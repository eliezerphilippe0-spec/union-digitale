/**
 * MEASUREMENT UTILITIES
 * Helper functions for body measurements, conversions, and validations
 */

/**
 * Convert centimeters to inches
 */
export const cmToInches = (cm) => {
    return (cm / 2.54).toFixed(1);
};

/**
 * Convert inches to centimeters
 */
export const inchesToCm = (inches) => {
    return (inches * 2.54).toFixed(1);
};

/**
 * Validate measurement value
 */
export const isValidMeasurement = (value, min, max) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
};

/**
 * Measurement ranges for validation (in cm)
 */
export const MEASUREMENT_RANGES = {
    chest: { min: 70, max: 150, label: 'Tour de poitrine' },
    waist: { min: 50, max: 140, label: 'Tour de taille' },
    hips: { min: 70, max: 160, label: 'Tour de hanches' },
    height: { min: 140, max: 220, label: 'Taille' },
    weight: { min: 40, max: 200, label: 'Poids' },
    shoulders: { min: 35, max: 60, label: 'Largeur épaules' },
    inseam: { min: 60, max: 100, label: 'Entrejambe' },
    neck: { min: 30, max: 50, label: 'Tour de cou' },
    sleeve: { min: 50, max: 90, label: 'Longueur manche' }
};

/**
 * Validate all measurements
 */
