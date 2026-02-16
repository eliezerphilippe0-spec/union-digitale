const { buildBatchRunner, getWeekStartUTC } = require('../payoutBatch');

describe('payout batch', () => {
  test('week start is monday UTC', () => {
    const date = new Date(Date.UTC(2026, 1, 18)); // Wed
    const start = getWeekStartUTC(date);
    expect(start.getUTCDay()).toBe(1);
    expect(start.getUTCHours()).toBe(0);
  });

  test('dry run skips below min', async () => {
    const prisma = {
      sellerBalance: {
        findMany: jest.fn().mockResolvedValue([
          { storeId: 's1', availableHTG: 1500, payoutPendingHTG: 0, store: { kycStatus: 'VERIFIED', riskFlag: false } },
        ]),
      },
    };
    const run = buildBatchRunner(prisma, { PAYOUT_MIN_HTG: 2000 });
    const report = await run({ dryRun: true, now: new Date() });
    expect(report.createdCount).toBe(0);
    expect(report.skipped[0].reason).toBe('BELOW_MIN');
  });

  test('double run same week skips existing', async () => {
    const prisma = {
      sellerBalance: {
        findMany: jest.fn().mockResolvedValue([
          { storeId: 's1', availableHTG: 5000, payoutPendingHTG: 0, store: { kycStatus: 'VERIFIED', riskFlag: false } },
        ]),
        findUnique: jest.fn().mockResolvedValue({ storeId: 's1', availableHTG: 5000, payoutPendingHTG: 0 }),
        update: jest.fn(),
      },
      payoutRequest: {
        findUnique: jest.fn().mockResolvedValue({ id: 'existing' }),
        create: jest.fn(),
      },
      financialLedger: { create: jest.fn() },
      $transaction: async (fn) => fn(prisma),
    };

    const run = buildBatchRunner(prisma, { PAYOUT_MIN_HTG: 2000 });
    const report = await run({ dryRun: false, now: new Date() });
    expect(report.skipped.some(s => s.reason === 'ALREADY_CREATED')).toBe(true);
  });
});
