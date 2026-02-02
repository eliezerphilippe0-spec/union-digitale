/**
 * Unified Payout Service
 * Handles payouts across multiple payment gateways (MonCash, NatCash, Bank Transfer)
 */

import { processMonCashPayout, validateMonCashNumber } from './monCashPayoutService';
import { processNatCashPayout, validateNatCashNumber } from './natCashPayoutService';
import logger from '../utils/logger';

/**
 * Process payout using appropriate gateway
 */
export async function processPayout(payoutData) {
    const { method } = payoutData;

    try {
        logger.info('Processing payout', {
            method,
            payoutId: payoutData.payoutId,
            amount: payoutData.amount
        });

        let result;

        switch (method) {
            case 'moncash':
                result = await processMonCashPayout(payoutData);
                break;

            case 'natcash':
                result = await processNatCashPayout(payoutData);
                break;

            case 'bank_transfer':
                result = await processBankTransferPayout(payoutData);
                break;

            default:
                throw new Error(`Méthode de payout non supportée: ${method}`);
        }

        if (result.success) {
            logger.info('Payout processed successfully', {
                method,
                payoutId: payoutData.payoutId,
                transactionId: result.transactionId
            });
        } else {
            logger.error('Payout processing failed', {
                method,
                payoutId: payoutData.payoutId,
                error: result.error
            });
        }

        return result;

    } catch (error) {
        logger.error('Payout processing error', error, {
            method,
            payoutId: payoutData.payoutId
        });

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Validate payout destination based on method
 */
export function validatePayoutDestination(method, destination) {
    switch (method) {
        case 'moncash':
            return validateMonCashNumber(destination.phoneNumber);

        case 'natcash':
            return validateNatCashNumber(destination.phoneNumber);

        case 'bank_transfer':
            return validateBankAccount(destination);

        default:
            return {
                valid: false,
                error: 'Méthode invalide'
            };
    }
}

/**
 * Process bank transfer payout (placeholder)
 */
async function processBankTransferPayout(payoutData) {
    // TODO: Implement bank transfer integration
    // This would typically involve:
    // 1. Validate bank account details
    // 2. Submit transfer request to banking API
    // 3. Return transaction reference

    logger.warn('Bank transfer payout not yet implemented', {
        payoutId: payoutData.payoutId
    });

    return {
        success: false,
        error: 'Virement bancaire temporairement indisponible. Utilisez MonCash ou NatCash.'
    };
}

/**
 * Validate bank account details
 */
function validateBankAccount(destination) {
    const { accountNumber, accountName, bankName } = destination;

    if (!accountNumber || !accountName || !bankName) {
        return {
            valid: false,
            error: 'Informations bancaires incomplètes'
        };
    }

    // Basic validation - account number should be numeric and reasonable length
    const cleaned = accountNumber.replace(/[^0-9]/g, '');
    if (cleaned.length < 8 || cleaned.length > 20) {
        return {
            valid: false,
            error: 'Numéro de compte invalide'
        };
    }

    return {
        valid: true,
        formatted: cleaned
    };
}

/**
 * Get available payout methods for a vendor
 */
export function getAvailablePayoutMethods(vendor) {
    const methods = [
        {
            id: 'moncash',
            name: 'MonCash',
            icon: '💰',
            description: 'Transfert instantané vers MonCash',
            minAmount: 500,
            maxAmount: 50000,
            processingTime: 'Instantané',
            fees: 50
        },
        {
            id: 'natcash',
            name: 'NatCash',
            icon: '📱',
            description: 'Transfert vers NatCash',
            minAmount: 500,
            maxAmount: 50000,
            processingTime: 'Instantané',
            fees: 50
        },
        {
            id: 'bank_transfer',
            name: 'Virement Bancaire',
            icon: '🏦',
            description: 'Virement vers compte bancaire',
            minAmount: 1000,
            maxAmount: 1000000,
            processingTime: '1-3 jours ouvrables',
            fees: 100,
            disabled: true, // Not yet implemented
            disabledReason: 'Bientôt disponible'
        }
    ];

    // Filter based on vendor verification level
    if (vendor.verificationLevel === 'standard') {
        // Standard vendors have lower limits
        return methods.map(method => ({
            ...method,
            maxAmount: Math.min(method.maxAmount, 10000)
        }));
    }

    return methods;
}

/**
 * Calculate payout fees
 */
export function calculatePayoutFees(method, amount) {
    const feeStructure = {
        moncash: {
            fixed: 50,
            percentage: 0
        },
        natcash: {
            fixed: 50,
            percentage: 0
        },
        bank_transfer: {
            fixed: 100,
            percentage: 0
        }
    };

    const fees = feeStructure[method] || { fixed: 0, percentage: 0 };
    const totalFees = fees.fixed + (amount * fees.percentage);

    return {
        fees: totalFees,
        netAmount: amount - totalFees,
        breakdown: {
            fixed: fees.fixed,
            percentage: amount * fees.percentage
        }
    };
}

export default {
    processPayout,
    validatePayoutDestination,
    getAvailablePayoutMethods,
    calculatePayoutFees
};
