jest.mock('../src/lib/prisma', () => {
  const prisma = {
    store: { findMany: jest.fn() },
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

describe('Admin trust auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 when not authenticated', async () => {
    const res = await request(app).get('/api/admin/trust/stores');
    expect(res.statusCode).toBe(401);
  });

  test('403 when not admin', async () => {
    const res = await request(app)
      .get('/api/admin/trust/stores')
      .set('x-test-auth', 'true')
      .set('x-test-role', 'USER');
    expect(res.statusCode).toBe(403);
  });

  test('200 when admin + shape', async () => {
    prisma.store.findMany.mockResolvedValueOnce([]);
    const res = await request(app)
      .get('/api/admin/trust/stores')
      .set('x-test-auth', 'true')
      .set('x-test-role', 'ADMIN');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('items');
  });
});
