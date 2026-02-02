/**
 * Rate Limiting & Security Enhancements
 * Protects API endpoints from abuse
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';

const db = admin.firestore();

// Rate limit secrets (optional, can use Firestore)
const redisUrl = defineSecret('UPSTASH_REDIS_URL');
const redisToken = defineSecret('UPSTASH_REDIS_TOKEN');

/**
 * Rate limit configuration by action type
 */
const RATE_LIMITS = {
  login: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute
  signup: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
  order: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  review: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 per hour
  message: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
  search: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
  api: { windowMs: 60 * 1000, maxRequests: 60 } // 60 per minute (default)
};

type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Check rate limit for an action
 */
export async function checkRateLimit(
  userId: string,
  action: RateLimitAction,
  ip?: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const config = RATE_LIMITS[action] || RATE_LIMITS.api;
  const identifier = userId || ip || 'anonymous';
  const key = `ratelimit:${action}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Use Firestore for rate limiting (could be replaced with Redis)
  const rateLimitRef = db.collection('rate_limits').doc(key);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      const data = doc.data();

      // Clean old requests
      const requests: number[] = (data?.requests || []).filter(
        (time: number) => time > windowStart
      );

      // Check if limit exceeded
      if (requests.length >= config.maxRequests) {
        const oldestRequest = Math.min(...requests);
        const resetAt = oldestRequest + config.windowMs;

        return {
          allowed: false,
          remaining: 0,
          resetAt
        };
      }

      // Add current request
      requests.push(now);

      transaction.set(rateLimitRef, {
        requests,
        lastRequest: now,
        action,
        identifier
      });

      return {
        allowed: true,
        remaining: config.maxRequests - requests.length,
        resetAt: now + config.windowMs
      };
    });

    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);

    // SECURITY: Fail-closed for critical operations to prevent abuse
    const criticalActions: RateLimitAction[] = ['login', 'signup', 'order'];
    if (criticalActions.includes(action)) {
      console.warn(`Rate limiting failed for critical action: ${action}. Denying request.`);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + config.windowMs
      };
    }

    // Fail-open for non-critical operations (search, message, etc.)
    console.warn(`Rate limiting failed for non-critical action: ${action}. Allowing request.`);
    return { allowed: true, remaining: config.maxRequests, resetAt: now + config.windowMs };
  }
}

/**
 * Rate-limited wrapper for Cloud Functions
 */
export function withRateLimit(
  action: RateLimitAction,
  handler: (request: any) => Promise<any>
) {
  return async (request: any) => {
    const userId = request.auth?.uid;
    const ip = request.rawRequest?.ip;

    const rateLimit = await checkRateLimit(userId, action, ip);

    if (!rateLimit.allowed) {
      throw new HttpsError(
        'resource-exhausted',
        `Trop de requêtes. Réessayez dans ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} secondes.`
      );
    }

    return handler(request);
  };
}

/**
 * Input sanitization helpers
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (Haitian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+509[0-9]{8}$/;
  return phoneRegex.test(phone);
}

/**
 * Check for suspicious activity
 */
export const checkSuspiciousActivity = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { action, metadata } = data;

    // Check for suspicious patterns
    const suspiciousPatterns = [
      // Multiple failed logins
      async () => {
        const recentFailures = await db
          .collection('audit_logs')
          .where('userId', '==', auth.uid)
          .where('action', '==', 'login_failed')
          .where('timestamp', '>', admin.firestore.Timestamp.fromMillis(Date.now() - 3600000))
          .get();
        return recentFailures.size > 5;
      },
      // Unusual order amounts
      async () => {
        if (action === 'order' && metadata?.amount) {
          const userOrders = await db
            .collection('orders')
            .where('userId', '==', auth.uid)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

          if (userOrders.size > 0) {
            const avgAmount = userOrders.docs.reduce(
              (sum, doc) => sum + (doc.data().total || 0), 0
            ) / userOrders.size;

            // Flag if order is 5x higher than average
            return metadata.amount > avgAmount * 5;
          }
        }
        return false;
      },
      // Multiple orders in short time
      async () => {
        if (action === 'order') {
          const recentOrders = await db
            .collection('orders')
            .where('userId', '==', auth.uid)
            .where('createdAt', '>', admin.firestore.Timestamp.fromMillis(Date.now() - 300000))
            .get();
          return recentOrders.size > 3;
        }
        return false;
      }
    ];

    let isSuspicious = false;
    for (const check of suspiciousPatterns) {
      if (await check()) {
        isSuspicious = true;
        break;
      }
    }

    if (isSuspicious) {
      // Log suspicious activity
      await db.collection('security_alerts').add({
        userId: auth.uid,
        action,
        metadata,
        severity: 'medium',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.warn(`⚠️ Suspicious activity detected: ${auth.uid} - ${action}`);
    }

    return { suspicious: isSuspicious };
  }
);

/**
 * Cleanup old rate limit records (runs daily)
 */
export async function cleanupRateLimits() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

  const oldRecords = await db
    .collection('rate_limits')
    .where('lastRequest', '<', cutoff)
    .limit(500)
    .get();

  const batch = db.batch();
  oldRecords.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  console.log(`🧹 Cleaned up ${oldRecords.size} old rate limit records`);
}
