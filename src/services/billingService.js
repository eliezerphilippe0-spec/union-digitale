import { db } from '../lib/firebase';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * UD-Peye Bil Service
 * Manages public utility payments and recurring bill tracking for Haiti.
 */

export const BILL_CATEGORIES = {
    ELECTRICITY: { id: 'edh', label: 'EDH - Électricité', color: 'bg-yellow-100 text-yellow-800' },
    WATER: { id: 'dinepa', label: 'DINEPA - Eau', color: 'bg-blue-100 text-blue-800' },
    INTERNET: { id: 'internet', label: 'Internet (Canal+, ITEK, Access)', color: 'bg-purple-100 text-purple-800' },
    EDUCATION: { id: 'scolarite', label: 'Scolarité / Écoles', color: 'bg-green-100 text-green-800' }
};

/**
 * Fetch bills for a specific user
 */
export async function getUserBills(userId) {
    try {
        const q = query(
            collection(db, 'bills'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        logger.error('Failed to fetch user bills', error);
        return [];
    }
}

/**
 * Register a new bill for tracking (e.g. EDH Account Number)
 */
export async function registerBillAccount(userId, accountData) {
    try {
        const billRef = await addDoc(collection(db, 'bill_accounts'), {
            userId,
            category: accountData.category,
            accountNumber: accountData.accountNumber,
            alias: accountData.alias || accountData.category,
            lastChecked: serverTimestamp(),
            createdAt: serverTimestamp()
        });
        return billRef.id;
    } catch (error) {
        logger.error('Failed to register bill account', error);
        throw error;
    }
}

/**
 * Process a bill payment entry
 */
export async function createBillPaymentRecord(userId, paymentData) {
    try {
        const docRef = await addDoc(collection(db, 'bills'), {
            userId,
            ...paymentData,
            status: 'pending', // pending, paid, failed
            currency: 'HTG',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        logger.info(`Bill payment created: ${docRef.id} for category ${paymentData.category}`);
        return docRef.id;
    } catch (error) {
        logger.error('Failed to create bill payment record', error);
        throw error;
    }
}

/**
 * Update bill status after gateway confirmation
 */
export async function updateBillStatus(billId, status, transactionId = null) {
    try {
        const billRef = doc(db, 'bills', billId);
        await updateDoc(billRef, {
            status,
            transactionId,
            updatedAt: serverTimestamp()
        });
        logger.success(`Bill ${billId} status updated to ${status}`);
    } catch (error) {
        logger.error('Failed to update bill status', error);
    }
}

export default {
    BILL_CATEGORIES,
    getUserBills,
    registerBillAccount,
    createBillPaymentRecord,
    updateBillStatus
};
