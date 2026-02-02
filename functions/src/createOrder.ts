import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

interface OrderItem {
    productId: string;
    price: number;
    quantity?: number;
    type: 'digital' | 'physical';
}

interface CreateOrderRequest {
    items: OrderItem[];
    userId: string;
    customerDetails?: {
        name: string;
        email: string;
        phone: string;
    };
}

export const createOrder = onCall(async (request) => {
    const { items, userId, customerDetails } = request.data as CreateOrderRequest;

    if (!items || items.length === 0) {
        throw new HttpsError('invalid-argument', 'No items in order');
    }

    // Basic validation or price check from DB could go here

    const totalPrice = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    const orderData = {
        userId: userId || 'guest',
        items,
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
