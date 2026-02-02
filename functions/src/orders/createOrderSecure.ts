import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

interface OrderItem {
  productId: string;
  quantity: number;
  type?: 'digital' | 'physical';
}

interface CreateOrderRequest {
  items: OrderItem[];
  customerDetails?: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

/**
 * Secure Order Creation with Server-Side Price Validation
 * Prevents price manipulation attacks by fetching prices from database
 */
export const createOrderSecure = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to create order');
  }

  const userId = request.auth.uid;
  const { items, customerDetails, shippingAddress } = request.data as CreateOrderRequest;

  // Validate inputs
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new HttpsError('invalid-argument', 'Order must contain at least one item');
  }

  if (items.length > 50) {
    throw new HttpsError('invalid-argument', 'Order cannot contain more than 50 items');
  }

  try {
    // Fetch all product documents from database
    const productRefs = items.map(item => db.collection('products').doc(item.productId));
    const productDocs = await db.getAll(...productRefs);

    // Validate products and calculate total using DATABASE prices
    const validatedItems = [];
    let totalAmount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const productDoc = productDocs[i];

      // Check if product exists
      if (!productDoc.exists) {
        throw new HttpsError('not-found', `Product ${item.productId} not found`);
      }

      const product = productDoc.data();

      // Check if product is active
      if (!product?.isActive) {
        throw new HttpsError('failed-precondition', `Product ${product?.name || item.productId} is not available`);
      }

      // Validate quantity
      if (!item.quantity || item.quantity < 1 || item.quantity > 100) {
        throw new HttpsError('invalid-argument', 'Invalid quantity (must be 1-100)');
      }

      // Check stock for physical products
      if (product.type === 'physical' && product.stock !== undefined) {
        if (product.stock < item.quantity) {
          throw new HttpsError('failed-precondition', `Insufficient stock for ${product.name}`);
        }
      }

      // Use ONLY database price (ignore any client-provided price)
      const itemPrice = product.price;
      const itemTotal = itemPrice * item.quantity;

      validatedItems.push({
        productId: item.productId,
        name: product.name,
        price: itemPrice, // FROM DATABASE
        quantity: item.quantity,
        vendorId: product.vendorId,
        type: product.type || 'digital',
        imageUrl: product.images?.[0] || null
      });

      totalAmount += itemTotal;
    }

    // Validate total amount
    if (totalAmount <= 0) {
      throw new HttpsError('invalid-argument', 'Order total must be greater than 0');
    }

    if (totalAmount > 10000000) { // 10M HTG max
      throw new HttpsError('invalid-argument', 'Order total exceeds maximum allowed amount');
    }

    // Create order document
    const orderData = {
      userId,
      items: validatedItems,
      totalPrice: totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      customerDetails: customerDetails || null,
      shippingAddress: shippingAddress || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      type: validatedItems.some(i => i.type === 'physical') ? 'mixed' : 'digital'
    };

    // Create order
    const orderRef = await db.collection('orders').add(orderData);

    console.log(`✅ Order created: ${orderRef.id}, total: ${totalAmount} HTG`);

    return {
      orderId: orderRef.id,
      totalPrice: totalAmount,
      items: validatedItems.map(i => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      }))
    };
  } catch (error: any) {
    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Log unexpected errors
    console.error('Order creation error:', error);
    throw new HttpsError('internal', 'Failed to create order');
  }
});

/**
 * Validate cart before checkout (optional pre-check)
 */
export const validateCart = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { items } = request.data;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new HttpsError('invalid-argument', 'Cart is empty');
  }

  try {
    const productRefs = items.map((item: any) => db.collection('products').doc(item.productId));
    const productDocs = await db.getAll(...productRefs);

    const issues = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const productDoc = productDocs[i];

      if (!productDoc.exists) {
        issues.push({
          productId: item.productId,
          issue: 'not_found',
          message: 'Product no longer available'
        });
        continue;
      }

      const product = productDoc.data();

      if (!product?.isActive) {
        issues.push({
          productId: item.productId,
          issue: 'inactive',
          message: 'Product is no longer available'
        });
      }

      if (product.type === 'physical' && product.stock !== undefined && product.stock < item.quantity) {
        issues.push({
          productId: item.productId,
          issue: 'insufficient_stock',
          message: `Only ${product.stock} available`,
          availableStock: product.stock
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  } catch (error: any) {
    console.error('Cart validation error:', error);
    throw new HttpsError('internal', 'Failed to validate cart');
  }
});
