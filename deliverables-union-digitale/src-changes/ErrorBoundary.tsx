import React, { ReactNode, ErrorInfo } from 'react';
import * as Sentry from '@sentry/react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
  fallback?: ReactNode;
}

interface PaymentErrorState {
  hasError: boolean;
  error: Error | null;
  savedCart: unknown | null;
}

interface AppErrorState {
  hasError: boolean;
  error: Error | null;
}

const CART_STORAGE_KEY = 'ud_cart';

/** Read cart from localStorage before it's lost */
function snapshotCart(): unknown | null {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Restore cart snapshot to localStorage */
function restoreCart(cart: unknown): void {
  try {
    if (cart) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // ignore
  }
}

/**
 * PaymentErrorBoundary — Catches errors in payment components
 * ✅ Preserves cart state (snapshots before crash, restores on retry)
 * ✅ Displays user-friendly Creole error messages
 * ✅ Logs to Sentry with full component context
 * ✅ Dev-only technical details panel
 */
export class PaymentErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  PaymentErrorState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, savedCart: null };
  }

  static getDerivedStateFromError(error: Error): Partial<PaymentErrorState> {
    // Snapshot cart synchronously before render is blocked
    const savedCart = snapshotCart();
    return { hasError: true, error, savedCart };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      tags: {
        component: 'PaymentErrorBoundary',
        severity: 'payment_error',
      },
      contexts: {
        react: { componentStack: errorInfo.componentStack },
        cart: { preserved: this.state.savedCart !== null },
      },
    });

    console.error('[PaymentErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    // Restore the cart snapshot before resetting
    if (this.state.savedCart) {
      restoreCart(this.state.savedCart);
    }
    this.setState({ hasError: false, error: null, savedCart: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const cartCount =
        Array.isArray((this.state.savedCart as { items?: unknown[] })?.items)
          ? (this.state.savedCart as { items: unknown[] }).items.length
          : null;

      return (
        <div className="error-boundary-container payment-error">
          <div className="error-content">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <h2 className="error-title">Gen yon pwoblèm ak peman an</h2>
            <p className="error-message">
              Nou gaye nan yon erè pandan peysman ou a. Tanpri eseye ankò oswa
              kontakte sipò yo.
            </p>
            {cartCount !== null && (
              <p className="cart-preserved-notice">
                🛒 Panye ou sove — {cartCount} atik toujou la.
              </p>
            )}
            <div className="error-actions">
              <button
                onClick={this.handleRetry}
                className="btn btn-primary retry-button"
              >
                Eseye Ankò
              </button>
              <a
                href="https://wa.me/50900000000"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary support-button"
              >
                Kontakte Sipò
              </a>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Detay teknik (dev only)</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.error.stack && (
                  <pre className="error-stack">{this.state.error.stack}</pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * AppErrorBoundary — General application error boundary
 * ✅ Logs all errors to Sentry with severity tags
 * ✅ Accepts custom `fallback` prop for context-specific UIs
 * ✅ Creole default fallback UI
 */
export class AppErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  AppErrorState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AppErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      tags: {
        component: 'AppErrorBoundary',
        severity: 'error',
      },
      contexts: {
        react: { componentStack: errorInfo.componentStack },
      },
    });

    console.error('[AppErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="error-boundary-container app-error">
          <div className="error-content">
            <div className="error-icon" aria-hidden="true">🔄</div>
            <h2>Yon Erè Enprevwa</h2>
            <p>
              Aplication an rankontre yon pwoblèm. Tanpri rechaje paj la oswa
              kontakte nou.
            </p>
            <div className="error-actions">
              <button onClick={this.handleRetry} className="btn btn-primary">
                Rechaje
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
              >
                Rechaje Paj La
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Detay teknik (dev only)</summary>
                <pre>{this.state.error.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
