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
    shippingMethod?: 'delivery' | 'pickup';
    pickupHubId?: string;
}

export const createOrder = onCall(async (request) => {
    if (!request.auth?.uid) {
        throw new HttpsError('unauthenticated', 'Auth required');
    }

    const { items, customerDetails, shippingMethod, pickupHubId } = request.data as CreateOrderRequest;
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

    const totalPrice = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const vendorTotals = vendorIds.map((vendorId) => {
        const subtotalAmount = lineItems
            .filter((li) => li.vendorId === vendorId)
            .reduce((s, i) => s + i.lineTotal, 0);
        return { vendorId, subtotalAmount };
    });

    const subSummary = {
        subCount: vendorIds.length,
        vendorCount: vendorIds.length,
        vendorsPreview: vendorTotals.slice(0, 5),
        hasMultiVendor: vendorIds.length > 1,
    };

    try {
        const orderRef = db.collection('orders').doc();
        const orderId = orderRef.id;

        let fulfillmentType: 'DELIVERY' | 'PICKUP' = 'DELIVERY';
        let pickupSnapshot: any = null;

        if ((shippingMethod || '').toLowerCase() === 'pickup') {
            if (!pickupHubId) {
                throw new HttpsError('invalid-argument', 'pickupHubId required');
            }
            const hubRef = db.doc(`pickup_hubs/${pickupHubId}`);
            const hubSnap = await hubRef.get();
            const hub = hubSnap.data();
            if (!hubSnap.exists || !hub?.active || !hub?.pilotEnabled) {
                throw new HttpsError('failed-precondition', 'Pickup hub invalid');
            }
            fulfillmentType = 'PICKUP';
            pickupSnapshot = {
                hubId: hubSnap.id,
                hubName: hub.name,
                hubAddress: hub.address,
                hubPhone: hub.phone || null,
                hubHours: hub.hours || null,
            };
        }

        const orderData = {
            orderId,
            buyerId: userId,
            userId,
            totalAmount: totalPrice,
            status: 'pending',
            paymentStatus: 'pending',
            customerDetails,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            currency: 'HTG',
            subOrderIds: [],
            type: 'digital_checkout',
            subSummary,
            fulfillmentType,
            pickup: pickupSnapshot,
        };

        const batch = db.batch();
        batch.set(orderRef, orderData);

        const subOrderIds: string[] = [];

        const defaultBps = Number(process.env.PLATFORM_COMMISSION_BPS || 800);
        const vendorRefs = vendorIds.map((vid) => db.doc(`vendors/${vid}`));
        const vendorSnaps = await db.getAll(...vendorRefs);
        const vendorBpsMap = new Map<string, number>();
        vendorSnaps.forEach((snap) => {
            if (!snap.exists) return;
            const data: any = snap.data();
            const bps = data?.commissionBps != null
                ? Number(data.commissionBps)
                : (data?.commissionRate != null ? Math.round(Number(data.commissionRate) * 10000) : defaultBps);
            vendorBpsMap.set(snap.id, Number.isFinite(bps) ? bps : defaultBps);
        });

        for (const vendorId of vendorIds) {
            const subRef = db.collection('orderSubs').doc();
            subOrderIds.push(subRef.id);

            const subItems = lineItems.filter((li) => li.vendorId === vendorId);
            const subtotalAmount = subItems.reduce((s, i) => s + i.lineTotal, 0);
            const commissionBps = vendorBpsMap.get(vendorId) ?? defaultBps;
            const commissionAmount = Math.round((subtotalAmount * commissionBps) / 10000);
            const sellerNetAmount = Math.max(subtotalAmount - commissionAmount, 0);

            batch.set(subRef, {
                subOrderId: subRef.id,
                orderId,
                buyerId: userId,
                vendorId,
                subtotalAmount,
                commissionBps,
                commissionAmount,
                sellerNetAmount,
                status: 'pending',
                escrowStatus: 'PENDING',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            for (const item of subItems) {
                const itemRef = db.collection('orderItems').doc();
                batch.set(itemRef, {
                    itemId: itemRef.id,
                    subOrderId: subRef.id,
                    orderId,
                    buyerId: userId,
                    vendorId,
                    productId: item.productId,
                    qty: item.qty,
                    unitPrice: item.unitPrice,
                    lineTotal: item.lineTotal,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }

        batch.update(orderRef, { subOrderIds });

        if (fulfillmentType === 'PICKUP') {
            const eventRef = db.collection('analytics_events').doc();
            batch.set(eventRef, {
                eventName: 'pickup_order_persisted',
                orderId,
                hubId: pickupSnapshot?.hubId || null,
                fulfillmentType,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        await batch.commit();
        return { orderId, totalPrice };
    } catch (error) {
        console.error("Order creation error:", error);
        throw new HttpsError('internal', 'Failed to create order');
    }
});
