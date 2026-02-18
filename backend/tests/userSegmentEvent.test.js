jest.mock('../src/lib/prisma', () => {
  const prisma = {
    user: { update: jest.fn() },
    userSegmentEvent: { create: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  };
  return prisma;
});

const prisma = require('../src/lib/prisma');
const { applyUserSegment } = require('../src/services/userSegmentEngine');

describe('userSegmentEvent creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('writes event on segment change', async () => {
    await applyUserSegment({
      userId: 'u1',
      prevSegment: 'NEW',
      nextSegment: 'RETURNING',
      acquisitionDate: new Date(),
      firstPurchaseDate: new Date(),
      metrics: { orderCount90d: 2, orderTotal90d: 1000 },
      windowDays: 90,
      reason: 'cron_daily',
      jobRunId: 'job1',
    });

    expect(prisma.userSegmentEvent.create).toHaveBeenCalled();
    const payload = prisma.userSegmentEvent.create.mock.calls[0][0].data;
    expect(payload.fromSegment).toBe('NEW');
    expect(payload.toSegment).toBe('RETURNING');
    expect(payload.windowDays).toBe(90);
  });

  test('no event when segment unchanged', async () => {
    await applyUserSegment({
      userId: 'u1',
      prevSegment: 'RETURNING',
      nextSegment: 'RETURNING',
      acquisitionDate: new Date(),
      firstPurchaseDate: new Date(),
      metrics: { orderCount90d: 2, orderTotal90d: 1000 },
      windowDays: 90,
      reason: 'cron_daily',
      jobRunId: 'job1',
    });

    expect(prisma.userSegmentEvent.create).not.toHaveBeenCalled();
  });
});
