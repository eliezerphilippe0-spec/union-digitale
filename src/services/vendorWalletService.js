import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit as limitQuery,
    serverTimestamp,
    increment,
    runTransaction
} from 'firebase/firestore';
import { validatePayoutRequest } from '../utils/vendorValidationSchemas';
import logger from '../utils/logger';

/**
 * Vendor Wallet Service
 * Manages vendor wallets, balances, and transactions
 */

// Constants
export const MINIMUM_PAYOUT = 500; // 500 HTG
export const PAYOUT_FEE = 50; // 50 HTG
export const FUNDS_HOLD_DAYS = 3; // J+3

// ============================================================================
// WALLET OPERATIONS
// ============================================================================

/**
 * Get vendor wallet
 */
export async function getVendorWallet(vendorId) {
    try {
        const walletRef = doc(db, 'wallets', vendorId);
        const walletDoc = await getDoc(walletRef);

        if (!walletDoc.exists()) {
            // Create wallet if doesn't exist
            await createVendorWallet(vendorId);
            return await getVendorWallet(vendorId);
        }

        return {
            id: walletDoc.id,
            ...walletDoc.data()
        };
    } catch (error) {
        logger.error('Failed to get vendor wallet', error, { vendorId });
        throw new Error('Impossible de récupérer le portefeuille');
    }
}

/**
 * Create vendor wallet
 */
