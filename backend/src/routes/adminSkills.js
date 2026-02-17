const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { listSkills } = require('../utils/skillsRegistry');

const router = express.Router();

const parseWindow = (window = '7d') => {
  const match = String(window).match(/^(\d+)(h|d)$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = unit === 'h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return value * multiplier;
};

router.get('/skills/summary', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const window = req.query.window || '7d';
    const since = new Date(Date.now() - parseWindow(window));

    const [totalEvents, grouped, recentErrors] = await Promise.all([
      prisma.skillUsageEvent.count({ where: { createdAt: { gte: since } } }),
      prisma.skillUsageEvent.groupBy({
        by: ['skillKey'],
        _count: { _all: true },
        _max: { createdAt: true },
        where: { createdAt: { gte: since } },
      }),
      prisma.skillUsageEvent.findMany({
        where: { status: { not: 'success' }, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const skills = listSkills();

    const bySkill = grouped.map((row) => ({
      skillKey: row.skillKey,
      count: row._count._all,
      lastUsedAt: row._max.createdAt,
    }));

    res.json({
      window,
      since: since.toISOString(),
      totalEvents,
      skills,
      bySkill,
      recentErrors,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/skills/events', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const skillKey = req.query.skillKey || undefined;
    const status = req.query.status || undefined;

    const where = {
      ...(skillKey ? { skillKey } : {}),
      ...(status ? { status } : {}),
    };

    const [events, total] = await Promise.all([
      prisma.skillUsageEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.skillUsageEvent.count({ where }),
    ]);

    res.json({
      events,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
