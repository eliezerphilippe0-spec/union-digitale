const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const config = require('../config');
const { computeRiskLevel } = require('../services/riskEngine');

const acquireJobLock = async ({ key, lockedBy, ttlMs }) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.jobLock.findUnique({ where: { key } });
    if (existing?.expiresAt && existing.expiresAt > now) {
      return null;
    }

    const updated = await tx.jobLock.upsert({
      where: { key },
      update: { lockedBy, lockedAt: now, expiresAt },
      create: { key, lockedBy, lockedAt: now, expiresAt },
    });

    return updated;
  });
};

const releaseJobLock = async ({ key, report }) => {
  const now = new Date();
  await prisma.jobLock.update({
    where: { key },
    data: {
      expiresAt: now,
      lockedBy: null,
      lockedAt: null,
      ...(report && { lastReport: report }),
    },
  });
};

const mapWithConcurrency = async (items, limit, fn) => {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
};

const autoUnfreezeExpired = async ({ jobId }) => {
  const now = new Date();
  const stores = await prisma.store.findMany({
    where: {
      payoutsFrozen: true,
      freezeExpiresAt: { lte: now },
    },
    select: { id: true, riskLevel: true, payoutsFrozen: true, freezeExpiresAt: true },
  });

  let unfrozen = 0;

  await mapWithConcurrency(stores, 5, async (store) => {
    await prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: store.id },
        data: {
          payoutsFrozen: false,
          riskFlag: false,
          riskLevel: 'WATCH',
          freezeExpiresAt: null,
          lastRiskEvaluated: new Date(),
        },
      });

      await tx.riskEvent.create({
        data: {
          storeId: store.id,
          type: 'AUTO_UNFREEZE',
          severity: 'INFO',
          prevLevel: store.riskLevel,
          nextLevel: 'WATCH',
          scoreDelta: 0,
          details: {
            reason: 'expiresAt passed',
            previousExpiresAt: store.freezeExpiresAt,
            jobId,
          },
        },
      });
    });

    unfrozen += 1;
  });

  return unfrozen;
};

const runDailyRiskEval = async ({ dryRun = false } = {}) => {
  const jobId = uuidv4();
  const startedAt = new Date();
  const lockKey = 'risk_daily_eval';
  const batchSize = Number(config.RISK_CRON_BATCH_SIZE || 200);
  const lock = await acquireJobLock({ key: lockKey, lockedBy: jobId, ttlMs: 30 * 60 * 1000 });

  if (!lock) {
    return { job: lockKey, jobId, skipped: true, reason: 'LOCKED' };
  }

  const report = {
    job: lockKey,
    jobId,
    startedAt: startedAt.toISOString(),
    finishedAt: null,
    evaluated: 0,
    skippedRecent: 0,
    changed: 0,
    frozen: 0,
    unfrozen: 0,
    errors: 0,
    topReasons: {},
  };

  try {
    if (!dryRun) {
      report.unfrozen = await autoUnfreezeExpired({ jobId });
    }

    let cursor = null;
    const now = new Date();
    const recentThreshold = new Date(now.getTime() - 20 * 60 * 60 * 1000);

    while (true) {
      const stores = await prisma.store.findMany({
        take: batchSize,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { id: 'asc' },
        select: {
          id: true,
          riskLevel: true,
          payoutsFrozen: true,
          lastRiskEvaluated: true,
        },
      });

      if (stores.length === 0) break;
      cursor = stores[stores.length - 1].id;

      await mapWithConcurrency(stores, 5, async (store) => {
        if (store.lastRiskEvaluated && store.lastRiskEvaluated > recentThreshold) {
          report.skippedRecent += 1;
          return;
        }

        try {
          const decision = await computeRiskLevel(store.id, { dryRun });
          report.evaluated += 1;

          if (decision?.nextLevel && decision.nextLevel !== store.riskLevel) {
            report.changed += 1;
            if ((decision.nextLevel === 'HIGH' || decision.nextLevel === 'FROZEN') && (store.riskLevel !== 'HIGH' && store.riskLevel !== 'FROZEN')) {
              report.frozen += 1;
            }
          }

          const primary = decision?.reasons?.[0];
          if (primary?.type) {
            report.topReasons[primary.type] = (report.topReasons[primary.type] || 0) + 1;
          }
        } catch (error) {
          report.errors += 1;
        }
      });
    }
  } finally {
    report.finishedAt = new Date().toISOString();
    await releaseJobLock({ key: lockKey, report: dryRun ? null : report });
  }

  console.log(JSON.stringify(report));
  console.log(JSON.stringify({ event: 'metric', name: 'risk_daily_eval_changed_count', value: report.changed }));
  console.log(JSON.stringify({ event: 'metric', name: 'risk_daily_eval_errors_count', value: report.errors }));

  return report;
};

const getJobStatus = async (key = 'risk_daily_eval') => {
  return prisma.jobLock.findUnique({ where: { key } });
};

module.exports = {
  runDailyRiskEval,
  getJobStatus,
  acquireJobLock,
  releaseJobLock,
};
