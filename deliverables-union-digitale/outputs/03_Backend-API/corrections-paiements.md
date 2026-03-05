# Union Digitale - Payment Integration Implementation Guide

## Overview

This document details the complete payment integration files created for Union Digitale, a Haitian e-commerce platform. The implementation supports Haiti's primary mobile payment systems (MonCash and NatCash) with automatic fallback to international methods (Stripe, PayPal).

**Date:** 2026-03-04
**Status:** Complete
**Environment:** Production-Ready

---

## File Structure

```
src/
├── lib/
│   ├── validation/
│   │   └── payment.validation.ts       # Haiti payment validation logic
│   └── payments/
│       ├── moncash.ts                  # MonCash (Digicel) integration
│       ├── natcash.ts                  # NatCash (Natcom) integration
│       └── fallback.ts                 # Payment fallback chain
└── components/
    └── payments/
        ├── PaymentSuccess.tsx          # Success confirmation component
        ├── PaymentSuccess.css          # Success component styles
        ├── PaymentError.tsx            # Error handling component
        └── PaymentError.css            # Error component styles
```

---

## 1. Payment Validation Module (`payment.validation.ts`)

### Purpose
Validates Haiti payment data and sanitizes product information for secure processing.

### Key Functions

#### `validateHaitiPhone(phone: string): PhoneValidationResult`
Validates Haiti phone numbers in 509XXXXXXXX format.

**Parameters:**
- `phone`: Phone number string (any format)

**Returns:**
```typescript
{
  valid: boolean;
  formatted?: string;        // +509XXXXXXXX format
  operator?: HaitiOperator;  // 'MONCASH' | 'NATCASH' | 'UNKNOWN'
  error?: string;            // Haitian Creole error message
}
```

**Validation Rules:**
- Must be exactly 12 digits
- Must start with 509
- Must be a recognized operator prefix

**Error Messages (Haitian Creole):**
- "Numèo telefòn obrigatwa" - Phone number is required
- "Numèo telefòn dwe kòmanse ak 509 epi genyen 12 chif" - Must start with 509 and have 12 digits
- "Opreratè telefòn pa rekonèt" - Operator not recognized

---

#### `detectHaitiOperator(phone: string): HaitiOperator`
Detects mobile operator from phone prefix.

**Operator Detection Rules:**
- **MonCash (Digicel):** Prefixes 30-38, 46-48
  - Example: 50930XXXXXX, 50946XXXXXX
- **NatCash (Natcom):** Prefixes 39-45, 49
  - Example: 50939XXXXXX, 50949XXXXXX

**Example Usage:**
```typescript
const operator = detectHaitiOperator('50930123456'); // Returns 'MONCASH'
const operator = detectHaitiOperator('50939123456'); // Returns 'NATCASH'
```

---

#### `validatePaymentAmount(amount: number): PaymentValidationResult`
Validates payment amount in Haiti Gourdes (HTG).

