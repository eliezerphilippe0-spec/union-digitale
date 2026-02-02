import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const db = admin.firestore();

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-11-17.clover'
});

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Create Stripe Payment Intent
 * Returns clientSecret for frontend to confirm payment
 */
export const createStripePaymentIntent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { orderId } = request.data;
  const userId = request.auth.uid;

  if (!orderId) {
    throw new HttpsError('invalid-argument', 'orderId is required');
  }

  try {
    // Get order from Firestore
    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      throw new HttpsError('not-found', 'Order not found');
    }

    const order = orderDoc.data();

    // Verify order belongs to user
    if (order.userId !== userId) {
      throw new HttpsError('permission-denied', 'Order does not belong to you');
    }

    // Check order status
    if (order.paymentStatus === 'paid') {
      throw new HttpsError('already-exists', 'Order already paid');
    }

    if (order.status === 'cancelled') {
      throw new HttpsError('failed-precondition', 'Order is cancelled');
    }

    // Calculate amount in cents
    const amount = Math.round(order.totalPrice * 100); // Convert to cents

    // Get customer email
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const customerEmail = userData?.email || order.customerDetails?.email;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd', // or 'htg' if Stripe supports it
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        orderId,
        userId,
        platformName: 'Union Digitale'
      },
      receipt_email: customerEmail,
      description: `Order ${orderId} - Union Digitale`
    });

    // Store payment intent ID in order
    await db.collection('orders').doc(orderId).update({
      stripePaymentIntentId: paymentIntent.id,
      paymentMethod: 'stripe',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Payment intent created: ${paymentIntent.id} for order ${orderId}`);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };

  } catch (error: any) {
    console.error('Error creating payment intent:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', `Failed to create payment intent: ${error.message}`);
  }
});

/**
 * Stripe Webhook Handler
 * Handles payment_intent.succeeded and other events
 */
export const stripeWebhook = onRequest({
  timeoutSeconds: 60
}, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    console.error('Missing Stripe signature');
    res.status(400).send('Missing signature');
    return;
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    res.status(500).send('Webhook secret not configured');
    return;
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.rawBody as Buffer,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }

  // Handle event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }

  console.log(`Processing successful payment for order: ${orderId}`);

  // Use idempotency to prevent duplicate processing
  const idempotencyKey = `stripe:${paymentIntent.id}`;
  const lockRef = db.collection('payment_idempotency').doc(idempotencyKey);

  const existing = await lockRef.get();
  if (existing.exists) {
    console.log(`Payment already processed: ${paymentIntent.id}`);
    return;
  }

  // Set lock
  await lockRef.set({
    paymentIntentId: paymentIntent.id,
    orderId,
    status: 'processing',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  try {
    // Process payment atomically
    await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error(`Order ${orderId} not found`);
      }

      const order = orderDoc.data();

      if (order.paymentStatus === 'paid') {
        console.log(`Order ${orderId} already marked as paid`);
        return;
      }

      // Mark order as paid
      transaction.update(orderRef, {
        status: 'paid',
        paymentStatus: 'paid',
        stripePaymentIntentId: paymentIntent.id,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentMethod: 'stripe'
      });

      // Process commission splits
      if (order.items && Array.isArray(order.items)) {
        // SECURITY: Validate vendorIds against actual product ownership
        for (const item of order.items) {
          if (!item.vendorId || !item.productId) {
            console.error(`Invalid item in order ${orderId}:`, item);
            throw new Error(`Item missing vendorId or productId`);
          }

          // Verify vendorId matches product owner in database
          const productRef = db.collection('products').doc(item.productId);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists) {
            throw new Error(`Product ${item.productId} not found`);
          }

          const product = productDoc.data();

          if (product.vendorId !== item.vendorId) {
            console.error(
              `SECURITY ALERT: Vendor ID mismatch for product ${item.productId}. ` +
              `Order claims: ${item.vendorId}, Actual: ${product.vendorId}`
            );
            throw new Error(`Vendor ID validation failed for product ${item.productId}`);
          }
        }

        const vendorGroups = new Map<string, any[]>();

        // Group items by vendor
        for (const item of order.items) {
          if (!vendorGroups.has(item.vendorId)) {
            vendorGroups.set(item.vendorId, []);
          }
          vendorGroups.get(item.vendorId)!.push(item);
        }

        // Credit each vendor's balance
        for (const [vendorId, items] of vendorGroups) {
          const subtotal = items.reduce(
            (sum, item) => sum + (item.price * (item.quantity || 1)),
            0
          );
          const platformFee = subtotal * 0.15; // 15% commission
          const vendorAmount = subtotal * 0.85; // 85% to vendor

          const balanceRef = db.collection('balances').doc(vendorId);
          const balanceDoc = await transaction.get(balanceRef);

          if (balanceDoc.exists) {
            const balance = balanceDoc.data();
            transaction.update(balanceRef, {
              available: (balance.available || 0) + vendorAmount,
              total: (balance.total || 0) + vendorAmount,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            transaction.set(balanceRef, {
              vendorId,
              available: vendorAmount,
              pending: 0,
              total: vendorAmount,
              currency: 'HTG',
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }

          // Record transaction
          const txRef = db.collection('transactions').doc();
          transaction.set(txRef, {
            orderId,
            vendorId,
            type: 'order_payment',
            amount: vendorAmount,
            platformFee,
            stripePaymentIntentId: paymentIntent.id,
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    });

    // Update idempotency record
    await lockRef.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Payment processed successfully for order: ${orderId}`);

  } catch (error: any) {
    console.error('Error processing payment:', error);

    // Update idempotency with error
    await lockRef.update({
      status: 'error',
      error: error.message,
      errorAt: admin.firestore.FieldValue.serverTimestamp()
    });

    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    return;
  }

  console.log(`Payment failed for order: ${orderId}`);

  await db.collection('orders').doc(orderId).update({
    paymentStatus: 'failed',
    paymentError: paymentIntent.last_payment_error?.message || 'Payment failed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    return;
  }

  console.log(`Payment canceled for order: ${orderId}`);

  await db.collection('orders').doc(orderId).update({
    paymentStatus: 'canceled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}
