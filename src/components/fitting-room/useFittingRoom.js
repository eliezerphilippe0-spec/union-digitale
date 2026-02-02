import { useState, useEffect } from 'react';

export const useFittingRoom = (product) => {
    const [userStats, setUserStats] = useState({
        gender: 'unisex',
        height: '',
        weight: '',
        bodyType: 'average',
        fitPreference: 'regular'
    });
    const [recommendation, setRecommendation] = useState(null);

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('ud_fitting_profile');
        if (saved) {
            setUserStats(JSON.parse(saved));
        }
    }, []);

    const saveProfile = () => {
        localStorage.setItem('ud_fitting_profile', JSON.stringify(userStats));
    };

    const calculateSize = () => {
        if (!product) return null;

        // --- SHOE LOGIC ---
        if (product.category === 'shoes') {
            const fl = parseFloat(userStats.footLength);
            if (!fl) return null;

            let score = fl;

            // Adjust for foot width
            // Wide foot needs slightly bigger shoe effectively
            if (userStats.footWidth === 'wide') score += 0.5;
            if (userStats.footWidth === 'narrow') score -= 0.2;

            // Standard EU Calculation: (cm + 1.5) * 1.5 = EU Size (approx)
            // Or use an approximate map:
            // 23.5 -> 37
            // 24.5 -> 38
            // 25.5 -> 40
            // 26.5 -> 42
            // 27.5 -> 43
            // 28.5 -> 44

            // Heuristic for Demo:
            let recommendedSize = Math.round((score + 1.5) * 1.5);

            // If product has specific size chart, check it
            // Assuming product.sizeChart maps "42" -> { maxFootLength: 27 }
            if (product.sizeChart) {
                // Find closest size in chart
                let bestFit = null;
                let minDiff = 999;

                Object.entries(product.sizeChart).forEach(([sizeKey, data]) => {
                    const maxLen = parseFloat(data.maxFootLength || data.length);
                    if (maxLen) {
                        const diff = Math.abs(score - maxLen);
                        if (diff < minDiff) {
                            minDiff = diff;
                            bestFit = sizeKey;
                        }
                        // Prefer slightly larger if close data.length < score
                        if (maxLen < score && diff < 1) {
                            // If foot is bigger than maxLen by a tiny bit, maybe suggest next up?
                            // Keeping simple for MVP
                        }
                    }
                });

                if (bestFit) recommendedSize = bestFit;
            }

            setRecommendation({
                size: recommendedSize.toString(),
                score: 90, // High confidence on foot length
                details: { footLength: fl }
            });
            return recommendedSize.toString();
        }

        // --- CLOTHING LOGIC ---
        if (!product?.sizeChart) return null;

        // Validating inputs for clothing
        const h = parseInt(userStats.height);
        const w = parseInt(userStats.weight);
        if (!h || !w) return null;

        // 1. BMI Approximation (Rough estimate of "volume")
        // BMI = kg / m^2
        const bmi = w / ((h / 100) * (h / 100));

        // 2. Adjust for Body Type
        // Slim -> effectively slightly smaller volume for clothing fit
        // Broad/Curvy -> effectively larger
        let adjustedBmi = bmi;
        if (userStats.bodyType === 'slim') adjustedBmi *= 0.95;
        if (userStats.bodyType === 'broad' || userStats.bodyType === 'curvy') adjustedBmi *= 1.05;

        // 3. Map to Standard Sizes (Generic Global Standard fallback)
        // This is a heuristic if the product size chart interacts with these metrics, 
        // OR we map BMI to "T-Shirt Size" roughly.
        // For this MVP, we will try to match against the Product's specific Size Chart if it has chest/waist.
        // If not, we fall back to a "Universal Estimator".

        // Let's use a simpler Points system for stability.
        // Base score = Weight (kg) + (Height (cm) - 100)
        let score = w + (h - 100);

        // Adjust for fit preference
        // Loose -> Treat as if person is bigger to recommend larger size
        if (userStats.fitPreference === 'loose') score += 5;
        if (userStats.fitPreference === 'tight') score -= 5;

        // Product Fit Type Correction
        if (product.fitType === 'slim') score += 5; // Product runs small, so user 'needs' more space
        if (product.fitType === 'oversized') score -= 10; // Product runs big

        // Standard Scoring Table (Rough Heuristic for Men/Unisex):
        // S: < 140
        // M: 140 - 160
        // L: 160 - 180
        // XL: 180 - 200
        // XXL: > 200

        // We check the product's available sizes.
        // If product has a specific mapping, use it. Otherwise use the standard table.

        let recommendedSize = 'M';
        let confidence = 85;

        if (score < 140) recommendedSize = 'S';
        else if (score < 160) recommendedSize = 'M';
        else if (score < 180) recommendedSize = 'L';
        else if (score < 200) recommendedSize = 'XL';
        else recommendedSize = 'XXL';

        // Check availability in product sizes
        const availableSizes = product.sizeChart ? Object.keys(product.sizeChart) : ['S', 'M', 'L', 'XL', 'XXL'];

        // If recommended isn't there, find closest
        if (!availableSizes.includes(recommendedSize)) {
            // Fallback logic could go here
            confidence -= 10;
        }

        setRecommendation({
            size: recommendedSize,
            score: confidence,
            details: { score, bmi: bmi.toFixed(1) }
        });

        return recommendedSize;
    };

    return {
        userStats,
        setUserStats,
        saveProfile,
        calculateSize,
        recommendation
    };
};
