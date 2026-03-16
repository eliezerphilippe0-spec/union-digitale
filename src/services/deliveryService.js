import { db } from '../lib/firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    serverTimestamp,
    increment,
    runTransaction
} from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * UD Solution - Delivery & Logistics Service
 * Manages the "Envíos Extra" collaborative delivery network.
 */

// Constants
const DELIVERY_COMMISSION = 0.85; // Driver gets 85% of delivery fee
const BASE_DELIVERY_FEE = 250; // Default delivery fee in HTG

/**
 * Register a user as a driver (UD Solution Onboarding)
 */
export async function registerDriver(userId, driverData) {
    try {
        const driverRef = doc(db, 'drivers', userId);
        await setDoc(driverRef, {
            ...driverData,
            status: 'pending_verification',
            totalDeliveries: 0,
            rating: 5.0,
            isOnline: false,
            joinedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        logger.info('New driver registered for UD Solution', { userId });
        return { success: true };
    } catch (error) {
        logger.error('Failed to register driver', error);
        throw error;
    }
}

/**
 * Create a delivery mission from an order
 */
export async function createMissionFromOrder(orderId, orderData) {
    try {
        const missionData = {
            orderId,
            vendorId: orderData.vendorId,
            customerId: orderData.customerId,
            pickupAddress: orderData.pickupAddress || 'Magasin Vendeur',
            deliveryAddress: orderData.shippingAddress,
            deliveryFee: orderData.deliveryFee || BASE_DELIVERY_FEE,
            status: 'available', // available, assigned, picked_up, delivered, cancelled
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'missions'), missionData);
        logger.info('Mission created for UD Solution', { missionId: docRef.id, orderId });
        return docRef.id;
    } catch (error) {
        logger.error('Failed to create mission', error);
        return null;
    }
}

/**
 * Get available missions for drivers
 */
export async function getAvailableMissions() {
    try {
        const q = query(
            collection(db, 'missions'),
            where('status', '==', 'available')
        );
        const snap = await getDoc(q); // Simplified for now
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        logger.error('Failed to get available missions', error);
        return [];
    }
}

/**
 * Accept a mission (Driver assignment)
 */
export async function acceptMission(missionId, driverId) {
    try {
        return await runTransaction(db, async (transaction) => {
            const missionRef = doc(db, 'missions', missionId);
            const missionSnap = await transaction.get(missionRef);

            if (!missionSnap.exists()) throw new Error('Mission non trouvée');
            if (missionSnap.data().status !== 'available') throw new Error('Mission déjà prise');

            transaction.update(missionRef, {
                status: 'assigned',
                driverId,
                assignedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            return { success: true };
        });
    } catch (error) {
        logger.error('Failed to accept mission', error);
        throw error;
    }
}

/**
 * Confirm delivery and trigger instant payout (UD Solution Core)
 */
export async function completeDelivery(missionId, driverId) {
    try {
        return await runTransaction(db, async (transaction) => {
            const missionRef = doc(db, 'missions', missionId);
            const missionSnap = await transaction.get(missionRef);
            const mission = missionSnap.data();

            if (mission.status !== 'picked_up') throw new Error('Mission non prête pour finalisation');

            // 1. Mark mission as delivered
            transaction.update(missionRef, {
                status: 'delivered',
                deliveredAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // 2. Update Driver Stats
            const driverRef = doc(db, 'drivers', driverId);
            transaction.update(driverRef, {
                totalDeliveries: increment(1)
            });

            // 3. Instant Payout to Driver Wallet
            const driverPayout = mission.deliveryFee * DELIVERY_COMMISSION;
            const walletRef = doc(db, 'wallets', driverId);

            transaction.update(walletRef, {
                availableBalance: increment(driverPayout),
                totalEarnings: increment(driverPayout),
                updatedAt: serverTimestamp()
            });

            // 4. Log Transaction
            const txRef = doc(collection(db, 'wallet_transactions'));
            transaction.set(txRef, {
                vendorId: driverId, // Reusing field for simplicity or rename to holderId
                type: 'delivery_payout',
                amount: driverPayout,
                missionId,
                description: `Paiement mission #${missionId}`,
                createdAt: serverTimestamp()
            });

            return { success: true, payout: driverPayout };
        });
    } catch (error) {
        logger.error('Failed to complete delivery', error);
        throw error;
    }
}

export default {
    registerDriver,
    createMissionFromOrder,
    getAvailableMissions,
    acceptMission,
    completeDelivery
};
