/**
 * Sentry Configuration for Union Digitale
 * Modern Sentry SDK v8+ compatible
 */

import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for error tracking
 * Only runs in production or when explicitly enabled
 */
export const initSentry = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;
    const enableSentry = import.meta.env.VITE_ENABLE_SENTRY === 'true';

    // Don't initialize if DSN is missing or Sentry is disabled
    if (!dsn || !enableSentry) {
        console.log('Sentry disabled or DSN missing');
        return;
    }

    Sentry.init({
        dsn,
        environment,

        // Sample rate for performance monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Sample rate for error tracking
        sampleRate: 1.0,

        // Release tracking
        release: `union-digitale@${import.meta.env.VITE_APP_VERSION || '0.0.0'}`,

        // Filter out sensitive data
        beforeSend(event) {
            // Don't send events in development unless explicitly enabled
            if (environment === 'development' && !enableSentry) {
                return null;
            }

            // Filter out sensitive information
            if (event.request) {
                delete event.request.headers?.['Authorization'];
                delete event.request.headers?.['Cookie'];
            }

            return event;
        },

        // Ignore certain errors
        ignoreErrors: [
            'top.GLOBALS',
            'chrome-extension://',
            'moz-extension://',
            'NetworkError',
            'Failed to fetch',
            'Load failed',
            'auth/popup-closed-by-user',
            'auth/cancelled-popup-request',
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
        ],

        // Don't report errors from certain URLs
        denyUrls: [
            /extensions\//i,
            /^chrome:\/\//i,
            /^moz-extension:\/\//i,
        ],

        // Add context to all events
        initialScope: {
            tags: {
                platform: 'web',
                app: 'union-digitale',
            },
        },

        // Enable debug mode in development
        debug: environment === 'development',

        // Attach stack traces to messages
        attachStacktrace: true,

        // Maximum breadcrumbs to keep
        maxBreadcrumbs: 50,
    });

    console.log(`Sentry initialized for ${environment}`);
};

/**
 * Set user context for Sentry
 */
export const setSentryUser = (user) => {
    if (!user) {
        Sentry.setUser(null);
        return;
    }

    Sentry.setUser({
        id: user.uid,
        email: user.email,
        username: user.displayName,
    });
};

/**
 * Clear user context
 */
export const clearSentryUser = () => {
    Sentry.setUser(null);
};

/**
 * Capture exception with context
 */
export const captureException = (error, context = {}) => {
    Sentry.withScope((scope) => {
        if (context.tags) {
            Object.entries(context.tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });
        }

        if (context.extra) {
            Object.entries(context.extra).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }

        if (context.level) {
            scope.setLevel(context.level);
        }

        Sentry.captureException(error);
    });
};

/**
 * Capture message with context
 */
export const captureMessage = (message, level = 'info', context = {}) => {
    Sentry.withScope((scope) => {
        scope.setLevel(level);

        if (context.tags) {
            Object.entries(context.tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });
        }

        if (context.extra) {
            Object.entries(context.extra).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }

        Sentry.captureMessage(message);
    });
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (breadcrumb) => {
    Sentry.addBreadcrumb({
        timestamp: Date.now() / 1000,
        ...breadcrumb,
    });
};

export default {
    initSentry,
    setSentryUser,
    clearSentryUser,
    captureException,
    captureMessage,
    addBreadcrumb,
};
