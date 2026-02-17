const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const windowToDate = (window) => {
  const now = Date.now();
  if (window === '24h') return new Date(now - 24 * 60 * 60 * 1000);
  if (window === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (window === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return new Date(now - 7 * 24 * 60 * 60 * 1000);
};

router.get('/skills/usage', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { window = '7d' } = req.query;
    const since = windowToDate(window);

    const events = await prisma.skillUsageEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ events });
  } catch (error) {
    next(error);
  }
});

router.get('/skills/usage/events', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100'), 200);
    const events = await prisma.skillUsageEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

router.get('/skills/usage/summary', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { window = '7d' } = req.query;
    const since = windowToDate(window);

    const [totalRuns, blockedRuns, topSkills] = await Promise.all([
      prisma.skillUsageEvent.count({ where: { createdAt: { gte: since } } }),
      prisma.skillUsageEvent.count({ where: { createdAt: { gte: since }, result: 'BLOCKED' } }),
      prisma.skillUsageEvent.groupBy({
        by: ['selectedSkill'],
        where: { createdAt: { gte: since } },
        _count: { selectedSkill: true },
        orderBy: { _count: { selectedSkill: 'desc' } },
        take: 5,
      }),
    ]);

    res.json({
      totalRuns,
      blockedRuns,
      topSkills: topSkills.map((s) => ({ skill: s.selectedSkill, count: s._count.selectedSkill })),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
