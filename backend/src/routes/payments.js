/**
 * Payment Routes
 * Supports: MonCash, NatCash, Card (Stripe), Cash on Delivery
 */

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config');
const moncashService = require('../services/moncashService');
const natcashService = require('../services/natcashService');
const validate = require('../middleware/validate');
const { body } = require('express-validator');
const { redeemPointsOnPayment, awardCashbackAndPoints, applyEscrowAndCommission } = require('../services/paymentCompletion');

const router = express.Router();

const logPaymentEvent = (event, payload = {}) => {
  try {
    console.log(JSON.stringify({ event, ...payload }));
  } catch (error) {
    console.log(JSON.stringify({ event, error: 'event_log_failed' }));
  }
};

const getPaymentSuccessSource = (order) => {
  if (!order) return null;
  return order.paymentStatus === 'PAID' ? 'confirmed' : null;
};

const recheckRateBuckets = new Map();
const checkRecheckRateLimit = (orderId) => {
  const now = Date.now();
  const bucket = recheckRateBuckets.get(orderId) || { lastCalledAt: 0 };
  if (now - bucket.lastCalledAt < 30 * 1000) return false;
  bucket.lastCalledAt = now;
  recheckRateBuckets.set(orderId, bucket);
  return true;
};

const paymentLimiter = require('express-rate-limit')({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de requêtes paiement. Réessayez plus tard.' },
});

const initPaymentRules = [
  body('orderId').isUUID().withMessage('orderId invalide'),
  body('method').isIn(['MONCASH','NATCASH','CARD','CASH_ON_DELIVERY','BANK_TRANSFER']).withMessage('Méthode invalide'),
  body('customerPhone').optional().isString().isLength({ min: 6 }).withMessage('Téléphone invalide'),
];

const confirmPaymentIfNeeded = async ({ order, paymentId, provider, successSource }) => {
  if (!order) return null;
  if (order.paymentStatus === 'PAID') return order;

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'PAID',
      paymentId: paymentId || order.paymentId,
      paidAt: new Date(),
      status: 'CONFIRMED',
    },
  });

  await redeemPointsOnPayment({ order: updated, paymentId: paymentId || updated.paymentId || 'UNKNOWN' });
  await awardCashbackAndPoints(updated);
  await applyEscrowAndCommission(updated);

  await prisma.store.update({
    where: { id: order.storeId },
    data: { totalSales: { increment: 1 } },
  });

  logPaymentEvent('checkout_payment_confirmed', {
    orderId: order.id,
    provider,
    successSource: successSource || 'confirmed',
  });

  return updated;
};

/**
 * Initialize payment for order
 */