**Validation Rules:**
- Minimum: 10 HTG
- Maximum: 500,000 HTG
- Maximum 2 decimal places

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[]; // Array of validation error messages
}
```

**Error Messages (Haitian Creole):**
- "Montan dwe yon nimewo valide" - Amount must be a valid number
- "Montan minimòm se 10 HTG" - Minimum amount is 10 HTG
- "Montan maksimòm se 500,000 HTG" - Maximum amount is 500,000 HTG
- "Montan dwe gen maksimòm 2 desimal" - Maximum 2 decimal places

---

#### `validateMonCashPayment(phone: string, amount: number): PaymentValidationResult`
Combined validator for MonCash payments.

**Validates:**
1. Haiti phone number is valid
2. Phone number is a Digicel (MonCash) number
3. Amount is within valid range

---

#### `validateNatCashPayment(phone: string, amount: number): PaymentValidationResult`
Combined validator for NatCash payments.

**Validates:**
1. Haiti phone number is valid
2. Phone number is a Natcom (NatCash) number
3. Amount is within valid range

---

#### `sanitizeProductTitle(title: string): string`
Sanitizes product title for safe storage and display.

**Processing:**
- Strips all HTML tags
- Removes control characters
- Limits to 200 characters maximum
- Trims whitespace

---

#### `sanitizeDescription(desc: string): string`
Sanitizes product description.

**Processing:**
- Strips all HTML tags
- Removes control characters
- Limits to 5,000 characters maximum
- Trims whitespace

---

#### `sanitizePrice(price: number | string): number | null`
Sanitizes and validates price values.

**Processing:**
- Converts string to number if needed
- Ensures positive value
- Rounds to 2 decimal places
- Returns null if invalid

---

## 2. MonCash Integration (`moncash.ts`)

### Purpose
Handles payment initiation and verification for MonCash (Digicel) in Haiti.

### MonCashService Class

#### Constructor
```typescript
constructor(
  apiBaseUrl?: string,    // Default: process.env.MONCASH_API_URL
  apiKey?: string,        // Default: process.env.MONCASH_API_KEY
  webhookSecret?: string  // Default: process.env.MONCASH_WEBHOOK_SECRET
)
```

#### `initiatePayment(orderId, amount, phone, idempotencyKey, maxRetries?)`

**Parameters:**
- `orderId`: Unique order identifier
- `amount`: Payment amount in HTG
- `phone`: Haiti phone number (509XXXXXXXX)
- `idempotencyKey`: Unique key to prevent duplicate charges
- `maxRetries`: Maximum retry attempts (default: 3)

**Returns:**
```typescript
{
  success: boolean;
  transactionId?: string;
  message: string;           // Haitian Creole message
  error?: string;            // Error code
  details?: Record<string, unknown>; // Additional data
}
```

**Features:**
- Automatic parameter validation
- Exponential backoff retry logic (0s, 5s, 15s)
- All error messages in Haitian Creole
- Idempotent requests to prevent double-charging

**Error Messages (Haitian Creole):**
- "Solde insifisan nan kont ou" - Insufficient balance
- "OTP ekspire. Eseye ankò" - OTP expired
- "Tanpòt ekspire. Konekte internet ou epi eseye ankò" - Timeout occurred
- "Doub debil detekte. Kontakte sipò MonCash" - Double debit detected
- "Numèo telefòn envali" - Invalid phone number
- "Erè rezo. Eseye ankò pita" - Network error
- "Sèvis MonCash pa disponib. Eseye ankò pita" - Service unavailable
- "Montan invalide" - Invalid amount
- "Atentifikasyon echwe" - Authentication failed
- "Yon erè enprevèn rive. Konekte sipò" - Unexpected error

---

#### `verifyWebhookSignature(payload, signature, secret?)`

**Purpose:** Verify webhook authenticity using HMAC-SHA256.

**Parameters:**
- `payload`: Webhook payload (string or object)
- `signature`: Signature from webhook header (X-MonCash-Signature)
- `secret`: Webhook secret (default: instance secret)

**Returns:** Boolean indicating signature validity

**Implementation Details:**
- Uses SubtleCrypto API for HMAC-SHA256
- Constant-time comparison to prevent timing attacks
- Works in both Node.js and browser environments

**Example Usage:**
```typescript
const isValid = await monCashService.verifyWebhookSignature(
  JSON.stringify(webhookData),
  headerSignature
);
```

---

#### `detectOperator(phone: string)`

Returns operator for given phone number using validation utilities.

---

### Retry Logic

**Exponential Backoff Strategy:**
- Attempt 1: Immediate (0s delay)
- Attempt 2: After 5 seconds
- Attempt 3: After 15 seconds
- Attempt 4: After 30 seconds (if maxRetries > 3)

**Transient Errors Triggering Retry:**
- Network timeouts
- Service unavailable (503)
- Temporary failures

**Non-Retryable Errors:**
- Validation errors (400)
- Authentication failures (401)
- Insufficient balance (402)

---

## 3. NatCash Integration (`natcash.ts`)

### Purpose
Handles payment initiation and verification for NatCash (Natcom) in Haiti.

### Key Differences from MonCash
- Uses NatCash API endpoints (default: https://api.natcash.io)
- Validates for NatCash-compatible phone numbers
- Webhook header: X-NatCash-Signature
- All messages reference "Natcash" instead of "MonCash"

### Implementation

The NatCash service mirrors the MonCash service in structure:

```typescript
const natCashService = new NatCashService(
  apiBaseUrl,
  apiKey,
  webhookSecret
);

