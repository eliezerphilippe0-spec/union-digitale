/**
 * SIZE RECOMMENDATION SERVICE
 * Advanced algorithm for recommending clothing sizes based on user measurements
 */

/**
 * Calculate size recommendation for a product
 * @param {Object} userMeasurements - User's body measurements
 * @param {Object} productData - Product size chart and fit data
 * @returns {Object} Recommendation with size, confidence, and tips
 */
export const recommendSize = (userMeasurements, productData) => {
    const { chest, waist, hips, height } = userMeasurements;
    const { sizeChart, fitType = 'regular', fabricElasticity = 'medium' } = productData;

    if (!sizeChart || Object.keys(sizeChart).length === 0) {
        return {
            recommendedSize: null,
            confidence: 0,
            fit: 'unknown',
            alternatives: [],
            reasoning: 'Guide des tailles non disponible pour ce produit',
            tips: ['Contactez le vendeur pour plus d\'informations sur les tailles']
        };
    }

    // Calculate fit adjustments
    const fitAdjustment = getFitAdjustment(fitType);
    const elasticityAdjustment = getElasticityAdjustment(fabricElasticity);
    const totalAdjustment = fitAdjustment + elasticityAdjustment;

    // Score each size
    const sizeScores = {};
    const sizes = Object.keys(sizeChart);

    sizes.forEach(size => {
        const sizeData = sizeChart[size];
        const score = calculateSizeScore(
            { chest, waist, hips },
            sizeData,
            totalAdjustment
        );
        sizeScores[size] = score;
    });

    // Find best size
    const sortedSizes = Object.entries(sizeScores)
        .sort(([, a], [, b]) => b.score - a.score);

    const [recommendedSize, bestScore] = sortedSizes[0];
    const alternatives = sortedSizes.slice(1, 3).map(([size]) => size);

    // Determine fit quality
    const fit = determineFitQuality(bestScore.score);
    const confidence = Math.min(100, Math.round(bestScore.score));

    // Generate reasoning and tips
    const reasoning = generateReasoning(
        { chest, waist, hips },
        sizeChart[recommendedSize],
        fitType,
        fabricElasticity
    );

    const tips = generateTips(
        fit,
        fitType,
        fabricElasticity,
        bestScore.details
    );

    return {
        recommendedSize,
        confidence,
        fit,
        alternatives,
        reasoning,
        tips,
        sizeDetails: sizeChart[recommendedSize],
        userMeasurements: { chest, waist, hips }
    };
};

/**
 * Get fit type adjustment value
 */
const getFitAdjustment = (fitType) => {
    const adjustments = {
        'slim': -2,      // Tighter fit, need less tolerance
        'regular': 0,    // Standard fit
        'oversized': 4,  // Looser fit, more tolerance
        'relaxed': 3     // Comfortable fit
    };
    return adjustments[fitType] || 0;
};

/**
 * Get fabric elasticity adjustment value
 */
const getElasticityAdjustment = (elasticity) => {
    const adjustments = {
        'low': -1,       // Rigid fabric, less forgiving
        'medium': 0,     // Standard stretch
        'high': 2        // Very stretchy, more forgiving
    };
    return adjustments[elasticity] || 0;
};

/**
 * Calculate score for a specific size
 */
const calculateSizeScore = (userMeasurements, sizeData, adjustment) => {
    let totalScore = 0;
    let measurements = 0;
    const details = {};

    // Check chest measurement
    if (userMeasurements.chest && sizeData.chest) {
        const chestDiff = parseFloat(sizeData.chest) - parseFloat(userMeasurements.chest) + adjustment;
        const chestScore = calculateMeasurementScore(chestDiff, 'chest');
        totalScore += chestScore * 1.5; // Chest is most important
        measurements += 1.5;
        details.chest = { diff: chestDiff, score: chestScore };
    }

    // Check waist measurement
    if (userMeasurements.waist && sizeData.waist) {
        const waistDiff = parseFloat(sizeData.waist) - parseFloat(userMeasurements.waist) + adjustment;
        const waistScore = calculateMeasurementScore(waistDiff, 'waist');
        totalScore += waistScore * 1.2; // Waist is important
        measurements += 1.2;
        details.waist = { diff: waistDiff, score: waistScore };
    }

    // Check hips measurement (if available)
    if (userMeasurements.hips && sizeData.hips) {
        const hipsDiff = parseFloat(sizeData.hips) - parseFloat(userMeasurements.hips) + adjustment;
        const hipsScore = calculateMeasurementScore(hipsDiff, 'hips');
        totalScore += hipsScore;
        measurements += 1;
        details.hips = { diff: hipsDiff, score: hipsScore };
    }

    const averageScore = measurements > 0 ? totalScore / measurements : 0;

    return {
        score: averageScore,
        details
    };
};

/**
 * Calculate score for a single measurement difference
 */
