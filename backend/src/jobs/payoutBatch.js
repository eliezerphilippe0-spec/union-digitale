const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const config = require('../config');

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

    for (const balance of balances) {
      const store = balance.store;
      const eligibleAmountHTG = balance.availableHTG || 0;

      if (!store?.kycStatus) {
        report.skipped.push({ storeId: balance.storeId, reason: 'KYC_NOT_AVAILABLE' });
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

          await tx.financialLedger.create({
            data: {
              type: 'PAYOUT_LOCK',
              status: 'COMMITTED',
              storeId: balance.storeId,
              payoutRequestId: request.id,
              amountHTG: -fresh.availableHTG,
            },
          });

          await tx.sellerBalance.update({
            where: { storeId: balance.storeId },
            data: {
              availableHTG: { decrement: fresh.availableHTG },
              payoutPendingHTG: { increment: fresh.availableHTG },
            },
          });

          report.createdCount += 1;
          report.totalHTG += fresh.availableHTG;
        });
      } catch (error) {
        report.errors.push({ storeId: balance.storeId, error: error.message });
      }
    }

    console.log(JSON.stringify({ event: 'payout_batch', ...report }));
    return report;
  };
};

const runWeeklyPayoutBatch = buildBatchRunner(prisma, config);

module.exports = { runWeeklyPayoutBatch, buildBatchRunner, getWeekStartUTC };
