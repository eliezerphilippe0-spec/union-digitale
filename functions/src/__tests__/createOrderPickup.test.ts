import { createOrder } from '../createOrder';
import * as admin from 'firebase-admin';

jest.mock('firebase-admin', () => {
  const firestore = () => ({
    collection: () => ({ doc: () => ({ id: 'o1', set: jest.fn(), update: jest.fn() }) }),
    doc: () => ({ get: jest.fn() }),
    batch: () => ({ set: jest.fn(), update: jest.fn(), commit: jest.fn() }),
  });
  return { firestore, initializeApp: jest.fn(), apps: [], FieldValue: { serverTimestamp: jest.fn() } };
});

describe('createOrder pickup', () => {
  it('rejects invalid hub', async () => {
    const get = jest.fn().mockResolvedValue({ exists: false });
    (admin.firestore().doc as any).mockReturnValueOnce({ get });
    await expect(createOrder({ data: { items: [{ productId: 'p1' }], shippingMethod: 'pickup', pickupHubId: 'x' }, auth: { uid: 'u1' } } as any))
      .rejects.toThrow();
  });
});
