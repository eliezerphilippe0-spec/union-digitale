jest.mock('../src/lib/prisma', () => ({
  webhookEvent: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  order: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(async (fn) => fn({
    order: { update: jest.fn() },
  })),
}));

jest.mock('../src/services/natcashService', () => ({
  verifyWebhook: jest.fn(() => true),
}));

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

describe('Webhook idempotency guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('first natcash webhook processes once', async () => {
    prisma.webhookEvent.create.mockResolvedValue({ id: 'wh1' });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.order.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/payments/callback/natcash')
      .send({ paymentId: 'pay-1', status: 'completed', transactionId: 'tx-1', orderId: 'ord-1' });

    expect(res.statusCode).toBe(200);
    expect(prisma.webhookEvent.create).toHaveBeenCalledTimes(1);
  });

  test('duplicate natcash webhook is ignored', async () => {
    prisma.webhookEvent.create.mockRejectedValue({ code: 'P2002' });

    const res = await request(app)
      .post('/api/payments/callback/natcash')
      .send({ paymentId: 'pay-1', status: 'completed', transactionId: 'tx-1', orderId: 'ord-1' });

    expect(res.statusCode).toBe(200);
    expect(prisma.order.findFirst).not.toHaveBeenCalled();
  });
});
