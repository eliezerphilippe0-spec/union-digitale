/**
 * Payment Routes
 * Supports: MonCash, NatCash, Card (Stripe), Cash on Delivery
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config');
const moncashService = require('../services/moncashService');
const natcashService = require('../services/natcashService');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Initialize payment for order
 */
router.post('/initialize', authenticate, async (req, res, next) => {
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
      
      // Find and update order
      const order = await prisma.order.findFirst({
        where: { orderNumber: orderId },
      });

      if (order && order.paymentStatus !== 'PAID') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            paymentId: transactionId,
            paidAt: new Date(),
            status: 'CONFIRMED',
          },
        });

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
      const order = await prisma.order.findFirst({
        where: { orderNumber: orderId },
      });

      if (order && order.paymentStatus !== 'PAID') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            paymentId: transactionId,
            paidAt: new Date(),
            status: 'CONFIRMED',
          },
        });

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

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      
      if (order && order.paymentStatus !== 'PAID') {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            paymentId: session.payment_intent,
            paidAt: new Date(),
            status: 'CONFIRMED',
          },
        });

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

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paymentId: transactionId || `MANUAL-${Date.now()}`,
        paidAt: new Date(),
        status: 'CONFIRMED',
        sellerNote: notes,
      },
    });

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
