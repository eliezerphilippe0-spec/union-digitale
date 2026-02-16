const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, query } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const config = require('../config');
const { computeRiskLevel } = require('../services/riskEngine');

const router = express.Router();

const evalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Trop de requêtes risk-evaluate' },
});

const isSuperAdmin = (req) => {
  const list = config.SUPER_ADMIN_EMAILS || [];
  return list.includes(req.user.email);
};

router.patch('/stores/:storeId/risk-level', authenticate, requireAdmin, validate([
  body('riskLevel').isIn(['NORMAL','WATCH','HIGH','FROZEN']).withMessage('riskLevel invalide'),
  body('reason').isString().isLength({ min: 5, max: 500 }).withMessage('reason invalide'),
  body('note').optional().isString().isLength({ max: 2000 }),
  body('payoutsFrozen').optional().isBoolean(),
  body('expiresAt').optional().isISO8601().toDate(),
]), async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { riskLevel, reason, note, payoutsFrozen, expiresAt } = req.body;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new AppError('Boutique non trouvée', 404);

    if (store.riskLevel === 'FROZEN' && riskLevel === 'NORMAL' && !isSuperAdmin(req)) {
      throw new AppError('SUPER_ADMIN requis pour unfreeze direct', 403);
    }

    const nextFrozen = typeof payoutsFrozen === 'boolean'
      ? payoutsFrozen
      : (riskLevel === 'HIGH' || riskLevel === 'FROZEN');

    const prevLevel = store.riskLevel;
    const prevFrozen = store.payoutsFrozen;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedStore = await tx.store.update({
        where: { id: storeId },
        data: {
          riskLevel,
          payoutsFrozen: nextFrozen,
          riskFlag: nextFrozen,
          lastRiskEvaluated: new Date(),
        },
      });

      await tx.riskEvent.create({
        data: {
          storeId,
          type: 'MANUAL_SET',
          severity: riskLevel === 'FROZEN' ? 'CRITICAL' : 'WARNING',
          prevLevel,
          nextLevel: riskLevel,
          scoreDelta: 0,
          details: { reason, note, adminId: req.user.id, prevFrozen, nextFrozen, expiresAt },
        },
      });

      return updatedStore;
    });

    console.log(JSON.stringify({ event: 'risk_manual_set', storeId, adminId: req.user.id, prevLevel, nextLevel: riskLevel, prevFrozen, nextFrozen }));
    console.log(JSON.stringify({ event: 'metric', name: 'risk_manual_set_count', value: 1 }));

    res.json({
      storeId,
      prevLevel,
      nextLevel: riskLevel,
      payoutsFrozen: updated.payoutsFrozen,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/stores/:storeId/unfreeze', authenticate, requireAdmin, validate([
  body('reason').isString().isLength({ min: 5, max: 500 }).withMessage('reason invalide'),
  body('note').optional().isString().isLength({ max: 2000 }),
]), async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { reason, note } = req.body;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new AppError('Boutique non trouvée', 404);

    if (store.riskLevel === 'FROZEN' && !isSuperAdmin(req)) {
      throw new AppError('SUPER_ADMIN requis pour unfreeze FROZEN', 403);
    }

    const prevLevel = store.riskLevel;
    const prevFrozen = store.payoutsFrozen;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedStore = await tx.store.update({
        where: { id: storeId },
        data: {
          payoutsFrozen: false,
          riskFlag: false,
          lastRiskEvaluated: new Date(),
        },
      });

      await tx.riskEvent.create({
        data: {
          storeId,
          type: 'MANUAL_SET',
          severity: 'WARNING',
          prevLevel,
          nextLevel: prevLevel,
          scoreDelta: 0,
          details: { reason, note, adminId: req.user.id, prevFrozen, nextFrozen: false },
        },
      });

      return updatedStore;
    });

    console.log(JSON.stringify({ event: 'risk_manual_set', storeId, adminId: req.user.id, prevLevel, nextLevel: prevLevel, prevFrozen, nextFrozen: false }));
    console.log(JSON.stringify({ event: 'metric', name: 'risk_manual_set_count', value: 1 }));

    res.json({ storeId, prevLevel, nextLevel: prevLevel, payoutsFrozen: updated.payoutsFrozen, updatedAt: updated.updatedAt });
  } catch (error) {
    next(error);
  }
});

