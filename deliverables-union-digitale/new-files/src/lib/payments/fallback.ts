/**
 * Payment Fallback Chain for Union Digitale
 * Attempts payments in order: MonCash -> NatCash -> Stripe -> PayPal
 * Cart is preserved at each step with automatic method switching
 */

import { MonCashService, type MonCashPaymentResponse } from './moncash';
import { NatCashService, type NatCashPaymentResponse } from './natcash';

export interface PaymentCart {
  orderId: string;
  amount: number;
  phone?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  metadata?: Record<string, unknown>;
}

export interface FallbackStep {
  method: 'MONCASH' | 'NATCASH' | 'STRIPE' | 'PAYPAL';
  status: 'pending' | 'success' | 'failed' | 'skipped';
  error?: string;
  message?: string;
  timestamp: string;
}

export interface FallbackResult {
  success: boolean;
  method: string;
  transactionId?: string;
  message: string;
  cart: PaymentCart;
  steps: FallbackStep[];
}

export type OnFallbackCallback = (step: FallbackStep, nextMethod: string) => void;

/**
 * Haitian Creole fallback messages
 */
const FALLBACK_MESSAGES: Record<string, string> = {
  MONCASH_FAILED: 'MonCash pa travay. Eseye ak Natcash...',
  NATCASH_FAILED: 'Natcash pa travay. Eseye ak Stripe...',
  STRIPE_FAILED: 'Stripe pa travay. Eseye ak PayPal...',
  MONCASH_SKIPPED: 'Yo skip MonCash paske w pa gen Digicel numwo',
  NATCASH_SKIPPED: 'Yo skip Natcash paske w pa gen Natcom numwo',
  ALL_METHODS_FAILED: 'Tout metod peman echwe. Kontakte sipò',
  PAYMENT_SUCCESS: 'Peman reyisit!',
};

export class PaymentFallbackChain {
  private monCashService: MonCashService;
  private natCashService: NatCashService;
  private steps: FallbackStep[] = [];
  private onFallback?: OnFallbackCallback;

  constructor(
    monCashService?: MonCashService,
    natCashService?: NatCashService,
    onFallback?: OnFallbackCallback
  ) {
    this.monCashService = monCashService || new MonCashService();
    this.natCashService = natCashService || new NatCashService();
    this.onFallback = onFallback;
  }

  /**
   * Main method to execute payment with fallback chain
   */
  async processPayment(
    cart: PaymentCart,
    idempotencyKey: string
  ): Promise<FallbackResult> {
    this.steps = [];

    // Try MonCash first
    const monCashResult = await this.tryMonCash(cart, idempotencyKey);
    if (monCashResult.success) {
      return monCashResult;
    }

    // Try NatCash
    const natCashResult = await this.tryNatCash(cart, idempotencyKey);
    if (natCashResult.success) {
      return natCashResult;
    }

    // Try Stripe
    const stripeResult = await this.tryStripe(cart, idempotencyKey);
    if (stripeResult.success) {
      return stripeResult;
    }

    // Try PayPal
    const payPalResult = await this.tryPayPal(cart, idempotencyKey);
    if (payPalResult.success) {
      return payPalResult;
    }

    // All methods failed
    return {
      success: false,
      method: 'NONE',
      message: FALLBACK_MESSAGES.ALL_METHODS_FAILED,
      cart,
      steps: this.steps,
    };
  }

