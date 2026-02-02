import axios from 'axios';
import logger from '../utils/logger';

/**
 * MonCash Payout Integration Service
 * Documentation: https://moncashbutton.digicelgroup.com/Moncash-business/resources/doc/
 */

const MONCASH_API_BASE = process.env.VITE_MONCASH_API_URL || 'https://sandbox.moncashbutton.digicelgroup.com/Api';
const MONCASH_CLIENT_ID = process.env.VITE_MONCASH_CLIENT_ID;
const MONCASH_CLIENT_SECRET = process.env.VITE_MONCASH_CLIENT_SECRET;

// Cache for access token
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get MonCash access token
 */
async function getAccessToken() {
    // Return cached token if still valid
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    try {
        const credentials = Buffer.from(`${MONCASH_CLIENT_ID}:${MONCASH_CLIENT_SECRET}`).toString('base64');

        const response = await axios.post(
            `${MONCASH_API_BASE}/oauth/token`,
            'grant_type=client_credentials&scope=read,write',
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        cachedToken = response.data.access_token;
        // Token expires in 1 hour, cache for 50 minutes to be safe
        tokenExpiry = Date.now() + (50 * 60 * 1000);

        logger.info('MonCash access token obtained');
        return cachedToken;

    } catch (error) {
        logger.error('Failed to get MonCash access token', error);
        throw new Error('Impossible de se connecter à MonCash');
    }
}

/**
 * Process MonCash payout
 * @param {Object} payoutData - Payout information
 * @returns {Object} - Transaction result
 */
export async function processMonCashPayout(payoutData) {
    try {
        const { amount, destination, vendorId, payoutId } = payoutData;

        // Validate phone number format (MonCash uses format: 509XXXXXXXX)
        const phoneNumber = destination.phoneNumber.replace(/[^0-9]/g, '');
        if (!phoneNumber.match(/^509[0-9]{8}$/)) {
            throw new Error('Numéro MonCash invalide. Format requis: 509XXXXXXXX');
        }

        // Get access token
        const accessToken = await getAccessToken();

        // Create payout request
        const payoutRequest = {
            amount: amount,
            receiver: phoneNumber,
            desc: `Payout Union Digitale - ${payoutId}`,
            orderId: payoutId
        };

        logger.info('Processing MonCash payout', {
            vendorId,
            payoutId,
            amount,
            receiver: phoneNumber.substring(0, 6) + '***' // Log partial number for privacy
        });

        // Send payout request
        const response = await axios.post(
            `${MONCASH_API_BASE}/v1/transfert`,
            payoutRequest,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Check response
        if (response.data.status === 'success' || response.data.transaction_id) {
            logger.info('MonCash payout successful', {
                payoutId,
                transactionId: response.data.transaction_id
            });

            return {
                success: true,
                transactionId: response.data.transaction_id,
                reference: response.data.reference,
                message: 'Payout envoyé avec succès'
            };
        } else {
            throw new Error(response.data.message || 'Payout échoué');
        }

    } catch (error) {
        logger.error('MonCash payout failed', error, {
            vendorId: payoutData.vendorId,
            payoutId: payoutData.payoutId
        });

        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Erreur MonCash',
            errorCode: error.response?.data?.code
        };
    }
}

/**
 * Check MonCash payout status
 */
export async function checkMonCashPayoutStatus(transactionId) {
    try {
        const accessToken = await getAccessToken();

        const response = await axios.get(
            `${MONCASH_API_BASE}/v1/transaction/${transactionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        return {
            success: true,
            status: response.data.status,
            data: response.data
        };

    } catch (error) {
        logger.error('Failed to check MonCash status', error, { transactionId });
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get MonCash account balance (for admin)
 */
export async function getMonCashBalance() {
    try {
        const accessToken = await getAccessToken();

        const response = await axios.get(
            `${MONCASH_API_BASE}/v1/balance`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        return {
            success: true,
            balance: response.data.balance,
            currency: 'HTG'
        };

    } catch (error) {
        logger.error('Failed to get MonCash balance', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Validate MonCash phone number
 */
export function validateMonCashNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');

    // MonCash numbers start with 509 and have 11 digits total
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
        error: 'Numéro MonCash invalide. Format: 509XXXXXXXX ou XXXXXXXX'
    };
}

export default {
    processMonCashPayout,
    checkMonCashPayoutStatus,
    getMonCashBalance,
    validateMonCashNumber
};