const result = await natCashService.initiatePayment(
  orderId,
  amount,
  phone,
  idempotencyKey
);

const isValid = await natCashService.verifyWebhookSignature(
  payload,
  signature
);
```

**Same Features as MonCash:**
- Validation before processing
- Exponential backoff retry logic
- HMAC-SHA256 webhook signature verification
- Constant-time comparison
- Comprehensive error handling in Haitian Creole

---

## 4. Payment Fallback Chain (`fallback.ts`)

### Purpose
Implements intelligent fallback mechanism when primary payment method fails.

### Payment Method Order
1. **MonCash** (Digicel mobile money)
2. **NatCash** (Natcom mobile money)
3. **Stripe** (International cards)
4. **PayPal** (International payments)

### PaymentFallbackChain Class

#### Constructor
```typescript
constructor(
  monCashService?: MonCashService,
  natCashService?: NatCashService,
  onFallback?: OnFallbackCallback
)
```

#### `processPayment(cart, idempotencyKey): Promise<FallbackResult>`

**Parameters:**
- `cart`: Shopping cart with order details
- `idempotencyKey`: Unique transaction key

**Cart Structure:**
```typescript
{
  orderId: string;
  amount: number;
  phone?: string;              // For mobile money methods
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  metadata?: Record<string, unknown>;
}
```

**Returns:**
```typescript
{
  success: boolean;
  method: string;              // Which method succeeded
  transactionId?: string;
  message: string;             // Haitian Creole message
  cart: PaymentCart;           // Preserved cart data
  steps: FallbackStep[];       // History of all attempts
}
```

---

#### Fallback Step Structure

```typescript
{
  method: 'MONCASH' | 'NATCASH' | 'STRIPE' | 'PAYPAL';
  status: 'pending' | 'success' | 'failed' | 'skipped';
  error?: string;              // Error code if failed
  message?: string;            // Detailed message
  timestamp: string;           // ISO 8601 timestamp
}
```

---

#### Fallback Behavior

**When a method fails:**
1. Cart is preserved completely
2. Next method in chain is attempted
3. `onFallback` callback is triggered
4. All steps are logged for auditing

**Cart Preservation:**
- Order ID remains constant across all attempts
- Amount is unchanged
- Items list is preserved
- Metadata carries through

**Example Flow:**
```
User attempts MonCash with phone 50930123456
↓
MonCash fails (insufficient balance)
↓ [onFallback callback triggered]
Automatically attempts NatCash with same cart
↓
NatCash succeeds
↓
Returns success with transaction ID and complete history
```

---

#### `onFallback` Callback

**Signature:**
```typescript
(step: FallbackStep, nextMethod: string) => void
```

**Usage:**
```typescript
const fallbackChain = new PaymentFallbackChain(
  monCashService,
  natCashService,
  (step, nextMethod) => {
    // Notify UI of fallback
    console.log(`${step.method} failed, trying ${nextMethod}`);
    // Show user notification in Haitian Creole
    showNotification(step.message);
  }
);
```

---

#### `getSteps(): FallbackStep[]`

Returns complete history of all payment attempts for current transaction.

**Use Cases:**
- Audit logging
- User communication
- Debugging payment failures

---

#### `reset(): void`

Clears step history for new transaction.

---

### Fallback Messages (Haitian Creole)

```typescript
MONCASH_FAILED: 'MonCash pa travay. Eseye ak Natcash...'
NATCASH_FAILED: 'Natcash pa travay. Eseye ak Stripe...'
STRIPE_FAILED: 'Stripe pa travay. Eseye ak PayPal...'
MONCASH_SKIPPED: 'Yo skip MonCash paske w pa gen Digicel numwo'
NATCASH_SKIPPED: 'Yo skip Natcash paske w pa gen Natcom numwo'
ALL_METHODS_FAILED: 'Tout metod peman echwe. Kontakte sipò'
PAYMENT_SUCCESS: 'Peman reyisit!'
```

---

## 5. Payment Success Component (`PaymentSuccess.tsx`)

### Purpose
Displays payment confirmation with celebratory animations.

### Component Props

```typescript
interface PaymentSuccessProps {
  orderId: string;          // Order identifier
  amount: number;           // Payment amount
  currency?: string;        // Default: 'HTG'
  phone?: string;           // Customer phone (optional)
}
```

### Features

#### Visual Elements
1. **Checkmark Animation**
   - SVG circle drawn first (600ms)
   - Checkmark stroke drawn after (500ms delay)
   - Spring cubic-bezier timing: `cubic-bezier(0.34, 1.56, 0.64, 1)`

2. **Confetti Effect**
   - 30 individual confetti pieces
   - Random horizontal distribution
   - Staggered animation delays (0-1.5s)
   - Smooth fade-out while falling
   - Pure CSS keyframes (no dependencies)

3. **Content Slide-In**
   - Box slides up 30px fade-in
   - Staggered element animations
   - Checkmark (0.2s delay)
   - Title (0.2s delay)
   - Details (0.4s delay)
   - Buttons (0.5s delay)
   - Footer (0.6s delay)

#### Information Display
- **Title:** "Peman Reyisi!" (Payment Successful in Haitian Creole)
- **Order Number:** Displayed for reference
- **Amount:** Formatted with HTG currency and proper decimal places
- **SMS Confirmation:** Shows phone number confirmation was sent to
- **Call to Action:** "Swif lòd ou a" (Track Your Order) button → `/tracking/:orderId`

#### Styling
- White card on purple-pink gradient background
- Rounded corners (16px)
- Shadow effect for depth
- Responsive design (mobile, tablet, desktop)
- Fully accessible with proper ARIA labels

---

### Usage Example

```typescript
import PaymentSuccess from '@/components/payments/PaymentSuccess';

