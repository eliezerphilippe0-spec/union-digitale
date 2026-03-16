import { db } from '../lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, orderBy, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { REPUTATION_TIERS } from './reputationService';
import logger from '../utils/logger';

/**
 * Union Digitale - Mass Market Commission Strategy
 * Inspired by e-commerce giants, tailored for the Haitian market.
 */

export const COMMISSION_CONFIG = {
    rates: {
        // High Volume / Mass Market Categories
        'Essentials': 0.06,      // 6% (Groceries, basic needs)
        'Electronics': 0.09,     // 9%
        'Fashion': 0.12,         // 12%
        'Home': 0.10,            // 10%
        'Digital': 0.08,         // 8% (General Digital)
        'Recharge': 0.03,        // 3% (Mass Market Recharges: MonCash, Digicel, Natcom)
        'Gaming': 0.07,          // 7% (Steam, PSN, etc.)
        'Vouchers': 0.05,        // 5% (Gift cards, coupons)
        'Other': 0.10
    },
    USE_FLAT_RATE: false, // Toggle for simplified global model
    FLAT_RATE_VALUE: 0.10, // 10% standard
    productTypes: {
        physical: 0.10,
        digital: 0.08,
        service: 0.12
    },
    // Volume-based rewards (Monthly volume in HTG)
    volumeTiers: [
        { min: 500000, discount: 0.03 }, // Platinum: -3%
        { min: 100000, discount: 0.02 }, // Gold: -2%
        { min: 25000, discount: 0.01 }   // Silver: -1%
    ],
    FLAT_FEE: 5,   // 5 HTG protection per transaction (Physical)
    DIGITAL_FLAT_FEE: 2, // 2 HTG for Digital (Mass market adoption)
    MIN_RATE: 0.02, // Lowered to 2% to allow ultra-low mass market rates
    MAX_RATE: 0.20
};

/**
 * Calculate commission for an order
 */
export async function calculateCommission(orderData) {
    try {
        const { amount, productType, category, vendorId, parentAmbassadorId } = orderData;

        // 1. Determine Base Rate based on Strategy (Category first, then type)
        let baseRate = COMMISSION_CONFIG.rates[category] ||
            COMMISSION_CONFIG.productTypes[productType] ||
            COMMISSION_CONFIG.productTypes.physical;

        // 2. Apply Dynamic Discounts (Volume + Reputation)
        let totalDiscount = 0;

        if (vendorId) {
            // Volume Discount
            const stats = await getVendorVolumeStats(vendorId);
            const volumeTier = COMMISSION_CONFIG.volumeTiers.find(t => stats.totalVolume >= t.min);
            if (volumeTier) totalDiscount += volumeTier.discount;

            // Reputation Discount (Mercado Libre style)
            const vendorRef = doc(db, 'vendors', vendorId);
            const vendorSnap = await getDoc(vendorRef);
            if (vendorSnap.exists()) {
                const vendorData = vendorSnap.data();
                
                // Subscription based rate override
                if (vendorData.subscriptionPlan) {
                    const { VENDOR_PLANS } = await import('./vendorSubscriptionService');
                    const plan = VENDOR_PLANS[vendorData.subscriptionPlan.toUpperCase()];
                    if (plan) baseRate = plan.commissionRate;
                }

                const tierId = vendorData.reputationTier;
                const repTier = Object.values(REPUTATION_TIERS).find(t => t.id === tierId);
                if (repTier) totalDiscount += repTier.commissionDiscount;
            }
        }

        // 2.5 Apply Flat Rate Override if enabled
        if (COMMISSION_CONFIG.USE_FLAT_RATE) {
            baseRate = COMMISSION_CONFIG.FLAT_RATE_VALUE;
        }

        // 3. Apply Professional Constraints
        const finalRate = Math.max(
            COMMISSION_CONFIG.MIN_RATE,
            Math.min(baseRate - totalDiscount, COMMISSION_CONFIG.MAX_RATE)
        );

        // 4. Calculate Final Split
        const variableCommission = amount * finalRate;
        const flatFee = (productType === 'digital' || category === 'digital' || category === 'Recharge')
            ? COMMISSION_CONFIG.DIGITAL_FLAT_FEE
            : COMMISSION_CONFIG.FLAT_FEE;

        const totalCommission = variableCommission + flatFee;

        // MLM / Ambassador Cut (5% of the Platform's variable commission)
        const mlmCommission = parentAmbassadorId ? (variableCommission * 0.05) : 0;

        const vendorEarnings = amount - totalCommission;

        const result = {
            amount,
            commissionRate: finalRate,
            commission: Math.round(totalCommission * 100) / 100,
            variablePart: Math.round(variableCommission * 100) / 100,
            flatFee: flatFee,
            mlmCommission: Math.round(mlmCommission * 100) / 100,
            vendorEarnings: Math.round(vendorEarnings * 100) / 100,
            strategyApplied: 'mass_market_v2_digital_optimized'
        };

        logger.info('Commission calculated (Mass Market)', { orderId: orderData.orderId, ...result });

        return result;
    } catch (error) {
        logger.error('Commission calculation failed', error, orderData);
        throw new Error('Impossible de calculer la commission');
    }
}

/**
 * Get vendor volume stats from last 30 days
 */
async function getVendorVolumeStats(vendorId) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const q = query(
            collection(db, 'orders'),
            where('sellerIds', 'array-contains', vendorId),
            where('status', 'in', ['paid', 'delivered', 'delivered_paid']),
            where('createdAt', '>=', thirtyDaysAgo)
        );
        const snap = await getDocs(q);
        let total = 0;
        snap.forEach(doc => total += (doc.data().totalAmount || 0));
        return { totalVolume: total };
    } catch (e) {
        return { totalVolume: 0 };
    }
}

/**
 * Estimate commission for a product listing
 */
export async function estimateCommission(productData, vendorId) {
    try {
        const result = await calculateCommission({
            orderId: 'estimate',
            vendorId,
            amount: productData.price,
            productType: productData.type || 'physical',
            category: productData.category
        });

        return {
            price: productData.price,
            totalFee: result.commission,
            commissionRate: result.commissionRate,
            vendorEarnings: result.vendorEarnings,
            breakdown: {
                flatFee: COMMISSION_CONFIG.FLAT_FEE,
                variablePart: result.variablePart
            }
        };
    } catch (error) {
        throw new Error('Impossible d\'estimer la commission');
    }
}

export default {
    calculateCommission,
    estimateCommission,
    COMMISSION_CONFIG
};
