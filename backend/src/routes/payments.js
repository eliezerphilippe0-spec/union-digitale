/**
 * Payment Routes
 * Supports: MonCash, NatCash, Card (Stripe)
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config');

const router = express.Router();
const prisma = new PrismaClient();

// Initialize payment for order
router.post('/initialize', authenticate, async (req, res, next) => {
  try {
    const { orderId, method } = req.body;

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
        // MonCash API integration
        paymentData = {
          provider: 'moncash',
          redirectUrl: `https://moncashbutton.digicelgroup.com/Moncash-middleware/Payment/Redirect?orderId=${order.orderNumber}&amount=${order.total}&business=${config.MONCASH_CLIENT_ID}`,
          instructions: 'Vous serez redirigé vers MonCash pour compléter le paiement.',
        };
        break;

      case 'NATCASH':
        // NatCash integration
        paymentData = {
          provider: 'natcash',
          phone: '4040-XXXX', // NatCash merchant number
          amount: order.total,
          reference: order.orderNumber,
          instructions: 'Envoyez le montant via NatCash au numéro indiqué avec la référence.',
        };
        break;

      case 'CARD':
        // Stripe integration
        if (config.STRIPE_SECRET_KEY) {
          const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
              price_data: {
                currency: 'usd', // Convert HTG to USD
                product_data: { name: `Commande ${order.orderNumber}` },
                unit_amount: Math.round(order.total / 150 * 100), // HTG to USD cents
              },
              quantity: 1,
            }],
            mode: 'payment',
            success_url: `${config.FRONTEND_URL}/order-confirmation?orderId=${order.id}`,
            cancel_url: `${config.FRONTEND_URL}/checkout?orderId=${order.id}`,
            metadata: { orderId: order.id },
          });
          paymentData = {
            provider: 'stripe',
            sessionId: session.id,
            redirectUrl: session.url,
          };
        } else {
          throw new AppError('Paiement par carte non disponible', 400);
        }
        break;

      case 'CASH_ON_DELIVERY':
        paymentData = {
          provider: 'cod',
          instructions: 'Paiement à la livraison. Préparez le montant exact.',
        };
        break;

      default:
        throw new AppError('Méthode de paiement non supportée', 400);
    }

    // Update order payment method
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: method },
    });

    res.json({
      message: 'Paiement initialisé',
      payment: paymentData,
    });
  } catch (error) {
    next(error);
  }
});

// Confirm payment (webhook or manual)
router.post('/confirm', async (req, res, next) => {
  try {
    const { orderId, paymentId, provider } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paymentId,
        paidAt: new Date(),
        status: 'CONFIRMED',
      },
    });

    // Update store total sales
    await prisma.store.update({
      where: { id: order.storeId },
      data: { totalSales: { increment: 1 } },
    });

    res.json({ message: 'Paiement confirmé' });
  } catch (error) {
    next(error);
  }
});

// Stripe webhook
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!config.STRIPE_SECRET_KEY) {
    return res.status(400).send('Stripe not configured');
  }

  const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, config.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata.orderId;

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          paymentId: session.payment_intent,
          paidAt: new Date(),
          status: 'CONFIRMED',
        },
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// MonCash callback
router.get('/callback/moncash', async (req, res, next) => {
  try {
    const { transactionId, orderId } = req.query;

    // Verify transaction with MonCash API
    // For now, just confirm
    const order = await prisma.order.findFirst({
      where: { orderNumber: orderId },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentId: transactionId,
          paidAt: new Date(),
          status: 'CONFIRMED',
        },
      });
    }

    res.redirect(`${config.FRONTEND_URL}/order-confirmation?orderId=${order?.id}`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
