/**
 * PaymentRateLimiter
 * Max 3 attempts per session, 60s cooldown
 * Uses sessionStorage to persist across component remounts
 * Creole error messages for Haiti users
 */

const STORAGE_KEY = 'ud_payment_attempts';
const MAX_ATTEMPTS = 3;
const COOLDOWN_MS = 60_000; // 60 seconds

interface RateLimitState {
  attempts: number;
  firstAttemptAt: number | null;
  blockedUntil: number | null;
}

function getState(): RateLimitState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempts: 0, firstAttemptAt: null, blockedUntil: null };
    return JSON.parse(raw) as RateLimitState;
  } catch {
    return { attempts: 0, firstAttemptAt: null, blockedUntil: null };
  }
}

function saveState(state: RateLimitState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage unavailable (private mode) — degrade gracefully
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  cooldownSeconds: number;
  message: string;
}

export class PaymentRateLimiter {
  /**
   * Check if a new payment attempt is allowed.
   * Call BEFORE initiating any payment.
   */
  static check(): RateLimitResult {
    const now = Date.now();
    const state = getState();

    // Still in cooldown window?
    if (state.blockedUntil && now < state.blockedUntil) {
      const cooldownSeconds = Math.ceil((state.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        cooldownSeconds,
        message: `Ou te eseye twòp fwa. Tann ${cooldownSeconds} segonn epi eseye ankò.`,
      };
    }

    // Cooldown expired — reset state
    if (state.blockedUntil && now >= state.blockedUntil) {
      const fresh: RateLimitState = { attempts: 0, firstAttemptAt: null, blockedUntil: null };
      saveState(fresh);
      return {
        allowed: true,
        remainingAttempts: MAX_ATTEMPTS,
        cooldownSeconds: 0,
        message: '',
      };
    }

    const remaining = MAX_ATTEMPTS - state.attempts;
    return {
      allowed: remaining > 0,
      remainingAttempts: Math.max(0, remaining),
      cooldownSeconds: 0,
      message:
        remaining <= 0
          ? 'Trop eseye. Tann 1 minit epi eseye ankò.'
          : '',
    };
  }

  /**
   * Record a payment attempt.
   * Call AFTER user submits the payment form.
   * Returns the updated RateLimitResult.
   */
  static record(): RateLimitResult {
    const now = Date.now();
    const state = getState();

    // Already blocked
    if (state.blockedUntil && now < state.blockedUntil) {
      return PaymentRateLimiter.check();
    }

    const newAttempts = state.attempts + 1;
    const newState: RateLimitState = {
      attempts: newAttempts,
      firstAttemptAt: state.firstAttemptAt ?? now,
      blockedUntil: newAttempts >= MAX_ATTEMPTS ? now + COOLDOWN_MS : null,
    };

    saveState(newState);

    if (newAttempts >= MAX_ATTEMPTS) {
      return {
        allowed: false,
        remainingAttempts: 0,
        cooldownSeconds: Math.ceil(COOLDOWN_MS / 1000),
        message: `Trop eseye. Tann ${Math.ceil(COOLDOWN_MS / 1000)} segonn epi eseye ankò.`,
      };
    }

    const remaining = MAX_ATTEMPTS - newAttempts;
    return {
      allowed: true,
      remainingAttempts: remaining,
      cooldownSeconds: 0,
      message:
        remaining === 1
          ? 'Atansyon: dènyè chans ou anvan yon ti poz.'
          : '',
    };
  }

  /**
   * Reset rate limit on successful payment.
   */
  static reset(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Get remaining cooldown in seconds (0 if not blocked).
   */
  static getCooldownSeconds(): number {
    const state = getState();
    if (!state.blockedUntil) return 0;
    const remaining = state.blockedUntil - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }
}

export default PaymentRateLimiter;
