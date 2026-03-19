jest.mock('../src/services/trustEngine', () => ({
  recomputeTrustForStore: jest.fn(),
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
    },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  };
  return prisma;
});

const prisma = require('../src/lib/prisma');
const { recomputeTrustForStore } = require('../src/services/trustEngine');
const { runDailyTrustRecompute } = require('../src/jobs/trustDailyRecompute');

const future = () => new Date(Date.now() + 60 * 60 * 1000);
const pastLong = () => new Date(Date.now() - 25 * 60 * 60 * 1000);

describe('trustDailyRecompute job', () => {
  beforeEach(() => jest.clearAllMocks());

  test('lock multi-instance -> skip', async () => {
    prisma.jobLock.findUnique.mockResolvedValue({ expiresAt: future() });
    const report = await runDailyTrustRecompute({ dryRun: true });
    expect(report.skipped).toBe(true);
  });

  test('skip recent evaluations', async () => {
    prisma.jobLock.findUnique.mockResolvedValue(null);
    prisma.jobLock.upsert.mockResolvedValue({ key: 'trust_daily_recompute' });
    prisma.store.findMany
      .mockResolvedValueOnce([{ id: 's1', trustTier: 'STANDARD', trustScore: 80, trustUpdatedAt: future() }])
      .mockResolvedValueOnce([]);

    const report = await runDailyTrustRecompute({ dryRun: true });
    expect(report.skippedRecent).toBe(1);
  });

  test('recompute called', async () => {
    prisma.jobLock.findUnique.mockResolvedValue(null);
    prisma.jobLock.upsert.mockResolvedValue({ key: 'trust_daily_recompute' });
    prisma.store.findMany
      .mockResolvedValueOnce([{ id: 's1', trustTier: 'STANDARD', trustScore: 80, trustUpdatedAt: pastLong() }])
      .mockResolvedValueOnce([]);

    recomputeTrustForStore.mockResolvedValue({ changed: true, tier: 'TRUSTED', nextScore: 85 });

    const report = await runDailyTrustRecompute({ dryRun: true });
    expect(report.changedTier).toBe(1);
  });
});
