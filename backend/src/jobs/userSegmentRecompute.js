const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const config = require('../config');
const { recomputeUserSegmentForUser } = require('../services/userSegmentEngine');
const { acquireJobLock, releaseJobLock } = require('./trustDailyRecompute');

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

const runDailyUserSegmentRecompute = async ({ dryRun = false } = {}) => {
  const jobId = uuidv4();
  const startedAt = new Date();
  const lockKey = 'user_segment_recompute';
  const batchSize = Number(config.USER_SEGMENT_BATCH_SIZE || 500);
  const windowDays = Number(config.USER_SEGMENT_WINDOW_DAYS || 90);
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
    errors: 0,
  };

  try {
    let cursor = null;
    const now = new Date();
    const recentThreshold = new Date(now.getTime() - 20 * 60 * 60 * 1000);

    while (true) {
      const users = await prisma.user.findMany({
        take: batchSize,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { id: 'asc' },
        select: { id: true, segmentUpdatedAt: true },
      });

      if (users.length === 0) break;
      cursor = users[users.length - 1].id;

      await mapWithConcurrency(users, 5, async (user) => {
        if (user.segmentUpdatedAt && user.segmentUpdatedAt > recentThreshold) {
          report.skippedRecent += 1;
          return;
        }

        try {
          const decision = await recomputeUserSegmentForUser(user.id, { now, windowDays, reason: 'cron_daily', jobRunId: jobId });
          report.evaluated += 1;
          if (decision?.changed) report.changed += 1;
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
  console.log(JSON.stringify({ event: 'metric', name: 'user_segment_recompute_changed_count', value: report.changed }));
  console.log(JSON.stringify({ event: 'metric', name: 'user_segment_recompute_errors_count', value: report.errors }));

  return report;
};

module.exports = { runDailyUserSegmentRecompute };