const calculateMeasurementScore = (diff, measurementType) => {
    // diff = size measurement - user measurement
    // Positive diff = garment is bigger (good)
    // Negative diff = garment is smaller (bad)

    if (diff >= 2 && diff <= 6) {
        // Perfect fit range (2-6cm larger than body)
        return 100;
    } else if (diff >= 0 && diff < 2) {
        // Slightly tight but acceptable (0-2cm)
        return 90 - (2 - diff) * 10;
    } else if (diff > 6 && diff <= 10) {
        // Slightly loose but acceptable (6-10cm)
        return 90 - (diff - 6) * 5;
    } else if (diff > 10 && diff <= 15) {
        // Too loose (10-15cm)
        return 70 - (diff - 10) * 4;
    } else if (diff < 0 && diff >= -3) {
        // Too tight but wearable (-3 to 0cm)
        return 60 + diff * 10;
    } else if (diff < -3) {
        // Way too tight (< -3cm)
        return Math.max(0, 30 + (diff + 3) * 10);
    } else {
        // Way too loose (> 15cm)
        return Math.max(0, 50 - (diff - 15) * 3);
    }
};

/**
 * Determine fit quality based on score
 */
const determineFitQuality = (score) => {
    if (score >= 90) return 'perfect';
    if (score >= 75) return 'good';
    if (score >= 60) return 'acceptable';
    if (score >= 40) return 'tight';
    return 'poor';
};

/**
 * Generate human-readable reasoning
 */
const generateReasoning = (userMeasurements, sizeData, fitType, elasticity) => {
    const parts = [];

    if (userMeasurements.chest && sizeData.chest) {
        parts.push(`tour de poitrine (${userMeasurements.chest}cm)`);
    }
    if (userMeasurements.waist && sizeData.waist) {
        parts.push(`tour de taille (${userMeasurements.waist}cm)`);
    }

    let reasoning = `Basé sur votre ${parts.join(' et ')}`;

    if (fitType !== 'regular') {
        const fitLabels = {
            'slim': 'coupe ajustée',
            'oversized': 'coupe ample',
            'relaxed': 'coupe décontractée'
        };
        reasoning += `, avec une ${fitLabels[fitType] || fitType}`;
    }

    if (elasticity === 'high') {
        reasoning += ' et un tissu extensible';
    }

    return reasoning;
};

/**
 * Generate personalized tips
 */
const generateTips = (fit, fitType, elasticity, details) => {
    const tips = [];

    // Fit-specific tips
    if (fit === 'perfect') {
        tips.push('✓ Cette taille devrait vous aller parfaitement');
    } else if (fit === 'good') {
        tips.push('✓ Cette taille vous ira bien');
    } else if (fit === 'acceptable') {
        tips.push('⚠️ Cette taille devrait convenir, mais pourrait être légèrement ajustée');
    } else if (fit === 'tight') {
        tips.push('⚠️ Cette taille pourrait être un peu serrée');
        tips.push('💡 Considérez la taille supérieure si vous préférez plus d\'aisance');
    } else {
        tips.push('⚠️ Cette taille pourrait ne pas convenir parfaitement');
        tips.push('💡 Contactez le vendeur pour plus d\'informations');
    }

    // Elasticity tips
    if (elasticity === 'high') {
        tips.push('✓ Le tissu extensible s\'adaptera à votre morphologie');
    } else if (elasticity === 'low') {
        tips.push('ℹ️ Tissu peu extensible, la taille doit être précise');
    }

    // Fit type tips
    if (fitType === 'slim') {
        tips.push('ℹ️ Coupe ajustée - près du corps');
    } else if (fitType === 'oversized') {
        tips.push('ℹ️ Coupe ample - style décontracté');
    }

    // Specific measurement tips
    if (details.chest && details.chest.diff < 0) {
        tips.push('⚠️ Pourrait être serré au niveau de la poitrine');
    }
    if (details.waist && details.waist.diff < 0) {
        tips.push('⚠️ Pourrait être serré au niveau de la taille');
    }

    return tips;
};

/**
 * Get size comparison data for visualization
 */
export const getSizeComparison = (userMeasurements, sizeChart) => {
    const sizes = Object.keys(sizeChart);
    const comparisons = {};

    sizes.forEach(size => {
        const sizeData = sizeChart[size];
        comparisons[size] = {
            chest: {
                user: userMeasurements.chest,
                size: sizeData.chest,
                diff: sizeData.chest - userMeasurements.chest
            },
            waist: {
                user: userMeasurements.waist,
                size: sizeData.waist,
                diff: sizeData.waist - userMeasurements.waist
            }
        };
    });

    return comparisons;
};

/**
 * Recommend size for shoes based on foot length
 */
export const recommendShoeSize = (footLength, sizeChart) => {
    if (!sizeChart || !footLength) {
        return {
            recommendedSize: null,
            confidence: 0,
            reasoning: 'Données insuffisantes'
        };
    }

    const sizes = Object.keys(sizeChart);
    let bestSize = null;
    let smallestDiff = Infinity;

    sizes.forEach(size => {
        const maxFootLength = parseFloat(sizeChart[size].maxFootLength);
        if (maxFootLength) {
            const diff = Math.abs(maxFootLength - footLength);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                bestSize = size;
            }
        }
    });

    const confidence = smallestDiff < 0.5 ? 95 : smallestDiff < 1 ? 85 : 70;

    return {
        recommendedSize: bestSize,
        confidence,
        reasoning: `Basé sur votre longueur de pied (${footLength}cm)`,
        tips: [
            'Mesurez votre pied le soir pour plus de précision',
            'Ajoutez 0.5-1cm pour l\'espace des orteils'
        ]
    };
};

export default {
    recommendSize,
    getSizeComparison,
    recommendShoeSize
};
