import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Creates vendor-specific order views when an order is created
 * This ensures vendors only see their items, not competitors' data
 */
export const onOrderCreated = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const orderId = event.params.orderId;
    const order = event.data?.data();

    if (!order || !order.items) {
      console.warn(`No items found in order ${orderId}`);
      return;
    }

    // Group items by vendor
    const vendorGroups = new Map<string, any[]>();

    for (const item of order.items) {
      if (!item.vendorId) {
        console.warn(`Item ${item.productId} has no vendorId`);
        continue;
      }

      if (!vendorGroups.has(item.vendorId)) {
        vendorGroups.set(item.vendorId, []);
      }
      vendorGroups.get(item.vendorId)!.push(item);
    }

    // Create vendor-specific views
    const batch = db.batch();

    for (const [vendorId, items] of vendorGroups) {
      const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      const platformFee = subtotal * 0.15; // 15% commission
      const vendorAmount = subtotal * 0.85; // 85% to vendor

      const vendorOrderRef = db
        .collection('orders')
        .doc(orderId)
        .collection('vendor_orders')
        .doc(vendorId);

      batch.set(vendorOrderRef, {
        orderId,
        vendorId,
        items, // Only this vendor's items
        subtotal,
        platformFee,
        vendorAmount,
        // Limited buyer info (privacy)
        buyerCity: order.shippingAddress?.city || null,
        buyerCountry: order.shippingAddress?.country || null,
        // Order status
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    console.log(`✅ Created vendor views for order ${orderId}, ${vendorGroups.size} vendors`);
  }
);

/**
 * Updates vendor views when order status changes
 */
export const onOrderUpdated = onDocumentUpdated(
  'orders/{orderId}',
  async (event) => {
    const orderId = event.params.orderId;
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!after) return;

    // Only update if status changed
    if (before?.status === after.status && before?.paymentStatus === after.paymentStatus) {
      return;
    }

    // Get all vendor views
    const vendorOrdersSnap = await db
      .collection('orders')
      .doc(orderId)
      .collection('vendor_orders')
      .get();

    if (vendorOrdersSnap.empty) {
      console.warn(`No vendor views found for order ${orderId}`);
      return;
    }

    // Update all vendor views with new status
    const batch = db.batch();

    for (const doc of vendorOrdersSnap.docs) {
      batch.update(doc.ref, {
        status: after.status,
        paymentStatus: after.paymentStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    console.log(`✅ Updated vendor views for order ${orderId}, ${vendorOrdersSnap.size} vendors`);
  }
);
