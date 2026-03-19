const prisma = require('../src/lib/prisma');

jest.mock('../src/lib/prisma', () => ({
  $transaction: jest.fn(),
  financialLedger: { findFirst: jest.fn(), create: jest.fn() },
  sellerBalance: { upsert: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  order: { findFirst: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  store: { findUnique: jest.fn(), update: jest.fn() },
  pointsLedger: { findUnique: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
  pointsWallet: { upsert: jest.fn(), findUnique: jest.fn() },
  user: { findUnique: jest.fn(), update: jest.fn() },
}));

const { __test } = require('../src/routes/payments');
const orderController = require('../src/controllers/orderController');

const makeRes = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis() });

const makeReq = (overrides = {}) => ({
  params: { id: 'order1' },
  body: {},
  user: { id: 'user1', role: 'SELLER' },
  ...overrides,
});

describe('finance hardening flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
  });

  test('Webhook PAID idempotent -> single ESCROW_HOLD + PLATFORM_EARN', async () => {
    const order = { id: 'order1', storeId: 'store1', sellerNetHTG: 1000, commissionAmountHTG: 100 };

    let callCount = 0;
    prisma.financialLedger.findFirst.mockImplementation(async () => {
      callCount += 1;
      if (callCount <= 3) return null; // first run checks
      return { id: 'existing' }; // second run existing hold
    });

    prisma.sellerBalance.upsert.mockResolvedValue({});
    prisma.sellerBalance.findUnique.mockResolvedValue({ escrowHTG: 0 });
    prisma.sellerBalance.update.mockResolvedValue({});
    prisma.financialLedger.create.mockResolvedValue({});
    prisma.order.update.mockResolvedValue({});

    await __test.applyEscrowAndCommission(order);
    await __test.applyEscrowAndCommission(order);

    expect(prisma.financialLedger.create).toHaveBeenCalledTimes(2);
  });

  test('DELIVERED idempotent -> single ESCROW_RELEASE', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 'store1' });
    prisma.order.findFirst.mockResolvedValue({ id: 'order1', storeId: 'store1' });

    prisma.order.update
      .mockResolvedValueOnce({ id: 'order1', storeId: 'store1', sellerNetHTG: 500, escrowStatus: 'HELD', userId: 'u1', pointsEarned: 0 })
      .mockResolvedValueOnce({ id: 'order1', storeId: 'store1', sellerNetHTG: 500, escrowStatus: 'RELEASED', userId: 'u1', pointsEarned: 0 });

    prisma.sellerBalance.upsert.mockResolvedValue({});
    prisma.sellerBalance.findUnique.mockResolvedValue({ escrowHTG: 500, availableHTG: 0 });
    prisma.sellerBalance.update.mockResolvedValue({});
    prisma.financialLedger.findFirst.mockResolvedValue(null);
    prisma.financialLedger.create.mockResolvedValue({});

    const req = makeReq({ body: { status: 'DELIVERED' } });
    const res = makeRes();
    const next = jest.fn();

    await orderController.updateOrderStatus(req, res, next);
    await orderController.updateOrderStatus(req, res, next);

    expect(prisma.financialLedger.create).toHaveBeenCalledTimes(2);
  });

  test('Refund before release -> REVERSAL + REFUND', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 'store1' });
    prisma.order.findFirst.mockResolvedValue({ id: 'order1', storeId: 'store1' });

    prisma.order.update.mockResolvedValueOnce({
      id: 'order1',
      storeId: 'store1',
      sellerNetHTG: 300,
      commissionAmountHTG: 50,
      escrowStatus: 'HELD',
      userId: 'u1',
      pointsEarned: 0,
    });

    prisma.sellerBalance.upsert.mockResolvedValue({});
    prisma.sellerBalance.findUnique.mockResolvedValue({ escrowHTG: 300 });
    prisma.sellerBalance.update.mockResolvedValue({});
    prisma.financialLedger.findFirst.mockResolvedValue(null);
    prisma.financialLedger.create.mockResolvedValue({});

    const req = makeReq({ body: { status: 'CANCELLED' } });
    const res = makeRes();
    const next = jest.fn();

    await orderController.updateOrderStatus(req, res, next);

    expect(prisma.financialLedger.create).toHaveBeenCalledTimes(2);
  });

  test('Refund after release blocks when insufficient balance', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 'store1' });
    prisma.order.findFirst.mockResolvedValue({ id: 'order1', storeId: 'store1' });

    prisma.order.update.mockResolvedValueOnce({
      id: 'order1',
      storeId: 'store1',
      sellerNetHTG: 1000,
      commissionAmountHTG: 0,
      escrowStatus: 'RELEASED',
      userId: 'u1',
      pointsEarned: 0,
    });

    prisma.sellerBalance.findUnique.mockResolvedValue({ availableHTG: 0 });

    const req = makeReq({ body: { status: 'REFUNDED' } });
    const res = makeRes();
    const next = jest.fn();

    await orderController.updateOrderStatus(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(prisma.sellerBalance.update).not.toHaveBeenCalled();
  });
});