  /**
   * Try MonCash payment
   */
  private async tryMonCash(
    cart: PaymentCart,
    idempotencyKey: string
  ): Promise<FallbackResult> {
    const step: FallbackStep = {
      method: 'MONCASH',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    try {
      // Check if phone is provided and is valid for MonCash
      if (!cart.phone) {
        step.status = 'skipped';
        step.message = FALLBACK_MESSAGES.MONCASH_SKIPPED;
        this.steps.push(step);
        return { success: false, method: 'MONCASH', message: step.message || '', cart, steps: this.steps };
      }

      step.status = 'pending';
      this.steps.push(step);

      const response = await this.monCashService.initiatePayment(
        cart.orderId,
        cart.amount,
        cart.phone,
        idempotencyKey
      );

      if (response.success) {
        step.status = 'success';
        step.message = response.message;
        this.steps[this.steps.length - 1] = step;
        return {
          success: true,
          method: 'MONCASH',
          transactionId: response.transactionId,
          message: FALLBACK_MESSAGES.PAYMENT_SUCCESS,
          cart,
          steps: this.steps,
        };
      }

      step.status = 'failed';
      step.error = response.error;
      step.message = response.message;
      this.steps[this.steps.length - 1] = step;

      // Trigger fallback callback
      if (this.onFallback) {
        this.onFallback(step, 'NATCASH');
      }

      return { success: false, method: 'MONCASH', message: FALLBACK_MESSAGES.MONCASH_FAILED, cart, steps: this.steps };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      step.message = FALLBACK_MESSAGES.MONCASH_FAILED;
      this.steps.push(step);

      if (this.onFallback) {
        this.onFallback(step, 'NATCASH');
      }

      return { success: false, method: 'MONCASH', message: FALLBACK_MESSAGES.MONCASH_FAILED, cart, steps: this.steps };
    }
  }

  /**
   * Try NatCash payment
   */
  private async tryNatCash(
    cart: PaymentCart,
    idempotencyKey: string
  ): Promise<FallbackResult> {
    const step: FallbackStep = {
      method: 'NATCASH',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    try {
      // Check if phone is provided and is valid for NatCash
      if (!cart.phone) {
        step.status = 'skipped';
        step.message = FALLBACK_MESSAGES.NATCASH_SKIPPED;
        this.steps.push(step);
        return { success: false, method: 'NATCASH', message: step.message || '', cart, steps: this.steps };
      }

      step.status = 'pending';
      this.steps.push(step);

      const response = await this.natCashService.initiatePayment(
        cart.orderId,
        cart.amount,
        cart.phone,
        idempotencyKey
      );

      if (response.success) {
        step.status = 'success';
        step.message = response.message;
        this.steps[this.steps.length - 1] = step;
        return {
          success: true,
          method: 'NATCASH',
          transactionId: response.transactionId,
          message: FALLBACK_MESSAGES.PAYMENT_SUCCESS,
          cart,
          steps: this.steps,
        };
      }

      step.status = 'failed';
      step.error = response.error;
      step.message = response.message;
      this.steps[this.steps.length - 1] = step;

      // Trigger fallback callback
      if (this.onFallback) {
        this.onFallback(step, 'STRIPE');
      }

      return { success: false, method: 'NATCASH', message: FALLBACK_MESSAGES.NATCASH_FAILED, cart, steps: this.steps };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      step.message = FALLBACK_MESSAGES.NATCASH_FAILED;
      this.steps.push(step);

      if (this.onFallback) {
        this.onFallback(step, 'STRIPE');
      }

      return { success: false, method: 'NATCASH', message: FALLBACK_MESSAGES.NATCASH_FAILED, cart, steps: this.steps };
    }
  }

  /**
   * Try Stripe payment (placeholder)
   */
  private async tryStripe(
    cart: PaymentCart,
    idempotencyKey: string
  ): Promise<FallbackResult> {
    const step: FallbackStep = {
      method: 'STRIPE',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    try {
      // Stripe implementation would go here
      // For now, this is a placeholder that can be extended
      step.status = 'failed';
      step.message = 'Stripe payment not yet implemented';
      this.steps.push(step);

      if (this.onFallback) {
        this.onFallback(step, 'PAYPAL');
      }

      return { success: false, method: 'STRIPE', message: FALLBACK_MESSAGES.STRIPE_FAILED, cart, steps: this.steps };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      this.steps.push(step);

      if (this.onFallback) {
        this.onFallback(step, 'PAYPAL');
      }

      return { success: false, method: 'STRIPE', message: FALLBACK_MESSAGES.STRIPE_FAILED, cart, steps: this.steps };
    }
  }

  /**
   * Try PayPal payment (placeholder)
   */
  private async tryPayPal(
    cart: PaymentCart,
    idempotencyKey: string
  ): Promise<FallbackResult> {
    const step: FallbackStep = {
      method: 'PAYPAL',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    try {
      // PayPal implementation would go here
      // For now, this is a placeholder that can be extended
      step.status = 'failed';
      step.message = 'PayPal payment not yet implemented';
      this.steps.push(step);

      return { success: false, method: 'PAYPAL', message: FALLBACK_MESSAGES.ALL_METHODS_FAILED, cart, steps: this.steps };
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      this.steps.push(step);

      return { success: false, method: 'PAYPAL', message: FALLBACK_MESSAGES.ALL_METHODS_FAILED, cart, steps: this.steps };
    }
  }

  /**
   * Get all fallback steps executed
   */
  getSteps(): FallbackStep[] {
    return this.steps;
  }

  /**
   * Reset steps for new transaction
   */
  reset(): void {
    this.steps = [];
  }
}

// Export singleton instance
export const paymentFallbackChain = new PaymentFallbackChain();