export const validateMeasurements = (measurements) => {
    const errors = {};

    Object.keys(measurements).forEach(key => {
        if (MEASUREMENT_RANGES[key]) {
            const value = measurements[key];
            const range = MEASUREMENT_RANGES[key];

            if (!isValidMeasurement(value, range.min, range.max)) {
                errors[key] = `${range.label} doit être entre ${range.min} et ${range.max} cm`;
            }
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Calculate BMI (Body Mass Index)
 */
export const calculateBMI = (weight, height) => {
    // height in cm, weight in kg
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

/**
 * Determine body type based on measurements
 */
export const determineBodyType = (measurements) => {
    const { chest, waist, hips } = measurements;

    if (!chest || !waist || !hips) return 'unknown';

    const chestWaistRatio = chest / waist;
    const hipWaistRatio = hips / waist;

    // Body type classification
    if (hipWaistRatio > 1.05 && chestWaistRatio < 1.09) {
        return 'pear'; // Poire (hanches plus larges)
    } else if (chestWaistRatio > 1.1 && hipWaistRatio < 1.05) {
        return 'triangle'; // Triangle inversé (épaules plus larges)
    } else if (Math.abs(chest - hips) < 5 && chestWaistRatio > 1.1) {
        return 'hourglass'; // Sablier (équilibré avec taille marquée)
    } else if (Math.abs(chest - waist) < 10 && Math.abs(hips - waist) < 10) {
        return 'rectangle'; // Rectangle (proportions similaires)
    } else if (waist > chest && waist > hips) {
        return 'apple'; // Pomme (taille plus large)
    }

    return 'balanced'; // Équilibré
};

/**
 * Get body type recommendations
 */
export const getBodyTypeRecommendations = (bodyType) => {
    const recommendations = {
        pear: {
            label: 'Morphologie en Poire',
            tips: [
                'Privilégiez les hauts ajustés pour équilibrer',
                'Les pantalons droits ou évasés vous iront bien',
                'Évitez les coupes trop serrées au niveau des hanches'
            ]
        },
        triangle: {
            label: 'Morphologie en Triangle Inversé',
            tips: [
                'Les coupes droites équilibrent votre silhouette',
                'Privilégiez les bas avec du volume',
                'Les décolletés en V allongent la silhouette'
            ]
        },
        hourglass: {
            label: 'Morphologie en Sablier',
            tips: [
                'Les coupes cintrées mettent en valeur vos formes',
                'Évitez les vêtements trop amples',
                'Les ceintures marquent joliment votre taille'
            ]
        },
        rectangle: {
            label: 'Morphologie en Rectangle',
            tips: [
                'Créez des courbes avec des ceintures',
                'Les coupes empire sont flatteuses',
                'Jouez avec les volumes pour créer du relief'
            ]
        },
        apple: {
            label: 'Morphologie en Pomme',
            tips: [
                'Les coupes empire allongent la silhouette',
                'Privilégiez les décolletés en V',
                'Évitez les ceintures à la taille'
            ]
        },
        balanced: {
            label: 'Morphologie Équilibrée',
            tips: [
                'Vous pouvez porter la plupart des styles',
                'Expérimentez avec différentes coupes',
                'Choisissez selon vos préférences personnelles'
            ]
        },
        unknown: {
            label: 'Morphologie Non Déterminée',
            tips: [
                'Complétez vos mesures pour des recommandations personnalisées'
            ]
        }
    };

    return recommendations[bodyType] || recommendations.unknown;
};

/**
 * Format measurement for display
 */
export const formatMeasurement = (value, unit = 'cm') => {
    if (!value) return '-';
    return `${value} ${unit}`;
};

/**
 * Get measurement instructions
 */
export const getMeasurementInstructions = (measurementType) => {
    const instructions = {
        chest: {
            title: 'Tour de Poitrine',
            steps: [
                'Tenez-vous droit, bras le long du corps',
                'Passez le mètre ruban autour de la partie la plus large de votre poitrine',
                'Le ruban doit être horizontal et bien ajusté sans serrer',
                'Respirez normalement et notez la mesure'
            ],
            image: '👕',
            tip: 'Portez un soutien-gorge bien ajusté pour les femmes'
        },
        waist: {
            title: 'Tour de Taille',
            steps: [
                'Trouvez votre taille naturelle (partie la plus étroite)',
                'Généralement située au-dessus du nombril',
                'Passez le mètre ruban horizontalement',
                'Ne rentrez pas le ventre, restez naturel'
            ],
            image: '📏',
            tip: 'La taille naturelle est souvent au niveau du nombril'
        },
        hips: {
            title: 'Tour de Hanches',
            steps: [
                'Tenez-vous droit, pieds joints',
                'Mesurez autour de la partie la plus large des hanches',
                'Incluez les fesses dans la mesure',
                'Le ruban doit être parallèle au sol'
            ],
            image: '👖',
            tip: 'Mesurez par-dessus des sous-vêtements légers'
        },
        height: {
            title: 'Taille (Hauteur)',
            steps: [
                'Tenez-vous dos contre un mur',
                'Pieds joints, talons contre le mur',
                'Regardez droit devant vous',
                'Marquez le sommet de votre tête et mesurez'
            ],
            image: '📐',
            tip: 'Retirez vos chaussures pour une mesure précise'
        },
        shoulders: {
            title: 'Largeur des Épaules',
            steps: [
                'Mesurez d\'une extrémité d\'épaule à l\'autre',
                'Passez le ruban sur le haut du dos',
                'D\'un point d\'épaule à l\'autre',
                'Le ruban doit suivre la courbe naturelle'
            ],
            image: '👔',
            tip: 'Demandez de l\'aide pour cette mesure'
        },
        inseam: {
            title: 'Entrejambe',
            steps: [
                'Mesurez de l\'entrejambe jusqu\'à la cheville',
                'Utilisez un pantalon bien ajusté comme référence',
                'Mesurez le long de l\'intérieur de la jambe',
                'Pieds nus pour plus de précision'
            ],
            image: '👖',
            tip: 'Portez un pantalon ajusté pour faciliter la mesure'
        }
    };

    return instructions[measurementType] || {
        title: measurementType,
        steps: ['Suivez les instructions standard de mesure'],
        image: '📏',
        tip: ''
    };
};

/**
 * Calculate ideal measurements based on height and body type
 */
export const calculateIdealMeasurements = (height, gender = 'unisex') => {
    // Simplified ideal proportions (can be refined)
    const heightInCm = parseFloat(height);

    if (gender === 'female') {
        return {
            chest: (heightInCm * 0.53).toFixed(0),
            waist: (heightInCm * 0.42).toFixed(0),
            hips: (heightInCm * 0.57).toFixed(0)
        };
    } else if (gender === 'male') {
        return {
            chest: (heightInCm * 0.55).toFixed(0),
            waist: (heightInCm * 0.47).toFixed(0),
            hips: (heightInCm * 0.53).toFixed(0)
        };
    }

    // Unisex average
    return {
        chest: (heightInCm * 0.54).toFixed(0),
        waist: (heightInCm * 0.45).toFixed(0),
        hips: (heightInCm * 0.55).toFixed(0)
    };
};

export default {
    cmToInches,
    inchesToCm,
    isValidMeasurement,
    validateMeasurements,
    calculateBMI,
    determineBodyType,
    getBodyTypeRecommendations,
    formatMeasurement,
    getMeasurementInstructions,
    calculateIdealMeasurements,
    MEASUREMENT_RANGES
};
