const prisma = require('../lib/prisma');

const TRUST_BENEFITS = {
  ELITE: { payoutDelayHours: 24, listingBoostFactor: 1.2 },
  TRUSTED: { payoutDelayHours: 48, listingBoostFactor: 1.1 },
  STANDARD: { payoutDelayHours: 72, listingBoostFactor: 1.0 },
  WATCH: { payoutDelayHours: 96, listingBoostFactor: 0.9 },
  RESTRICTED: { payoutDelayHours: 120, listingBoostFactor: 0.8 },
};

const tierFromScore = (score) => {
  if (score >= 90) return 'ELITE';
  if (score >= 75) return 'TRUSTED';
  if (score >= 50) return 'STANDARD';
  if (score >= 30) return 'WATCH';
  return 'RESTRICTED';
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const daysAgo = (days) => new Date(Date.now() - days * 864e5);

const refundPenalty7d = (rate) => {
  const pct = rate * 100;
  if (pct <= 5) return 0;
  if (pct <= 10) return pct * 0.8;
  return pct * 1.5;
};

const refundAfterReleasePenalty30d = (rate) => {
  const pct = rate * 100;
  return Math.min(40, pct * 2.5);
};

const chargebackPenalty30d = (count) => {
  if (count <= 0) return 0;
  if (count === 1) return 12;
  if (count === 2) return 25;
  return 40;
};

const rapidPayoutPenalty = (patterns7d) => Math.min(25, patterns7d * 5);
const criticalEventsPenalty = (count30d) => Math.min(30, count30d * 10);

const computeCleanBonus = ({ orders30d, refundRate30d, chargebacks30d, criticalEvents30d, clean30d, clean90d }) => {
  const bonuses = [];
  if (orders30d < 20) return { totalBonus: 0, bonuses };
  const eligible = refundRate30d < 0.03 && chargebacks30d === 0 && criticalEvents30d === 0;
  if (!eligible) return { totalBonus: 0, bonuses };
  let total = 0;
  if (clean30d) {
    total += 8;
    bonuses.push({ key: 'clean_30d', points: 8 });
  }
  if (clean90d) {
    total += 15;
    bonuses.push({ key: 'clean_90d', points: 15 });
  }
  total = Math.min(20, total);
  return { totalBonus: total, bonuses };
};

const countOrdersPaidOrDelivered = (storeId, since) => prisma.order.count({
  where: {
    storeId,
    createdAt: { gte: since },
    OR: [
      { paymentStatus: 'PAID' },
      { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUNDED'] } },
    ],
  },
});

const countRefunds = (storeId, since) => prisma.order.count({
  where: { storeId, updatedAt: { gte: since }, status: 'REFUNDED' },
});

const countRefundsAfterRelease = (storeId, since) => prisma.order.count({
  where: { storeId, updatedAt: { gte: since }, status: 'REFUNDED', escrowStatus: 'RELEASED' },
});

const countChargebacksOrDisputes = (storeId, since) => prisma.financialLedger.count({
  where: { storeId, createdAt: { gte: since }, type: 'REVERSAL' },
});

const countCriticalRiskEvents = (storeId, since) => prisma.riskEvent.count({
  where: { storeId, createdAt: { gte: since }, severity: 'CRITICAL' },
});

const countRapidPayoutPattern = (storeId, since) => prisma.riskEvent.count({
  where: { storeId, createdAt: { gte: since }, type: 'RAPID_PAYOUT_PATTERN' },
});

const isCleanStreak = async (storeId, since) => {
  const [refunds, chargebacks, critical] = await Promise.all([
    countRefunds(storeId, since),
    countChargebacksOrDisputes(storeId, since),
    countCriticalRiskEvents(storeId, since),
  ]);
  return refunds === 0 && chargebacks === 0 && critical === 0;
};

const computeTrustScore = async (storeId) => {
  const now = new Date();
  const since7d = daysAgo(7);
  const since30d = daysAgo(30);
  const since90d = daysAgo(90);

  const [
    store,
    orders7d,
    orders30d,
    orders90d,
    refunds7d,
    refunds30d,
    refundsAfterRelease30d,
    chargebacks30d,
    criticalRiskEvents30d,
    rapidPayoutPatterns7d,
    clean30d,
    clean90d,
  ] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId }, select: { id: true, trustTier: true, trustScore: true, trustScoreStableDays: true, trustLastTierChangeAt: true } }),
    countOrdersPaidOrDelivered(storeId, since7d),
    countOrdersPaidOrDelivered(storeId, since30d),
    countOrdersPaidOrDelivered(storeId, since90d),
    countRefunds(storeId, since7d),
    countRefunds(storeId, since30d),
    countRefundsAfterRelease(storeId, since30d),
    countChargebacksOrDisputes(storeId, since30d),
    countCriticalRiskEvents(storeId, since30d),
    countRapidPayoutPattern(storeId, since7d),
    isCleanStreak(storeId, since30d),
    isCleanStreak(storeId, since90d),
  ]);

  if (!store) throw new Error('Store not found');

  const refundRate7d = orders7d >= 10 ? (refunds7d / Math.max(1, orders7d)) : 0;
  const refundRate30d = orders30d >= 10 ? (refunds30d / Math.max(1, orders30d)) : 0;
  const refundAfterReleaseRate30d = orders30d >= 10 ? (refundsAfterRelease30d / Math.max(1, orders30d)) : 0;

  const penalties = [];
  const pRefund7d = refundPenalty7d(refundRate7d);
  if (pRefund7d > 0) penalties.push({ key: 'refund_rate_7d', points: pRefund7d, details: { refundRate7d } });
  const pRefundAfter = refundAfterReleasePenalty30d(refundAfterReleaseRate30d);
  if (pRefundAfter > 0) penalties.push({ key: 'refund_after_release_30d', points: pRefundAfter, details: { refundAfterReleaseRate30d } });
  const pCb = chargebackPenalty30d(chargebacks30d);
  if (pCb > 0) penalties.push({ key: 'chargebacks_30d', points: pCb, details: { chargebacks30d } });
  const pRapid = rapidPayoutPenalty(rapidPayoutPatterns7d);
  if (pRapid > 0) penalties.push({ key: 'rapid_payout_pattern_7d', points: pRapid, details: { rapidPayoutPatterns7d } });
  const pCritical = criticalEventsPenalty(criticalRiskEvents30d);
  if (pCritical > 0) penalties.push({ key: 'critical_risk_events_30d', points: pCritical, details: { criticalRiskEvents30d } });

  const totalPenalty = penalties.reduce((s, x) => s + x.points, 0);
  const { totalBonus, bonuses } = computeCleanBonus({
    orders30d,
    refundRate30d,
    chargebacks30d,
    criticalEvents30d: criticalRiskEvents30d,
    clean30d,
    clean90d,
  });

  const base = 100;
  const raw = base - totalPenalty + totalBonus;
  const finalScore = clamp(Math.round(raw), 0, 100);
  const nextTier = tierFromScore(finalScore);

  const summary = {
    version: 'v1',
    signals: {
      orders7d,
      orders30d,
      orders90d,
      refunds7d,
      refunds30d,
      refundsAfterRelease30d,
      chargebacks30d,
      criticalRiskEvents30d,
      rapidPayoutPatterns7d,
      refundRate7d,
      refundRate30d,
      refundAfterReleaseRate30d,
    },
    penalties: penalties.map(p => ({ ...p, points: Math.round(p.points) })),
    bonuses,
    score: { base, penalty: Math.round(totalPenalty), bonus: totalBonus, final: finalScore },
    computedAt: now.toISOString(),
  };

  return { storeId, finalScore, nextTier, summary, prevTier: store.trustTier, prevScore: store.trustScore };
};

