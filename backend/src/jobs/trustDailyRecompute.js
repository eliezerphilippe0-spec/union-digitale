const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const config = require('../config');
const { recomputeTrustForStore } = require('../services/trustEngine');

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

const runDailyTrustRecompute = async ({ dryRun = false } = {}) => {
  const jobId = uuidv4();
  const startedAt = new Date();
  const lockKey = 'trust_daily_recompute';
  const batchSize = Number(config.TRUST_CRON_BATCH_SIZE || 200);
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
    changedTier: 0,
    changedScore: 0,
    upgraded: 0,
    downgraded: 0,
    errors: 0,
    avgScore: 0,
  };

  try {
    let cursor = null;
    const now = new Date();
    const recentThreshold = new Date(now.getTime() - 20 * 60 * 60 * 1000);
    let scoreSum = 0;

    while (true) {
      const stores = await prisma.store.findMany({
        take: batchSize,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { id: 'asc' },
        select: { id: true, trustTier: true, trustScore: true, trustUpdatedAt: true },
      });

      if (stores.length === 0) break;
      cursor = stores[stores.length - 1].id;

      await mapWithConcurrency(stores, 5, async (store) => {
        if (store.trustUpdatedAt && store.trustUpdatedAt > recentThreshold) {
          report.skippedRecent += 1;
          return;
        }

        try {
          if (dryRun) {
            const decision = await recomputeTrustForStore(store.id);
            report.evaluated += 1;
            scoreSum += decision?.nextScore || 0;
            if (decision?.changed) report.changedTier += 1;
          } else {
            const decision = await recomputeTrustForStore(store.id);
            report.evaluated += 1;
            scoreSum += decision?.nextScore || 0;
            if (decision?.changed) {
              report.changedTier += 1;
              if (decision?.tier && decision.tier !== store.trustTier) {
                if (['ELITE','TRUSTED','STANDARD','WATCH','RESTRICTED'].indexOf(decision.tier) > ['ELITE','TRUSTED','STANDARD','WATCH','RESTRICTED'].indexOf(store.trustTier)) {
                  report.upgraded += 1;
                } else {
                  report.downgraded += 1;
                }
              }
            }
          }
        } catch (error) {
          report.errors += 1;
        }
      });
    }

    report.avgScore = report.evaluated > 0 ? Math.round(scoreSum / report.evaluated) : 0;
  } finally {
    report.finishedAt = new Date().toISOString();
    await releaseJobLock({ key: lockKey, report: dryRun ? null : report });
  }

  console.log(JSON.stringify(report));
  console.log(JSON.stringify({ event: 'metric', name: 'trust_daily_eval_changed_tier_count', value: report.changedTier }));
  console.log(JSON.stringify({ event: 'metric', name: 'trust_daily_eval_errors_count', value: report.errors }));
  console.log(JSON.stringify({ event: 'metric', name: 'trust_daily_avg_score', value: report.avgScore }));

  return report;
};

const getTrustJobStatus = async (key = 'trust_daily_recompute') => {
  return prisma.jobLock.findUnique({ where: { key } });
};

module.exports = { runDailyTrustRecompute, getTrustJobStatus, acquireJobLock, releaseJobLock };
