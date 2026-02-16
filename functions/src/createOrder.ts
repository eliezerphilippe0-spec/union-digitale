import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

interface OrderItemInput {
    productId: string;
    quantity?: number;
    variantId?: string;
}

interface CreateOrderRequest {
    items: OrderItemInput[];
    customerDetails?: {
        name: string;
        email: string;
        phone: string;
    };
}

export const createOrder = onCall(async (request) => {
    if (!request.auth?.uid) {
        throw new HttpsError('unauthenticated', 'Auth required');
    }

    const { items, customerDetails } = request.data as CreateOrderRequest;
    const userId = request.auth.uid;

    if (!items || items.length === 0) {
        throw new HttpsError('invalid-argument', 'No items in order');
    }

    const productRefs = items.map((it) => db.doc(`products/${it.productId}`));
    const productSnaps = await db.getAll(...productRefs);

    const lineItems = items.map((it, idx) => {
        const snap = productSnaps[idx];
        if (!snap.exists) throw new HttpsError('not-found', `Product not found: ${it.productId}`);
        const p: any = snap.data();
        if (p?.active === false) throw new HttpsError('failed-precondition', `Product inactive: ${it.productId}`);
        const qty = Number(it.quantity || 1);
        if (!Number.isFinite(qty) || qty <= 0 || qty > 999) throw new HttpsError('invalid-argument', 'Invalid qty');
        const unitPrice = Number(p?.price || 0);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new HttpsError('failed-precondition', 'Invalid price');
        return {
            productId: it.productId,
            variantId: it.variantId || null,
            vendorId: p?.vendorId || p?.storeId || null,
            qty,
            unitPrice,
            lineTotal: unitPrice * qty,
        };
    });

    const vendorIds = Array.from(new Set(lineItems.map((li) => li.vendorId).filter(Boolean)));
    if (vendorIds.length !== 1) {
        throw new HttpsError('failed-precondition', 'multi_vendor_not_supported_yet');
    }

    const totalPrice = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const orderData = {
        userId,
        vendorId: vendorIds[0],
        items: lineItems.map(({ productId, qty, unitPrice }) => ({ productId, qty, price: unitPrice })),
        totalPrice,
        status: 'pending',
        paymentStatus: 'pending',
        customerDetails,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        type: 'digital_checkout'
    };

    try {
        const orderRef = await db.collection('orders').add(orderData);
        return { orderId: orderRef.id, totalPrice };
    } catch (error) {
        console.error("Order creation error:", error);
        throw new HttpsError('internal', 'Failed to create order');
    }
});
