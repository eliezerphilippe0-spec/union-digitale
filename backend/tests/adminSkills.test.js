jest.mock('../src/lib/prisma', () => {
  const prisma = {
    skillUsageEvent: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
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

describe('Admin skills endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('summary returns counts', async () => {
    prisma.skillUsageEvent.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2);
    prisma.skillUsageEvent.groupBy.mockResolvedValue([
      { selectedSkill: 'finance_guardian', _count: { selectedSkill: 5 } },
    ]);

    const res = await request(app)
      .get('/api/admin/skills/usage/summary?window=7d');

    expect(res.statusCode).toBe(200);
    expect(res.body.totalRuns).toBe(10);
  });

  test('events returns list', async () => {
    prisma.skillUsageEvent.findMany.mockResolvedValue([{ id: 'e1' }]);
    const res = await request(app)
      .get('/api/admin/skills/usage/events?limit=10');
    expect(res.statusCode).toBe(200);
    expect(res.body.events.length).toBe(1);
  });
});