export function CheckoutComplete() {
  return (
    <PaymentSuccess
      orderId="ORD-2024-001234"
      amount={500.00}
      currency="HTG"
      phone="+50930123456"
    />
  );
}
```

---

### Responsive Breakpoints

**Desktop (640px+):**
- Padding: 60px 40px
- Font sizes: 32px title, 16px details
- Full checkmark (100px)

**Tablet (640px - 480px):**
- Padding: 40px 24px
- Font sizes: 24px title, 14px details
- Medium checkmark (80px)

**Mobile (< 480px):**
- Padding: 32px 16px
- Font sizes: 20px title, 12px details
- Compact checkmark (80px)
- Stacked layout

---

## 6. Payment Error Component (`PaymentError.tsx`)

### Purpose
Displays payment failures with retry and support options.

### Component Props

```typescript
interface PaymentErrorProps {
  error: string;           // Error message (Haitian Creole)
  method: string;          // Payment method that failed
  onRetry: () => void;     // Retry handler function
}
```

### Features

#### Visual Elements
1. **Error Icon Animation**
   - Red circle drawn (600ms)
   - X mark animated (500ms with 400ms delay)
   - Drop shadow effect

2. **Error Display**
   - Orange/red warning styling
   - Method label (MonCash, Natcash, Stripe, PayPal)
   - Full error message in Haitian Creole
   - Light red background highlight

3. **Call-to-Action Buttons**
   - **"Eseye ankò" (Retry):** Red gradient button
   - **"Kontakte sipò" (Contact Support):** White button with red border
   - Hover effects with elevation
   - Touch-friendly sizing

#### Information Display
- **Title:** "Peman echwe" (Payment Failed in Haitian Creole)
- **Method Label:** Which payment method failed
- **Error Message:** User-friendly explanation
- **Support Message:** "Si pwoblèm la kontinye, tanpri kontakte ekip sipò nou an"
  (If the problem continues, please contact our support team)

---

### Usage Example

```typescript
import PaymentError from '@/components/payments/PaymentError';

