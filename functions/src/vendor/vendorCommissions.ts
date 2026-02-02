import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

/**
 * Cloud Functions for Vendor Commission & Payout System
 */

// ============================================================================
// COMMISSION & PAYMENT PROCESSING
// ============================================================================

/**
 * Process order payment and distribute commission
 * Called after successful payment webhook
 */
export const processOrderPayment = onCall(async (request) => {
    const { orderId, amount, vendorId, productType } = request.data;

    if (!orderId || !amount || !vendorId) {
        throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
        return await db.runTransaction(async (transaction) => {
            // 1. Get vendor
            const vendorRef = db.doc(`vendors/${vendorId}`);
            const vendorDoc = await transaction.get(vendorRef);

            if (!vendorDoc.exists) {
                throw new HttpsError('not-found', 'Vendor not found');
            }

            const vendor = vendorDoc.data();

            // 2. Calculate commission
            const commissionRate = await calculateCommissionRate(
                productType || 'physical',
                vendor.verificationLevel || 'standard',
                amount
            );

            const commission = amount * commissionRate;
            const vendorEarnings = amount - commission;

            // 3. Update order
            const orderRef = db.doc(`orders/${orderId}`);
            transaction.update(orderRef, {
                commission,
                vendorEarnings,
                commissionRate,
                status: 'paid',
                paidAt: FieldValue.serverTimestamp(),
                fundsReleased: false
            });

            // 4. Credit vendor wallet (PENDING for J+3)
            const walletRef = db.doc(`wallets/${vendorId}`);
            const walletDoc = await transaction.get(walletRef);

            if (!walletDoc.exists) {
                // Create wallet if doesn't exist
                transaction.set(walletRef, {
                    vendorId,
                    availableBalance: 0,
                    pendingBalance: vendorEarnings,
                    totalEarnings: vendorEarnings,
                    totalWithdrawn: 0,
                    currency: 'HTG',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
            } else {
                const wallet = walletDoc.data();
                transaction.update(walletRef, {
                    pendingBalance: (wallet.pendingBalance || 0) + vendorEarnings,
                    totalEarnings: (wallet.totalEarnings || 0) + vendorEarnings,
                    updatedAt: FieldValue.serverTimestamp()
                });
            }

            // 5. Log wallet transaction
            const txRef = db.collection('wallet_transactions').doc();
            transaction.set(txRef, {
                vendorId,
                type: 'sale',
                amount: vendorEarnings,
                balanceAfter: (walletDoc.data()?.pendingBalance || 0) + vendorEarnings,
                orderId,
                description: `Vente commande #${orderId}`,
                metadata: {
                    commission,
                    commissionRate,
                    productType
                },
                createdAt: FieldValue.serverTimestamp()
            });

            // 6. Record platform revenue
            const revenueRef = db.collection('platform_revenue').doc();
            transaction.set(revenueRef, {
                amount: commission,
                orderId,
                vendorId,
                type: 'commission',
                commissionRate,
                productType,
                createdAt: FieldValue.serverTimestamp()
            });

            // 7. Update vendor stats
            transaction.update(vendorRef, {
                totalSales: FieldValue.increment(amount),
                totalOrders: FieldValue.increment(1),
                updatedAt: FieldValue.serverTimestamp()
            });

            console.log(`✅ Order payment processed: ${orderId}, Vendor: ${vendorEarnings} HTG, Commission: ${commission} HTG`);

            return {
                success: true,
                vendorEarnings,
                commission,
                commissionRate
            };
        });
    } catch (error) {
        console.error('Error processing order payment:', error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * Release pending funds after hold period (J+3)
 * Runs daily at 2 AM
 */
export const releasePendingFunds = onSchedule('0 2 * * *', async () => {
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() - 3); // J+3

    try {
        // Get orders ready to release
        const ordersSnapshot = await db.collection('orders')
            .where('status', '==', 'paid')
            .where('fundsReleased', '==', false)
            .where('paidAt', '<=', admin.firestore.Timestamp.fromDate(releaseDate))
            .limit(500) // Process in batches
            .get();

        if (ordersSnapshot.empty) {
            console.log('No funds to release');
            return;
        }

        const batch = db.batch();
        let count = 0;

        for (const orderDoc of ordersSnapshot.docs) {
            const order = orderDoc.data();
            const walletRef = db.doc(`wallets/${order.vendorId}`);
            const walletDoc = await walletRef.get();

            if (!walletDoc.exists) {
                console.error(`Wallet not found for vendor: ${order.vendorId}`);
                continue;
            }

            const wallet = walletDoc.data();

            // Move from pending to available
            batch.update(walletRef, {
                pendingBalance: wallet.pendingBalance - order.vendorEarnings,
                availableBalance: wallet.availableBalance + order.vendorEarnings,
                updatedAt: FieldValue.serverTimestamp()
            });

            // Mark order as released
            batch.update(orderDoc.ref, {
                fundsReleased: true,
                fundsReleasedAt: FieldValue.serverTimestamp()
            });

            // Log transaction
            batch.set(db.collection('wallet_transactions').doc(), {
                vendorId: order.vendorId,
                type: 'release',
                amount: order.vendorEarnings,
                orderId: orderDoc.id,
                description: 'Fonds disponibles pour retrait',
                createdAt: FieldValue.serverTimestamp()
            });

            count++;
        }

        await batch.commit();
        console.log(`✅ Released funds for ${count} orders`);

    } catch (error) {
        console.error('Error releasing pending funds:', error);
        throw error;
    }
});

/**
 * Process payout request
 * Called by vendor to withdraw funds
 */
export const processPayoutRequest = onCall(async (request) => {
    const { payoutId } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
        throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    if (!payoutId) {
        throw new HttpsError('invalid-argument', 'Payout ID required');
    }

    try {
        return await db.runTransaction(async (transaction) => {
            const payoutRef = db.doc(`payouts/${payoutId}`);
            const payoutDoc = await transaction.get(payoutRef);

            if (!payoutDoc.exists) {
                throw new HttpsError('not-found', 'Payout not found');
            }

            const payout = payoutDoc.data();

            // Verify ownership
            if (payout.vendorId !== userId) {
                throw new HttpsError('permission-denied', 'Unauthorized');
            }

            // Check status
            if (payout.status !== 'pending') {
                throw new HttpsError('failed-precondition', 'Payout already processed');
            }

            // Update status to processing
            transaction.update(payoutRef, {
                status: 'processing',
                processedAt: FieldValue.serverTimestamp()
            });

            // TODO: Call payment gateway (MonCash/NatCash)
            // For now, simulate success
            const result = { success: true, transactionId: `TXN${Date.now()}` };

            if (result.success) {
                // Mark as completed
                transaction.update(payoutRef, {
                    status: 'completed',
                    completedAt: FieldValue.serverTimestamp(),
                    transactionReference: result.transactionId
                });

                // Update wallet
                const walletRef = db.doc(`wallets/${payout.vendorId}`);
                const walletDoc = await transaction.get(walletRef);

                if (walletDoc.exists) {
                    const wallet = walletDoc.data();
                    transaction.update(walletRef, {
                        pendingBalance: wallet.pendingBalance - payout.amount,
                        totalWithdrawn: wallet.totalWithdrawn + payout.amount,
                        lastPayoutAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                }

                // Log transaction
                transaction.set(db.collection('wallet_transactions').doc(), {
                    vendorId: payout.vendorId,
                    type: 'payout',
                    amount: -payout.amount,
                    payoutId,
                    description: `Retrait ${payout.method}`,
                    metadata: {
                        method: payout.method,
                        transactionReference: result.transactionId
                    },
                    createdAt: FieldValue.serverTimestamp()
                });

                console.log(`✅ Payout completed: ${payoutId}, Amount: ${payout.amount} HTG`);

                return { success: true, transactionId: result.transactionId };
            } else {
                // Payout failed - refund to available balance
                transaction.update(payoutRef, {
                    status: 'failed',
                    failureReason: result.error || 'Payment gateway error'
                });

                const walletRef = db.doc(`wallets/${payout.vendorId}`);
                const walletDoc = await transaction.get(walletRef);

                if (walletDoc.exists) {
                    const wallet = walletDoc.data();
                    transaction.update(walletRef, {
                        availableBalance: wallet.availableBalance + payout.amount,
                        pendingBalance: wallet.pendingBalance - payout.amount,
                        updatedAt: FieldValue.serverTimestamp()
                    });
                }

                throw new HttpsError('internal', 'Payout failed');
            }
        });
    } catch (error) {
        console.error('Error processing payout:', error);
        throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
    }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate commission rate based on product type and vendor level
 */
async function calculateCommissionRate(productType, vendorLevel, amount) {
    const DEFAULT_RATES = {
        physical: 0.10,
        digital: 0.15,
        service: 0.12,
        rental: 0.08
    };

    const VENDOR_DISCOUNTS = {
        standard: 0.00,
        verified: -0.02,
        premium: -0.03
    };

    let baseRate = DEFAULT_RATES[productType] || DEFAULT_RATES.physical;
    const discount = VENDOR_DISCOUNTS[vendorLevel] || 0;

    // Apply limits
    const finalRate = Math.max(0.05, Math.min(baseRate + discount, 0.20));

    return finalRate;
}
