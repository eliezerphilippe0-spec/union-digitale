import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Transfer funds between wallets atomically
 * Prevents race conditions and overdrafts
 */
export const transferFunds = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { toUserId, amount, description, idempotencyKey } = request.data;
  const fromUserId = request.auth.uid;

  // Validation
  if (!toUserId || typeof toUserId !== 'string') {
    throw new HttpsError('invalid-argument', 'toUserId is required');
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new HttpsError('invalid-argument', 'amount must be positive number');
  }

  if (amount > 1000000) {
    throw new HttpsError('invalid-argument', 'amount exceeds maximum (1,000,000 HTG)');
  }

  if (fromUserId === toUserId) {
    throw new HttpsError('invalid-argument', 'cannot transfer to yourself');
  }

  // Check idempotency
  if (idempotencyKey) {
    const idempotencyRef = db.collection('transfer_idempotency').doc(idempotencyKey);
    const existing = await idempotencyRef.get();

    if (existing.exists) {
      const data = existing.data();
      if (data?.status === 'completed') {
        return { success: true, duplicate: true, transactionId: data.transactionId };
      } else if (data?.status === 'processing') {
        throw new HttpsError('already-exists', 'Transfer already in progress');
      }
    }

    // Set lock
    await idempotencyRef.set({
      fromUserId,
      toUserId,
      amount,
      status: 'processing',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  try {
    // Execute transfer atomically
    const result = await db.runTransaction(async (transaction) => {
      const fromBalanceRef = db.collection('balances').doc(fromUserId);
      const toBalanceRef = db.collection('balances').doc(toUserId);

      const fromBalanceDoc = await transaction.get(fromBalanceRef);
      const toBalanceDoc = await transaction.get(toBalanceRef);

      // Check sender has balance
      if (!fromBalanceDoc.exists) {
        throw new HttpsError('failed-precondition', 'Sender has no wallet');
      }

      const fromBalance = fromBalanceDoc.data();
      const currentAvailable = fromBalance.available || 0;

      if (currentAvailable < amount) {
        throw new HttpsError(
          'failed-precondition',
          `Insufficient balance. Available: ${currentAvailable} HTG, Required: ${amount} HTG`
        );
      }

      // Deduct from sender
      transaction.update(fromBalanceRef, {
        available: currentAvailable - amount,
        total: (fromBalance.total || 0) - amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Add to recipient
      if (toBalanceDoc.exists) {
        const toBalance = toBalanceDoc.data();
        transaction.update(toBalanceRef, {
          available: (toBalance.available || 0) + amount,
          total: (toBalance.total || 0) + amount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Create recipient wallet if doesn't exist
        transaction.set(toBalanceRef, {
          userId: toUserId,
          available: amount,
          pending: 0,
          total: amount,
          currency: 'HTG',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Create transaction record
      const transactionRef = db.collection('wallet_transactions').doc();
      transaction.set(transactionRef, {
        fromUserId,
        toUserId,
        amount,
        type: 'transfer',
        description: description || 'Wallet transfer',
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { transactionId: transactionRef.id };
    });

    // Update idempotency record
    if (idempotencyKey) {
      await db.collection('transfer_idempotency').doc(idempotencyKey).update({
        status: 'completed',
        transactionId: result.transactionId,
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`✅ Transfer completed: ${amount} HTG from ${fromUserId} to ${toUserId}`);

    return {
      success: true,
      transactionId: result.transactionId,
      amount
    };

  } catch (error: any) {
    // Update idempotency record with error
    if (idempotencyKey) {
      await db.collection('transfer_idempotency').doc(idempotencyKey).update({
        status: 'failed',
        error: error.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    console.error('Transfer error:', error);
    throw new HttpsError('internal', 'Failed to complete transfer');
  }
});

/**
 * Withdraw funds from wallet to external account
 */
export const withdrawFunds = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { amount, method, accountDetails, idempotencyKey } = request.data;
  const userId = request.auth.uid;

  // Validation
  if (!amount || amount <= 0) {
    throw new HttpsError('invalid-argument', 'amount must be positive');
  }

  if (amount < 100) {
    throw new HttpsError('invalid-argument', 'minimum withdrawal is 100 HTG');
  }

  if (!method || !['moncash', 'bank_transfer'].includes(method)) {
    throw new HttpsError('invalid-argument', 'method must be moncash or bank_transfer');
  }

  // Check idempotency
  if (idempotencyKey) {
    const idempotencyRef = db.collection('withdrawal_idempotency').doc(idempotencyKey);
    const existing = await idempotencyRef.get();

    if (existing.exists) {
      const data = existing.data();
      if (data?.status === 'completed') {
        return { success: true, duplicate: true, withdrawalId: data.withdrawalId };
      }
    }

    await idempotencyRef.set({
      userId,
      amount,
      status: 'processing',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  try {
    const result = await db.runTransaction(async (transaction) => {
      const balanceRef = db.collection('balances').doc(userId);
      const balanceDoc = await transaction.get(balanceRef);

      if (!balanceDoc.exists) {
        throw new HttpsError('failed-precondition', 'No wallet found');
      }

      const balance = balanceDoc.data();
      const available = balance.available || 0;

      if (available < amount) {
        throw new HttpsError(
          'failed-precondition',
          `Insufficient balance. Available: ${available} HTG`
        );
      }

      // Move to pending (not available until withdrawal approved)
      transaction.update(balanceRef, {
        available: available - amount,
        pending: (balance.pending || 0) + amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create payout request
      const payoutRef = db.collection('payouts').doc();
      transaction.set(payoutRef, {
        userId,
        amount,
        method,
        accountDetails: accountDetails || {},
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: null,
        approvedAt: null
      });

      // Create transaction record
      const txRef = db.collection('wallet_transactions').doc();
      transaction.set(txRef, {
        userId,
        amount: -amount, // Negative for withdrawal
        type: 'withdrawal',
        status: 'pending',
        payoutId: payoutRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { withdrawalId: payoutRef.id };
    });

    // Update idempotency
    if (idempotencyKey) {
      await db.collection('withdrawal_idempotency').doc(idempotencyKey).update({
        status: 'completed',
        withdrawalId: result.withdrawalId,
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`✅ Withdrawal request created: ${amount} HTG for ${userId}`);

    return {
      success: true,
      withdrawalId: result.withdrawalId,
      status: 'pending'
    };

  } catch (error: any) {
    if (idempotencyKey) {
      await db.collection('withdrawal_idempotency').doc(idempotencyKey).update({
        status: 'failed',
        error: error.message
      });
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    console.error('Withdrawal error:', error);
    throw new HttpsError('internal', 'Failed to create withdrawal');
  }
});

/**
 * Get wallet balance (read-only, safe for client to call)
 */
export const getWalletBalance = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    const balanceDoc = await db.collection('balances').doc(userId).get();

    if (!balanceDoc.exists) {
      // Create default wallet if doesn't exist
      await db.collection('balances').doc(userId).set({
        userId,
        available: 0,
        pending: 0,
        total: 0,
        currency: 'HTG',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        available: 0,
        pending: 0,
        total: 0,
        currency: 'HTG'
      };
    }

    const balance = balanceDoc.data();

    return {
      available: balance.available || 0,
      pending: balance.pending || 0,
      total: balance.total || 0,
      currency: balance.currency || 'HTG'
    };

  } catch (error) {
    console.error('Error fetching balance:', error);
    throw new HttpsError('internal', 'Failed to fetch balance');
  }
});

/**
 * Get wallet transaction history
 */
export const getWalletTransactions = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { limitCount = 50 } = request.data;
  const userId = request.auth.uid;

  try {
    const snapshot = await db
      .collection('wallet_transactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { transactions };

  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new HttpsError('internal', 'Failed to fetch transactions');
  }
});

/**
 * Admin function to approve withdrawal
 */
export const approveWithdrawal = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Check admin role
  if (request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can approve withdrawals');
  }

  const { withdrawalId } = request.data;

  if (!withdrawalId) {
    throw new HttpsError('invalid-argument', 'withdrawalId required');
  }

  try {
    await db.runTransaction(async (transaction) => {
      const payoutRef = db.collection('payouts').doc(withdrawalId);
      const payoutDoc = await transaction.get(payoutRef);

      if (!payoutDoc.exists) {
        throw new HttpsError('not-found', 'Withdrawal not found');
      }

      const payout = payoutDoc.data();

      if (payout.status !== 'pending') {
        throw new HttpsError('failed-precondition', 'Withdrawal already processed');
      }

      const userId = payout.userId;
      const amount = payout.amount;

      // Update payout status
      transaction.update(payoutRef, {
        status: 'approved',
        approvedBy: request.auth.uid,
        approvedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Move from pending to completed (deduct from total)
      const balanceRef = db.collection('balances').doc(userId);
      const balanceDoc = await transaction.get(balanceRef);

      if (balanceDoc.exists) {
        const balance = balanceDoc.data();
        transaction.update(balanceRef, {
          pending: (balance.pending || 0) - amount,
          total: (balance.total || 0) - amount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Update transaction status
      const txSnapshot = await db
        .collection('wallet_transactions')
        .where('payoutId', '==', withdrawalId)
        .limit(1)
        .get();

      if (!txSnapshot.empty) {
        transaction.update(txSnapshot.docs[0].ref, {
          status: 'completed'
        });
      }
    });

    console.log(`✅ Withdrawal approved: ${withdrawalId}`);

    return { success: true };

  } catch (error: any) {
    if (error instanceof HttpsError) {
      throw error;
    }

    console.error('Approval error:', error);
    throw new HttpsError('internal', 'Failed to approve withdrawal');
  }
});
