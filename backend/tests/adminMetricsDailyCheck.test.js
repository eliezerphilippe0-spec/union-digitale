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
  authenticate: (req, res, next) => {
    if (req.headers['x-test-auth'] !== 'true') {
      return res.status(401).json({ message: 'unauthorized' });
    }
    req.user = { id: 'u1', role: req.headers['x-test-role'] || 'USER' };
    return next();
  },
  optionalAuth: (_req, _res, next) => next(),
  requireAdmin: (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'forbidden' });
    }
    return next();
  },
  requireSeller: (_req, _res, next) => next(),
}));

describe('Admin metrics daily-check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 when not authenticated', async () => {
    const res = await request(app).get('/api/admin/metrics/daily-check');
    expect(res.statusCode).toBe(401);
  });

  test('403 when not admin', async () => {
    const res = await request(app)
      .get('/api/admin/metrics/daily-check')
      .set('x-test-auth', 'true')
      .set('x-test-role', 'USER');
    expect(res.statusCode).toBe(403);
  });

  test('200 with admin and shape', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{
      cartCheckoutClicks: 0,
      checkoutStarts: 0,
      checkoutCompletions: 0,
      paymentSuccessConfirmed: 0,
      paymentSuccessRedirect: 0,
      paymentWebhookReceived: 0,
      upsellVisible: 0,
      upsellAdded: 0,
      pickupOrders: 0,
      trackingSupportClicks: 0,
      sessions: 0,
    }]);
    prisma.$queryRaw.mockResolvedValueOnce([{
      cartCheckoutClicks: 0,
      checkoutStarts: 0,
      checkoutCompletions: 0,
      paymentSuccessConfirmed: 0,
      paymentSuccessRedirect: 0,
      paymentWebhookReceived: 0,
      upsellVisible: 0,
      upsellAdded: 0,
      pickupOrders: 0,
      trackingSupportClicks: 0,
      sessions: 0,
    }]);
    prisma.order.aggregate.mockResolvedValue({ _sum: { total: 0 }, _count: { _all: 0 } });

    const res = await request(app)
      .get('/api/admin/metrics/daily-check')
      .set('x-test-auth', 'true')
      .set('x-test-role', 'ADMIN');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('window');
    expect(res.body).toHaveProperty('rates');
    expect(res.body).toHaveProperty('redirectDropRate');
  });
});
