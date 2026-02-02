import { db } from '../lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { validateCommissionCalculation } from '../utils/vendorValidationSchemas';
import logger from '../utils/logger';

/**
 * Commission Calculation Service
 * Calculates commissions based on configurable rules
 */

// Default commission rates
export const DEFAULT_COMMISSION_RATES = {
    // By product type
    physical: 0.10,      // 10% physical products
    digital: 0.15,       // 15% digital products
    service: 0.12,       // 12% services
    rental: 0.08,        // 8% rentals

    // By vendor level (discounts)
    standard: 0.00,      // No discount
    verified: -0.02,     // -2% (e.g., 10% → 8%)
    premium: -0.03,      // -3% (e.g., 10% → 7%)

    // Limits
    min: 0.05,           // 5% minimum
    max: 0.20            // 20% maximum
};

// ============================================================================
// COMMISSION CALCULATION
// ============================================================================

/**
 * Calculate commission for an order
 */
export async function calculateCommission(orderData) {
    try {
        // Validate input
        const validated = validateCommissionCalculation(orderData);

        // Get applicable commission rules
        const rules = await getApplicableCommissionRules(validated);

        // Calculate base rate
        let baseRate = DEFAULT_COMMISSION_RATES[validated.productType] || DEFAULT_COMMISSION_RATES.physical;

        // Apply custom rules if any
        if (rules.length > 0) {
            // Use highest priority rule
            const topRule = rules[0];
            baseRate = topRule.rate;

            logger.info('Custom commission rule applied', {
                orderId: validated.orderId,
                ruleName: topRule.name,
                rate: topRule.rate
            });
        }

        // Apply vendor level discount
        const vendorDiscount = DEFAULT_COMMISSION_RATES[validated.vendorLevel] || 0;

        // Calculate final rate with limits
        const finalRate = Math.max(
            DEFAULT_COMMISSION_RATES.min,
            Math.min(baseRate + vendorDiscount, DEFAULT_COMMISSION_RATES.max)
        );

        // Calculate amounts
        const commission = validated.amount * finalRate;
        const vendorEarnings = validated.amount - commission;

        const result = {
            amount: validated.amount,
            commissionRate: finalRate,
            commission: Math.round(commission * 100) / 100, // Round to 2 decimals
            vendorEarnings: Math.round(vendorEarnings * 100) / 100,
            appliedRule: rules.length > 0 ? rules[0].name : 'default'
        };

        logger.info('Commission calculated', {
            orderId: validated.orderId,
            ...result
        });

        return result;

    } catch (error) {
        logger.error('Commission calculation failed', error, orderData);
        throw new Error('Impossible de calculer la commission');
    }
}

/**
 * Get applicable commission rules for an order
 */
async function getApplicableCommissionRules(orderData) {
    try {
        // Query active rules
        const rulesQuery = query(
            collection(db, 'commission_rules'),
            where('active', '==', true),
            orderBy('priority', 'desc')
        );

        const snapshot = await getDocs(rulesQuery);
        const applicableRules = [];

        snapshot.forEach(doc => {
            const rule = { id: doc.id, ...doc.data() };

            // Check if rule applies
            if (isRuleApplicable(rule, orderData)) {
                applicableRules.push(rule);
            }
        });

        // Sort by priority (highest first)
        applicableRules.sort((a, b) => b.priority - a.priority);

        return applicableRules;

    } catch (error) {
        logger.error('Failed to get commission rules', error);
        // Return empty array to use defaults
        return [];
    }
}

/**
 * Check if a commission rule applies to an order
 */
function isRuleApplicable(rule, orderData) {
    const conditions = rule.conditions || {};

    // Check rule type
    if (rule.type === 'default') {
        return true;
    }

    if (rule.type === 'product_type') {
        if (conditions.productType && conditions.productType !== orderData.productType) {
            return false;
        }
    }

    if (rule.type === 'vendor') {
        if (conditions.vendorLevel && conditions.vendorLevel !== orderData.vendorLevel) {
            return false;
        }
    }

    if (rule.type === 'category') {
        if (conditions.category && conditions.category !== orderData.category) {
            return false;
        }
    }

    // Check amount conditions
    if (conditions.minAmount !== undefined && orderData.amount < conditions.minAmount) {
        return false;
    }

    if (conditions.maxAmount !== undefined && orderData.amount > conditions.maxAmount) {
        return false;
    }

    return true;
}

/**
 * Get commission breakdown for vendor dashboard
 */
