import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';

/**
 * Transaction Logger for Union Digitale Financial Services
 * Logs all financial transactions to Firestore with security and audit trail
 */

export const TRANSACTION_TYPES = {
    RECHARGE_MONCASH: 'recharge_moncash',
    RECHARGE_NATCASH: 'recharge_natcash',
    TRANSFER: 'transfer',
    PAYMENT_EDH: 'payment_edh',
    PAYMENT_CAMEP: 'payment_camep'
};

export const TRANSACTION_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

/**
 * Log a transaction to Firestore
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<string>} - Transaction ID
 */
export const logTransaction = async (transactionData) => {
    try {
        // Import validation schemas
        const { safeValidate, TransactionValidators, TransactionSchema, formatValidationErrors } = await import('./validationSchemas.js');

        const { type } = transactionData;

        // Use type-specific validator if available, otherwise use generic schema
        const schema = TransactionValidators[type] || TransactionSchema;
        const validation = safeValidate(schema, transactionData);

        if (!validation.success) {
            const errors = formatValidationErrors(validation.error);
            console.error('Transaction validation failed:', errors);
            throw new Error(`Validation échouée: ${errors.join(', ')}`);
        }

        const validatedData = validation.data;

        // Create transaction object
        const transaction = {
            userId: validatedData.userId,
            type: validatedData.type,
            amount: validatedData.amount,
            currency: validatedData.currency,
            status: validatedData.status,
            recipient: validatedData.recipient || null,
            phoneNumber: validatedData.phoneNumber || null,
            accountNumber: validatedData.accountNumber || null,
            metadata: validatedData.metadata || {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ipAddress: null, // Should be set by backend in production
            userAgent: navigator.userAgent,
            referenceId: generateReferenceId(validatedData.type)
        };

        // Add to Firestore
        const docRef = await addDoc(collection(db, 'transactions'), transaction);

        console.log('Transaction logged:', docRef.id);
        return docRef.id;

    } catch (error) {
        console.error('Error logging transaction:', error);
        throw error;
    }
};

/**
 * Update transaction status
 * @param {string} transactionId - Transaction ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional data to update
 */
export const updateTransactionStatus = async (transactionId, status, additionalData = {}) => {
    try {
        const { updateDoc, doc } = await import('firebase/firestore');

        await updateDoc(doc(db, 'transactions', transactionId), {
            status,
            ...additionalData,
            updatedAt: serverTimestamp()
        });

        console.log('Transaction status updated:', transactionId, status);
    } catch (error) {
        console.error('Error updating transaction:', error);
        throw error;
    }
};

/**
 * Get user transactions with cursor-based pagination
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{transactions: Array, hasMore: boolean, lastDoc: any}>}
 */
export const getUserTransactions = async (userId, options = {}) => {
    try {
        const {
            limit = 50,
            type = null,
            status = null,
            startAfter = null, // Cursor for pagination
            startDate = null,
            endDate = null
        } = options;

        // Import pagination utilities
        const { limit: limitQuery, startAfter: startAfterQuery } = await import('firebase/firestore');

        let q = query(
            collection(db, 'transactions'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limitQuery(limit + 1) // Fetch one extra to check if there are more
        );

        // Add filters
        if (type) {
            q = query(q, where('type', '==', type));
        }
        if (status) {
            q = query(q, where('status', '==', status));
        }

        // Add cursor for pagination
        if (startAfter) {
            q = query(q, startAfterQuery(startAfter));
        }

        const querySnapshot = await getDocs(q);
        const transactions = [];
        let lastDoc = null;

        querySnapshot.forEach((doc, index) => {
            // Don't include the extra document in results
            if (index < limit) {
                transactions.push({
                    id: doc.id,
                    ...doc.data()
                });
                lastDoc = doc; // Keep track of last document for next page
            }
        });

        // Check if there are more results
        const hasMore = querySnapshot.size > limit;

        return {
            transactions,
            hasMore,
            lastDoc: hasMore ? lastDoc : null
        };

    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};

/**
 * Generate unique reference ID
 * @param {string} type - Transaction type
 * @returns {string} - Reference ID
 */
const generateReferenceId = (type) => {
    const prefix = {
        [TRANSACTION_TYPES.RECHARGE_MONCASH]: 'MCH',
        [TRANSACTION_TYPES.RECHARGE_NATCASH]: 'NCH',
        [TRANSACTION_TYPES.TRANSFER]: 'TRF',
        [TRANSACTION_TYPES.PAYMENT_EDH]: 'EDH',
        [TRANSACTION_TYPES.PAYMENT_CAMEP]: 'CAM'
    };

    const typePrefix = prefix[type] || 'TXN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `${typePrefix}${timestamp}${random}`;
};

/**
 * Validate transaction amount
 * @param {number} amount - Amount to validate
 * @param {string} type - Transaction type
 * @returns {boolean} - Is valid
 */
export const validateTransactionAmount = (amount, type) => {
    const limits = {
        [TRANSACTION_TYPES.RECHARGE_MONCASH]: { min: 50, max: 50000 },
        [TRANSACTION_TYPES.RECHARGE_NATCASH]: { min: 50, max: 50000 },
        [TRANSACTION_TYPES.TRANSFER]: { min: 50, max: 50000 },
        [TRANSACTION_TYPES.PAYMENT_EDH]: { min: 100, max: 100000 },
        [TRANSACTION_TYPES.PAYMENT_CAMEP]: { min: 50, max: 50000 }
    };

    const limit = limits[type];
    if (!limit) return false;

    return amount >= limit.min && amount <= limit.max;
};

/**
 * Get transaction statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Statistics
 */
export const getTransactionStats = async (userId) => {
    try {
        const transactions = await getUserTransactions(userId);

        const stats = {
            total: transactions.length,
            completed: transactions.filter(t => t.status === TRANSACTION_STATUS.COMPLETED).length,
            pending: transactions.filter(t => t.status === TRANSACTION_STATUS.PENDING).length,
            failed: transactions.filter(t => t.status === TRANSACTION_STATUS.FAILED).length,
            totalAmount: transactions
                .filter(t => t.status === TRANSACTION_STATUS.COMPLETED)
                .reduce((sum, t) => sum + t.amount, 0),
            byType: {}
        };

        // Group by type
        Object.values(TRANSACTION_TYPES).forEach(type => {
            stats.byType[type] = transactions.filter(t => t.type === type).length;
        });

        return stats;

    } catch (error) {
        console.error('Error calculating stats:', error);
        throw error;
    }
};

export default {
    logTransaction,
    updateTransactionStatus,
    getUserTransactions,
    validateTransactionAmount,
    getTransactionStats,
    TRANSACTION_TYPES,
    TRANSACTION_STATUS
};
