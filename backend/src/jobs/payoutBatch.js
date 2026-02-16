const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const config = require('../config');
const { assertNonNegative, assertNoDuplicateLedger } = require('../utils/financeGuards');
const { computeRiskLevel } = require('../services/riskEngine');

const getWeekStartUTC = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const buildBatchRunner = (prismaClient, cfg) => {
  return async ({ dryRun = false, now = new Date() } = {}) => {
    const batchId = uuidv4();
    const weekStart = getWeekStartUTC(now);
    const minAmount = cfg.PAYOUT_MIN_HTG || 2000;

    const balances = await prismaClient.sellerBalance.findMany({
      include: { store: true },
    });

    const report = { batchId, weekStart: weekStart.toISOString(), createdCount: 0, totalHTG: 0, skipped: [], errors: [] };
    console.log(JSON.stringify({ event: 'payout_batch_start', batchId, weekStart: report.weekStart }));

    for (const balance of balances) {
      const store = balance.store;
      const eligibleAmountHTG = balance.availableHTG || 0;

      if (!store?.kycStatus) {
        report.skipped.push({ storeId: balance.storeId, reason: 'KYC_NOT_AVAILABLE' });
        continue;
      }
      if ((balance.payoutPendingHTG || 0) > 0) {
        report.skipped.push({ storeId: balance.storeId, reason: 'PAYOUT_PENDING' });
        continue;
      }
      if (store.payoutsFrozen === true) {
        report.skipped.push({ storeId: balance.storeId, reason: 'RISK_FROZEN' });
        continue;
      }
      if (store.riskFlag === true) {
        report.skipped.push({ storeId: balance.storeId, reason: 'RISK_FLAG' });
        continue;
      }
      if (store.kycStatus !== 'VERIFIED') {
        report.skipped.push({ storeId: balance.storeId, reason: 'KYC_NOT_VERIFIED' });
        continue;
      }
      if (eligibleAmountHTG < minAmount) {
        report.skipped.push({ storeId: balance.storeId, reason: 'BELOW_MIN' });
        continue;
      }

      const batchKey = `${balance.storeId}:${weekStart.toISOString()}`;

      if (dryRun) {
        report.createdCount += 1;
        report.totalHTG += eligibleAmountHTG;
        continue;
      }

      try {
        let created = false;
        await prismaClient.$transaction(async (tx) => {
          const existing = await tx.payoutRequest.findUnique({ where: { batchKey } });
          if (existing) {
            report.skipped.push({ storeId: balance.storeId, reason: 'ALREADY_CREATED' });
            return;
          }

          const fresh = await tx.sellerBalance.findUnique({ where: { storeId: balance.storeId } });
          if (!fresh || fresh.availableHTG < minAmount) {
            report.skipped.push({ storeId: balance.storeId, reason: 'BELOW_MIN' });
            return;
          }
          if ((fresh.payoutPendingHTG || 0) > 0) {
            report.skipped.push({ storeId: balance.storeId, reason: 'PAYOUT_PENDING' });
            return;
          }

          const request = await tx.payoutRequest.create({
            data: {
              storeId: balance.storeId,
              amountHTG: fresh.availableHTG,
              method: 'manual',
              status: 'REQUESTED',
              weekStart,
              batchKey,
            },
          });

          await assertNoDuplicateLedger(tx, { type: 'PAYOUT_LOCK', payoutRequestId: request.id, storeId: balance.storeId });

          await tx.financialLedger.create({
            data: {
              type: 'PAYOUT_LOCK',
              status: 'COMMITTED',
              storeId: balance.storeId,
              payoutRequestId: request.id,
              amountHTG: -fresh.availableHTG,
            },
          });

          assertNonNegative('availableHTG', (fresh.availableHTG || 0) - fresh.availableHTG, { storeId: balance.storeId });
          assertNonNegative('payoutPendingHTG', (fresh.payoutPendingHTG || 0) + fresh.availableHTG, { storeId: balance.storeId });

          await tx.sellerBalance.update({
            where: { storeId: balance.storeId },
            data: {
              availableHTG: { decrement: fresh.availableHTG },
              payoutPendingHTG: { increment: fresh.availableHTG },
            },
          });

          report.createdCount += 1;
          report.totalHTG += fresh.availableHTG;
          created = true;
        });

        if (created) {
          await computeRiskLevel(balance.storeId);
        }
      } catch (error) {
        if (error.code === 'P2002') {
          report.skipped.push({ storeId: balance.storeId, reason: 'ALREADY_CREATED' });
        } else {
          report.errors.push({ storeId: balance.storeId, error: error.message });
        }
      }
    }

    const skippedRatio = report.createdCount + report.skipped.length === 0 ? 0 : report.skipped.length / (report.createdCount + report.skipped.length);
    const skippedReasons = report.skipped.reduce((acc, item) => {
      acc[item.reason] = (acc[item.reason] || 0) + 1;
      return acc;
    }, {});

    console.log(JSON.stringify({ event: 'payout_batch', ...report, skippedRatio, skippedReasons }));

    console.log(JSON.stringify({ event: 'metric', name: 'payout_batch_totalHTG', value: report.totalHTG }));
    console.log(JSON.stringify({ event: 'metric', name: 'payout_batch_createdCount', value: report.createdCount }));
    console.log(JSON.stringify({ event: 'metric', name: 'payout_batch_skippedCount', value: report.skipped.length }));

    // basic alert hooks
    if (skippedRatio > 0.5) {
      console.log(JSON.stringify({ event: 'alert', name: 'skippedRatio', value: skippedRatio }));
    }

    return { ...report, skippedReasons };
  };
};

const runWeeklyPayoutBatch = buildBatchRunner(prisma, config);

module.exports = { runWeeklyPayoutBatch, buildBatchRunner, getWeekStartUTC };
