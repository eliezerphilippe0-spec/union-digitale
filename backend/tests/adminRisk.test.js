jest.mock('../src/lib/prisma', () => {
  const prisma = {
    store: { findUnique: jest.fn(), update: jest.fn() },
    riskEvent: { create: jest.fn() },
    riskRuleConfig: { findMany: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
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

describe('Admin risk endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Admin can set HIGH => payoutsFrozen true + RiskEvent created', async () => {
    prisma.store.findUnique.mockResolvedValue({ id: 's1', riskLevel: 'NORMAL', payoutsFrozen: false });
    prisma.store.update.mockResolvedValue({ id: 's1', payoutsFrozen: true, updatedAt: new Date() });

    const res = await request(app)
      .patch('/api/admin/stores/s1/risk-level')
      .send({ riskLevel: 'HIGH', reason: 'trop de refunds', payoutsFrozen: true });

    expect(res.statusCode).toBe(200);
    expect(prisma.riskEvent.create).toHaveBeenCalled();
  });
});
