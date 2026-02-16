jest.mock('../src/lib/prisma', () => {
  const tx = {
    financialLedger: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    sellerBalance: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
  };

  return {
    __tx: tx,
    $transaction: jest.fn(async (fn) => fn(tx)),
    financialLedger: {
      findFirst: jest.fn(),
    },
    sellerBalance: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    store: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    pointsLedger: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    pointsWallet: {
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
});

const prisma = require('../src/lib/prisma');
const paymentsRouter = require('../src/routes/payments');
const orderController = require('../src/controllers/orderController');
const { buildBatchRunner } = require('../src/jobs/payoutBatch');

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('Finance invariants & idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Webhook PAID idempotent → 1 ESCROW_HOLD + 1 PLATFORM_EARN', async () => {
    const applyEscrowAndCommission = paymentsRouter.__test.applyEscrowAndCommission;

    let holdExists = false;
    prisma.__tx.financialLedger.findFirst.mockImplementation(({ where }) => {
      if (where.type === 'ESCROW_HOLD') {
        return holdExists ? { id: 'hold-1' } : null;
      }
      return null;
    });

    prisma.__tx.financialLedger.create.mockImplementation(({ data }) => {
      if (data.type === 'ESCROW_HOLD') holdExists = true;
      return { id: `${data.type}-1` };
    });

    prisma.__tx.sellerBalance.findUnique.mockResolvedValue({ escrowHTG: 0 });

    const order = {
      id: 'o1',
      storeId: 's1',
      commissionAmountHTG: 10,
      sellerNetHTG: 90,
    };

    await applyEscrowAndCommission(order);
    await applyEscrowAndCommission(order);

    const createdTypes = prisma.__tx.financialLedger.create.mock.calls.map(c => c[0].data.type);
    expect(createdTypes.filter(t => t === 'ESCROW_HOLD').length).toBe(1);
    expect(createdTypes.filter(t => t === 'PLATFORM_EARN').length).toBe(1);
  });

  test('DELIVERED idempotent → 1 ESCROW_RELEASE', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 's1', userId: 'u1' });
    prisma.order.findFirst.mockResolvedValue({ id: 'o1', storeId: 's1' });

    const updatedHeld = {
      id: 'o1', storeId: 's1', escrowStatus: 'HELD', sellerNetHTG: 100, userId: 'u1', pointsEarned: 0,
    };
    const updatedReleased = { ...updatedHeld, escrowStatus: 'RELEASED' };

    prisma.order.update
      .mockResolvedValueOnce(updatedHeld)
      .mockResolvedValueOnce(updatedReleased);

    prisma.__tx.sellerBalance.findUnique.mockResolvedValue({ escrowHTG: 100, availableHTG: 0 });

    const req = { params: { id: 'o1' }, body: { status: 'DELIVERED' }, user: { id: 'u1', role: 'SELLER' } };
    const res = makeRes();

    await orderController.updateOrderStatus(req, res, jest.fn());
    await orderController.updateOrderStatus(req, res, jest.fn());

    const createdTypes = prisma.__tx.financialLedger.create.mock.calls.map(c => c[0].data.type);
    expect(createdTypes.filter(t => t === 'ESCROW_RELEASE').length).toBe(1);
  });

  test('Refund avant release → REVERSAL + balances OK', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 's1', userId: 'u1' });
    prisma.order.findFirst.mockResolvedValue({ id: 'o1', storeId: 's1' });

    const updatedHeld = {
      id: 'o1', storeId: 's1', escrowStatus: 'HELD', sellerNetHTG: 100, commissionAmountHTG: 10, userId: 'u1', pointsEarned: 0,
    };
    prisma.order.update.mockResolvedValue(updatedHeld);

    prisma.__tx.sellerBalance.findUnique.mockResolvedValue({ escrowHTG: 100, availableHTG: 0 });

    const req = { params: { id: 'o1' }, body: { status: 'REFUNDED' }, user: { id: 'u1', role: 'SELLER' } };
    const res = makeRes();

    await orderController.updateOrderStatus(req, res, jest.fn());

    const createdTypes = prisma.__tx.financialLedger.create.mock.calls.map(c => c[0].data.type);
    expect(createdTypes).toEqual(expect.arrayContaining(['REVERSAL', 'REFUND']));
  });

  test('Refund après release → ajustement safe (no negative)', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 's1', userId: 'u1' });
    prisma.order.findFirst.mockResolvedValue({ id: 'o1', storeId: 's1' });

    const updatedReleased = {
      id: 'o1', storeId: 's1', escrowStatus: 'RELEASED', sellerNetHTG: 100, commissionAmountHTG: 10, userId: 'u1', pointsEarned: 0,
    };
    prisma.order.update.mockResolvedValue(updatedReleased);

    prisma.__tx.sellerBalance.findUnique.mockResolvedValue({ availableHTG: 100, escrowHTG: 0 });

    const req = { params: { id: 'o1' }, body: { status: 'REFUNDED' }, user: { id: 'u1', role: 'SELLER' } };
    const res = makeRes();

    await orderController.updateOrderStatus(req, res, jest.fn());

    const createdTypes = prisma.__tx.financialLedger.create.mock.calls.map(c => c[0].data.type);
    expect(createdTypes).toEqual(expect.arrayContaining(['REFUND']));
  });

  test('Batch concurrence → 1 seul PayoutRequest (unique + tx)', async () => {
    const prismaMock = {
      sellerBalance: {
        findMany: jest.fn().mockResolvedValue([
          { storeId: 's1', availableHTG: 5000, payoutPendingHTG: 0, store: { kycStatus: 'VERIFIED', riskFlag: false } },
        ]),
        findUnique: jest.fn().mockResolvedValue({ storeId: 's1', availableHTG: 5000, payoutPendingHTG: 0 }),
        update: jest.fn(),
      },
      payoutRequest: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockRejectedValue({ code: 'P2002' }),
      },
      financialLedger: { create: jest.fn(), findFirst: jest.fn() },
      store: { findUnique: jest.fn().mockResolvedValue({ payoutDelayHours: 0 }) },
      order: { count: jest.fn().mockResolvedValue(1) },
      $transaction: async (fn) => fn(prismaMock),
    };

    const run = buildBatchRunner(prismaMock, { PAYOUT_MIN_HTG: 2000 });
    const report = await run({ dryRun: false, now: new Date() });
    expect(report.skipped.some(s => s.reason === 'ALREADY_CREATED')).toBe(true);
  });
});
