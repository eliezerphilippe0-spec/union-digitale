import React, { useEffect, useState } from 'react';
import {
  detectHaitiOperator,
  getPaymentMethodName,
  getPaymentMethodDescription,
  PaymentMethod,
} from '../../lib/validation/payment.validation';
import '../styles/PaymentSelector.css';

/**
 * PaymentSelector Component
 * 
 * Payment method selector for Union Digitale checkout.
 * Supports:
 * - MonCash (Digicel mobile money)
 * - NatCash (Natcom mobile money)
 * - Stripe Card (International credit/debit)
 * - PayPal (International)
 * 
 * Auto-detects operator from phone number to suggest relevant payment methods.
 * 
 * Props:
 * - selected: Currently selected payment method
 * - onChange: Callback when payment method changes
 * - phoneNumber: Optional phone number for operator detection
 */

interface PaymentSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  phoneNumber?: string;
  className?: string;
}

const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  selected,
  onChange,
  phoneNumber,
  className = '',
}) => {
  const [detectedOperator, setDetectedOperator] = useState<string>('unknown');

  // Detect operator when phone number changes
  useEffect(() => {
    if (phoneNumber) {
      const operator = detectHaitiOperator(phoneNumber);
      setDetectedOperator(operator);
    }
  }, [phoneNumber]);

  const paymentMethods: PaymentMethod[] = ['moncash', 'natcash', 'stripe', 'paypal'];

  const getMethodIcon = (method: PaymentMethod): string => {
    const icons: Record<PaymentMethod, string> = {
      moncash: '📱',
      natcash: '📱',
      stripe: '💳',
      paypal: '🅿️',
    };
    return icons[method];
  };

  const getIsRecommended = (method: PaymentMethod): boolean => {
    if (!phoneNumber) return false;
    
    if (method === 'moncash' && detectedOperator === 'digicel') {
      return true;
    }
    
    if (method === 'natcash' && detectedOperator === 'natcash') {
      return true;
    }
    
    return false;
  };

  return (
    <div
      className={`payment-selector ${className}`}
      role="group"
      aria-labelledby="payment-selector-label"
    >
      <fieldset className="payment-selector__fieldset">
        <legend id="payment-selector-label" className="payment-selector__legend">
          Chwazi yon metòd pèl
        </legend>

        <div className="payment-selector__grid">
          {paymentMethods.map((method) => {
            const isRecommended = getIsRecommended(method);
            const isSelected = selected === method;

            return (
              <label
                key={method}
                className={`payment-option ${
                  isSelected ? 'payment-option--selected' : ''
                } ${isRecommended ? 'payment-option--recommended' : ''}`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={method}
                  checked={isSelected}
                  onChange={() => onChange(method)}
                  className="payment-option__input"
                  aria-label={`Select ${getPaymentMethodName(method)}`}
                />

                <div className="payment-option__content">
                  <div className="payment-option__header">
                    <span className="payment-option__icon" aria-hidden="true">
                      {getMethodIcon(method)}
                    </span>
                    <span className="payment-option__name">
                      {getPaymentMethodName(method)}
                    </span>
                    {isRecommended && (
                      <span className="payment-option__badge" aria-label="Recommended">
                        ✓ Rekòmande
                      </span>
                    )}
                  </div>

                  <p className="payment-option__description">
                    {getPaymentMethodDescription(method)}
                  </p>

                  {isSelected && (
                    <div className="payment-option__reassurance">
                      <span aria-hidden="true">🔒</span>
                      {method === 'stripe' && ' Sekirize pa Stripe'}
                      {method === 'paypal' && ' Sekirize pa PayPal'}
                      {(method === 'moncash' || method === 'natcash') && 
                        ' Pèl sekirize ak chifre'}
                    </div>
                  )}
                </div>

                <div className="payment-option__checkmark" aria-hidden="true">
                  ✓
                </div>
              </label>
            );
          })}
        </div>

        <div className="payment-selector__info">
          <p className="payment-selector__info-text">
            Tout tranzaksyon yo sekirize ak chifre SSL. Pa ta gen okenn frè kache.
          </p>
        </div>
      </fieldset>
    </div>
  );
};

export default PaymentSelector;
