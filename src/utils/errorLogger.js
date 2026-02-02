/**
 * Centralized Error Logger
 * Handles error logging, reporting, and user notifications
 */

class ErrorLogger {
    constructor() {
        this.errors = [];
        this.maxErrors = 50; // Keep last 50 errors in memory
    }

    // Log error with context
    log(error, context = {}) {
        const errorEntry = {
            message: error.message || 'Unknown error',
            stack: error.stack,
            timestamp: new Date().toISOString(),
            context: {
                ...context,
                userAgent: navigator.userAgent,
                url: window.location.href,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
            },
        };

        // Add to in-memory store
        this.errors.push(errorEntry);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Console logging in development
        if (process.env.NODE_ENV === 'development') {
            console.error('[Error Logger]', errorEntry);
        }

        // Send to error tracking service (Sentry, LogRocket, etc.)
        this.sendToErrorTracking(errorEntry);

        return errorEntry;
    }

    // Send to external error tracking service
    sendToErrorTracking(errorEntry) {
        // Sentry integration (if available)
        if (window.Sentry) {
            window.Sentry.captureException(new Error(errorEntry.message), {
                extra: errorEntry.context,
            });
        }

        // Custom error endpoint
        if (window.location.hostname !== 'localhost') {
            fetch('/api/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorEntry),
            }).catch(() => {
                // Silently fail - don't create error loop
            });
        }
    }

    // Get recent errors
    getRecentErrors(count = 10) {
        return this.errors.slice(-count);
    }

    // Clear errors
    clear() {
        this.errors = [];
    }

    // Log warning (non-critical)
    warn(message, context = {}) {
        console.warn('[Warning]', message, context);

        if (window.gtag) {
            window.gtag('event', 'warning', {
                event_category: 'Error',
                event_label: message,
                non_interaction: true,
            });
        }
    }

    // Log info
    info(message, context = {}) {
        if (process.env.NODE_ENV === 'development') {
            console.info('[Info]', message, context);
        }
    }
}

// Singleton instance
const errorLogger = new ErrorLogger();

// Error categories for better organization
export const ErrorCategory = {
    NETWORK: 'network',
    AUTH: 'authentication',
    VALIDATION: 'validation',
    PAYMENT: 'payment',
    FIREBASE: 'firebase',
    UNKNOWN: 'unknown',
};

// User-friendly error messages
export const getUserFriendlyMessage = (error, category = ErrorCategory.UNKNOWN) => {
    const messages = {
        [ErrorCategory.NETWORK]: 'Problème de connexion. Veuillez vérifier votre internet.',
        [ErrorCategory.AUTH]: 'Erreur d\'authentification. Veuillez vous reconnecter.',
        [ErrorCategory.VALIDATION]: 'Veuillez vérifier les informations saisies.',
        [ErrorCategory.PAYMENT]: 'Erreur de paiement. Veuillez réessayer.',
        [ErrorCategory.FIREBASE]: 'Erreur serveur. Veuillez réessayer plus tard.',
        [ErrorCategory.UNKNOWN]: 'Une erreur est survenue. Veuillez réessayer.',
    };

    // Check for specific Firebase errors
    if (error.code) {
        switch (error.code) {
            case 'auth/user-not-found':
                return 'Utilisateur non trouvé.';
            case 'auth/wrong-password':
                return 'Mot de passe incorrect.';
            case 'auth/email-already-in-use':
                return 'Cet email est déjà utilisé.';
            case 'permission-denied':
                return 'Vous n\'avez pas les permissions nécessaires.';
            default:
                break;
        }
    }

    return messages[category] || messages[ErrorCategory.UNKNOWN];
};

// Retry helper for failed operations
export const retryOperation = async (
    operation,
    maxRetries = 3,
    delayMs = 1000
) => {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            errorLogger.warn(`Retry attempt ${i + 1}/${maxRetries} failed`, {
                error: error.message,
            });

            if (i < maxRetries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
            }
        }
    }

    throw lastError;
};

export default errorLogger;
