/**
 * Production-Grade Logger for Union Digitale
 * Inspired by: Stripe, Vercel, Sentry best practices
 * 
 * Features:
 * - Conditional logging (disabled in production)
 * - Log levels (debug, info, warn, error)
 * - Sentry integration for errors
 * - Performance tracking
 * - Structured logging
 */

// Log levels
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;
    this.enableSentry = import.meta.env.VITE_ENABLE_SENTRY === 'true';
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  /**
   * Format log message with timestamp and context
   */
  _formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);
    
    return {
      timestamp,
      level: levelName,
      message,
      context,
      environment: this.isDevelopment ? 'development' : 'production',
    };
  }

  /**
   * Send error to Sentry (production only)
   */
  _sendToSentry(error, context = {}) {
    if (!this.enableSentry || !this.isProduction) {
      return;
    }

    try {
      // Sentry will be initialized in sentry.config.js
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          extra: context,
        });
      }
    } catch (e) {
      // Fail silently to avoid breaking the app
      console.error('Failed to send to Sentry:', e);
    }
  }

  /**
   * Debug level - Development only
   * Use for detailed debugging information
   */
  debug(message, context = {}) {
    if (LogLevel.DEBUG < this.minLevel) return;

    const formatted = this._formatMessage(LogLevel.DEBUG, message, context);
    
    if (this.isDevelopment) {
      console.log(
        `%c[DEBUG] ${message}`,
        'color: #6B7280; font-weight: normal;',
        context
      );
    }
  }

  /**
   * Info level - Development only
   * Use for general information
   */
  info(message, context = {}) {
    if (LogLevel.INFO < this.minLevel) return;

    const formatted = this._formatMessage(LogLevel.INFO, message, context);
    
    if (this.isDevelopment) {
      console.log(
        `%c[INFO] ${message}`,
        'color: #3B82F6; font-weight: bold;',
        context
      );
    }
  }

  /**
   * Warn level - Development and Production
   * Use for warnings that don't break functionality
   */
  warn(message, context = {}) {
    if (LogLevel.WARN < this.minLevel) return;

    const formatted = this._formatMessage(LogLevel.WARN, message, context);
    
    // Always log warnings (even in production)
    console.warn(`[WARN] ${message}`, context);

    // Send to Sentry in production
    if (this.isProduction && this.enableSentry) {
      this._sendToSentry(new Error(message), context);
    }
  }

  /**
   * Error level - Always logged
   * Use for errors that break functionality
   */
  error(message, error = null, context = {}) {
    const formatted = this._formatMessage(LogLevel.ERROR, message, {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : null,
    });

    // Always log errors
    console.error(`[ERROR] ${message}`, error, context);

    // Send to Sentry
    if (this.enableSentry) {
      this._sendToSentry(error || new Error(message), context);
    }
  }

  /**
   * Performance tracking
   * Inspired by Vercel Analytics
   */
  performance(name, duration, context = {}) {
    if (!this.isDevelopment) return;

    console.log(
      `%c[PERF] ${name}: ${duration.toFixed(2)}ms`,
      'color: #10B981; font-weight: bold;',
      context
    );
  }

  /**
   * Track user events (for analytics)
   * Development: console.log
   * Production: Send to analytics service
   */
  event(eventName, properties = {}) {
    if (this.isDevelopment) {
      console.log(
        `%c[EVENT] ${eventName}`,
        'color: #8B5CF6; font-weight: bold;',
        properties
      );
    }

    // In production, send to Google Analytics, Mixpanel, etc.
    if (this.isProduction && window.gtag) {
      window.gtag('event', eventName, properties);
    }
  }

  /**
   * API request logging
   * Inspired by Stripe's request logging
   */
  api(method, url, status, duration, context = {}) {
    const statusColor = status >= 200 && status < 300 ? '#10B981' : '#EF4444';
    
    if (this.isDevelopment) {
      console.log(
        `%c[API] ${method} ${url} - ${status} (${duration}ms)`,
        `color: ${statusColor}; font-weight: bold;`,
        context
      );
    }

    // Log slow requests in production
    if (this.isProduction && duration > 3000) {
      this.warn(`Slow API request: ${method} ${url}`, {
        duration,
        status,
        ...context,
      });
    }
  }

  /**
   * Payment logging (sensitive data)
   * NEVER log actual payment details (card numbers, etc.)
   * Only log transaction IDs and status
   */
  payment(action, transactionId, status, context = {}) {
    // Sanitize context to remove sensitive data
    const sanitized = {
      action,
      transactionId,
      status,
      timestamp: new Date().toISOString(),
      // Only include non-sensitive context
      userId: context.userId,
      amount: context.amount,
      currency: context.currency,
    };

    if (this.isDevelopment) {
      console.log(
        `%c[PAYMENT] ${action} - ${status}`,
        'color: #F59E0B; font-weight: bold;',
        sanitized
      );
    }

    // Always log payment events to Sentry (for audit trail)
    if (this.enableSentry) {
      window.Sentry?.addBreadcrumb({
        category: 'payment',
        message: `${action} - ${status}`,
        level: 'info',
        data: sanitized,
      });
    }
  }

  /**
   * Security event logging
   * For authentication, authorization, suspicious activity
   */
  security(event, severity, context = {}) {
    const formatted = this._formatMessage(LogLevel.ERROR, event, context);

    console.error(
      `%c[SECURITY] ${event}`,
      'color: #DC2626; font-weight: bold; background: #FEE2E2; padding: 4px;',
      context
    );

    // Always send security events to Sentry
    if (this.enableSentry) {
      this._sendToSentry(new Error(`Security: ${event}`), {
        severity,
        ...context,
      });
    }
  }

  /**
   * Create a timer for performance measurement
   * Usage: const timer = logger.startTimer('operation'); timer.end();
   */
  startTimer(name) {
    const startTime = performance.now();
    
    return {
      end: (context = {}) => {
        const duration = performance.now() - startTime;
        this.performance(name, duration, context);
        return duration;
      },
    };
  }

  /**
   * Group related logs (development only)
   */
  group(label, callback) {
    if (!this.isDevelopment) {
      callback();
      return;
    }

    console.group(label);
    try {
      callback();
    } finally {
      console.groupEnd();
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export both the instance and the class
export default logger;
export { Logger, LogLevel };
