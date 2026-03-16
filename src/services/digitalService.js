import { db } from '../lib/firebase';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDocs,
    query,
    where,
    limit,
    serverTimestamp,
    runTransaction,
    increment
} from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * UD Digital Store - Digital Delivery Service
 * Manages license keys (vouchers), secure files, and automated delivery.
 */

/**
 * Upload license keys for a product (Seller Side)
 */
export async function uploadLicenseKeys(productId, keysString) {
    try {
        const keys = keysString.split('\n').map(k => k.trim()).filter(k => k !== '');

        const batchPromises = keys.map(key => {
            return addDoc(collection(db, 'license_keys'), {
                productId,
                key,
                status: 'available', // available, sold
                createdAt: serverTimestamp()
            });
        });

        await Promise.all(batchPromises);

        // Update product inventory count for digital
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, {
            stock: keys.length,
            isDigital: true,
            deliveryType: 'key_automated'
        });

        logger.info(`Uploaded ${keys.length} keys for product ${productId}`);
        return { success: true, count: keys.length };
    } catch (error) {
        logger.error('Failed to upload license keys', error);
        throw error;
    }
}

/**
 * Securely claim a license key from the pool (Transactionally)
 *
 * SECURITY:
 *   - Vérifie que la commande appartient à l'utilisateur
 *   - Vérifie que la commande est réellement payée (status paid/completed/delivered)
 *   - Idempotent : renvoie la clé déjà attribuée si la fonction est rappelée
 */
export async function claimLicenseKey(productId, orderId, userId) {
    try {
        // ── Idempotence (pré-vérification hors transaction) ──────────────────
        // Si une clé a déjà été attribuée pour cet orderId + productId, on la renvoie.
        const alreadyClaimedSnap = await getDocs(
            query(
                collection(db, 'license_keys'),
                where('orderId', '==', orderId),
                where('productId', '==', productId),
                where('status', '==', 'sold'),
                limit(1)
            )
        );

        if (!alreadyClaimedSnap.empty) {
            logger.info(`License key already claimed for order ${orderId} / product ${productId}`);
            return { success: true, key: alreadyClaimedSnap.docs[0].data().key, alreadyClaimed: true };
        }

        // ── Transaction principale ────────────────────────────────────────────
        return await runTransaction(db, async (transaction) => {
            // 1. SECURITY: Vérifier que la commande est payée et appartient à l'utilisateur
            const orderRef = doc(db, 'orders', orderId);
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists()) {
                throw new Error('Commande introuvable');
            }

            const orderData = orderDoc.data();

            if (orderData.userId !== userId) {
                logger.error(`SECURITY: claimLicenseKey ownership mismatch — order ${orderId}, claimed by ${userId}`);
                throw new Error('Accès refusé : cette commande ne vous appartient pas');
            }

            const paidStatuses = ['paid', 'completed', 'delivered', 'delivered_paid'];
            if (!paidStatuses.includes(orderData.status) && orderData.paymentStatus !== 'paid') {
                throw new Error('Commande non payée — impossible d\'attribuer la clé');
            }

            // 2. Trouver une clé disponible
            const keysRef = collection(db, 'license_keys');
            const q = query(
                keysRef,
                where('productId', '==', productId),
                where('status', '==', 'available'),
                limit(1)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) throw new Error('Aucune clé disponible pour ce produit');

            const keyDoc = snapshot.docs[0];
            const keyData = keyDoc.data();

            // 3. Marquer la clé comme vendue + traçabilité (watermark)
            transaction.update(keyDoc.ref, {
                status: 'sold',
                soldTo: userId,
                orderId,
                soldAt: serverTimestamp(),
                // Traçabilité : permet de retrouver le propriétaire légitime en cas de litige
                licensedToUserId: userId,
                claimSource: 'order_confirmation'
            });

            // 4. Décrémenter le stock
            const productRef = doc(db, 'products', productId);
            transaction.update(productRef, {
                stock: increment(-1)
            });

            return { success: true, key: keyData.key };
        });
    } catch (error) {
        logger.error('Failed to claim license key', error);
        throw error;
    }
}

/**
 * Generate a digital delivery record for MyLibrary
 */
export async function generateDigitalAccess(userId, itemData) {
    try {
        const accessRef = await addDoc(collection(db, 'digital_access'), {
            userId,
            productId: itemData.productId,
            title: itemData.title,
            type: itemData.digitalType || 'download', // download, key, service
            content: itemData.content || null, // The key or download link
            grantedAt: serverTimestamp(),
            orderId: itemData.orderId
        });

        return accessRef.id;
    } catch (error) {
        logger.error('Failed to generate digital access', error);
        return null;
    }
}

export default {
    uploadLicenseKeys,
    claimLicenseKey,
    generateDigitalAccess
};
