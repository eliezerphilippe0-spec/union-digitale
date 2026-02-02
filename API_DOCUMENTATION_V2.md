# Union Digitale API Documentation

## Overview

Union Digitale backend API built on Firebase with Cloud Functions, Firestore, and Firebase Auth.

**Base URL**: `https://us-central1-[PROJECT-ID].cloudfunctions.net`

**Authentication**: Firebase Auth tokens (Bearer)

---

## Authentication

All API endpoints require Firebase Auth token in header:

```http
Authorization: Bearer <firebase_id_token>
```

### Get Auth Token

```javascript
import { auth } from './lib/firebase';
const token = await auth.currentUser.getIdToken();
```

---

## Endpoints

### Orders

#### Create Order

```http
POST /createOrderSecure
```

**Request Body**:
```json
{
  "items": [
    {
      "productId": "string",
      "vendorId": "string",
      "name": "string",
      "price": number,
      "quantity": number
    }
  ],
  "totalAmount": number,
  "paymentMethod": "moncash" | "stripe" | "wallet",
  "shippingAddress": {
    "fullName": "string",
    "phone": "string",
    "address": "string",
    "city": "string",
    "department": "string"
  }
}
```

**Validation**:
- `totalAmount`: 0 < amount ≤ 10,000,000 HTG
- `items`: 1-50 items max
- `quantity`: 1-100 per item

**Response**:
```json
{
  "orderId": "string",
  "status": "pending_payment"
}
```

---

### Payments

#### Process MonCash Payment

```http
POST /createMonCashPayment
```

**Request Body**:
```json
{
  "orderId": "string",
  "amount": number,
  "currency": "HTG",
  "idempotencyKey": "string"
}
```

**Response**:
```json
{
  "redirectUrl": "string",
  "transactionId": "string"
}
```

**Rate Limit**: 10 requests/minute per user

---

#### MonCash Webhook

```http
POST /moncashWebhook
```

**Headers**:
```http
X-MonCash-Signature: <hmac_signature>
```

**Request Body**:
```json
{
  "orderId": "string",
  "transactionId": "string",
  "amount": number,
  "status": "successful" | "failed",
  "timestamp": "ISO8601"
}
```

**Security**:
- HMAC SHA-256 signature verification
- Replay attack protection (5 min window)
- Idempotency checks

---

### Transactions

#### Log Transaction

Client-side function (not HTTP endpoint):

```javascript
import { logTransaction, TRANSACTION_TYPES } from './utils/transactionLogger';

await logTransaction({
  userId: currentUser.uid,
  type: TRANSACTION_TYPES.PAYMENT_EDH,
  amount: 500,
  accountNumber: '12345678',
  metadata: {
    service: 'EDH Payment',
    billingMonth: '2026-01'
  }
});
```

**Transaction Types**:
- `recharge_moncash`: 50-50,000 HTG
- `recharge_natcash`: 50-50,000 HTG
- `transfer`: 50-50,000 HTG
- `payment_edh`: 100-100,000 HTG
- `payment_camep`: 50-50,000 HTG

---

#### Get User Transactions

```javascript
import { getUserTransactions } from './utils/transactionLogger';

const result = await getUserTransactions(userId, {
  limit: 50,
  type: 'payment_edh', // optional
  status: 'completed', // optional
  startAfter: lastDoc // for pagination
});

// result = { transactions: [], hasMore: boolean, lastDoc: DocumentSnapshot }
```

---

### Wallet

#### Wallet Operations

```http
POST /walletDeposit
POST /walletWithdraw
GET /walletBalance
```

**Deposit Request**:
```json
{
  "amount": number,
  "paymentMethod": "moncash" | "stripe"
}
```

**Withdraw Request**:
```json
{
  "amount": number,
  "destination": "moncash" | "bank",
  "accountNumber": "string"
}
```

**Rate Limit**: 10 requests/minute

---

### Reviews

#### Submit Review

```http
POST /submitReview
```

**Request Body**:
```json
{
  "productId": "string",
  "orderId": "string",
  "rating": 1-5,
  "comment": "string (10-1000 chars)",
  "images": ["url1", "url2"] // max 5
}
```

**Rate Limit**: 5 requests/hour

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthenticated` | 401 | Missing or invalid auth token |
| `permission-denied` | 403 | Insufficient permissions |
| `invalid-argument` | 400 | Validation failed |
| `resource-exhausted` | 429 | Rate limit exceeded |
| `not-found` | 404 | Resource not found |
| `already-exists` | 409 | Duplicate resource |
| `internal` | 500 | Server error |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 requests | 1 minute |
| Signup | 3 requests | 1 hour |
| Orders | 10 requests | 1 minute |
| Reviews | 5 requests | 1 hour |
| Messages | 30 requests | 1 minute |
| Search | 100 requests | 1 minute |

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640000000
```

---

## Webhooks

### MonCash Webhook

**URL**: `https://us-central1-[PROJECT-ID].cloudfunctions.net/moncashWebhook`

**Method**: POST

**Signature Verification**:
```javascript
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');
```

**Retry Policy**:
- Max 3 retries
- Exponential backoff: 1s, 2s, 4s

---

## Security

### Authentication

- Firebase Auth with custom claims
- Email verification required for sellers
- 2FA available

### Authorization

- Role-based access control (RBAC)
- Custom claims: `user`, `seller`, `admin`
- Firestore security rules enforce permissions

### Data Validation

- Zod schemas for all inputs
- Type-specific validators
- SQL injection protection (NoSQL)

### Rate Limiting

- Per-user limits
- Per-IP limits (fallback)
- Fail-closed for critical operations

### Monitoring

- Sentry error tracking
- Firebase quota monitoring
- Performance metrics
- Security alerts

---

## Best Practices

### Idempotency

Always include idempotency keys for payment operations:

```javascript
const idempotencyKey = `${userId}-${Date.now()}-${crypto.randomUUID()}`;
```

### Pagination

Use cursor-based pagination for large datasets:

```javascript
let lastDoc = null;
let allTransactions = [];

do {
  const result = await getUserTransactions(userId, {
    limit: 50,
    startAfter: lastDoc
  });
  
  allTransactions = [...allTransactions, ...result.transactions];
  lastDoc = result.lastDoc;
} while (result.hasMore);
```

### Error Handling

```javascript
try {
  await createOrder(orderData, user);
} catch (error) {
  if (error.code === 'resource-exhausted') {
    // Rate limit exceeded
    showRateLimitMessage();
  } else if (error.code === 'invalid-argument') {
    // Validation failed
    showValidationErrors(error.details);
  } else {
    // Generic error
    showGenericError();
  }
}
```

---

## Support

- **Documentation**: https://docs.uniondigitale.com
- **API Status**: https://status.uniondigitale.com
- **Support Email**: support@uniondigitale.com
- **Developer Slack**: https://slack.uniondigitale.com

---

## Changelog

### v1.0.0 (2026-01-25)
- Initial API release
- Firebase Auth integration
- MonCash payment gateway
- Stripe payment gateway
- Transaction logging
- Rate limiting
- Validation schemas
- Monitoring & alerting
