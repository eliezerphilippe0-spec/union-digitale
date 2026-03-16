/**
 * Vendor Subscription Service
 * Manages marketplace seller plans and benefits.
 */

export const VENDOR_PLANS = {
    BASIC: {
        id: 'basic',
        name: 'Basic',
        price: 0,
        commissionRate: 0.10, // 10%
        maxProducts: 10,
        features: ['Vendre des produits'],
        visibility: 'standard'
    },
    PRO: {
        id: 'pro',
        name: 'Pro',
        price: 1500, // HTG/month
        commissionRate: 0.08, // 8%
        maxProducts: 50,
        features: ['Vendre des produits', 'Visibilité accrue', 'Analytics de base'],
        visibility: 'high'
    },
    PREMIUM: {
        id: 'premium',
        name: 'Premium',
        price: 3500, // HTG/month
        commissionRate: 0.06, // 6%
        maxProducts: Infinity,
        features: ['Vendre des produits', 'Visibilité maximale', 'Analytics avancés', 'Support prioritaire', 'Badges premium'],
        visibility: 'featured'
    }
};

/**
 * Get plan by ID
 */
export const getPlan = (planId) => {
    return VENDOR_PLANS[planId.toUpperCase()] || VENDOR_PLANS.BASIC;
};

export default {
    VENDOR_PLANS,
    getPlan
};
