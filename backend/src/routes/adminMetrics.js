const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { query } = require('express-validator');
const validate = require('../middleware/validate');
const { computeVerifiedSellerUpliftFirestore } = require('../services/metrics/verifiedUpliftFirestore');

const router = express.Router();

const parseWindow = (value) => {
  if (!value) return { label: '7d', ms: 7 * 24 * 60 * 60 * 1000 };
  const match = String(value).match(/^(\d+)([dh])$/);
  if (!match) return { label: '7d', ms: 7 * 24 * 60 * 60 * 1000 };
  const amount = Number(match[1]);
  const unit = match[2];
  if (!amount || amount <= 0) return { label: '7d', ms: 7 * 24 * 60 * 60 * 1000 };
  const ms = unit === 'h' ? amount * 60 * 60 * 1000 : amount * 24 * 60 * 60 * 1000;
  return { label: `${amount}${unit}`, ms };
};

const toNumber = (value) => (value === null || value === undefined ? 0 : Number(value));

router.get('/metrics/summary', authenticate, requireAdmin, validate([
  query('window').optional().isString(),
]), async (req, res, next) => {
  try {
    const windowParam = parseWindow(req.query.window);
    const now = new Date();
    const since = new Date(now.getTime() - windowParam.ms);

    const rows = await prisma.$queryRaw`
      SELECT
        COUNT(*) FILTER (WHERE "eventName" = 'cart_checkout_cta_click') AS "cartCheckoutClicks",
        COUNT(*) FILTER (WHERE "eventName" IN ('checkout_start', 'checkout_started')) AS "checkoutStarts",
        COUNT(*) FILTER (WHERE "eventName" = 'checkout_completed') AS "checkoutCompletions",
        COUNT(*) FILTER (WHERE "eventName" = 'checkout_payment_success' AND ("eventData"->>'successSource') = 'confirmed') AS "paymentSuccessConfirmed",
        COUNT(*) FILTER (WHERE "eventName" = 'checkout_payment_success' AND ("eventData"->>'successSource') = 'redirect') AS "paymentSuccessRedirect",
        COUNT(*) FILTER (WHERE "eventName" = 'cart_upsell_visible') AS "upsellVisible",
        COUNT(*) FILTER (WHERE "eventName" = 'cart_upsell_added') AS "upsellAdded",
        COUNT(*) FILTER (WHERE "eventName" = 'pickup_order_persisted') AS "pickupOrders",
        COUNT(*) FILTER (WHERE "eventName" = 'cart_trust_visible') AS "trustVisible",
        COUNT(*) FILTER (WHERE "eventName" = 'cart_checkout_cta_click') AS "trustClick",
        COUNT(*) FILTER (WHERE "eventName" = 'tracking_support_cta_click') AS "trackingSupportClicks",
        COUNT(DISTINCT "sessionId") AS "sessions"
      FROM analytics_events
      WHERE "createdAt" >= ${since}
    `;

    const row = rows?.[0] || {};

    const cartCheckoutClicks = toNumber(row.cartCheckoutClicks);
    const checkoutStarts = toNumber(row.checkoutStarts);
    const checkoutCompletions = toNumber(row.checkoutCompletions);
    const paymentSuccessConfirmed = toNumber(row.paymentSuccessConfirmed);
    const paymentSuccessRedirect = toNumber(row.paymentSuccessRedirect);
    const upsellVisible = toNumber(row.upsellVisible);
    const upsellAdded = toNumber(row.upsellAdded);
    const pickupOrders = toNumber(row.pickupOrders);
    const trustVisible = toNumber(row.trustVisible);
    const trustClick = toNumber(row.trustClick);
    const trackingSupportClicks = toNumber(row.trackingSupportClicks);
    const sessions = toNumber(row.sessions);

    const orderAgg = await prisma.order.aggregate({
      where: {
        createdAt: { gte: since },
        paymentStatus: 'PAID',
      },
      _sum: { total: true },
      _count: { _all: true },
    });

    const upliftResult = await computeVerifiedSellerUpliftFirestore({
      from: since,
      to: now,
      budgetMs: 1200,
      maxDocs: 15000,
      STORE_KEY_MODE: 'DOC_ID',
    });

    const revenueConfirmed = Number(orderAgg._sum.total || 0);
    const ordersConfirmed = Number(orderAgg._count._all || 0);
    const aovConfirmed = ordersConfirmed ? Number((revenueConfirmed / ordersConfirmed).toFixed(2)) : 0;

    const safeRate = (num, den) => {
      if (!den || den <= 0) return 0;
      const raw = num / den;
      if (Number.isNaN(raw) || !Number.isFinite(raw)) return 0;
      return Math.max(0, Math.min(1, Number(raw.toFixed(6))));
    };

    const redirectDropRate = safeRate((paymentSuccessRedirect - paymentSuccessConfirmed), Math.max(paymentSuccessRedirect, 1));
    const upsellAttachRate = safeRate(upsellAdded, Math.max(upsellVisible, 1));
    const pickupAdoptionRate = safeRate(pickupOrders, Math.max(ordersConfirmed, 1));
    const trustBadgeCTR = safeRate(trustClick, Math.max(trustVisible, 1));
    const trackingTicketRate = safeRate(trackingSupportClicks, Math.max(ordersConfirmed, 1));

    const verifiedSellerUplift = null;
    const verifiedUpliftStatus = 'TODO_missing_join';

    res.json({
      window: windowParam.label,
      range: { from: since.toISOString(), to: now.toISOString() },
      sessions,
      cartCheckoutClicks,
      checkoutStarts,
      checkoutCompletions,
      paymentSuccessConfirmed,
      ordersConfirmed,
      revenueConfirmed,
      aovConfirmed,
      redirectSuccess: paymentSuccessRedirect,
      confirmedSuccess: paymentSuccessConfirmed,
      redirectDropRate,
      upsellVisible,
      upsellAdded,
      upsellAttachRate,
      pickupOrders,
      pickupAdoptionRate,
      trustVisible,
      trustClick,
      trustBadgeCTR,
      trackingSupportClicks,
      trackingTicketRate,
      verifiedSellerUplift: upliftResult.data,
      verifiedUpliftStatus: upliftResult.status,
      rates: {
        cartToCheckout: safeRate(checkoutStarts, cartCheckoutClicks),
        checkoutCompletion: safeRate(checkoutCompletions, checkoutStarts),
        paymentSuccess: safeRate(paymentSuccessConfirmed, checkoutCompletions),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
