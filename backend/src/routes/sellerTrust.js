const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate, requireSeller } = require('../middleware/auth');

const router = express.Router();

const signalLabelMap = {
  refund_rate_7d: 'Retours récents observés',
  refund_after_release_30d: 'Litiges après livraison',
  chargebacks_30d: 'Contestations récentes',
  rapid_payout_pattern_7d: 'Demandes de paiement fréquentes',
  clean_30d: 'Performance stable 30 jours',
  clean_90d: 'Performance stable 90 jours',
  critical_risk_events_30d: 'Événements critiques récents',
};

const mapSummaryToLabels = (summary = {}) => {
  const penalties = summary.penalties || [];
  const bonuses = summary.bonuses || [];

  const positives = bonuses
    .map((b) => signalLabelMap[b.key])
    .filter(Boolean);

  const warnings = penalties
    .map((p) => signalLabelMap[p.key])
    .filter(Boolean);

  return { positives, warnings };
};

router.get('/trust', authenticate, requireSeller, async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
        trustTier: true,
        trustUpdatedAt: true,
        trustReasonSummary: true,
        payoutDelayHours: true,
        listingBoostFactor: true,
      },
    });

    if (!store) return res.status(404).json({ error: 'Store not found' });

    const { positives, warnings } = mapSummaryToLabels(store.trustReasonSummary || {});

    const events = await prisma.trustEvent.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const tierRank = {
      RESTRICTED: 1,
      WATCH: 2,
      STANDARD: 3,
      TRUSTED: 4,
      ELITE: 5,
    };

    const timeline = events.map((evt) => {
      const prevRank = tierRank[evt.prevTier] || 0;
      const nextRank = tierRank[evt.nextTier] || 0;
      let type = 'STABLE';
      if (prevRank !== nextRank) type = nextRank > prevRank ? 'UPGRADE' : 'DOWNGRADE';
      return {
        date: evt.createdAt,
        type,
        from: evt.prevTier,
        to: evt.nextTier,
      };
    });

    if (timeline.length === 0 && store.trustUpdatedAt) {
      timeline.push({
        date: store.trustUpdatedAt,
        type: 'STABLE',
      });
    }

    res.json({
      tier: store.trustTier,
      updatedAt: store.trustUpdatedAt,
      benefits: {
        payoutDelayHours: store.payoutDelayHours,
        listingBoostFactor: store.listingBoostFactor,
      },
      positives,
      warnings,
      timeline,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