router.post('/initialize', paymentLimiter, authenticate, validate(initPaymentRules), async (req, res, next) => {
  try {
    const { orderId, method, customerPhone } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user.id },
    });

    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    if (order.paymentStatus === 'PAID') {
      throw new AppError('Commande déjà payée', 400);
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new AppError('Commande invalide', 400);
    }

    let paymentData = {};

    switch (method) {
      case 'MONCASH':
        if (!config.MONCASH_CLIENT_ID) {
          throw new AppError('MonCash non configuré', 400);
        }
        
        const moncashPayment = await moncashService.createPayment({
          amount: order.total,
          orderId: order.orderNumber,
        });
        
        paymentData = {
          provider: 'moncash',
          paymentToken: moncashPayment.paymentToken,
          redirectUrl: moncashPayment.redirectUrl,
          instructions: 'Vous allez être redirigé vers MonCash pour compléter le paiement.',
        };
        break;

      case 'NATCASH':
        const natcashPayment = await natcashService.createPayment({
          amount: order.total,
          orderId: order.orderNumber,
          customerPhone: customerPhone || req.user.phone,
          description: `Commande Union Digitale ${order.orderNumber}`,
        });
        
        if (natcashPayment.isManual) {
          paymentData = {
            provider: 'natcash',
            isManual: true,
            merchantNumber: natcashPayment.merchantNumber,
            amount: natcashPayment.amount,
            reference: natcashPayment.reference,
            instructions: natcashPayment.instructions,
            note: natcashPayment.note,
          };
        } else {
          paymentData = {
            provider: 'natcash',
            paymentId: natcashPayment.paymentId,
            ussdCode: natcashPayment.ussdCode,
            qrCode: natcashPayment.qrCode,
            expiresAt: natcashPayment.expiresAt,
            instructions: natcashPayment.instructions,
          };

          await prisma.order.update({
            where: { id: orderId },
            data: { paymentId: natcashPayment.paymentId },
          });
        }
        break;

      case 'CARD':
        if (!config.STRIPE_SECRET_KEY) {
          throw new AppError('Paiement par carte non disponible', 400);
        }
        
        const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
        
        // Convert HTG to USD (approximate rate)
        const usdAmount = Math.round((order.total / 150) * 100); // cents
        
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: { 
                name: `Commande ${order.orderNumber}`,
                description: `Union Digitale - ${order.items?.length || 1} article(s)`,
              },
              unit_amount: usdAmount,
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${config.FRONTEND_URL}/order-confirmation?orderId=${order.id}&status=success`,
          cancel_url: `${config.FRONTEND_URL}/checkout?orderId=${order.id}&status=cancelled`,
          metadata: { 
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
          customer_email: req.user.email,
        });
        
        paymentData = {
          provider: 'stripe',
          sessionId: session.id,
          redirectUrl: session.url,
        };
        break;

      case 'CASH_ON_DELIVERY':
        paymentData = {
          provider: 'cod',
          instructions: 'Paiement à la livraison. Préparez le montant exact.',
          amount: order.total,
          note: 'Le livreur vous contactera avant la livraison.',
        };
        
        // Auto-confirm COD orders
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            paymentMethod: 'CASH_ON_DELIVERY',
            status: 'CONFIRMED',
          },
        });
        break;

      default:
        throw new AppError('Méthode de paiement non supportée', 400);
    }

    // Update order payment method
    if (method !== 'CASH_ON_DELIVERY') {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentMethod: method },
      });
    }

    res.json({
      message: 'Paiement initialisé',
      payment: paymentData,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Check payment status (legacy)
 */
router.get('/status/:orderId', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) throw new AppError('Commande non trouvée', 404);

    const isAdmin = req.user.role === 'ADMIN';
    const isBuyer = req.user.role === 'BUYER' && order.userId === req.user.id;
    if (!isAdmin && !isBuyer) throw new AppError('Non autorisé', 403);

    res.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
      status: order.paymentStatus,
      successSource: getPaymentSuccessSource(order),
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Check payment status
 */
router.get('/:orderId/status', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) throw new AppError('Commande non trouvée', 404);

    const isAdmin = req.user.role === 'ADMIN';
    const isBuyer = req.user.role === 'BUYER' && order.userId === req.user.id;
    if (!isAdmin && !isBuyer) throw new AppError('Non autorisé', 403);

    res.json({
      orderId: order.id,
      status: order.paymentStatus,
      successSource: getPaymentSuccessSource(order),
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Manual payment recheck
 */
router.post('/:orderId/recheck', authenticate, async (req, res, next) => {
  try {
    if (!checkRecheckRateLimit(req.params.orderId)) {
      return res.status(429).json({ error: 'Rate limit' });
    }

    logPaymentEvent('checkout_payment_recheck_called', {
      orderId: req.params.orderId,
      userId: req.user.id,
    });

    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) throw new AppError('Commande non trouvée', 404);

    const isAdmin = req.user.role === 'ADMIN';
    const isBuyer = req.user.role === 'BUYER' && order.userId === req.user.id;
    if (!isAdmin && !isBuyer) throw new AppError('Non autorisé', 403);

    if (order.paymentStatus === 'PAID') {
      return res.json({
        orderId: order.id,
        status: order.paymentStatus,
        successSource: getPaymentSuccessSource(order),
        updatedAt: order.updatedAt,
      });
    }

    if (order.paymentMethod === 'MONCASH') {
      const payment = await moncashService.getPaymentByOrderId(order.orderNumber);
      if (payment?.success && payment?.payment) {
        const updated = await confirmPaymentIfNeeded({
          order,
          paymentId: payment.payment?.transactionId,
          provider: 'moncash',
          successSource: 'confirmed',
        });
        return res.json({
          orderId: updated.id,
          status: updated.paymentStatus,
          successSource: getPaymentSuccessSource(updated),
          updatedAt: updated.updatedAt,
        });
      }
    }

    if (order.paymentMethod === 'NATCASH') {
      if (!order.paymentId) {
        throw new AppError('Paiement NatCash introuvable', 400);
      }
      const payment = await natcashService.getPaymentStatus(order.paymentId);
      if (payment.status === 'completed') {
        const updated = await confirmPaymentIfNeeded({
          order,
          paymentId: payment.transactionId,
          provider: 'natcash',
          successSource: 'confirmed',
        });
        return res.json({
          orderId: updated.id,
          status: updated.paymentStatus,
          successSource: getPaymentSuccessSource(updated),
          updatedAt: updated.updatedAt,
        });
      }

      if (['failed', 'expired'].includes(payment.status)) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED' },
        });
        logPaymentEvent('checkout_payment_failed_provider', {
          orderId: order.id,
          provider: 'natcash',
          status: payment.status,
        });
      }
    }

    if (order.paymentMethod === 'CARD' && config.STRIPE_SECRET_KEY && order.paymentId) {
      const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
      const intent = await stripe.paymentIntents.retrieve(order.paymentId);
      if (intent?.status === 'succeeded') {
        const updated = await confirmPaymentIfNeeded({
          order,
          paymentId: order.paymentId,
          provider: 'stripe',
          successSource: 'confirmed',
        });
        return res.json({
          orderId: updated.id,
          status: updated.paymentStatus,
          successSource: getPaymentSuccessSource(updated),
          updatedAt: updated.updatedAt,
        });
      }

      if (['canceled', 'requires_payment_method'].includes(intent?.status)) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED' },
        });
        logPaymentEvent('checkout_payment_failed_provider', {
          orderId: order.id,
          provider: 'stripe',
          status: intent?.status,
        });
      }
    }

    const refreshed = await prisma.order.findUnique({ where: { id: order.id } });
    res.json({
      orderId: refreshed.id,
      status: refreshed.paymentStatus,
      successSource: getPaymentSuccessSource(refreshed),
      updatedAt: refreshed.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * MonCash callback (redirect after payment)
 */
router.get('/callback/moncash', async (req, res, next) => {
  try {
    const { transactionId } = req.query;

    if (!transactionId) {
      return res.redirect(`${config.FRONTEND_URL}/order-confirmation?status=error&message=Transaction manquante`);
    }

    // Verify transaction with MonCash
    const payment = await moncashService.getPaymentByTransactionId(transactionId);

    logPaymentEvent('checkout_payment_webhook_received', {
      provider: 'moncash',
      transactionId,
    });
    
    if (payment.success && payment.payment) {
      const orderId = payment.payment.reference;
      console.log('[MonCash] payment confirmed', { transactionId, orderId });
      
      // Find and update order
      const order = await prisma.order.findFirst({
        where: { orderNumber: orderId },
      });

      if (order) {
        await confirmPaymentIfNeeded({
          order,
          paymentId: transactionId,
          provider: 'moncash',
          successSource: 'confirmed',
        });
      }

      return res.redirect(`${config.FRONTEND_URL}/order-confirmation?orderId=${order?.id}&status=success`);
    }

    logPaymentEvent('checkout_payment_failed_provider', {
      provider: 'moncash',
      transactionId,
    });

    res.redirect(`${config.FRONTEND_URL}/order-confirmation?status=pending`);
  } catch (error) {
    console.error('MonCash callback error:', error);
    res.redirect(`${config.FRONTEND_URL}/order-confirmation?status=error`);
  }
});

/**
 * NatCash webhook callback
 */
router.post('/callback/natcash', async (req, res, next) => {
  try {
    const signature = req.headers['x-signature'];
    
    // Verify webhook signature
    if (!natcashService.verifyWebhook(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { paymentId, status, transactionId, orderId } = req.body;

    logPaymentEvent('checkout_payment_webhook_received', {
      provider: 'natcash',
      orderNumber: orderId,
      paymentId,
      status,
    });

    if (status === 'completed') {
      console.log('[NatCash] payment confirmed', { transactionId, orderId });
      const order = await prisma.order.findFirst({
        where: { orderNumber: orderId },
      });

      if (order) {
        await confirmPaymentIfNeeded({
          order,
          paymentId: transactionId,
          provider: 'natcash',
          successSource: 'confirmed',
        });
      }
    }

    if (['failed', 'expired'].includes(status)) {
      const order = await prisma.order.findFirst({
        where: { orderNumber: orderId },
      });
      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED' },
        });
        logPaymentEvent('checkout_payment_failed_provider', {
          orderId: order.id,
          provider: 'natcash',
          status,
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('NatCash webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Stripe webhook
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send('Stripe not configured');
  }

  const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      config.STRIPE_WEBHOOK_SECRET
    );

    logPaymentEvent('checkout_payment_webhook_received', {
      provider: 'stripe',
      type: event.type,
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata.orderId;
      console.log('[Stripe] checkout completed', { orderId, paymentIntent: session.payment_intent });

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      
      if (order) {
        await confirmPaymentIfNeeded({
          order,
          paymentId: session.payment_intent,
          provider: 'stripe',
          successSource: 'confirmed',
        });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      if (intent?.metadata?.orderId) {
        await prisma.order.update({
          where: { id: intent.metadata.orderId },
          data: { paymentStatus: 'FAILED' },
        });
        logPaymentEvent('checkout_payment_failed_provider', {
          orderId: intent.metadata.orderId,
          provider: 'stripe',
          status: intent.status,
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

/**
 * Manual payment confirmation (admin/seller)
 */
router.post('/confirm-manual', authenticate, async (req, res, next) => {
  try {
    const { orderId, transactionId, notes } = req.body;

    // Check if user is admin or store owner
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    const isAuthorized = 
      req.user.role === 'ADMIN' || 
      order.store.userId === req.user.id;

    if (!isAuthorized) {
      throw new AppError('Non autorisé', 403);
    }

    const paymentIdFinal = transactionId || `MANUAL-${Date.now()}`;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paymentId: paymentIdFinal,
        paidAt: new Date(),
        status: 'CONFIRMED',
        sellerNote: notes,
      },
    });

    await redeemPointsOnPayment({ order: updated, paymentId: paymentIdFinal });
    await awardCashbackAndPoints(updated);
    await applyEscrowAndCommission(updated);

    await prisma.store.update({
      where: { id: order.storeId },
      data: { totalSales: { increment: 1 } },
    });

    res.json({ message: 'Paiement confirmé manuellement' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports.__test = { applyEscrowAndCommission, recheckRateBuckets, checkRecheckRateLimit };
