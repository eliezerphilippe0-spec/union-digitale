import axios from 'axios';
import logger from '../utils/logger';

/**
 * NatCash Payout Integration Service
 * Documentation: Contact Natcom for API documentation
 */

const NATCASH_API_BASE = process.env.VITE_NATCASH_API_URL || 'https://api.natcom.ht/natcash';
const NATCASH_API_KEY = process.env.VITE_NATCASH_API_KEY;
const NATCASH_MERCHANT_ID = process.env.VITE_NATCASH_MERCHANT_ID;

/**
 * Process NatCash payout
 * @param {Object} payoutData - Payout information
 * @returns {Object} - Transaction result
 */
export async function processNatCashPayout(payoutData) {
    try {
        const { amount, destination, vendorId, payoutId } = payoutData;

        // Validate phone number format (NatCash uses format: 509XXXXXXXX)
        const phoneNumber = destination.phoneNumber.replace(/[^0-9]/g, '');
        if (!phoneNumber.match(/^509[0-9]{8}$/)) {
            throw new Error('Numéro NatCash invalide. Format requis: 509XXXXXXXX');
        }

        // Create payout request
        const payoutRequest = {
            merchant_id: NATCASH_MERCHANT_ID,
            transaction_id: payoutId,
            amount: amount,
            currency: 'HTG',
            recipient_phone: phoneNumber,
            description: `Payout Union Digitale - ${payoutId}`,
            callback_url: `${window.location.origin}/api/webhooks/natcash/payout`,
            metadata: {
                vendor_id: vendorId,
                payout_id: payoutId
            }
        };

        logger.info('Processing NatCash payout', {
            vendorId,
            payoutId,
            amount,
            recipient: phoneNumber.substring(0, 6) + '***'
        });

        // Send payout request
        const response = await axios.post(
            `${NATCASH_API_BASE}/v1/payouts`,
            payoutRequest,
            {
                headers: {
                    'Authorization': `Bearer ${NATCASH_API_KEY}`,
                    'Content-Type': 'application/json',
                    'X-Merchant-ID': NATCASH_MERCHANT_ID
                }
            }
        );

        // Check response
        if (response.data.status === 'success' || response.data.status === 'pending') {
            logger.info('NatCash payout initiated', {
                payoutId,
                transactionId: response.data.transaction_id,
                status: response.data.status
            });

            return {
                success: true,
                transactionId: response.data.transaction_id,
                reference: response.data.reference_number,
                status: response.data.status,
                message: 'Payout en cours de traitement'
            };
        } else {
            throw new Error(response.data.message || 'Payout échoué');
        }

    } catch (error) {
        logger.error('NatCash payout failed', error, {
            vendorId: payoutData.vendorId,
            payoutId: payoutData.payoutId
        });

        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Erreur NatCash',
            errorCode: error.response?.data?.error_code
        };
    }
}

/**
 * Check NatCash payout status
 */
export async function checkNatCashPayoutStatus(transactionId) {
    try {
        const response = await axios.get(
            `${NATCASH_API_BASE}/v1/payouts/${transactionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${NATCASH_API_KEY}`,
                    'X-Merchant-ID': NATCASH_MERCHANT_ID
                }
            }
        );

        return {
            success: true,
            status: response.data.status,
            data: response.data
        };

    } catch (error) {
        logger.error('Failed to check NatCash status', error, { transactionId });
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get NatCash account balance (for admin)
 */
export async function getNatCashBalance() {
    try {
        const response = await axios.get(
            `${NATCASH_API_BASE}/v1/merchant/balance`,
            {
                headers: {
                    'Authorization': `Bearer ${NATCASH_API_KEY}`,
                    'X-Merchant-ID': NATCASH_MERCHANT_ID
                }
            }
        );

        return {
            success: true,
            balance: response.data.available_balance,
            pending: response.data.pending_balance,
            currency: 'HTG'
        };

    } catch (error) {
        logger.error('Failed to get NatCash balance', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Validate NatCash phone number
 */
export function validateNatCashNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');

    // NatCash numbers start with 509 and have 11 digits total
    if (cleaned.match(/^509[0-9]{8}$/)) {
        return {
            valid: true,
            formatted: cleaned
        };
    }

    // Try to auto-format if user entered 8 digits (add 509 prefix)
    if (cleaned.match(/^[0-9]{8}$/)) {
        return {
            valid: true,
            formatted: `509${cleaned}`,
            autoFormatted: true
        };
    }

    return {
        valid: false,
        error: 'Numéro NatCash invalide. Format: 509XXXXXXXX ou XXXXXXXX'
    };
}

/**
 * Handle NatCash webhook callback
 * Called by NatCash when payout status changes
 */
export async function handleNatCashWebhook(webhookData, signature) {
    try {
        // Verify webhook signature
        const isValid = verifyNatCashSignature(webhookData, signature);
        if (!isValid) {
            throw new Error('Invalid webhook signature');
        }

        const { transaction_id, status, payout_id } = webhookData;

        logger.info('NatCash webhook received', {
            transactionId: transaction_id,
            status,
            payoutId: payout_id
        });

        // Update payout status in database
        // This would be handled by a Cloud Function
        return {
            success: true,
            transactionId: transaction_id,
            status
        };

    } catch (error) {
        logger.error('NatCash webhook processing failed', error);
        throw error;
    }
}

/**
 * Verify NatCash webhook signature
 */
function verifyNatCashSignature(data, signature) {
    // Implementation depends on NatCash's signature algorithm
    // Typically HMAC-SHA256 with secret key
    const crypto = require('crypto');
    const secret = NATCASH_API_KEY;

    const payload = JSON.stringify(data);
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    return signature === expectedSignature;
}

export default {
    processNatCashPayout,
    checkNatCashPayoutStatus,
    getNatCashBalance,
    validateNatCashNumber,
    handleNatCashWebhook
};