export async function getCommissionBreakdown(vendorId, period = 'month') {
    try {
        // Calculate date range
        const now = new Date();
        const startDate = new Date();

        if (period === 'week') {
            startDate.setDate(now.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(now.getMonth() - 1);
        } else if (period === 'year') {
            startDate.setFullYear(now.getFullYear() - 1);
        }

        // Get wallet transactions
        const txQuery = query(
            collection(db, 'wallet_transactions'),
            where('vendorId', '==', vendorId),
            where('type', '==', 'sale'),
            where('createdAt', '>=', startDate),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(txQuery);

        let totalSales = 0;
        let totalCommissions = 0;
        let totalEarnings = 0;
        const transactions = [];

        snapshot.forEach(doc => {
            const tx = doc.data();
            const metadata = tx.metadata || {};

            totalSales += (tx.amount + (metadata.commission || 0));
            totalCommissions += (metadata.commission || 0);
            totalEarnings += tx.amount;

            transactions.push({
                id: doc.id,
                ...tx
            });
        });

        return {
            period,
            totalSales: Math.round(totalSales * 100) / 100,
            totalCommissions: Math.round(totalCommissions * 100) / 100,
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            averageCommissionRate: totalSales > 0 ? (totalCommissions / totalSales) : 0,
            transactionCount: transactions.length,
            transactions
        };

    } catch (error) {
        logger.error('Failed to get commission breakdown', error, { vendorId, period });
        throw new Error('Impossible de récupérer le détail des commissions');
    }
}

/**
 * Estimate commission for a product before listing
 */
export async function estimateCommission(productData, vendorId) {
    try {
        // Get vendor info
        const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));

        if (!vendorDoc.exists()) {
            throw new Error('Vendor not found');
        }

        const vendor = vendorDoc.data();

        // Calculate commission
        const result = await calculateCommission({
            orderId: 'estimate',
            vendorId,
            amount: productData.price,
            productType: productData.type || 'physical',
            vendorLevel: vendor.verificationLevel || 'standard',
            category: productData.category
        });

        return {
            price: productData.price,
            commission: result.commission,
            commissionRate: result.commissionRate,
            youWillReceive: result.vendorEarnings,
            breakdown: {
                baseRate: DEFAULT_COMMISSION_RATES[productData.type || 'physical'],
                vendorDiscount: DEFAULT_COMMISSION_RATES[vendor.verificationLevel || 'standard'],
                finalRate: result.commissionRate
            }
        };

    } catch (error) {
        logger.error('Failed to estimate commission', error, { productData, vendorId });
        throw new Error('Impossible d\'estimer la commission');
    }
}

/**
 * Get commission statistics for admin dashboard
 */
export async function getCommissionStats(period = 'month') {
    try {
        const now = new Date();
        const startDate = new Date();

        if (period === 'week') {
            startDate.setDate(now.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(now.getMonth() - 1);
        } else if (period === 'year') {
            startDate.setFullYear(now.getFullYear() - 1);
        }

        // Get platform revenue (commissions)
        const revenueQuery = query(
            collection(db, 'platform_revenue'),
            where('type', '==', 'commission'),
            where('createdAt', '>=', startDate),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(revenueQuery);

        let totalCommissions = 0;
        let totalSales = 0;
        const byProductType = {
            physical: 0,
            digital: 0,
            service: 0,
            rental: 0
        };

        snapshot.forEach(doc => {
            const revenue = doc.data();
            totalCommissions += revenue.amount;

            // Estimate total sales (commission / rate)
            const estimatedSale = revenue.amount / (revenue.commissionRate || 0.10);
            totalSales += estimatedSale;

            // Track by product type
            if (revenue.productType && byProductType[revenue.productType] !== undefined) {
                byProductType[revenue.productType] += revenue.amount;
            }
        });

        return {
            period,
            totalCommissions: Math.round(totalCommissions * 100) / 100,
            totalSales: Math.round(totalSales * 100) / 100,
            averageCommissionRate: totalSales > 0 ? (totalCommissions / totalSales) : 0,
            transactionCount: snapshot.size,
            byProductType
        };

    } catch (error) {
        logger.error('Failed to get commission stats', error, { period });
        throw new Error('Impossible de récupérer les statistiques de commissions');
    }
}

export default {
    calculateCommission,
    getCommissionBreakdown,
    estimateCommission,
    getCommissionStats,
    DEFAULT_COMMISSION_RATES
};
