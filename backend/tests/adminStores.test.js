jest.mock('../src/lib/prisma', () => {
  const prisma = {
    store: { update: jest.fn() },
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

describe('Admin stores verify endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Admin can verify a store', async () => {
    prisma.store.update.mockResolvedValue({ id: 's1', isVerifiedSeller: true });

    const res = await request(app)
      .post('/api/admin/stores/s1/verify')
      .send({ reason: 'KYC ok' });

    expect(res.statusCode).toBe(200);
    expect(prisma.store.update).toHaveBeenCalled();
  });

  test('Admin can unverify a store', async () => {
    prisma.store.update.mockResolvedValue({ id: 's1', isVerifiedSeller: false });

    const res = await request(app)
      .post('/api/admin/stores/s1/unverify')
      .send({ reason: 'Doc expired' });

    expect(res.statusCode).toBe(200);
    expect(prisma.store.update).toHaveBeenCalled();
  });
});
