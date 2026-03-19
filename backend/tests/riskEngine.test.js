jest.mock('../src/lib/prisma', () => {
  const prisma = {
    store: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    riskRuleConfig: {
      findMany: jest.fn(),
    },
    order: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    financialLedger: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    sellerBalance: {
      findUnique: jest.fn(),
    },
    payoutRequest: {
      count: jest.fn(),
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

describe('risk engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('refundSpike 7d -> WATCH', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 's1', riskLevel: 'NORMAL' });
    prisma.riskRuleConfig.findMany.mockResolvedValue([]);

    prisma.order.count
      .mockResolvedValueOnce(100) // orders7d
      .mockResolvedValueOnce(100) // orders30d
      .mockResolvedValueOnce(10)  // refunds7d
      .mockResolvedValueOnce(10)  // refunds30d
      .mockResolvedValueOnce(0)   // refundsAfterRelease30d
      .mockResolvedValueOnce(0);  // paymentsConfirmedLastHour

    prisma.financialLedger.count.mockResolvedValue(0);
    prisma.sellerBalance.findUnique.mockResolvedValue({ payoutPendingHTG: 0 });
    prisma.financialLedger.aggregate.mockResolvedValue({ _sum: { amountHTG: 0 } });
    prisma.order.findMany.mockResolvedValue([]);
    prisma.payoutRequest.count.mockResolvedValue(0);

    const decision = await computeRiskLevel('s1');
    expect(decision.nextLevel).toBe('WATCH');
  });

  test('refundAfterRelease -> HIGH', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 's1', riskLevel: 'NORMAL' });
    prisma.riskRuleConfig.findMany.mockResolvedValue([]);

    prisma.order.count
      .mockResolvedValueOnce(100) // orders7d
      .mockResolvedValueOnce(100) // orders30d
      .mockResolvedValueOnce(0)   // refunds7d
      .mockResolvedValueOnce(0)   // refunds30d
      .mockResolvedValueOnce(6)   // refundsAfterRelease30d
      .mockResolvedValueOnce(0);  // paymentsConfirmedLastHour

    prisma.financialLedger.count.mockResolvedValue(0);
    prisma.sellerBalance.findUnique.mockResolvedValue({ payoutPendingHTG: 0 });
    prisma.financialLedger.aggregate.mockResolvedValue({ _sum: { amountHTG: 0 } });
    prisma.order.findMany.mockResolvedValue([]);
    prisma.payoutRequest.count.mockResolvedValue(0);

    const decision = await computeRiskLevel('s1');
    expect(decision.nextLevel).toBe('HIGH');
  });

  test('rapid payout pattern -> HIGH', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 's1', riskLevel: 'NORMAL' });
    prisma.riskRuleConfig.findMany.mockResolvedValue([]);

    prisma.order.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    prisma.financialLedger.count.mockResolvedValue(0);
    prisma.sellerBalance.findUnique.mockResolvedValue({ payoutPendingHTG: 0 });
    prisma.financialLedger.aggregate.mockResolvedValue({ _sum: { amountHTG: 0 } });

    prisma.order.findMany.mockResolvedValue([
      { paidAt: new Date(Date.now() - 60 * 60 * 1000), deliveredAt: new Date() },
      { paidAt: new Date(Date.now() - 60 * 60 * 1000), deliveredAt: new Date() },
      { paidAt: new Date(Date.now() - 60 * 60 * 1000), deliveredAt: new Date() },
    ]);
    prisma.payoutRequest.count.mockResolvedValue(3);

    const decision = await computeRiskLevel('s1');
    expect(decision.nextLevel).toBe('HIGH');
  });

  test('no orders -> NORMAL', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 's1', riskLevel: 'NORMAL' });
    prisma.riskRuleConfig.findMany.mockResolvedValue([]);

    prisma.order.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    prisma.financialLedger.count.mockResolvedValue(0);
    prisma.sellerBalance.findUnique.mockResolvedValue({ payoutPendingHTG: 0 });
    prisma.financialLedger.aggregate.mockResolvedValue({ _sum: { amountHTG: 0 } });
    prisma.order.findMany.mockResolvedValue([]);
    prisma.payoutRequest.count.mockResolvedValue(0);

    const decision = await computeRiskLevel('s1');
    expect(decision.nextLevel).toBe('NORMAL');
  });
});
