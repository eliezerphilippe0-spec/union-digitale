import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * Union Digitale - Reputation & Gamification Service
 * Inspired by Mercado Libre's "MercadoLider" system.
 */

export const REPUTATION_TIERS = {
    BRONZE: {
        id: 'bronze',
        label: 'Vendeur Bronze',
        minOrders: 0,
        minRating: 0,
        commissionDiscount: 0,
        color: '#cd7f32',
        icon: '🥉'
    },
    SILVER: {
        id: 'silver',
        label: 'Vendeur Argent',
        minOrders: 10,
        minRating: 4.0,
        commissionDiscount: 0.01, // -1%
        color: '#c0c0c0',
        icon: '🥈'
    },
    GOLD: {
        id: 'gold',
        label: 'Vendeur Or',
        minOrders: 50,
        minRating: 4.5,
        commissionDiscount: 0.02, // -2%
        color: '#ffd700',
        icon: '🥇'
    },
    PLATINUM: {
        id: 'platinum',
        label: 'Union Platine',
        minOrders: 200,
        minRating: 4.8,
        commissionDiscount: 0.03, // -3%
        color: '#e5e4e2',
        icon: '💎'
    }
};

/**
 * Calculate and update a vendor's reputation tier
 */
export async function refreshVendorTier(vendorId) {
    try {
        const vendorRef = doc(db, 'vendors', vendorId);
        const snap = await getDoc(vendorRef);

        if (!snap.exists()) return null;

        const data = snap.data();
        const orders = data.totalOrders || 0;
        const rating = data.rating || 0;
        const successRate = data.successRate || 100; // COD refusals affect this

        let newTier = REPUTATION_TIERS.BRONZE;

        // Determination logic (Tier thresholds)
        if (orders >= REPUTATION_TIERS.PLATINUM.minOrders && rating >= REPUTATION_TIERS.PLATINUM.minRating && successRate > 95) {
            newTier = REPUTATION_TIERS.PLATINUM;
        } else if (orders >= REPUTATION_TIERS.GOLD.minOrders && rating >= REPUTATION_TIERS.GOLD.minRating && successRate > 90) {
            newTier = REPUTATION_TIERS.GOLD;
        } else if (orders >= REPUTATION_TIERS.SILVER.minOrders && rating >= REPUTATION_TIERS.SILVER.minRating) {
            newTier = REPUTATION_TIERS.SILVER;
        }

        // Update if tier changed
        if (data.reputationTier !== newTier.id) {
            await updateDoc(vendorRef, {
                reputationTier: newTier.id,
                tierLabel: newTier.label,
                tierBadge: newTier.icon,
                updatedAt: serverTimestamp()
            });

            logger.info('Vendor tier upgraded!', { vendorId, oldTier: data.reputationTier, newTier: newTier.id });
        }

        return newTier;
    } catch (error) {
        logger.error('Failed to refresh vendor tier', error);
        return REPUTATION_TIERS.BRONZE;
    }
}

/**
 * Get visual badge data for a tier
 */
export function getTierBadge(tierId) {
    const tier = Object.values(REPUTATION_TIERS).find(t => t.id === tierId);
    return tier || REPUTATION_TIERS.BRONZE;
}

export default {
    REPUTATION_TIERS,
    refreshVendorTier,
    getTierBadge
};
