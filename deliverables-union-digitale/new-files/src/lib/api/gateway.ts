/**
 * API Gateway
 * Routes calls to Firebase Functions OR Express backend based on domain.
 * Supports 15s timeout for slow Haitian network conditions.
 */

import { getAuth } from 'firebase/auth';

// Configuration: API routes separating Firebase vs Express domains
export const API_ROUTES = {
  // Firebase Functions (auth, notifications, storage, real-time)
  firebase: {
    domain: process.env.REACT_APP_FIREBASE_FUNCTIONS_URL || 'https://us-central1-union-digitale.cloudfunctions.net',
    services: ['auth', 'notifications', 'storage', 'realtime'],
    endpoints: {
      verifyEmail: '/verifyEmail',
      sendNotification: '/sendNotification',
      uploadFile: '/uploadFile',
    },
  },
  // Express + Prisma (payments, orders, escrow, risk engine)
  express: {
    domain: process.env.REACT_APP_EXPRESS_API_URL || 'https://api.union-digitale.ht',
    services: ['payments', 'orders', 'escrow', 'risk'],
    endpoints: {
      createPayment: '/api/payments',
      getOrders: '/api/orders',
      createEscrow: '/api/escrow',
      getRiskScore: '/api/risk/score',
    },
  },
};

/**
 * Typed API Error
 */
export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Get Firebase Auth Token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    return await user.getIdToken();
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * API Gateway Class
 * Main interface for making API calls with automatic routing and error handling
 */
export class APIGateway {
  private static readonly TIMEOUT_MS = 15000; // 15 seconds for slow Haitian network

  /**
   * Determine if endpoint should use Firebase or Express
   */
  private static getBackendForEndpoint(endpoint: string): 'firebase' | 'express' {
    // Check if endpoint is a Firebase service
    if (
      endpoint.includes('/verifyEmail') ||
      endpoint.includes('/sendNotification') ||
      endpoint.includes('/uploadFile') ||
      endpoint.includes('/auth')
    ) {
      return 'firebase';
    }
    // Default to Express for payment, order, escrow, risk endpoints
    if (
      endpoint.includes('/payments') ||
      endpoint.includes('/orders') ||
      endpoint.includes('/escrow') ||
      endpoint.includes('/risk')
    ) {
      return 'express';
    }
    // Default to express
    return 'express';
  }

  /**
   * Build full URL from endpoint
   */
  private static buildUrl(endpoint: string, backend: 'firebase' | 'express'): string {
    const config = API_ROUTES[backend];
    const isAbsolute = endpoint.startsWith('http');
    return isAbsolute ? endpoint : `${config.domain}${endpoint}`;
  }

  /**
   * Main API call method with timeout, auth, and error handling
   */
  static async call<T = any>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
    endpoint: string,
    options: {
      body?: Record<string, any>;
      headers?: Record<string, string>;
      query?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const backend = this.getBackendForEndpoint(endpoint);
    const url = this.buildUrl(endpoint, backend);
    const timeout = options.timeout || this.TIMEOUT_MS;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Inject auth token via Bearer header
    const authToken = await getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Build query string
    let finalUrl = url;
    if (options.query && Object.keys(options.query).length > 0) {
      const queryParams = new URLSearchParams(options.query);
      finalUrl = `${url}?${queryParams.toString()}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(finalUrl, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle errors
      if (!response.ok) {
        throw new APIError(
          response.status,
          data?.code || 'API_ERROR',
          data?.message || `${method} ${endpoint} failed with status ${response.status}`,
          data?.details
        );
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new APIError(
          408,
          'REQUEST_TIMEOUT',
          `Request timeout after ${timeout}ms. Network may be slow.`,
          { endpoint, backend, timeout }
        );
      }

      // Re-throw API errors
      if (error instanceof APIError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new APIError(
          0,
          'NETWORK_ERROR',
          `Network error: ${error.message}`,
          { endpoint, backend }
        );
      }

      // Generic error
      throw new APIError(
        500,
        'UNKNOWN_ERROR',
        `Unknown error: ${error instanceof Error ? error.message : 'Unknown'}`,
        { endpoint, backend }
      );
    }
  }
}

/**
 * Convenience functions for common HTTP methods
 */
export async function apiGet<T = any>(
  endpoint: string,
  options?: {
    headers?: Record<string, string>;
    query?: Record<string, string>;
    timeout?: number;
  }
): Promise<T> {
  return APIGateway.call<T>('GET', endpoint, options);
}

export async function apiPost<T = any>(
  endpoint: string,
  body?: Record<string, any>,
  options?: {
    headers?: Record<string, string>;
    query?: Record<string, string>;
    timeout?: number;
  }
): Promise<T> {
  return APIGateway.call<T>('POST', endpoint, { body, ...options });
}

export async function apiPatch<T = any>(
  endpoint: string,
  body?: Record<string, any>,
  options?: {
    headers?: Record<string, string>;
    query?: Record<string, string>;
    timeout?: number;
  }
): Promise<T> {
  return APIGateway.call<T>('PATCH', endpoint, { body, ...options });
}

export async function apiDelete<T = any>(
  endpoint: string,
  options?: {
    headers?: Record<string, string>;
    query?: Record<string, string>;
    timeout?: number;
  }
): Promise<T> {
  return APIGateway.call<T>('DELETE', endpoint, options);
}

export default APIGateway;
