import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

const db = admin.firestore();

// Configuration
const WEBHOOK_SECRET = process.env.MONCASH_WEBHOOK_SECRET || "your-webhook-secret";
const PLATFORM_COMMISSION = 0.15; // 15% platform fee

/**
 * Verifies webhook signature using raw body buffer
 * CRITICAL: Must use raw body, not JSON.stringify
 */
function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Process COD deposit atomically
 * Appelé quand un client paie l'acompte de 10% via MonCash pour une commande COD
 */
async function processCODDepositAtomic(
  orderId: string,
  transactionId: string,
  amount: number
): Promise<void> {
  await db.runTransaction(async (transaction) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await transaction.get(orderRef);

    if (!orderDoc.exists) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();

    // Éviter le double-traitement
    if (orderData?.depositPaid === true) {
      console.log(`COD deposit for order ${orderId} already processed, skipping`);
      return;
    }

    // Vérifier que le montant correspond à l'acompte attendu (tolérance 1 HTG)
    const expectedDeposit = orderData?.depositAmount ?? 0;
    if (Math.abs(expectedDeposit - amount) > 1) {
      throw new Error(
        `COD deposit amount mismatch: expected ${expectedDeposit} HTG, got ${amount} HTG`
      );
    }

    // Confirmer la commande COD avec l'acompte payé
    transaction.update(orderRef, {
      status: 'confirmed',
      depositPaid: true,
      depositPaidAt: admin.firestore.FieldValue.serverTimestamp(),
      depositTransactionId: transactionId,
      depositPaymentMethod: 'moncash',
    });
  });
}

/**
 * Process payment atomically to prevent race conditions
 */
