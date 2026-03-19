const prisma = require('../lib/prisma');

const levelFromScore = (score) => {
  if (score >= 80) return 'FROZEN';
  if (score >= 50) return 'HIGH';
  if (score >= 20) return 'WATCH';
  return 'NORMAL';
};

const pickPrimary = (reasons) => {
  const critical = reasons.find(r => r.severity === 'CRITICAL');
  if (critical) return critical;
  const warning = reasons.find(r => r.severity === 'WARNING');
  return warning || reasons[0];
};

const cfgByKey = (configs, key) => configs.find(c => c.key === key);

const countOrdersPaidOrDelivered = async (storeId, since) => prisma.order.count({
  where: {
    storeId,
    createdAt: { gte: since },
    OR: [
      { paymentStatus: 'PAID' },
      { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUNDED'] } },
    ],
  },
});

const countRefunds = async (storeId, since) => prisma.order.count({
  where: {
    storeId,
    createdAt: { gte: since },
    status: 'REFUNDED',
  },
});

const countRefundsAfterRelease = async (storeId, since) => prisma.order.count({
  where: {
    storeId,
    createdAt: { gte: since },
    status: 'REFUNDED',
    escrowStatus: 'RELEASED',
  },
});

const countChargebacksOrDisputes = async (storeId, since) => prisma.financialLedger.count({
  where: {
    storeId,
    createdAt: { gte: since },
    type: 'REVERSAL',
  },
});

const getPayoutPendingNow = async (storeId) => {
  const balance = await prisma.sellerBalance.findUnique({ where: { storeId } });
  return balance?.payoutPendingHTG || 0;
};

const getPayoutPendingAvg30d = async (storeId, since30d) => {
  const locks = await prisma.financialLedger.aggregate({
    _sum: { amountHTG: true },
    where: {
      storeId,
      createdAt: { gte: since30d },
      type: 'PAYOUT_LOCK',
    },
  });

  const total = Math.abs(locks?._sum?.amountHTG || 0);
  return total / 30;
};

const countPaymentsConfirmed = async (storeId, since) => prisma.order.count({
  where: {
    storeId,
    paymentStatus: 'PAID',
    paidAt: { gte: since },
  },
});

const countRapidPayoutPattern = async (storeId, since) => {
  const orders = await prisma.order.findMany({
    where: {
      storeId,
      deliveredAt: { gte: since },
      paidAt: { not: null },
    },
    select: { paidAt: true, deliveredAt: true },
  });

  const rapidDeliveries = orders.filter(o => {
    if (!o.paidAt || !o.deliveredAt) return false;
    return o.deliveredAt.getTime() - o.paidAt.getTime() <= 24 * 60 * 60 * 1000;
  }).length;

  const payoutRequests = await prisma.payoutRequest.count({
    where: {
      storeId,
      createdAt: { gte: since },
    },
  });

  return Math.min(rapidDeliveries, payoutRequests);
};

const computeRiskLevel = async (storeId, options = {}) => {
  const [store, configs] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId }, select: { id: true, riskLevel: true } }),
    prisma.riskRuleConfig.findMany({ where: { enabled: true } }),
  ]);

  if (!store) throw new Error('Store not found');

  const now = new Date();
  const since7d = new Date(now.getTime() - 7 * 864e5);
  const since30d = new Date(now.getTime() - 30 * 864e5);

  const [
    orders7d,
    orders30d,
    refunds7d,
    refunds30d,
    refundsAfterRelease30d,
    chargebacks30d,
    payoutPendingNow,
    payoutPendingAvg30d,
    paymentsConfirmedLastHour,
    rapidPatternCount7d,
  ] = await Promise.all([
    countOrdersPaidOrDelivered(storeId, since7d),
    countOrdersPaidOrDelivered(storeId, since30d),
    countRefunds(storeId, since7d),
    countRefunds(storeId, since30d),
    countRefundsAfterRelease(storeId, since30d),
    countChargebacksOrDisputes(storeId, since30d),
    getPayoutPendingNow(storeId),
    getPayoutPendingAvg30d(storeId, since30d),
    countPaymentsConfirmed(storeId, new Date(now.getTime() - 3600e3)),
    countRapidPayoutPattern(storeId, since7d),
  ]);

  const refundRate7d = orders7d > 0 ? refunds7d / orders7d : 0;
  const refundRate30d = orders30d > 0 ? refunds30d / orders30d : 0;
  const refundAfterReleaseRate30d = orders30d > 0 ? refundsAfterRelease30d / orders30d : 0;
  const payoutGrowth = payoutPendingAvg30d > 0 ? payoutPendingNow / payoutPendingAvg30d : 0;

  let score = 0;
  const reasons = [];

  {
    const c = cfgByKey(configs, 'refundSpike7d');
    const watch = c?.threshold ?? 0.08;
    const high = c?.threshold2 ?? 0.15;
    if (refundRate7d > high) {
      score += 40;
      reasons.push({ type: 'REFUND_SPIKE', severity: 'CRITICAL', value: refundRate7d, threshold: high, windowDays: 7 });
    } else if (refundRate7d > watch) {
      score += 20;
      reasons.push({ type: 'REFUND_SPIKE', severity: 'WARNING', value: refundRate7d, threshold: watch, windowDays: 7 });
    }
  }

  {
    const c = cfgByKey(configs, 'refundAfterRelease30d');
    const high = c?.threshold ?? 0.05;
    if (refundAfterReleaseRate30d > high) {
      score += 35;
      reasons.push({ type: 'REFUND_AFTER_RELEASE_SPIKE', severity: 'CRITICAL', value: refundAfterReleaseRate30d, threshold: high, windowDays: 30 });
    }
  }

  {
    const c = cfgByKey(configs, 'chargebacks30d');
    const lim = c?.limitInt ?? 2;
    if (chargebacks30d >= lim) {
      score += 30;
      reasons.push({ type: 'CHARGEBACK_SPIKE', severity: 'CRITICAL', value: chargebacks30d, threshold: lim, windowDays: 30 });
    }
  }

  {
    const c = cfgByKey(configs, 'payoutPendingGrowth');
    const mult = c?.multiplier ?? 3.0;
    if (payoutGrowth >= mult && payoutPendingNow > 0) {
      score += 15;
      reasons.push({ type: 'PAYOUT_PENDING_GROWTH', severity: 'WARNING', value: payoutGrowth, threshold: mult, details: { payoutPendingNow, payoutPendingAvg30d } });
    }
  }

  {
    const c = cfgByKey(configs, 'paymentVelocity1h');
    const lim = c?.limitInt ?? 10;
    if (paymentsConfirmedLastHour > lim) {
      score += 10;
      reasons.push({ type: 'PAYMENT_VELOCITY', severity: 'WARNING', value: paymentsConfirmedLastHour, threshold: lim });
    }
  }

  {
    const c = cfgByKey(configs, 'rapidPayoutPattern7d');
    const lim = c?.limitInt ?? 3;
    if (rapidPatternCount7d >= lim) {
      score += 25;
      reasons.push({ type: 'RAPID_PAYOUT_PATTERN', severity: 'CRITICAL', value: rapidPatternCount7d, threshold: lim, windowDays: 7 });
    }
  }

  if (reasons.some(r => r.severity === 'CRITICAL') && score < 50) {
    score = 50;
  }

  const prevLevel = store.riskLevel;
  const nextLevel = levelFromScore(score);

  const decision = { storeId, prevLevel, nextLevel, score, reasons };

  if (options.dryRun) {
    return decision;
  }

  await prisma.$transaction(async (tx) => {
    const payoutsFrozen = nextLevel === 'HIGH' || nextLevel === 'FROZEN';

    if (nextLevel !== prevLevel) {
      await tx.store.update({
        where: { id: storeId },
        data: {
          riskLevel: nextLevel,
          payoutsFrozen,
          riskFlag: payoutsFrozen,
          lastRiskEvaluated: new Date(),
        },
      });

      const primary = pickPrimary(reasons) || { type: 'MANUAL_SET', severity: 'INFO' };

      await tx.riskEvent.create({
        data: {
          storeId,
          type: primary.type,
          severity: primary.severity,
          prevLevel,
          nextLevel,
          scoreDelta: score,
          details: {
            reasons,
            aggregates: {
              refundRate7d,
              refundRate30d,
              refundAfterReleaseRate30d,
              chargebacks30d,
              payoutGrowth,
              paymentsConfirmedLastHour,
              rapidPatternCount7d,
            },
          },
        },
      });
    } else {
      await tx.store.update({
        where: { id: storeId },
        data: { lastRiskEvaluated: new Date() },
      });
    }
  });

  return decision;
};

module.exports = {
  computeRiskLevel,
  levelFromScore,
  countOrdersPaidOrDelivered,
  countRefunds,
  countRefundsAfterRelease,
  countChargebacksOrDisputes,
  getPayoutPendingNow,
  getPayoutPendingAvg30d,
  countPaymentsConfirmed,
  countRapidPayoutPattern,
};
