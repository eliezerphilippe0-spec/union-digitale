const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

/**
 * MonCash Webhook Handler for Union Digitale Marketplace
 * Handles payment.success events with 15% commission splits
 * 
 * Flow:
 * 1. Verify webhook signature from MonCash
 * 2. Update order status to 'paid'
 * 3. Calculate 15% platform commission
 * 4. Credit 85% to vendor balance
 * 5. Track platform revenue
 * 6. Send buyer notification
 * 7. Return 200 OK to MonCash
 */

// Initialize Firestore
const db = admin.firestore();

// MonCash webhook secret (set in environment variables)
const MONCASH_WEBHOOK_SECRET = process.env.MONCASH_WEBHOOK_SECRET || 'your-webhook-secret';
const PLATFORM_COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.15');

/**
 * Verify MonCash webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Signature from MonCash header
 * @returns {boolean}
 */
function verifyWebhookSignature(payload, signature) {
    const expectedSignature = crypto
        .createHmac('sha256', MONCASH_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * MonCash Webhook Endpoint
 * POST /api/webhooks/moncash
 */
exports.moncashWebhook = functions.https.onRequest(async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        // Get signature from header
        const signature = req.headers['x-moncash-signature'];

        if (!signature) {
            console.error('❌ Missing MonCash signature');
            return res.status(401).send('Unauthorized: Missing signature');
        }

        // Verify signature
        const rawBody = JSON.stringify(req.body);
        if (!verifyWebhookSignature(rawBody, signature)) {
            console.error('❌ Invalid MonCash signature');
            return res.status(401).send('Unauthorized: Invalid signature');
        }

        const event = req.body;
        console.log('📥 MonCash webhook received:', event.type);

        // Handle payment.success event
        if (event.type === 'payment.success') {
            await handlePaymentSuccess(event.data);
        } else {
            console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }

        // Always return 200 to acknowledge receipt
        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ Webhook error:', error);

        // Return 200 even on error to prevent MonCash retries
        // Log error for manual investigation
        await logWebhookError(error, req.body);
        return res.status(200).json({ received: true, error: 'Logged for investigation' });
    }
});

/**
 * Handle payment.success event
 * @param {Object} paymentData - Payment data from MonCash
 */
async function handlePaymentSuccess(paymentData) {
    const { orderId, transactionId, amount, currency, payer } = paymentData;

    console.log(`💰 Processing payment for order: ${orderId}`);

    try {
        // 1. Get order document
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            throw new Error(`Order not found: ${orderId}`);
        }

        const orderData = orderDoc.data();

        // 2. Check if already processed
        if (orderData.status === 'paid') {
            console.log(`⚠️ Order ${orderId} already processed`);
            return;
        }

        // 3. Update order status
        await orderRef.update({
            status: 'paid',
            paymentMethod: 'moncash',
            transactionId: transactionId,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            paymentDetails: {
                amount: amount,
                currency: currency,
                payer: payer
            }
        });

        console.log(`✅ Order ${orderId} marked as paid`);

        // 4. Process commission splits for each item
        const batch = db.batch();
        const items = orderData.items || [];
        const vendorPayouts = {};

        for (const item of items) {
            const vendorId = item.vendorId;
            const itemTotal = item.price * item.quantity;

            // Calculate commission
            const platformFee = itemTotal * PLATFORM_COMMISSION_RATE;
            const vendorPayout = itemTotal * (1 - PLATFORM_COMMISSION_RATE);

            // Accumulate vendor payouts
            if (!vendorPayouts[vendorId]) {
                vendorPayouts[vendorId] = {
                    total: 0,
                    platformFee: 0
                };
            }
            vendorPayouts[vendorId].total += vendorPayout;
            vendorPayouts[vendorId].platformFee += platformFee;
        }

        // 5. Update vendor balances
        for (const [vendorId, payout] of Object.entries(vendorPayouts)) {
            const balanceRef = db.collection('balances').doc(vendorId);

            batch.set(balanceRef, {
                vendorId: vendorId,
                available: admin.firestore.FieldValue.increment(payout.total),
                total: admin.firestore.FieldValue.increment(payout.total),
                currency: currency || 'HTG',
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Create transaction record
            const txRef = db.collection('transactions').doc();
            batch.set(txRef, {
                vendorId: vendorId,
                userId: orderData.userId,
                orderId: orderId,
                type: 'sale',
                amount: payout.total,
                platformFee: payout.platformFee,
                currency: currency || 'HTG',
                status: 'completed',
                transactionId: transactionId,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`💵 Vendor ${vendorId} credited: ${payout.total} HTG (Fee: ${payout.platformFee} HTG)`);
        }

        // 6. Track platform revenue
        const totalPlatformFee = Object.values(vendorPayouts).reduce((sum, p) => sum + p.platformFee, 0);
        const revenueRef = db.collection('platform_revenue').doc();
        batch.set(revenueRef, {
            orderId: orderId,
            amount: totalPlatformFee,
            source: 'moncash_commission',
            transactionId: transactionId,
            currency: currency || 'HTG',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`🏦 Platform revenue: ${totalPlatformFee} HTG`);

        // 7. Commit all updates
        await batch.commit();

        // 8. Send buyer notification (async, don't wait)
        sendBuyerNotification(orderData.userId, orderId, amount).catch(console.error);

        // 9. Create transaction lock to prevent duplicates (expires in 5 minutes)
        const lockRef = db.collection('transaction_locks').doc(orderData.userId);
        await lockRef.set({
            orderId: orderId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000)
        });

        console.log(`✅ Payment processed successfully for order ${orderId}`);

    } catch (error) {
        console.error(`❌ Error processing payment for order ${orderId}:`, error);
        throw error;
    }
}

/**
 * Send buyer notification
 * @param {string} userId - Buyer user ID
 * @param {string} orderId - Order ID
 * @param {number} amount - Payment amount
 */
async function sendBuyerNotification(userId, orderId, amount) {
    try {
        // Get user document
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            console.warn(`User not found: ${userId}`);
            return;
        }

        const userData = userDoc.data();
        const email = userData.email;
        const phoneNumber = userData.phoneNumber;

        // TODO: Implement email/SMS notification
        // For now, just log
        console.log(`📧 Notification sent to ${email || phoneNumber}: Order ${orderId} paid (${amount} HTG)`);

        // Create notification document
        await db.collection('notifications').add({
            userId: userId,
            type: 'payment_success',
            title: 'Paiement confirmé',
            message: `Votre commande ${orderId} a été payée avec succès. Montant: ${amount} HTG`,
            orderId: orderId,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

    } catch (error) {
        console.error('Error sending buyer notification:', error);
    }
}

/**
 * Log webhook errors for investigation
 * @param {Error} error - Error object
 * @param {Object} payload - Webhook payload
 */
async function logWebhookError(error, payload) {
    try {
        await db.collection('webhook_errors').add({
            source: 'moncash',
            error: {
                message: error.message,
                stack: error.stack
            },
            payload: payload,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (logError) {
        console.error('Failed to log webhook error:', logError);
    }
}

/**
 * Cleanup expired transaction locks (scheduled function)
 * Runs every 10 minutes
 */
exports.cleanupTransactionLocks = functions.pubsub
    .schedule('every 10 minutes')
    .onRun(async (context) => {
        const now = admin.firestore.Timestamp.now();
        const expiredLocks = await db.collection('transaction_locks')
            .where('expiresAt', '<', now)
            .limit(100)
            .get();

        const batch = db.batch();
        expiredLocks.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`🧹 Cleaned up ${expiredLocks.size} expired transaction locks`);
    });