async function processPaymentAtomic(
  orderId: string,
  transactionId: string,
  amount: number
): Promise<void> {
  await db.runTransaction(async (transaction) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await transaction.get(orderRef);

    if (!orderDoc.exists) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();

    // Check if already paid
    if (orderData?.paymentStatus === 'paid') {
      console.log(`Order ${orderId} already paid, skipping`);
      return;
    }

    // Validate amount
    if (Math.abs(orderData.totalPrice - amount) > 0.01) {
      throw new Error(`Amount mismatch: expected ${orderData.totalPrice}, got ${amount}`);
    }

    // Update order status
    transaction.update(orderRef, {
      status: 'paid',
      paymentStatus: 'paid',
      moncashTransactionId: transactionId,
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Process commissions for each vendor
    if (orderData.items && Array.isArray(orderData.items)) {
      // SECURITY: Validate vendorIds against actual product ownership
      for (const item of orderData.items) {
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

      // Group items by vendor
      const vendorGroups = new Map<string, any[]>();

      for (const item of orderData.items) {
        if (!vendorGroups.has(item.vendorId)) {
          vendorGroups.set(item.vendorId, []);
        }
        vendorGroups.get(item.vendorId)!.push(item);
      }

      // Credit each vendor's balance + accumulate platform fees
      let totalPlatformFees = 0;

      for (const [vendorId, items] of vendorGroups) {
        const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const platformFee = subtotal * PLATFORM_COMMISSION;
        const vendorAmount = subtotal - platformFee;

        totalPlatformFees += platformFee;

        const balanceRef = db.collection('balances').doc(vendorId);
        const balanceDoc = await transaction.get(balanceRef);

        if (balanceDoc.exists) {
          const currentBalance = balanceDoc.data();
          transaction.update(balanceRef, {
            available: (currentBalance.available || 0) + vendorAmount,
            total: (currentBalance.total || 0) + vendorAmount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          transaction.set(balanceRef, {
            vendorId,
            available: vendorAmount,
            pending: 0,
            total: vendorAmount,
            currency: 'HTG',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // Enregistrement de la transaction vendeur
        const txRef = db.collection('transactions').doc();
        transaction.set(txRef, {
          orderId,
          vendorId,
          type: 'order_payment',
          amount: vendorAmount,
          platformFee,
          commissionRate: PLATFORM_COMMISSION,
          moncashTransactionId: transactionId,
          status: 'completed',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // ─── Créditer la caisse plateforme (15%) ────────────────────────────────
      // Ce montant correspond au chiffre d'affaires réel de Union Digitale.
      const platformBalanceRef = db.collection('platform_balance').doc('main');
      const platformBalanceDoc = await transaction.get(platformBalanceRef);

      if (platformBalanceDoc.exists) {
        const pb = platformBalanceDoc.data();
        transaction.update(platformBalanceRef, {
          totalCollected: (pb.totalCollected || 0) + totalPlatformFees,
          availableBalance: (pb.availableBalance || 0) + totalPlatformFees,
          transactionCount: (pb.transactionCount || 0) + 1,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        transaction.set(platformBalanceRef, {
          totalCollected: totalPlatformFees,
          availableBalance: totalPlatformFees,
          totalPaidOut: 0,
          transactionCount: 1,
          commissionRate: PLATFORM_COMMISSION,
          currency: 'HTG',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Enregistrement de la transaction plateforme (audit)
      const platformTxRef = db.collection('platform_transactions').doc();
      transaction.set(platformTxRef, {
        orderId,
        moncashTransactionId: transactionId,
        totalOrderAmount: amount,
        platformFee: totalPlatformFees,
        commissionRate: PLATFORM_COMMISSION,
        vendorCount: vendorGroups.size,
        status: 'collected',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(
        `💰 Plateforme créditée : ${totalPlatformFees.toFixed(2)} HTG ` +
        `(${(PLATFORM_COMMISSION * 100)}% de ${amount} HTG) — commande ${orderId}`
      );
    }
  });
}

/**
 * MonCash Payment Webhook Handler
 * Handles payment notifications from MonCash
 */
export const moncashWebhook = onRequest({
  timeoutSeconds: 60,
  memory: "256MiB"
}, async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const signature = req.headers['x-moncash-signature'] as string;

  if (!signature) {
    console.error('Missing signature header');
    res.status(401).send('Unauthorized: Missing signature');
    return;
  }

  // Get raw body buffer (critical for signature verification)
  const rawBody = req.rawBody as Buffer;

  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('Invalid webhook signature');
    res.status(401).send('Unauthorized: Invalid signature');
    return;
  }

  // Parse body after signature verification
  const body = JSON.parse(rawBody.toString('utf8'));
  const { orderId, transactionId, amount, status, timestamp } = body;

  if (!orderId || !transactionId) {
    res.status(400).send('Bad Request: Missing required fields');
    return;
  }

  // Validate timestamp (prevent replay attacks)
  const now = Date.now();
  const webhookTime = new Date(timestamp).getTime();
  const timeDiff = Math.abs(now - webhookTime);

  // Reject webhooks older than 5 minutes
  if (timeDiff > 5 * 60 * 1000) {
    console.error(`Webhook timestamp too old: ${timeDiff}ms`);
    res.status(400).send('Bad Request: Timestamp too old');
    return;
  }

  // Check idempotency BEFORE processing
  const idempotencyKey = `webhook:moncash:${transactionId}`;
  const lockRef = db.collection('webhook_idempotency').doc(idempotencyKey);

  try {
    const existing = await lockRef.get();

    if (existing.exists) {
      console.log(`Duplicate webhook detected: ${transactionId}`);
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    // Set lock IMMEDIATELY (before processing)
    await lockRef.set({
      transactionId,
      orderId,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'processing'
    });

    // Process payment atomically
    if (status === 'successful' || status === 'completed') {

      // Aiguillage : dépôt COD vs paiement complet
      if (body.payment_type === 'cod_deposit') {
        await processCODDepositAtomic(orderId, transactionId, amount);
        console.log(`✅ COD deposit processed for order ${orderId}`);
      } else {
        await processPaymentAtomic(orderId, transactionId, amount);
        console.log(`✅ Full payment processed for order ${orderId}`);
      }

      // Update idempotency record
      await lockRef.update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({ received: true, processed: true });
    } else {
      // Payment failed or pending
      await lockRef.update({
        status: 'failed',
        reason: status
      });

      console.log(`Payment not successful: ${orderId}, status: ${status}`);
      res.status(200).json({ received: true, status });
    }
  } catch (error: any) {
    console.error('Webhook processing error:', error);

    // Update idempotency record with error
    try {
      await lockRef.update({
        status: 'error',
        error: error.message,
        errorAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.error('Failed to update idempotency record:', e);
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});
