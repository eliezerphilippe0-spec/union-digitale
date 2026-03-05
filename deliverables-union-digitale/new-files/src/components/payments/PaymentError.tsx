/**
 * Payment Error Component for Union Digitale
 * Displays payment error with retry and support options
 */

import React from 'react';
import './PaymentError.css';

export interface PaymentErrorProps {
  error: string;
  method: string;
  onRetry: () => void;
}

const PaymentError: React.FC<PaymentErrorProps> = ({
  error,
  method,
  onRetry,
}) => {
  const handleRetry = () => {
    onRetry();
  };

  const handleSupport = () => {
    // Open support contact page
    window.location.href = '/support';
  };

  const getMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      MONCASH: 'MonCash',
      NATCASH: 'Natcash',
      STRIPE: 'Stripe',
      PAYPAL: 'PayPal',
      UNKNOWN: 'Peman',
    };
    return labels[method] || method;
  };

  return (
    <div className="payment-error-container">
      {/* Error content */}
      <div className="error-content">
        {/* Error icon */}
        <div className="error-icon-container">
          <svg
            className="error-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
          >
            <circle
              className="error-circle"
              cx="26"
              cy="26"
              r="25"
              fill="none"
            />
            <path
              className="error-mark"
              d="M16 16 L36 36 M36 16 L16 36"
              fill="none"
            />
          </svg>
        </div>

        {/* Error message */}
        <h1 className="error-title">Peman echwe</h1>

        {/* Error details */}
        <div className="error-details">
          <p className="error-method">
            Metòd: <strong>{getMethodLabel(method)}</strong>
          </p>
          <p className="error-message">{error}</p>
        </div>

        {/* Action buttons */}
        <div className="action-buttons">
          <button
            className="retry-button"
            onClick={handleRetry}
            aria-label="Retry payment"
          >
            Eseye ankò
          </button>
          <button
            className="support-button"
            onClick={handleSupport}
            aria-label="Contact support"
          >
            Kontakte sipò
          </button>
        </div>

        {/* Additional info */}
        <p className="info-text">
          Si pwoblèm la kontinye, tanpri kontakte ekip sipò nou an.
        </p>
      </div>
    </div>
  );
};

export default PaymentError;