const tierRank = (tier) => {
  switch (tier) {
    case 'RESTRICTED': return 1;
    case 'WATCH': return 2;
    case 'STANDARD': return 3;
    case 'TRUSTED': return 4;
    case 'ELITE': return 5;
    default: return 3;
  }
};

const applyTrustTierTransition = async ({ storeId, prevTier, prevScore, nextTier, nextScore, summary }) => {
  const UPGRADE_STABLE_DAYS = 7;

  if (nextTier === prevTier) {
    await prisma.store.update({
      where: { id: storeId },
      data: {
        trustScore: nextScore,
        trustUpdatedAt: new Date(),
        trustReasonSummary: summary,
        trustScoreStableDays: nextScore >= prevScore ? { increment: 1 } : 0,
        trustTierRank: tierRank(prevTier),
        ...TRUST_BENEFITS[nextTier],
      },
    });
    return { changed: false, tier: prevTier };
  }

  const isUpgrade = tierRank(nextTier) > tierRank(prevTier);

  if (!isUpgrade) {
    return prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: storeId },
        data: {
          trustScore: nextScore,
          trustTier: nextTier,
          trustUpdatedAt: new Date(),
          trustReasonSummary: summary,
          trustScoreStableDays: 0,
          trustLastTierChangeAt: new Date(),
          trustTierRank: tierRank(nextTier),
          ...TRUST_BENEFITS[nextTier],
        },
      });

      await tx.trustEvent.create({
        data: { storeId, prevScore, nextScore, prevTier, nextTier, details: { summary } },
      });

      return { changed: true, tier: nextTier };
    });
  }

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { trustScoreStableDays: true } });
  const stableDays = store?.trustScoreStableDays ?? 0;

  if (stableDays + 1 < UPGRADE_STABLE_DAYS) {
    await prisma.store.update({
      where: { id: storeId },
      data: {
        trustScore: nextScore,
        trustUpdatedAt: new Date(),
        trustReasonSummary: summary,
        trustScoreStableDays: stableDays + 1,
        trustTierRank: tierRank(prevTier),
        ...TRUST_BENEFITS[prevTier],
      },
    });
    return { changed: false, tier: prevTier, pendingUpgradeTo: nextTier, stableDays: stableDays + 1 };
  }

  return prisma.$transaction(async (tx) => {
    await tx.store.update({
      where: { id: storeId },
      data: {
        trustScore: nextScore,
        trustTier: nextTier,
        trustUpdatedAt: new Date(),
        trustReasonSummary: summary,
        trustScoreStableDays: 0,
        trustLastTierChangeAt: new Date(),
        trustTierRank: tierRank(nextTier),
        ...TRUST_BENEFITS[nextTier],
      },
    });

    await tx.trustEvent.create({
      data: { storeId, prevScore, nextScore, prevTier, nextTier, details: { summary, stableDaysRequired: UPGRADE_STABLE_DAYS } },
    });

    return { changed: true, tier: nextTier };
  });
};

const recomputeTrustForStore = async (storeId) => {
  const { finalScore, nextTier, summary, prevTier, prevScore } = await computeTrustScore(storeId);
  return applyTrustTierTransition({ storeId, prevTier, prevScore, nextTier, nextScore: finalScore, summary });
};

module.exports = {
  TRUST_BENEFITS,
  tierFromScore,
  computeTrustScore,
  applyTrustTierTransition,
  recomputeTrustForStore,
};
