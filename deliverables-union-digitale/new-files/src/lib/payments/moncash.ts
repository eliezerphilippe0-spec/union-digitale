/**
 * MonCash (Digicel) Payment Integration for Haiti
 * Production-ready with retry logic and error handling in Haitian Creole
 */

import { validateMonCashPayment, detectHaitiOperator } from '../validation/payment.validation';

export interface MonCashPaymentRequest {
  orderId: string;
  amount: number;
  phone: string;
  idempotencyKey: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface MonCashPaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface WebhookPayload {
  transactionId: string;
  orderId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Haitian Creole error messages for MonCash
 */
const MONCASH_ERRORS: Record<string, string> = {
  INSUFFICIENT_BALANCE: 'Solde insifisan nan kont ou',
  OTP_EXPIRED: 'OTP ekspire. Eseye ankò',
  TIMEOUT: 'Tanpòt ekspire. Konekte internet ou epi eseye ankò',
  DOUBLE_DEBIT: 'Doub debil detekte. Kontakte sipò MonCash',
  INVALID_PHONE: 'Numèo telefòn envali',
  NETWORK_ERROR: 'Erè rezo. Eseye ankò pita',
  SERVICE_UNAVAILABLE: 'Sèvis MonCash pa disponib. Eseye ankò pita',
  INVALID_AMOUNT: 'Montan invalide',
  AUTHENTICATION_FAILED: 'Atentifikasyon echwe',
  UNKNOWN_ERROR: 'Yon erè enprevèn rive. Konekte sipò',
};

export class MonCashService {
  private apiBaseUrl: string;
  private apiKey: string;
  private webhookSecret: string;

  constructor(
    apiBaseUrl: string = process.env.MONCASH_API_URL || 'https://api.moncash.io',
    apiKey: string = process.env.MONCASH_API_KEY || '',
    webhookSecret: string = process.env.MONCASH_WEBHOOK_SECRET || ''
  ) {
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
    this.webhookSecret = webhookSecret;
  }

  /**
   * Initiates a MonCash payment with retry logic
   * @param orderId - Order identifier
   * @param amount - Payment amount in HTG
   * @param phone - Haiti phone number (509XXXXXXXX)
   * @param idempotencyKey - Unique key to prevent duplicate payments
   * @param maxRetries - Maximum number of retry attempts
   * @returns Payment response
   */
  async initiatePayment(
    orderId: string,
    amount: number,
    phone: string,
    idempotencyKey: string,
    maxRetries: number = 3
  ): Promise<MonCashPaymentResponse> {
    // Validate payment parameters
    const validation = validateMonCashPayment(phone, amount);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join('. '),
        error: 'VALIDATION_ERROR',
      };
    }

    // Make payment request with retry logic
    return this.retryWithBackoff(
      async () => {
        return this.makePaymentRequest(orderId, amount, phone, idempotencyKey);
      },
      maxRetries
    );
  }

  /**
   * Makes the actual payment request to MonCash API
   * @private
   */
  private async makePaymentRequest(
    orderId: string,
    amount: number,
    phone: string,
    idempotencyKey: string
  ): Promise<MonCashPaymentResponse> {
    try {
      const payload = {
        orderId,
        amount,
        phone,
        reference: idempotencyKey,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${this.apiBaseUrl}/api/v1/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'Idempotency-Key': idempotencyKey,
          'X-Request-ID': `${orderId}-${Date.now()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return this.handlePaymentError(response.status, errorData);
      }

      const data = await response.json();

      return {
        success: true,
        transactionId: data.transactionId,
        message: 'Peman an vini. Gade SMS konfirmasyon',
        details: {
          orderId: data.orderId,
          amount: data.amount,
          status: data.status,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: MONCASH_ERRORS.NETWORK_ERROR,
          error: error.message,
        };
      }
      return {
        success: false,
        message: MONCASH_ERRORS.UNKNOWN_ERROR,
        error: 'UNKNOWN',
      };
    }
  }

  /**
   * Handles payment errors and maps them to Creole messages
   * @private
   */
  private handlePaymentError(
    statusCode: number,
    errorData: Record<string, unknown>
  ): MonCashPaymentResponse {
    const errorCode = (errorData.error || '').toString().toUpperCase();
    let message = MONCASH_ERRORS.UNKNOWN_ERROR;

    if (statusCode === 400) {
      message = MONCASH_ERRORS.INVALID_AMOUNT;
    } else if (statusCode === 401) {
      message = MONCASH_ERRORS.AUTHENTICATION_FAILED;
    } else if (statusCode === 402) {
      message = MONCASH_ERRORS.INSUFFICIENT_BALANCE;
    } else if (statusCode === 408) {
      message = MONCASH_ERRORS.TIMEOUT;
    } else if (statusCode === 409) {
      message = MONCASH_ERRORS.DOUBLE_DEBIT;
    } else if (statusCode === 503) {
      message = MONCASH_ERRORS.SERVICE_UNAVAILABLE;
    } else if (errorCode in MONCASH_ERRORS) {
      message = MONCASH_ERRORS[errorCode];
    }

    return {
      success: false,
      message,
      error: errorCode || `HTTP_${statusCode}`,
      details: errorData,
    };
  }

  /**
   * Verifies webhook signature using HMAC-SHA256
   * @param payload - Webhook payload as string or object
   * @param signature - Signature from webhook header (X-MonCash-Signature)
   * @param secret - Webhook secret for verification
   * @returns Whether signature is valid
   */
  async verifyWebhookSignature(
    payload: string | Record<string, unknown>,
    signature: string,
    secret: string = this.webhookSecret
  ): Promise<boolean> {
    if (!signature || !secret) {
      return false;
    }

    try {
      // Convert payload to string if it's an object
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

      // Create HMAC-SHA256 signature
      const encoder = new TextEncoder();
      const data = encoder.encode(payloadString);
      const keyData = encoder.encode(secret);

      const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, [
        'sign',
      ]);
      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);

      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      const computedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Compare signatures (constant-time comparison to prevent timing attacks)
      return this.constantTimeEqual(computedSignature, signature);
    } catch (error) {
      return false;
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   * @private
   */
  private constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Retry mechanism with exponential backoff
   * Delays: 0s, 5s, 15s
   * @private
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    const backoffDelays = [0, 5000, 15000]; // milliseconds

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0 && attempt - 1 < backoffDelays.length) {
          const delay = backoffDelays[attempt - 1];
          if (delay > 0) {
            await this.sleep(delay);
          }
        }

        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        // Continue to next retry
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Utility function to sleep for specified milliseconds
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Detects the operator for a given phone number
   */
  detectOperator(phone: string): 'MONCASH' | 'NATCASH' | 'UNKNOWN' {
    const cleaned = phone.replace(/\D/g, '');
    return detectHaitiOperator(cleaned);
  }
}

// Export singleton instance for convenience
export const monCashService = new MonCashService();
