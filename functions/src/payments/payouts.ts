import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import * as crypto from "crypto";

const db = admin.firestore();

// MonCash Configuration
const MONCASH_API_BASE = process.env.MONCASH_API_URL || 'https://sandbox.moncashbutton.digicelgroup.com/Api';
const MONCASH_CLIENT_ID = process.env.MONCASH_CLIENT_ID;
const MONCASH_CLIENT_SECRET = process.env.MONCASH_CLIENT_SECRET;

// NatCash Configuration
const NATCASH_API_BASE = process.env.NATCASH_API_URL || 'https://api.natcom.ht/natcash';
const NATCASH_API_KEY = process.env.NATCASH_API_KEY;
const NATCASH_MERCHANT_ID = process.env.NATCASH_MERCHANT_ID;

/**
 * Get MonCash Access Token (Server-side)
 */
async function getMonCashToken() {
    if (!MONCASH_CLIENT_ID || !MONCASH_CLIENT_SECRET) {
        throw new Error('MonCash credentials missing in backend environment');
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
        return response.data.access_token;
    } catch (error: any) {
        console.error('MonCash Auth Error:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with MonCash');
    }
}

/**
 * Secure MonCash Payout
 */
export const processMonCashPayoutSecure = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { payoutId } = request.data;
    const userId = request.auth.uid;

    if (!payoutId) {
        throw new HttpsError('invalid-argument', 'payoutId is required');
    }

    try {
        // 1. Get payout details from Firestore
        const payoutDoc = await db.collection('payouts').doc(payoutId).get();
        if (!payoutDoc.exists) {
            throw new HttpsError('not-found', 'Payout request not found');
        }

        const payout = payoutDoc.data()!;

        // 2. Validate payout ownership and status
        if (payout.userId !== userId) {
            throw new HttpsError('permission-denied', 'Unauthorized payout access');
        }
        if (payout.status !== 'pending') {
            throw new HttpsError('failed-precondition', 'Payout already processed or cancelled');
        }
        if (payout.method !== 'moncash') {
            throw new HttpsError('invalid-argument', 'Invalid payout method');
        }

        // 3. SECURE: Get token on server
        const accessToken = await getMonCashToken();

        // 4. Execute Payout
        const phoneNumber = payout.accountDetails.phoneNumber.replace(/[^0-9]/g, '');
        const response = await axios.post(
            `${MONCASH_API_BASE}/v1/transfert`,
            {
                amount: payout.amount,
                receiver: phoneNumber,
                desc: `Payout Union Digitale - ${payoutId}`,
                orderId: payoutId
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // 5. Update Firestore
        if (response.data.status === 'success' || response.data.transaction_id) {
            await db.collection('payouts').doc(payoutId).update({
                status: 'completed',
                transactionId: response.data.transaction_id,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, transactionId: response.data.transaction_id };
        } else {
            throw new Error(response.data.message || 'Payout failed');
        }

    } catch (error: any) {
        console.error('MonCash Payout Error:', error.response?.data || error.message);
        throw new HttpsError('internal', error.message || 'Payment processing failed');
    }
});

/**
 * Secure NatCash Payout
 */
export const processNatCashPayoutSecure = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { payoutId } = request.data;
    const userId = request.auth.uid;

    if (!payoutId || !NATCASH_API_KEY || !NATCASH_MERCHANT_ID) {
        throw new HttpsError('failed-precondition', 'Missing required configuration');
    }

    try {
        const payoutDoc = await db.collection('payouts').doc(payoutId).get();
        if (!payoutDoc.exists) throw new HttpsError('not-found', 'Payout not found');

        const payout = payoutDoc.data()!;
        if (payout.userId !== userId) throw new HttpsError('permission-denied', 'Unauthorized');
        if (payout.status !== 'pending') throw new HttpsError('failed-precondition', 'Invalid status');

        const phoneNumber = payout.accountDetails.phoneNumber.replace(/[^0-9]/g, '');

        // NatCash Payout API call
        const response = await axios.post(
            `${NATCASH_API_BASE}/v1/payouts`,
            {
                merchant_id: NATCASH_MERCHANT_ID,
                transaction_id: payoutId,
                amount: payout.amount,
                currency: 'HTG',
                recipient_phone: phoneNumber,
                description: `Payout Union Digitale - ${payoutId}`
            },
            {
                headers: {
                    'Authorization': `Bearer ${NATCASH_API_KEY}`,
                    'Content-Type': 'application/json',
                    'X-Merchant-ID': NATCASH_MERCHANT_ID
                }
            }
        );

        if (response.data.status === 'success') {
            await db.collection('payouts').doc(payoutId).update({
                status: 'completed',
                transactionId: response.data.transaction_id,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, transactionId: response.data.transaction_id };
        } else {
            throw new Error(response.data.message || 'NatCash payout failed');
        }

    } catch (error: any) {
        console.error('NatCash Payout Error:', error.response?.data || error.message);
        throw new HttpsError('internal', error.message || 'NatCash Payout failed');
    }
});
