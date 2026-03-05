/**
 * Payment Success Component for Union Digitale
 * Displays successful payment confirmation with animations
 */

import React from 'react';
import './PaymentSuccess.css';

export interface PaymentSuccessProps {
  orderId: string;
  amount: number;
  currency?: string;
  phone?: string;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  orderId,
  amount,
  currency = 'HTG',
  phone,
}) => {
  const handleTrackOrder = () => {
    // Navigate to order tracking page
    window.location.href = `/tracking/${orderId}`;
  };

  return (
    <div className="payment-success-container">
      {/* Confetti effect */}
      <div className="confetti-container">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              delay: `${Math.random() * 0.5}s`,
              duration: `${2 + Math.random() * 1}s`,
            }}
          />
        ))}
      </div>

      {/* Main success content */}
      <div className="success-content">
        {/* Checkmark animation */}
        <div className="checkmark-container">
          <svg
            className="checkmark"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
          >
            <circle
              className="checkmark-circle"
              cx="26"
              cy="26"
              r="25"
              fill="none"
            />
            <path
              className="checkmark-check"
              fill="none"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>
        </div>

        {/* Success message */}
        <h1 className="success-title">Peman Reyisi!</h1>

        {/* Order details */}
        <div className="order-details">
          <div className="detail-item">
            <span className="detail-label">Nimewo Lod:</span>
            <span className="detail-value">{orderId}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Montan:</span>
            <span className="detail-value">
              {amount.toLocaleString('ht-HT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              {currency}
            </span>
          </div>

          {phone && (
            <div className="detail-item">
              <span className="detail-label">SMS konfirmasyon voye nan:</span>
              <span className="detail-value">{phone}</span>
            </div>
          )}
        </div>

        {/* Call to action */}
        <div className="action-buttons">
          <button
            className="primary-button"
            onClick={handleTrackOrder}
            aria-label="Track order"
          >
            Swiv lòd ou a
          </button>
        </div>

        {/* Additional info */}
        <p className="info-text">
          Mersi pou achte nan Union Digitale. Nap delivre lòd ou a kichou pli vit.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
