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

const router = express.Router();

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

const CASHBACK_RATES = {
  bronze: 0.01,
  silver: 0.02,
  gold: 0.03,
  platinum: 0.05,
  diamond: 0.07,
};

const calculateTier = (points = 0) => {
  if (points >= 50000) return 'diamond';
  if (points >= 15000) return 'platinum';
  if (points >= 5000) return 'gold';
  if (points >= 1000) return 'silver';
  return 'bronze';
};

const expireCashbackIfNeeded = async (userId) => {
  const now = new Date();
  const expired = await prisma.cashbackTransaction.findMany({
    where: {
      userId,
      status: 'AVAILABLE',
      expiresAt: { lt: now },
    },
  });

  if (expired.length === 0) return;

  const totalExpired = expired.reduce((sum, t) => sum + t.amount, 0);

  await prisma.cashbackTransaction.updateMany({
    where: {
      id: { in: expired.map(t => t.id) },
    },
    data: { status: 'EXPIRED' },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      cashbackBalance: { decrement: totalExpired },
    },
  });
};

const awardCashbackAndPoints = async (order) => {
  await expireCashbackIfNeeded(order.userId);

  const user = await prisma.user.findUnique({ where: { id: order.userId } });
  if (!user) return;

  const newPoints = (user.loyaltyPoints || 0) + (order.pointsEarned || 0);
  const newTier = calculateTier(newPoints);
  const rate = CASHBACK_RATES[newTier] || 0;
  const cashbackRaw = order.total * rate;

  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const monthTotal = await prisma.cashbackTransaction.aggregate({
    _sum: { amount: true },
    where: { userId: user.id, createdAt: { gte: monthStart } },
  });
  const cap = config.CASHBACK_MONTHLY_CAP || 0;
  const already = monthTotal._sum.amount || 0;
  const remaining = Math.max(cap - already, 0);
  const cashbackFinal = Math.max(Math.min(cashbackRaw, remaining), 0);

  const existingCashback = cashbackFinal > 0 ? await prisma.cashbackTransaction.findFirst({
    where: { orderId: order.id, status: 'AVAILABLE' },
  }) : null;

  const cashbackToApply = existingCashback ? 0 : cashbackFinal;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      loyaltyTier: newTier,
      cashbackBalance: { increment: cashbackToApply },
      cashbackLifetime: { increment: cashbackToApply },
    },
  });

  if (cashbackToApply > 0) {
    const expiresAt = new Date(Date.now() + config.CASHBACK_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await prisma.cashbackTransaction.create({
      data: {
        userId: user.id,
        orderId: order.id,
        amount: cashbackToApply,
        status: 'AVAILABLE',
        expiresAt,
      },
    });
  }
};

const expirePointsIfNeeded = async (tx, userId) => {
  const now = new Date();
  const expired = await tx.pointsLedger.findMany({
    where: {
      userId,
      type: 'EARN',
      status: 'COMMITTED',
      expiresAt: { lt: now },
    },
  });

  if (expired.length === 0) return;

  const totalExpired = expired.reduce((sum, t) => sum + Math.max(t.points, 0), 0);

  await tx.pointsLedger.updateMany({
    where: { id: { in: expired.map(t => t.id) } },
    data: { status: 'EXPIRED' },
  });

  if (totalExpired > 0) {
    const wallet = await tx.pointsWallet.findUnique({ where: { userId } });
    if (wallet) {
      await tx.pointsWallet.updateMany({
        where: { userId, version: wallet.version },
        data: { balance: { decrement: totalExpired }, version: { increment: 1 } },
      });
    }
  }
};

const redeemPointsOnPayment = async ({ order, paymentId }) => {
  if (!order || !order.userId) return;
  if (!order.pointsApplied || order.pointsApplied <= 0) return;

  const idempotencyKey = `payment:${paymentId}:redeem`;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.pointsLedger.findUnique({ where: { idempotencyKey } });
    if (existing?.status === 'COMMITTED') return;

    await expirePointsIfNeeded(tx, order.userId);

    const pending = await tx.pointsLedger.findFirst({
      where: { orderId: order.id, type: 'REDEEM', status: 'PENDING' },
    });

    if (!pending) return;

    const wallet = await tx.pointsWallet.findUnique({ where: { userId: order.userId } });
    if (!wallet) {
      throw new AppError('Wallet points introuvable', 400);
    }

    const expectedDiscount = order.pointsApplied * order.pointsValueHtgAtRedemption;
    if (expectedDiscount !== order.pointsDiscountHtg) {
      throw new AppError('Points mismatch', 400);
    }

    if (wallet.balance < Math.abs(pending.points)) {
      throw new AppError('Points insuffisants au moment du paiement', 400);
    }

    const updated = await tx.pointsWallet.updateMany({
      where: { userId: order.userId, version: wallet.version },
      data: { balance: { decrement: Math.abs(pending.points) }, version: { increment: 1 } },
    });

    if (updated.count !== 1) {
      throw new AppError('Conflit wallet, réessayez', 409);
    }

    await tx.pointsLedger.update({
      where: { id: pending.id },
      data: {
        status: 'COMMITTED',
        paymentId,
        committedAt: new Date(),
        idempotencyKey,
        meta: {
          rate: order.pointsValueHtgAtRedemption,
          maxPercent: order.pointsMaxPercent,
          eligibleSubtotalHtg: order.pointsEligibleSubtotalHtg,
        },
      },
    });
  });
};

