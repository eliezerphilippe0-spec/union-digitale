import * as Sentry from "@sentry/react";

/**
 * Error Tracking & Monitoring Service
 * Production-grade error handling inspired by Stripe/Airbnb
 */

const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEV = import.meta.env.DEV;

// Initialize Sentry (only in production)
if (IS_PRODUCTION && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
            new Sentry.BrowserTracing(),
            new Sentry.Replay({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
        tracesSampleRate: 0.1, // 10% of transactions
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0, // 100% of errors
        beforeSend(event, hint) {
            // Filter out sensitive data
            if (event.request) {
                delete event.request.cookies;
                delete event.request.headers;
            }
            return event;
        },
    });
}

export const errorTracking = {
    /**
     * Capture exception with context
     * @param {Error} error - The error object
     * @param {Object} context - Additional context
     */
    captureException(error, context = {}) {
        if (IS_PRODUCTION) {
            Sentry.captureException(error, {
                extra: context,
                tags: {
                    component: context.component || 'unknown',
                    action: context.action || 'unknown',
                },
            });
        } else {
            console.error('[ErrorTracking]', error, context);
        }
    },

    /**
     * Capture message (non-error events)
     * @param {string} message - The message
     * @param {string} level - Severity level
     * @param {Object} context - Additional context
     */
    captureMessage(message, level = 'info', context = {}) {
        if (IS_PRODUCTION) {
            Sentry.captureMessage(message, {
                level,
                extra: context,
            });
        } else {
            console.log(`[${level.toUpperCase()}]`, message, context);
        }
    },

    /**
     * Set user context for error tracking
     * @param {Object} user - User object
     */
    setUser(user) {
        if (IS_PRODUCTION && user) {
            Sentry.setUser({
                id: user.uid,
                email: user.email,
                role: user.role,
            });
        }
    },

    /**
     * Clear user context (on logout)
     */
    clearUser() {
        if (IS_PRODUCTION) {
            Sentry.setUser(null);
        }
    },

    /**
     * Add breadcrumb for debugging
     * @param {string} message - Breadcrumb message
     * @param {Object} data - Additional data
     */
    addBreadcrumb(message, data = {}) {
        if (IS_PRODUCTION) {
            Sentry.addBreadcrumb({
                message,
                data,
                timestamp: Date.now(),
            });
        }
    },

    /**
     * Track performance metric
     * @param {string} name - Metric name
     * @param {number} value - Metric value
     * @param {string} unit - Unit of measurement
     */
    trackPerformance(name, value, unit = 'ms') {
        if (IS_PRODUCTION) {
            Sentry.metrics.distribution(name, value, {
                unit,
                tags: { environment: import.meta.env.MODE },
            });
        } else {
            console.log(`[Performance] ${name}: ${value}${unit}`);
        }
    },

    /**
     * Start performance transaction
     * @param {string} name - Transaction name
     * @param {string} op - Operation type
     */
    startTransaction(name, op = 'http.request') {
        if (IS_PRODUCTION) {
            return Sentry.startTransaction({ name, op });
        }
        // Dev mode: simple timer
        const start = performance.now();
        return {
            finish: () => {
                const duration = performance.now() - start;
                console.log(`[Transaction] ${name}: ${duration.toFixed(2)}ms`);
            },
        };
    },
};

/**
 * Error Boundary HOC
 * Wraps components with error catching
 */
export const withErrorBoundary = (Component, fallback) => {
    if (IS_PRODUCTION) {
        return Sentry.withErrorBoundary(Component, {
            fallback,
            showDialog: false,
        });
    }
    return Component;
};

export default errorTracking;
