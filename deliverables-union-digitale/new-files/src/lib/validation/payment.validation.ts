/**
 * Payment Validation Utilities
 * 
 * Handles payment-related validations and operator detection for Haiti mobile networks.
 */

export type HaitiOperator = 'digicel' | 'natcash' | 'moncash' | 'unknown';

/**
 * Detects Haiti mobile operator from phone number
 * 
 * Haiti operator prefixes:
 * - Digicel: 30, 31, 32, 36, 37
 * - Natcash (Natcom): 40, 41, 42, 43, 44, 45, 46
 * - MonCash: generally works with both networks
 * 
 * @param phoneNumber - Phone number without country code (10 digits)
 * @returns Detected operator or 'unknown'
 */
export function detectHaitiOperator(phoneNumber: string): HaitiOperator {
  // Remove non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Get first two digits (area code)
  const prefix = cleaned.substring(0, 2);
  
  if (['30', '31', '32', '36', '37'].includes(prefix)) {
    return 'digicel';
  }
  
  if (['40', '41', '42', '43', '44', '45', '46'].includes(prefix)) {
    return 'natcash';
  }
  
  return 'unknown';
}

/**
 * Validates Haitian phone number format
 * Expected format: 10 digits
 * 
 * @param phoneNumber - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidHaitiPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.length === 10 && /^[234]\d{9}$/.test(cleaned);
}

/**
 * Payment method type
 */
export type PaymentMethod = 'moncash' | 'natcash' | 'stripe' | 'paypal';

/**
 * Validates payment method
 * 
 * @param method - Payment method to validate
 * @returns true if valid, false otherwise
 */
export function isValidPaymentMethod(method: string): method is PaymentMethod {
  return ['moncash', 'natcash', 'stripe', 'paypal'].includes(method);
}

/**
 * Gets display name for payment method
 * 
 * @param method - Payment method
 * @returns Display name
 */
export function getPaymentMethodName(method: PaymentMethod): string {
  const names: Record<PaymentMethod, string> = {
    moncash: 'MonCash',
    natcash: 'NatCash',
    stripe: 'Kab Kredi/Debi',
    paypal: 'PayPal',
  };
  return names[method];
}

/**
 * Gets description for payment method in Creole
 * 
 * @param method - Payment method
 * @returns Creole description
 */
export function getPaymentMethodDescription(method: PaymentMethod): string {
  const descriptions: Record<PaymentMethod, string> = {
    moncash: 'Pèl dirèk sou Digicel',
    natcash: 'Pèl dirèk sou Natcom',
    stripe: 'Kab kredi oswa debi entènasyonal',
    paypal: 'Konp PayPal entènasyonal',
  };
  return descriptions[method];
}
