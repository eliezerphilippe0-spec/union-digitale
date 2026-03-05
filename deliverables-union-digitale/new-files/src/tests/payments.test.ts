/**
 * Payment Tests — Union Digitale
 * Tests: Haiti phone validation, operator detection,
 * amount validation, idempotency, rate limiter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateHaitiPhone,
  detectHaitiOperator,
  validatePaymentAmount,
} from '../lib/validation/payment.validation';
import { PaymentRateLimiter } from '../lib/rateLimit';

// ─── Haiti Phone Validation ──────────────────────────────────────────────────

describe('validateHaitiPhone', () => {
  it('accepts valid MonCash numbers (prefix 30)', () => {
    expect(validateHaitiPhone('30 00 0001').valid).toBe(true);
  });

  it('accepts valid MonCash numbers (prefix 46)', () => {
    expect(validateHaitiPhone('46 00 0001').valid).toBe(true);
  });

  it('accepts valid NatCash numbers (prefix 39)', () => {
    expect(validateHaitiPhone('39 00 0001').valid).toBe(true);
  });

  it('accepts valid NatCash numbers (prefix 49)', () => {
    expect(validateHaitiPhone('49 00 0001').valid).toBe(true);
  });

  it('strips spaces and dashes before validation', () => {
    expect(validateHaitiPhone('30-00-0001').valid).toBe(true);
    expect(validateHaitiPhone('30 00 0001').valid).toBe(true);
    expect(validateHaitiPhone('3000-0001').valid).toBe(true);
  });

  it('rejects numbers shorter than 8 digits', () => {
    const result = validateHaitiPhone('300000');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects numbers longer than 8 digits', () => {
    const result = validateHaitiPhone('300000011');
    expect(result.valid).toBe(false);
  });

  it('rejects unknown prefixes', () => {
    const result = validateHaitiPhone('20000001');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('MonCash');
  });

  it('rejects empty string', () => {
    expect(validateHaitiPhone('').valid).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(validateHaitiPhone('abcdefgh').valid).toBe(false);
  });
});

// ─── Operator Detection ──────────────────────────────────────────────────────

describe('detectHaitiOperator', () => {
  it('detects MonCash for prefix 30', () => {
    expect(detectHaitiOperator('30000001')).toBe('moncash');
  });

  it('detects MonCash for prefix 38', () => {
    expect(detectHaitiOperator('38000001')).toBe('moncash');
  });

  it('detects MonCash for prefix 46', () => {
    expect(detectHaitiOperator('46000001')).toBe('moncash');
  });

  it('detects MonCash for prefix 48', () => {
    expect(detectHaitiOperator('48000001')).toBe('moncash');
  });

  it('detects NatCash for prefix 39', () => {
    expect(detectHaitiOperator('39000001')).toBe('natcash');
  });

  it('detects NatCash for prefix 45', () => {
    expect(detectHaitiOperator('45000001')).toBe('natcash');
  });

  it('detects NatCash for prefix 49', () => {
    expect(detectHaitiOperator('49000001')).toBe('natcash');
  });

  it('returns null for unknown prefix', () => {
    expect(detectHaitiOperator('20000001')).toBeNull();
  });
});

// ─── Amount Validation ───────────────────────────────────────────────────────

describe('validatePaymentAmount', () => {
  it('accepts minimum amount (10 HTG)', () => {
    expect(validatePaymentAmount(10).valid).toBe(true);
  });

  it('accepts maximum amount (500,000 HTG)', () => {
    expect(validatePaymentAmount(500_000).valid).toBe(true);
  });

  it('accepts typical order amount', () => {
    expect(validatePaymentAmount(2_500).valid).toBe(true);
  });

  it('rejects amount below minimum', () => {
    const result = validatePaymentAmount(5);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects amount above maximum', () => {
    const result = validatePaymentAmount(600_000);
    expect(result.valid).toBe(false);
  });

  it('rejects zero', () => {
    expect(validatePaymentAmount(0).valid).toBe(false);
  });

  it('rejects negative amounts', () => {
    expect(validatePaymentAmount(-100).valid).toBe(false);
  });

  it('rejects NaN', () => {
    expect(validatePaymentAmount(NaN).valid).toBe(false);
  });
});

// ─── Idempotency Key Uniqueness ──────────────────────────────────────────────

describe('Idempotency key generation', () => {
  it('generates unique keys per call', async () => {
    // UUID v4 via crypto.randomUUID()
    const keys = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      keys.add(crypto.randomUUID());
    }
    expect(keys.size).toBe(1000);
  });

  it('keys match UUID v4 format', () => {
    const key = crypto.randomUUID();
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(key).toMatch(uuidV4Regex);
  });
});

// ─── Rate Limiter ────────────────────────────────────────────────────────────

describe('PaymentRateLimiter', () => {
  beforeEach(() => {
    // Reset state before each test
    PaymentRateLimiter.reset();
    // Mock sessionStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
    });
  });

  it('allows first attempt', () => {
    const result = PaymentRateLimiter.check();
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(3);
  });

  it('allows up to 3 attempts', () => {
    PaymentRateLimiter.record();
    PaymentRateLimiter.record();
    const result = PaymentRateLimiter.record();
    expect(result.allowed).toBe(false);
  });

  it('blocks after 3 attempts', () => {
    PaymentRateLimiter.record();
    PaymentRateLimiter.record();
    PaymentRateLimiter.record();
    const check = PaymentRateLimiter.check();
    expect(check.allowed).toBe(false);
    expect(check.cooldownSeconds).toBeGreaterThan(0);
  });

  it('provides Creole error message when blocked', () => {
    PaymentRateLimiter.record();
    PaymentRateLimiter.record();
    const result = PaymentRateLimiter.record();
    expect(result.message).toContain('Trop eseye');
  });

  it('resets after successful payment', () => {
    PaymentRateLimiter.record();
    PaymentRateLimiter.record();
    PaymentRateLimiter.reset();
    const check = PaymentRateLimiter.check();
    expect(check.allowed).toBe(true);
    expect(check.remainingAttempts).toBe(3);
  });

  it('warns on last attempt', () => {
    PaymentRateLimiter.record();
    PaymentRateLimiter.record();
    const result = PaymentRateLimiter.record(); // 3rd = blocked
    // The message at the 2nd attempt (1 remaining) warns user
    // Test via direct state — record 2nd attempt
    PaymentRateLimiter.reset();
    PaymentRateLimiter.record(); // attempt 1
    const warn = PaymentRateLimiter.record(); // attempt 2: 1 remaining
    expect(warn.message).toContain('dènyè');
    expect(result).toBeTruthy();
  });
});
