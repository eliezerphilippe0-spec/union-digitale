const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { recomputeTrustForStore, TRUST_BENEFITS } = require('../services/trustEngine');
const { runDailyTrustRecompute, getTrustJobStatus } = require('../jobs/trustDailyRecompute');
const { query, body } = require('express-validator');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/trust/summary', authenticate, requireAdmin, validate([
  query('window').optional().isIn(['7d','30d','90d']),
]), async (req, res, next) => {
  try {
    const counts = await prisma.store.groupBy({
      by: ['trustTier'],
      _count: { trustTier: true },
    });

    const totals = counts.reduce((acc, row) => {
      acc[row.trustTier.toLowerCase()] = row._count.trustTier;
      return acc;
    }, {});

    const avgScore = await prisma.store.aggregate({
      _avg: { trustScore: true },
    });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const changedLast24h = await prisma.trustEvent.count({
      where: { createdAt: { gte: since } },
    });

    res.json({
      counts: totals,
      avgTrustScore: Math.round(avgScore._avg.trustScore || 0),
      changedTiers24h: changedLast24h,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/trust/stores', authenticate, requireAdmin, validate([
  query('tier').optional().isString(),
  query('cursor').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isIn(['score','updatedAt']).default('score'),
  query('direction').optional().isIn(['asc','desc']).default('desc'),
  query('payoutDelayNot72').optional().isBoolean().toBoolean(),
]), async (req, res, next) => {
  try {
    const tiers = req.query.tier ? req.query.tier.split(',').map(t => t.trim()).filter(Boolean) : null;
    const limit = req.query.limit || 50;
    const cursor = req.query.cursor || null;
    const sortField = req.query.sort || 'score';
    const direction = req.query.direction || 'desc';

    const where = {
      ...(tiers && tiers.length ? { trustTier: { in: tiers } } : {}),
      ...(req.query.payoutDelayNot72 ? { payoutDelayHours: { not: 72 } } : {}),
    };

    const orderBy = sortField === 'updatedAt'
      ? { trustUpdatedAt: direction }
      : { trustScore: direction };

    const items = await prisma.store.findMany({
      where,
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy,
      select: {
        id: true,
        name: true,
        trustScore: true,
        trustTier: true,
        trustUpdatedAt: true,
        trustReasonSummary: true,
        payoutDelayHours: true,
        listingBoostFactor: true,
      },
    });

    const nextCursor = items.length === limit ? items[items.length - 1].id : null;

    res.json({ items, nextCursor });
  } catch (error) {
    next(error);
  }
});

router.get('/stores/:storeId/trust', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.params.storeId },
      select: {
        id: true,
        name: true,
        trustScore: true,
        trustTier: true,
        trustUpdatedAt: true,
        trustReasonSummary: true,
        payoutDelayHours: true,
        listingBoostFactor: true,
      },
    });

    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json(store);
  } catch (error) {
    next(error);
  }
});

router.get('/stores/:storeId/trust/events', authenticate, requireAdmin, validate([
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
]), async (req, res, next) => {
  try {
    const limit = req.query.limit || 50;
    const events = await prisma.trustEvent.findMany({
      where: { storeId: req.params.storeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ items: events });
  } catch (error) {
    next(error);
  }
});

router.post('/stores/:storeId/trust/recompute', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const result = await recomputeTrustForStore(req.params.storeId);
    res.json({ result });
  } catch (error) {
    next(error);
  }
});

router.post('/trust/jobs/daily-recompute/run', authenticate, requireAdmin, validate([
  query('DRY_RUN').optional().isBoolean().toBoolean(),
  body('DRY_RUN').optional().isBoolean().toBoolean(),
]), async (req, res, next) => {
  try {
    const dryRun = String(req.query.DRY_RUN || req.body?.DRY_RUN || '').toLowerCase() === 'true';
    const report = await runDailyTrustRecompute({ dryRun });
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/trust/jobs/daily-recompute/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const status = await getTrustJobStatus();
    res.json({ status });
  } catch (error) {
    next(error);
  }
});

router.get('/stores/:slug/trust', async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: req.params.slug },
      select: { trustTier: true, payoutDelayHours: true },
    });

    if (!store) return res.status(404).json({ error: 'Store not found' });

    res.json({
      trustTier: store.trustTier,
      badge: store.trustTier === 'ELITE' ? 'Elite Seller' : store.trustTier === 'TRUSTED' ? 'Trusted Seller' : 'Seller',
      payoutDelayHours: store.payoutDelayHours,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
