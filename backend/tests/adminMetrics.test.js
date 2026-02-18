jest.mock('../src/lib/prisma', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    order: { aggregate: jest.fn() },
  };
  return prisma;
});

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'admin1', role: 'ADMIN', email: 'admin@uniondigitale.ht' };
    next();
  },
  optionalAuth: (_req, _res, next) => next(),
  requireAdmin: (_req, _res, next) => next(),
  requireSeller: (_req, _res, next) => next(),
}));

describe('Admin metrics summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns zeros without NaN for empty window', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{
      cartCheckoutClicks: 0,
      checkoutStarts: 0,
      checkoutCompletions: 0,
      paymentSuccessConfirmed: 0,
      paymentSuccessRedirect: 0,
      upsellVisible: 0,
      upsellAdded: 0,
      pickupOrders: 0,
      trustVisible: 0,
      trustClick: 0,
      trackingSupportClicks: 0,
      sessions: 0,
    }]);
    prisma.order.aggregate.mockResolvedValueOnce({ _sum: { total: 0 }, _count: { _all: 0 } });

    const res = await request(app)
      .get('/api/admin/metrics/summary?window=7d');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('redirectDropRate', 0);
    expect(res.body).toHaveProperty('upsellAttachRate', 0);
    expect(res.body).toHaveProperty('pickupAdoptionRate', 0);
    expect(res.body).toHaveProperty('trustBadgeCTR', 0);
    expect(res.body).toHaveProperty('trackingTicketRate', 0);
    expect(res.body.rates.cartToCheckout).toBe(0);
  });
});
