/**
 * Sentry Configuration for Union Digitale
 * Inspired by: Vercel, Stripe, Shopify error tracking
 * 
 * Features:
 * - Error tracking and monitoring
 * - Performance monitoring
 * - User feedback
 * - Release tracking
 * - Source maps support
 */

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

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

        // Performance Monitoring
        integrations: [
            new BrowserTracing({
                // Track navigation and route changes
                routingInstrumentation: Sentry.reactRouterV6Instrumentation(
                    React.useEffect,
                    useLocation,
                    useNavigationType,
                    createRoutesFromChildren,
                    matchRoutes
                ),
            }),
        ],

        // Sample rate for performance monitoring
        // 1.0 = 100% of transactions, 0.1 = 10%
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Sample rate for error tracking
        // 1.0 = 100% of errors
        sampleRate: 1.0,

        // Release tracking
        release: `union-digitale@${import.meta.env.VITE_APP_VERSION || '0.0.0'}`,

        // Filter out sensitive data
        beforeSend(event, hint) {
            // Don't send events in development unless explicitly enabled
            if (environment === 'development' && !enableSentry) {
                return null;
            }

            // Filter out sensitive information
            if (event.request) {
                // Remove sensitive headers
                delete event.request.headers?.['Authorization'];
                delete event.request.headers?.['Cookie'];

                // Remove sensitive query parameters
                if (event.request.query_string) {
                    event.request.query_string = event.request.query_string
                        .replace(/token=[^&]*/gi, 'token=[FILTERED]')
                        .replace(/password=[^&]*/gi, 'password=[FILTERED]')
                        .replace(/api_key=[^&]*/gi, 'api_key=[FILTERED]');
                }
            }

            // Filter out payment details from extra data
            if (event.extra) {
                const sensitiveKeys = ['cardNumber', 'cvv', 'password', 'token', 'apiKey'];
                sensitiveKeys.forEach(key => {
                    if (event.extra[key]) {
                        event.extra[key] = '[FILTERED]';
                    }
                });
            }

            return event;
        },

        // Ignore certain errors
        ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            'chrome-extension://',
            'moz-extension://',

            // Network errors that are expected
            'NetworkError',
            'Failed to fetch',
            'Load failed',

            // Firebase expected errors
            'auth/popup-closed-by-user',
            'auth/cancelled-popup-request',

            // Ignore non-critical errors
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
        ],

        // Don't report errors from certain URLs
        denyUrls: [
            // Browser extensions
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

        // Auto session tracking
        autoSessionTracking: true,

        // Enable user feedback
        enableUserFeedback: true,
    });

    // Set user context when available
    window.setSentryUser = (user) => {
        if (user) {
            Sentry.setUser({
                id: user.uid,
                email: user.email,
                username: user.displayName,
                role: user.role,
            });
        } else {
            Sentry.setUser(null);
        }
    };

    console.log(`✅ Sentry initialized (${environment})`);
};

/**
 * Capture exception with context
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
export const captureException = (error, context = {}) => {
    Sentry.captureException(error, {
        extra: context,
    });
};

/**
 * Capture message with level
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (info, warning, error)
 * @param {Object} context - Additional context
 */
export const captureMessage = (message, level = 'info', context = {}) => {
    Sentry.captureMessage(message, {
        level,
        extra: context,
    });
};

/**
 * Add breadcrumb for debugging
 * @param {string} message - Breadcrumb message
 * @param {string} category - Category (navigation, http, user, etc.)
 * @param {Object} data - Additional data
 */
export const addBreadcrumb = (message, category = 'custom', data = {}) => {
    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
    });
};

/**
 * Start a performance transaction
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 * @returns {Transaction} Sentry transaction
 */
export const startTransaction = (name, op = 'custom') => {
    return Sentry.startTransaction({
        name,
        op,
    });
};

/**
 * Show user feedback dialog
 * Allows users to report issues directly
 */
export const showFeedbackDialog = () => {
    Sentry.showReportDialog({
        title: 'Un problème est survenu',
        subtitle: 'Notre équipe a été notifiée.',
        subtitle2: 'Vous pouvez nous aider en décrivant ce qui s\'est passé.',
        labelName: 'Nom',
        labelEmail: 'Email',
        labelComments: 'Que s\'est-il passé ?',
        labelClose: 'Fermer',
        labelSubmit: 'Envoyer',
        errorGeneric: 'Une erreur s\'est produite lors de l\'envoi de votre rapport.',
        errorFormEntry: 'Certains champs sont invalides. Veuillez corriger les erreurs et réessayer.',
        successMessage: 'Votre rapport a été envoyé. Merci !',
    });
};

export default {
    initSentry,
    captureException,
    captureMessage,
    addBreadcrumb,
    startTransaction,
    showFeedbackDialog,
};