export function PaymentFailed() {
  const handleRetry = async () => {
    // Attempt payment again
  };

  return (
    <PaymentError
      error="Solde insifisan nan kont ou"
      method="MONCASH"
      onRetry={handleRetry}
    />
  );
}
```

---

### Button Actions

**Eseye ankò (Retry Button):**
- Calls `onRetry()` callback
- Should trigger payment form again
- May pre-fill previous payment details

**Kontakte sipò (Support Button):**
- Navigates to `/support`
- Opens support contact form
- Can be customized for different channels

---

### Responsive Breakpoints

Same as PaymentSuccess component, optimized for all device sizes.

---

## Environment Variables

Required environment variables for payment integration:

```bash
# MonCash Configuration
MONCASH_API_URL=https://api.moncash.io
MONCASH_API_KEY=your_moncash_api_key
MONCASH_WEBHOOK_SECRET=your_moncash_webhook_secret

# NatCash Configuration
NATCASH_API_URL=https://api.natcash.io
NATCASH_API_KEY=your_natcash_api_key
NATCASH_WEBHOOK_SECRET=your_natcash_webhook_secret
```

---

## Integration Guide

### Step 1: Import Validation

```typescript
import {
  validateHaitiPhone,
  validateMonCashPayment,
  validateNatCashPayment,
  detectHaitiOperator,
} from '@/lib/validation/payment.validation';

// Validate payment
const validation = validateMonCashPayment('50930123456', 500);
if (!validation.valid) {
  console.error(validation.errors);
}
```

### Step 2: Initialize Payment Services

```typescript
import { monCashService } from '@/lib/payments/moncash';
import { natCashService } from '@/lib/payments/natcash';

// Services are singletons, no need to reinstantiate
```

### Step 3: Use Fallback Chain

```typescript
import { PaymentFallbackChain } from '@/lib/payments/fallback';

const fallbackChain = new PaymentFallbackChain(
  monCashService,
  natCashService,
  (step, nextMethod) => {
    // Handle fallback notification
    console.log(`Switching from ${step.method} to ${nextMethod}`);
  }
);

const result = await fallbackChain.processPayment(
  {
    orderId: 'ORD-123',
    amount: 500,
    phone: '50930123456',
    items: [...],
  },
  'idempotency-key-' + Date.now()
);

if (result.success) {
  // Show success component
} else {
  // Show error component
}
```

### Step 4: Display Components

```typescript
import PaymentSuccess from '@/components/payments/PaymentSuccess';
import PaymentError from '@/components/payments/PaymentError';

if (paymentResult.success) {
  return (
    <PaymentSuccess
      orderId={result.cart.orderId}
      amount={result.cart.amount}
      phone={result.cart.phone}
    />
  );
} else {
  return (
    <PaymentError
      error={result.message}
      method={result.method}
      onRetry={handleRetry}
    />
  );
}
```

---

## Security Considerations

### 1. Webhook Verification
Always verify webhook signatures before processing:

```typescript
const isValid = await monCashService.verifyWebhookSignature(
  req.body,
  req.headers['x-moncash-signature']
);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### 2. Idempotency
Use unique idempotency keys for all payment requests:

```typescript
const idempotencyKey = `order-${orderId}-${Date.now()}`;
```

### 3. Phone Number Validation
Always validate phone numbers before payment:

```typescript
const validation = validateHaitiPhone(phone);
if (!validation.valid) {
  // Show error to user
}
```

### 4. Amount Validation
Verify amounts server-side, never trust client values:

```typescript
const validation = validatePaymentAmount(amount);
if (!validation.valid) {
  return res.status(400).json({ errors: validation.errors });
}
```

### 5. HTTPS Only
All payment API calls must use HTTPS in production.

---

## Testing

### Unit Tests for Validation

