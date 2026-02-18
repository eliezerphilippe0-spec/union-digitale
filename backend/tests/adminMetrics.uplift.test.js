jest.mock('../src/lib/prisma', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    order: { aggregate: jest.fn() },
  };
  return prisma;
});

jest.mock('../src/services/metrics/verifiedUpliftFirestore', () => ({
  computeVerifiedSellerUpliftFirestore: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { computeVerifiedSellerUpliftFirestore } = require('../src/services/metrics/verifiedUpliftFirestore');

jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'admin1', role: 'ADMIN', email: 'admin@uniondigitale.ht' };
    next();
  },
  optionalAuth: (_req, _res, next) => next(),
  requireAdmin: (_req, _res, next) => next(),
  requireSeller: (_req, _res, next) => next(),
}));

describe('Admin metrics uplift', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns FIRESTORE_DISABLED when uplift returns disabled', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ cartCheckoutClicks: 0, checkoutStarts: 0, checkoutCompletions: 0, paymentSuccessConfirmed: 0, paymentSuccessRedirect: 0, upsellVisible: 0, upsellAdded: 0, pickupOrders: 0, trustVisible: 0, trustClick: 0, trackingSupportClicks: 0, sessions: 0 }]);
    prisma.order.aggregate.mockResolvedValueOnce({ _sum: { total: 0 }, _count: { _all: 0 } });
    computeVerifiedSellerUpliftFirestore.mockResolvedValueOnce({ status: 'FIRESTORE_DISABLED', data: null });

    const res = await request(app).get('/api/admin/metrics/summary?window=7d');

    expect(res.statusCode).toBe(200);
    expect(res.body.verifiedUpliftStatus).toBe('FIRESTORE_DISABLED');
    expect(res.body.verifiedSellerUplift).toBeNull();
  });
});


  test('returns SNAPSHOT status when snapshot present', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ cartCheckoutClicks: 0, checkoutStarts: 0, checkoutCompletions: 0, paymentSuccessConfirmed: 0, paymentSuccessRedirect: 0, upsellVisible: 0, upsellAdded: 0, pickupOrders: 0, trustVisible: 0, trustClick: 0, trackingSupportClicks: 0, sessions: 0 }]);
    prisma.order.aggregate.mockResolvedValueOnce({ _sum: { total: 0 }, _count: { _all: 0 } });
    computeVerifiedSellerUpliftFirestore.mockResolvedValueOnce({ status: 'SNAPSHOT', data: { status: 'SNAPSHOT', counts: { verified: { subs: 1, converted: 1, conversionRate: 1 }, nonVerified: { subs: 1, converted: 0, conversionRate: 0 } }, uplift: { conversionDelta: 1, conversionLiftPct: null } } });

    const res = await request(app).get('/api/admin/metrics/summary?window=7d');

    expect(res.statusCode).toBe(200);
    expect(res.body.verifiedUpliftStatus).toBe('SNAPSHOT');
    expect(res.body.verifiedSellerUplift).toHaveProperty('counts');
  });