async function createVendorWallet(vendorId) {
    try {
        const walletRef = doc(db, 'wallets', vendorId);
        await updateDoc(walletRef, {
            vendorId,
            availableBalance: 0,
            pendingBalance: 0,
            totalEarnings: 0,
            totalWithdrawn: 0,
            currency: 'HTG',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        logger.info('Vendor wallet created', { vendorId });
    } catch (error) {
        logger.error('Failed to create vendor wallet', error, { vendorId });
        throw error;
    }
}

/**
 * Get wallet transactions
 */
export async function getWalletTransactions(vendorId, options = {}) {
    try {
        const {
            limit = 50,
            type = null,
            startAfter = null
        } = options;

        let q = query(
            collection(db, 'wallet_transactions'),
            where('vendorId', '==', vendorId),
            orderBy('createdAt', 'desc'),
            limitQuery(limit + 1)
        );

        if (type) {
            q = query(q, where('type', '==', type));
        }

        if (startAfter) {
            const { startAfter: startAfterQuery } = await import('firebase/firestore');
            q = query(q, startAfterQuery(startAfter));
        }

        const snapshot = await getDocs(q);
        const transactions = [];
        let lastDoc = null;

        snapshot.forEach((doc, index) => {
            if (index < limit) {
                transactions.push({
                    id: doc.id,
                    ...doc.data()
                });
                lastDoc = doc;
            }
        });

        return {
            transactions,
            hasMore: snapshot.size > limit,
            lastDoc: snapshot.size > limit ? lastDoc : null
        };
    } catch (error) {
        logger.error('Failed to get wallet transactions', error, { vendorId });
        throw new Error('Impossible de récupérer les transactions');
    }
}

/**
 * Log wallet transaction
 */
export async function logWalletTransaction(transactionData) {
    try {
        const txRef = await addDoc(collection(db, 'wallet_transactions'), {
            ...transactionData,
            createdAt: serverTimestamp()
        });

        logger.info('Wallet transaction logged', {
            transactionId: txRef.id,
            vendorId: transactionData.vendorId,
            type: transactionData.type,
            amount: transactionData.amount
        });

        return txRef.id;
    } catch (error) {
        logger.error('Failed to log wallet transaction', error, transactionData);
        throw error;
    }
}

// ============================================================================
// PAYOUT OPERATIONS
// ============================================================================

/**
 * Request payout
 */
export async function requestPayout(payoutData, currentUser) {
    try {
        // Validate input
        const validatedData = validatePayoutRequest(payoutData);

        // Get vendor
        const vendorRef = doc(db, 'vendors', currentUser.uid);
        const vendorDoc = await getDoc(vendorRef);

        if (!vendorDoc.exists()) {
            throw new Error('Vendeur non trouvé');
        }

        const vendor = vendorDoc.data();

        // Check verification
        if (vendor.verificationLevel === 'standard') {
            throw new Error('Vérification requise pour effectuer des retraits');
        }

        // Check minimum amount
        if (validatedData.amount < MINIMUM_PAYOUT) {
            throw new Error(`Montant minimum de retrait: ${MINIMUM_PAYOUT} HTG`);
        }

        // Get wallet
        const wallet = await getVendorWallet(currentUser.uid);

        // Check available balance
        if (validatedData.amount > wallet.availableBalance) {
            throw new Error('Solde disponible insuffisant');
        }

        // Check for active disputes
        const disputesQuery = query(
            collection(db, 'vendor_disputes'),
            where('vendorId', '==', currentUser.uid),
            where('status', 'in', ['open', 'investigating'])
        );
        const disputesSnapshot = await getDocs(disputesQuery);

        if (!disputesSnapshot.empty) {
            throw new Error('Impossible de retirer avec des litiges actifs');
        }

        // Calculate fees and net amount
        const fees = PAYOUT_FEE;
        const netAmount = validatedData.amount - fees;

        // Create payout request using transaction
        const payoutId = await runTransaction(db, async (transaction) => {
            // Reserve funds in wallet
            const walletRef = doc(db, 'wallets', currentUser.uid);
            const walletSnapshot = await transaction.get(walletRef);

            if (!walletSnapshot.exists()) {
                throw new Error('Wallet not found');
            }

            const currentWallet = walletSnapshot.data();

            // Double-check balance
            if (validatedData.amount > currentWallet.availableBalance) {
                throw new Error('Solde insuffisant');
            }

            // Update wallet - move from available to pending
            transaction.update(walletRef, {
                availableBalance: increment(-validatedData.amount),
                pendingBalance: increment(validatedData.amount),
                updatedAt: serverTimestamp()
            });

            // Create payout record
            const payoutRef = doc(collection(db, 'payouts'));
            transaction.set(payoutRef, {
                vendorId: currentUser.uid,
                amount: validatedData.amount,
                currency: validatedData.currency,
                method: validatedData.method,
                destination: validatedData.destination,
                status: 'pending',
                fees,
                netAmount,
                requestedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            });

            // Log transaction
            const txRef = doc(collection(db, 'wallet_transactions'));
            transaction.set(txRef, {
                vendorId: currentUser.uid,
                type: 'payout',
                amount: -validatedData.amount,
                balanceAfter: currentWallet.availableBalance - validatedData.amount,
                payoutId: payoutRef.id,
                description: `Demande de retrait ${validatedData.method}`,
                metadata: {
                    fees,
                    netAmount,
                    method: validatedData.method
                },
                createdAt: serverTimestamp()
            });

            return payoutRef.id;
        });

        logger.info('Payout requested', {
            payoutId,
            vendorId: currentUser.uid,
            amount: validatedData.amount,
            method: validatedData.method
        });

        return {
            payoutId,
            amount: validatedData.amount,
            fees,
            netAmount,
            status: 'pending'
        };

    } catch (error) {
        logger.error('Payout request failed', error, {
            userId: currentUser?.uid,
            amount: payoutData?.amount
        });
        throw error;
    }
}

/**
 * Get payout history
 */
export async function getPayoutHistory(vendorId, options = {}) {
    try {
        const {
            limit = 50,
            status = null,
            startAfter = null
        } = options;

        let q = query(
            collection(db, 'payouts'),
            where('vendorId', '==', vendorId),
            orderBy('createdAt', 'desc'),
            limitQuery(limit + 1)
        );

        if (status) {
            q = query(q, where('status', '==', status));
        }

        if (startAfter) {
            const { startAfter: startAfterQuery } = await import('firebase/firestore');
            q = query(q, startAfterQuery(startAfter));
        }

        const snapshot = await getDocs(q);
        const payouts = [];
        let lastDoc = null;

        snapshot.forEach((doc, index) => {
            if (index < limit) {
                payouts.push({
                    id: doc.id,
                    ...doc.data()
                });
                lastDoc = doc;
            }
        });

        return {
            payouts,
            hasMore: snapshot.size > limit,
            lastDoc: snapshot.size > limit ? lastDoc : null
        };
    } catch (error) {
        logger.error('Failed to get payout history', error, { vendorId });
        throw new Error('Impossible de récupérer l\'historique des retraits');
    }
}

/**
 * Cancel payout (if still pending)
 */
export async function cancelPayout(payoutId, vendorId) {
    try {
        return await runTransaction(db, async (transaction) => {
            const payoutRef = doc(db, 'payouts', payoutId);
            const payoutSnapshot = await transaction.get(payoutRef);

            if (!payoutSnapshot.exists()) {
                throw new Error('Payout not found');
            }

            const payout = payoutSnapshot.data();

            // Verify ownership
            if (payout.vendorId !== vendorId) {
                throw new Error('Unauthorized');
            }

            // Can only cancel pending payouts
            if (payout.status !== 'pending') {
                throw new Error('Seuls les retraits en attente peuvent être annulés');
            }

            // Update payout status
            transaction.update(payoutRef, {
                status: 'cancelled',
                cancelledAt: serverTimestamp()
            });

            // Refund to available balance
            const walletRef = doc(db, 'wallets', vendorId);
            transaction.update(walletRef, {
                availableBalance: increment(payout.amount),
                pendingBalance: increment(-payout.amount),
                updatedAt: serverTimestamp()
            });

            // Log transaction
            const txRef = doc(collection(db, 'wallet_transactions'));
            transaction.set(txRef, {
                vendorId,
                type: 'refund',
                amount: payout.amount,
                payoutId,
                description: 'Annulation de retrait',
                createdAt: serverTimestamp()
            });

            return { success: true };
        });
    } catch (error) {
        logger.error('Failed to cancel payout', error, { payoutId, vendorId });
        throw error;
    }
}

// ============================================================================
// VENDOR STATS
// ============================================================================

/**
 * Get vendor statistics
 */
export async function getVendorStats(vendorId) {
    try {
        const [wallet, vendor] = await Promise.all([
            getVendorWallet(vendorId),
            getDoc(doc(db, 'vendors', vendorId))
        ]);

        if (!vendor.exists()) {
            throw new Error('Vendor not found');
        }

        const vendorData = vendor.data();

        return {
            wallet: {
                availableBalance: wallet.availableBalance,
                pendingBalance: wallet.pendingBalance,
                totalEarnings: wallet.totalEarnings,
                totalWithdrawn: wallet.totalWithdrawn
            },
            performance: {
                rating: vendorData.rating || 0,
                totalOrders: vendorData.totalOrders || 0,
                totalSales: vendorData.totalSales || 0,
                responseTime: vendorData.responseTime || 0,
                successRate: vendorData.successRate || 100
            },
            verification: {
                level: vendorData.verificationLevel,
                status: vendorData.verificationStatus,
                badges: vendorData.badges || []
            }
        };
    } catch (error) {
        logger.error('Failed to get vendor stats', error, { vendorId });
        throw new Error('Impossible de récupérer les statistiques');
    }
}

export default {
    getVendorWallet,
    getWalletTransactions,
    logWalletTransaction,
    requestPayout,
    getPayoutHistory,
    cancelPayout,
    getVendorStats,
    MINIMUM_PAYOUT,
    PAYOUT_FEE,
    FUNDS_HOLD_DAYS
};