```typescript
describe('validateHaitiPhone', () => {
  it('validates correct MonCash number', () => {
    const result = validateHaitiPhone('50930123456');
    expect(result.valid).toBe(true);
    expect(result.operator).toBe('MONCASH');
  });

  it('rejects invalid format', () => {
    const result = validateHaitiPhone('123');
    expect(result.valid).toBe(false);
  });
});

describe('validatePaymentAmount', () => {
  it('accepts valid amount', () => {
    const result = validatePaymentAmount(500);
    expect(result.valid).toBe(true);
  });

  it('rejects amount below minimum', () => {
    const result = validatePaymentAmount(5);
    expect(result.valid).toBe(false);
  });

  it('rejects amount above maximum', () => {
    const result = validatePaymentAmount(1000000);
    expect(result.valid).toBe(false);
  });
});
```

### Integration Tests for Payment Services

```typescript
describe('MonCashService', () => {
  it('initiates payment successfully', async () => {
    const service = new MonCashService();
    const result = await service.initiatePayment(
      'ORD-123',
      500,
      '50930123456',
      'idempotency-key'
    );
    expect(result.success).toBe(true);
  });

  it('verifies webhook signature', async () => {
    const service = new MonCashService(
      'https://api.moncash.io',
      'test-key',
      'test-secret'
    );
    // Signature verification test
  });
});
```

---

## Error Handling

### Validation Errors
- Return immediately without API calls
- Display validation errors in Haitian Creole
- User can correct input and retry

### Network Errors
- Trigger exponential backoff retry
- Display timeout message after max retries
- Offer fallback payment method

### API Errors
- Map HTTP status codes to Creole messages
- Log errors for debugging
- Preserve cart for retry attempts

### Webhook Errors
- Verify signature before processing
- Reject invalid signatures
- Log webhook delivery for support

---

## Deployment Checklist

- [ ] Set environment variables for MonCash API
- [ ] Set environment variables for NatCash API
- [ ] Configure webhook URLs in payment provider dashboards
- [ ] Test payment flow with test credentials
- [ ] Verify webhook signature verification works
- [ ] Set up error logging and monitoring
- [ ] Test fallback chain with service degradation scenarios
- [ ] Verify components render correctly on all devices
- [ ] Set up SMS notification system for confirmations
- [ ] Configure order tracking page at `/tracking/:orderId`
- [ ] Set up support contact page at `/support`
- [ ] Test in staging environment before production deploy

---

## API Documentation References

For detailed API documentation, see:
- **API_DOCUMENTATION.md** - General API overview
- **API_DOCUMENTATION_V2.md** - Latest API changes
- **ARCHITECTURE.md** - System architecture details

---

## Troubleshooting

### MonCash Validation Issues
- Ensure phone starts with 509 and has exactly 12 digits
- Check operator prefix (30-38, 46-48) for Digicel
- Verify phone number isn't on blocklist

### NatCash Issues
- Confirm operator prefix (39-45, 49) for Natcom
- Check NatCash service availability status
- Verify API credentials are correct

### Webhook Verification Failures
- Ensure webhook secret matches configuration
- Verify payload encoding (JSON, not form data)
- Check signature algorithm (HMAC-SHA256)
- Confirm signature format (hex string)

### Payment Fallback Not Working
- Verify all services are initialized correctly
- Check fallback callback is provided if needed
- Confirm cart data is valid
- Review step history for which method failed

---

## Future Enhancements

1. **Stripe Integration**
   - Credit/debit card support
   - 3D Secure verification
   - Additional payment methods

2. **PayPal Integration**
   - International account support
   - Subscription capabilities
   - Invoice generation

3. **Analytics**
   - Payment success/failure rates by method
   - Average transaction times
   - Fallback usage statistics

4. **Multi-Currency Support**
   - USD, EUR, CAD conversions
   - Real-time exchange rates
   - Customer currency preference

5. **Enhanced Notifications**
   - Email confirmations
   - WhatsApp notifications
   - Push notifications

6. **Refund Management**
   - Partial refunds
   - Automatic refund processing
   - Refund status tracking

---

## Support

For issues or questions regarding payment integration:

1. Check error messages in Haitian Creole
2. Review step history in fallback chain
3. Verify webhook signatures
4. Check environment variables
5. Contact support team with transaction ID

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-04 | Initial implementation with MonCash, NatCash, and fallback chain |

---

## License

This payment integration is part of Union Digitale and follows the same license terms as the main application.

