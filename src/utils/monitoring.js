/**
 * Advanced Monitoring Configuration for Union Digitale
 * Sentry + Custom Metrics + Firebase Monitoring
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// ============================================================================
// SENTRY CONFIGURATION
// ============================================================================

export function initializeMonitoring() {
    const sentryDSN = import.meta.env.VITE_SENTRY_DSN;
    const sentryEnabled = import.meta.env.VITE_ENABLE_SENTRY === 'true';
    const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';

    if (!sentryEnabled || !sentryDSN) {
        console.warn('⚠️ Sentry monitoring is disabled');
        return;
    }

    Sentry.init({
        dsn: sentryDSN,
        environment,
        integrations: [
            new BrowserTracing(),
            new Sentry.Replay({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],

        // Performance Monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        // Error Filtering
        beforeSend(event, hint) {
            // Don't send errors from development
            if (environment === 'development') {
                console.log('Sentry event (dev):', event);
                return null;
            }

            // Filter out known non-critical errors
            const ignoredErrors = [
                'ResizeObserver loop limit exceeded',
                'Non-Error promise rejection captured',
                'Network request failed' // Too noisy
            ];

            const errorMessage = event.exception?.values?.[0]?.value || '';
            if (ignoredErrors.some(msg => errorMessage.includes(msg))) {
                return null;
            }

            return event;
        },

        // Release tracking
        release: `union-digitale@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

        // Additional context
        initialScope: {
            tags: {
                'app.name': 'Union Digitale',
                'app.region': 'Haiti'
            }
        }
    });

    console.log('✅ Sentry monitoring initialized');
}

// ============================================================================
// CUSTOM METRICS TRACKING
// ============================================================================

class MetricsCollector {
    constructor() {
        this.metrics = {
            pageViews: 0,
            apiCalls: 0,
            errors: 0,
            transactions: 0
        };
    }

    trackPageView(pageName) {
        this.metrics.pageViews++;
        Sentry.addBreadcrumb({
            category: 'navigation',
            message: `Page view: ${pageName}`,
            level: 'info'
        });
    }

    trackAPICall(endpoint, duration, success) {
        this.metrics.apiCalls++;

        Sentry.addBreadcrumb({
            category: 'api',
            message: `API call: ${endpoint}`,
            level: success ? 'info' : 'warning',
            data: {
                duration,
                success
            }
        });

        // Track slow API calls
        if (duration > 3000) {
            Sentry.captureMessage(`Slow API call: ${endpoint} (${duration}ms)`, 'warning');
        }
    }

    trackTransaction(type, amount, success) {
        this.metrics.transactions++;

        Sentry.addBreadcrumb({
            category: 'transaction',
            message: `Transaction: ${type}`,
            level: success ? 'info' : 'error',
            data: {
                type,
                amount,
                success
            }
        });

        // Alert on failed transactions
        if (!success) {
            Sentry.captureMessage(`Transaction failed: ${type} - ${amount} HTG`, 'error');
        }
    }

    trackError(error, context = {}) {
        this.metrics.errors++;

        Sentry.captureException(error, {
            contexts: {
                custom: context
            }
        });
    }

    getMetrics() {
        return { ...this.metrics };
    }
}

export const metrics = new MetricsCollector();

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export function trackPerformance(metricName, callback) {
    const startTime = performance.now();

    try {
        const result = callback();

        // Handle async functions
        if (result instanceof Promise) {
            return result.finally(() => {
                const duration = performance.now() - startTime;
                logPerformanceMetric(metricName, duration);
            });
        }

        const duration = performance.now() - startTime;
        logPerformanceMetric(metricName, duration);
        return result;

    } catch (error) {
        const duration = performance.now() - startTime;
        logPerformanceMetric(metricName, duration, false);
        throw error;
    }
}

function logPerformanceMetric(name, duration, success = true) {
    Sentry.addBreadcrumb({
        category: 'performance',
        message: `${name}: ${duration.toFixed(2)}ms`,
        level: duration > 1000 ? 'warning' : 'info',
        data: { duration, success }
    });

    // Send to Sentry as transaction
    const transaction = Sentry.startTransaction({
        name,
        op: 'function'
    });

    transaction.setMeasurement('duration', duration, 'millisecond');
    transaction.finish();
}

// ============================================================================
// USER CONTEXT TRACKING
// ============================================================================

export function setUserContext(user) {
    if (!user) {
        Sentry.setUser(null);
        return;
    }

    Sentry.setUser({
        id: user.uid,
        email: user.email,
        username: user.displayName || user.email
    });

    Sentry.setContext('user_details', {
        role: user.role || 'user',
        emailVerified: user.emailVerified || false,
        createdAt: user.metadata?.creationTime
    });
}

// ============================================================================
// FIREBASE QUOTA MONITORING
// ============================================================================

export class FirebaseQuotaMonitor {
    constructor() {
        this.quotas = {
            reads: 0,
            writes: 0,
            deletes: 0,
            storageBytes: 0
        };

        this.limits = {
            reads: 50000, // Daily limit
            writes: 20000,
            deletes: 20000,
            storageBytes: 5 * 1024 * 1024 * 1024 // 5GB
        };
    }

    trackRead(count = 1) {
        this.quotas.reads += count;
        this.checkQuota('reads');
    }

    trackWrite(count = 1) {
        this.quotas.writes += count;
        this.checkQuota('writes');
    }

    trackDelete(count = 1) {
        this.quotas.deletes += count;
        this.checkQuota('deletes');
    }

    trackStorage(bytes) {
        this.quotas.storageBytes += bytes;
        this.checkQuota('storageBytes');
    }

    checkQuota(type) {
        const usage = this.quotas[type];
        const limit = this.limits[type];
        const percentage = (usage / limit) * 100;

        // Alert at 80% usage
        if (percentage >= 80) {
            Sentry.captureMessage(
                `Firebase quota warning: ${type} at ${percentage.toFixed(1)}% (${usage}/${limit})`,
                'warning'
            );
        }

        // Critical alert at 95%
        if (percentage >= 95) {
            Sentry.captureMessage(
                `Firebase quota critical: ${type} at ${percentage.toFixed(1)}% (${usage}/${limit})`,
                'error'
            );
        }
    }

    getQuotaStatus() {
        const status = {};
        for (const [key, value] of Object.entries(this.quotas)) {
            const limit = this.limits[key];
            status[key] = {
                used: value,
                limit,
                percentage: ((value / limit) * 100).toFixed(2)
            };
        }
        return status;
    }

    resetDailyQuotas() {
        this.quotas.reads = 0;
        this.quotas.writes = 0;
        this.quotas.deletes = 0;
        console.log('📊 Firebase quotas reset');
    }
}

export const quotaMonitor = new FirebaseQuotaMonitor();

// Reset quotas daily
setInterval(() => {
    quotaMonitor.resetDailyQuotas();
}, 24 * 60 * 60 * 1000);

// ============================================================================
// SECURITY ALERTS
// ============================================================================

export function alertSuspiciousActivity(activity) {
    Sentry.captureMessage(
        `Suspicious activity detected: ${activity.type}`,
        {
            level: 'warning',
            contexts: {
                security: {
                    activityType: activity.type,
                    userId: activity.userId,
                    details: activity.details,
                    timestamp: new Date().toISOString()
                }
            },
            tags: {
                security_alert: true,
                activity_type: activity.type
            }
        }
    );
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

export async function performHealthCheck() {
    const health = {
        status: 'healthy',
        checks: {},
        timestamp: new Date().toISOString()
    };

    try {
        // Check Firebase connection
        const { db } = await import('../lib/firebase.js');
        const { getDoc, doc } = await import('firebase/firestore');

        const testDoc = await getDoc(doc(db, '_health', 'check'));
        health.checks.firebase = testDoc ? 'ok' : 'degraded';

    } catch (error) {
        health.checks.firebase = 'error';
        health.status = 'unhealthy';
        Sentry.captureException(error, {
            tags: { health_check: 'firebase' }
        });
    }

    // Check localStorage
    try {
        localStorage.setItem('_health_check', 'ok');
        localStorage.removeItem('_health_check');
        health.checks.localStorage = 'ok';
    } catch (error) {
        health.checks.localStorage = 'error';
    }

    return health;
}

// Run health check every 5 minutes
setInterval(async () => {
    const health = await performHealthCheck();
    if (health.status !== 'healthy') {
        Sentry.captureMessage('Health check failed', {
            level: 'error',
            contexts: { health }
        });
    }
}, 5 * 60 * 1000);

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    initializeMonitoring,
    metrics,
    trackPerformance,
    setUserContext,
    quotaMonitor,
    alertSuspiciousActivity,
    performHealthCheck
};