const applyEscrowAndCommission = async (order) => {
  if (!order) return;

  await prisma.$transaction(async (tx) => {
    const existingHold = await tx.financialLedger.findFirst({
      where: { orderId: order.id, type: 'ESCROW_HOLD' },
    });
    if (existingHold) return;

    await tx.sellerBalance.upsert({
      where: { storeId: order.storeId },
      update: {},
      create: { storeId: order.storeId },
    });

    await tx.financialLedger.create({
      data: {
        type: 'PLATFORM_EARN',
        status: 'COMMITTED',
        orderId: order.id,
        storeId: order.storeId,
        amountHTG: order.commissionAmountHTG || 0,
      },
    });

    await tx.financialLedger.create({
      data: {
        type: 'ESCROW_HOLD',
        status: 'COMMITTED',
        orderId: order.id,
        storeId: order.storeId,
        amountHTG: order.sellerNetHTG || 0,
      },
    });

    await tx.sellerBalance.update({
      where: { storeId: order.storeId },
      data: {
        escrowHTG: { increment: order.sellerNetHTG || 0 },
        lifetimeEarnedHTG: { increment: order.sellerNetHTG || 0 },
        lifetimeCommissionPaidHTG: { increment: order.commissionAmountHTG || 0 },
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { escrowStatus: 'HELD' },
    });
  });
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
 * Check payment status
 */
router.get('/status/:orderId', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { 
        id: req.params.orderId,
        userId: req.user.id,
      },
    });

    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    res.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
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
    
    if (payment.success && payment.payment) {
      const orderId = payment.payment.reference;
      console.log('[MonCash] payment confirmed', { transactionId, orderId });
      
      // Find and update order
      const order = await prisma.order.findFirst({
        where: { orderNumber: orderId },
      });

      if (order && order.paymentStatus !== 'PAID') {
        const updated = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            paymentId: transactionId,
            paidAt: new Date(),
            status: 'CONFIRMED',
          },
        });

        await redeemPointsOnPayment({ order: updated, paymentId: transactionId });
        await awardCashbackAndPoints(updated);
        await applyEscrowAndCommission(updated);

        // Update store total sales
        await prisma.store.update({
          where: { id: order.storeId },
          data: { totalSales: { increment: 1 } },
        });
      }

      return res.redirect(`${config.FRONTEND_URL}/order-confirmation?orderId=${order?.id}&status=success`);
    }

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

    if (status === 'completed') {
      console.log('[NatCash] payment confirmed', { transactionId, orderId });
      const order = await prisma.order.findFirst({
        where: { orderNumber: orderId },
      });

      if (order && order.paymentStatus !== 'PAID') {
        const updated = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            paymentId: transactionId,
            paidAt: new Date(),
            status: 'CONFIRMED',
          },
        });

        await redeemPointsOnPayment({ order: updated, paymentId: transactionId });
        await awardCashbackAndPoints(updated);
        await applyEscrowAndCommission(updated);

        await prisma.store.update({
          where: { id: order.storeId },
          data: { totalSales: { increment: 1 } },
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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata.orderId;
      console.log('[Stripe] checkout completed', { orderId, paymentIntent: session.payment_intent });

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      
      if (order && order.paymentStatus !== 'PAID') {
        const updated = await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            paymentId: session.payment_intent,
            paidAt: new Date(),
            status: 'CONFIRMED',
          },
        });

        await redeemPointsOnPayment({ order: updated, paymentId: session.payment_intent });
        await awardCashbackAndPoints(updated);
        await applyEscrowAndCommission(updated);

        await prisma.store.update({
          where: { id: order.storeId },
          data: { totalSales: { increment: 1 } },
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
