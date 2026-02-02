import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { updateMyLibrary } from "./updateMyLibrary";

const db = admin.firestore();

interface UpsellRequest {
    originalOrderId: string;
    upsellProductId: string;
}

export const oneClickUpsell = onCall(async (request) => {
    const { originalOrderId, upsellProductId } = request.data as UpsellRequest;
    const uid = request.auth?.uid;

    if (!uid) throw new HttpsError('unauthenticated', 'User must be authenticated');

    // 1. Fetch Original Order
    const orderRef = db.collection('orders').doc(originalOrderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) throw new HttpsError('not-found', 'Original order not found');
    const order = orderSnap.data();

    if (order?.userId !== uid) throw new HttpsError('permission-denied', 'Order does not belong to user');

    // 2. Fetch Upsell Product Info
    const productSnap = await db.collection('products').doc(upsellProductId).get();
    if (!productSnap.exists) throw new HttpsError('not-found', 'Product not found');
    const product = productSnap.data();

    // 3. Process Payment (Mock or Tokenized)
    // NOTE: In real world, use saved payment token from original order.
    // For this implementation, we assume successful "1-click" charge via wallet or existing auth.
    const success = true;

    if (success) {
        // 4. Update Original Order
        await orderRef.update({
            items: admin.firestore.FieldValue.arrayUnion({
                productId: upsellProductId,
                title: product?.title,
                price: product?.price,
                type: 'digital',
                isUpsell: true
            }),
            totalPrice: admin.firestore.FieldValue.increment(product?.price || 0),
            upsellAdded: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 5. Grant Access
        const itemArray = [{
            productId: upsellProductId,
            title: product?.title,
            type: 'digital'
        }];
        await updateMyLibrary(uid, itemArray);

        return { success: true, message: "Upsell added successfully" };
    } else {
        throw new HttpsError('aborted', 'Payment failed');
    }
});
