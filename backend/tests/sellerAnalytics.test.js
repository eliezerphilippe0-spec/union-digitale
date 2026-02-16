const { validateEvent } = require('../src/routes/sellerAnalytics');

describe('seller analytics validation', () => {
  test('rejects missing eventName', () => {
    expect(validateEvent({ eventVersion: 'v1', metadata: {} })).toBe('Invalid eventName');
  });

  test('rejects invalid metadata', () => {
    expect(validateEvent({ eventName: 'seller_trust_page_view', eventVersion: 'v1', metadata: [] })).toBe('Invalid metadata');
  });

  test('accepts valid payload', () => {
    expect(validateEvent({ eventName: 'seller_trust_page_view', eventVersion: 'v1', metadata: { path: '/seller/trust' } })).toBe(null);
  });
});
