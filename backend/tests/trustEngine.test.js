jest.mock('../src/lib/prisma', () => {
  const prisma = {
    store: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: { count: jest.fn() },
    financialLedger: { count: jest.fn() },
    riskEvent: { count: jest.fn() },
    trustEvent: { create: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  };
  return prisma;
});

const prisma = require('../src/lib/prisma');
const { computeTrustScore, applyTrustTierTransition, tierFromScore, TRUST_BENEFITS, TRUST_FORMULA_VERSION } = require('../src/services/trustEngine');

describe('trust engine', () => {
  beforeEach(() => jest.clearAllMocks());

  test('tier mapping', () => {
    expect(tierFromScore(92)).toBe('ELITE');
    expect(tierFromScore(80)).toBe('TRUSTED');
    expect(tierFromScore(55)).toBe('STANDARD');
    expect(tierFromScore(40)).toBe('WATCH');
    expect(tierFromScore(10)).toBe('RESTRICTED');
  });

  test('progressive refund penalty', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 's1', trustTier: 'STANDARD', trustScore: 100 });
    prisma.order.count
      .mockResolvedValueOnce(10) // orders7d
      .mockResolvedValueOnce(30) // orders30d
      .mockResolvedValueOnce(90) // orders90d
      .mockResolvedValueOnce(1)  // refunds7d
      .mockResolvedValueOnce(1)  // refunds30d
      .mockResolvedValueOnce(0); // refundsAfterRelease30d

    prisma.financialLedger.count.mockResolvedValue(0);
    prisma.riskEvent.count.mockResolvedValue(0);

    const res = await computeTrustScore('s1');
    expect(res.finalScore).toBeLessThanOrEqual(100);
  });

  test('low volume no bonus', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 's1', trustTier: 'STANDARD', trustScore: 100 });
    prisma.order.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    prisma.financialLedger.count.mockResolvedValue(0);
    prisma.riskEvent.count.mockResolvedValue(0);

    const res = await computeTrustScore('s1');
    expect(res.summary.bonuses.length).toBe(0);
  });

  test('downgrade immediate', async () => {
    prisma.store.findUnique.mockResolvedValue({ trustScoreStableDays: 0 });
    await applyTrustTierTransition({
      storeId: 's1',
      prevTier: 'TRUSTED',
      prevScore: 80,
      nextTier: 'WATCH',
      nextScore: 40,
      summary: {},
    });
    expect(prisma.store.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ trustTierRank: 2, trustFormulaVersion: TRUST_FORMULA_VERSION }),
    }));
  });

  test('upgrade requires stable days', async () => {
    prisma.store.findUnique.mockResolvedValue({ trustScoreStableDays: 3 });
    await applyTrustTierTransition({
      storeId: 's1',
      prevTier: 'STANDARD',
      prevScore: 60,
      nextTier: 'TRUSTED',
      nextScore: 78,
      summary: {},
    });
    expect(prisma.store.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ trustTierRank: 3, trustFormulaVersion: TRUST_FORMULA_VERSION }),
    }));
  });

  test('benefits applied', async () => {
    prisma.store.findUnique.mockResolvedValue({ trustScoreStableDays: 7 });
    await applyTrustTierTransition({
      storeId: 's1',
      prevTier: 'STANDARD',
      prevScore: 60,
      nextTier: 'TRUSTED',
      nextScore: 78,
      summary: {},
    });
    expect(prisma.store.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        ...TRUST_BENEFITS.TRUSTED,
        trustTierRank: 4,
        trustFormulaVersion: TRUST_FORMULA_VERSION,
      }),
    }));
  });
});
