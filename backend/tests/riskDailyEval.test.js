jest.mock('../src/services/riskEngine', () => ({
  computeRiskLevel: jest.fn(),
}));

jest.mock('../src/lib/prisma', () => {
  const prisma = {
    jobLock: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    store: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    riskEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  };
  return prisma;
});

const prisma = require('../src/lib/prisma');
const { computeRiskLevel } = require('../src/services/riskEngine');
const { runDailyRiskEval } = require('../src/jobs/riskDailyEval');

const future = () => new Date(Date.now() + 60 * 60 * 1000);
const past = () => new Date(Date.now() - 60 * 60 * 1000);
const pastLong = () => new Date(Date.now() - 25 * 60 * 60 * 1000);

describe('riskDailyEval job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lock multi-instance -> skip', async () => {
    prisma.jobLock.findUnique.mockResolvedValue({ expiresAt: future() });

    const report = await runDailyRiskEval({ dryRun: true });
    expect(report.skipped).toBe(true);
    expect(report.reason).toBe('LOCKED');
  });

  test('skip recent evaluations', async () => {
    prisma.jobLock.findUnique.mockResolvedValue(null);
    prisma.jobLock.upsert.mockResolvedValue({ key: 'risk_daily_eval' });
    prisma.store.findMany
      .mockResolvedValueOnce([{ id: 's1', riskLevel: 'NORMAL', payoutsFrozen: false, lastRiskEvaluated: future() }])
      .mockResolvedValueOnce([]);

    const report = await runDailyRiskEval({ dryRun: true });
    expect(report.skippedRecent).toBe(1);
    expect(computeRiskLevel).not.toHaveBeenCalled();
  });

  test('auto-unfreeze expired', async () => {
    prisma.jobLock.findUnique.mockResolvedValue(null);
    prisma.jobLock.upsert.mockResolvedValue({ key: 'risk_daily_eval' });
    prisma.store.findMany
      .mockResolvedValueOnce([{ id: 's1', riskLevel: 'HIGH', payoutsFrozen: true, freezeExpiresAt: past() }])
      .mockResolvedValueOnce([]);

    const report = await runDailyRiskEval({ dryRun: false });
    expect(report.unfrozen).toBe(1);
    expect(prisma.riskEvent.create).toHaveBeenCalled();
  });

  test('report counters changed/frozen', async () => {
    prisma.jobLock.findUnique.mockResolvedValue(null);
    prisma.jobLock.upsert.mockResolvedValue({ key: 'risk_daily_eval' });
    prisma.store.findMany
      .mockResolvedValueOnce([{ id: 's1', riskLevel: 'NORMAL', payoutsFrozen: false, lastRiskEvaluated: pastLong() }])
      .mockResolvedValueOnce([]);

    computeRiskLevel.mockResolvedValue({ nextLevel: 'HIGH', reasons: [{ type: 'REFUND_SPIKE' }] });

    const report = await runDailyRiskEval({ dryRun: true });
    expect(report.changed).toBe(1);
    expect(report.frozen).toBe(1);
    expect(report.topReasons.REFUND_SPIKE).toBe(1);
  });
});