router.post('/stores/:storeId/freeze', authenticate, requireAdmin, validate([
  body('level').isIn(['HIGH','FROZEN']).withMessage('level invalide'),
  body('reason').isString().isLength({ min: 5, max: 500 }).withMessage('reason invalide'),
  body('note').optional().isString().isLength({ max: 2000 }),
]), async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { level, reason, note } = req.body;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new AppError('Boutique non trouvée', 404);

    const prevLevel = store.riskLevel;
    const prevFrozen = store.payoutsFrozen;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedStore = await tx.store.update({
        where: { id: storeId },
        data: {
          riskLevel: level,
          payoutsFrozen: true,
          riskFlag: true,
          lastRiskEvaluated: new Date(),
        },
      });

      await tx.riskEvent.create({
        data: {
          storeId,
          type: 'MANUAL_SET',
          severity: level === 'FROZEN' ? 'CRITICAL' : 'WARNING',
          prevLevel,
          nextLevel: level,
          scoreDelta: 0,
          details: { reason, note, adminId: req.user.id, prevFrozen, nextFrozen: true },
        },
      });

      return updatedStore;
    });

    console.log(JSON.stringify({ event: 'risk_manual_set', storeId, adminId: req.user.id, prevLevel, nextLevel: level, prevFrozen, nextFrozen: true }));
    console.log(JSON.stringify({ event: 'metric', name: 'risk_manual_set_count', value: 1 }));

    res.json({ storeId, prevLevel, nextLevel: level, payoutsFrozen: updated.payoutsFrozen, updatedAt: updated.updatedAt });
  } catch (error) {
    next(error);
  }
});

router.get('/risk/stores', authenticate, requireAdmin, validate([
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('frozen').optional().isBoolean().toBoolean(),
]), async (req, res, next) => {
  try {
    const { level, frozen, limit = 50, cursor } = req.query;
    const levels = level ? String(level).split(',') : undefined;

    const where = {
      ...(levels && { riskLevel: { in: levels } }),
      ...(typeof frozen === 'boolean' && { payoutsFrozen: frozen }),
    };

    const items = await prisma.store.findMany({
      where,
      take: Number(limit) + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      select: {
        id: true,
        name: true,
        riskLevel: true,
        payoutsFrozen: true,
        lastRiskEvaluated: true,
        riskEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { type: true, severity: true, createdAt: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    let nextCursor = null;
    if (items.length > Number(limit)) {
      const nextItem = items.pop();
      nextCursor = nextItem.id;
    }

    res.json({
      items: items.map(s => ({
        storeId: s.id,
        name: s.name,
        riskLevel: s.riskLevel,
        payoutsFrozen: s.payoutsFrozen,
        lastRiskEvaluated: s.lastRiskEvaluated,
        lastEvent: s.riskEvents[0] || null,
      })),
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stores/:storeId/risk-events', authenticate, requireAdmin, validate([
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
]), async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { limit = 100, cursor } = req.query;

    const events = await prisma.riskEvent.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
    });

    let nextCursor = null;
    if (events.length > Number(limit)) {
      const next = events.pop();
      nextCursor = next.id;
    }

    res.json({ items: events, nextCursor });
  } catch (error) {
    next(error);
  }
});

router.post('/stores/:storeId/risk-evaluate', authenticate, requireAdmin, evalLimiter, validate([
  body('dryRun').optional().isBoolean().toBoolean(),
]), async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const dryRun = Boolean(req.body?.dryRun);

    const decision = await computeRiskLevel(storeId, { dryRun, adminId: req.user.id });
    res.json({ decision, dryRun });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
