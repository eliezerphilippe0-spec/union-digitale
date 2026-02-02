# Security Guide for Developers
## Union Digitale Backend

---

## 1. Security Principles

### 1.1 Defense in Depth

**Multiple layers of security**:
1. **Client-side**: Input validation, Firebase App Check
2. **Network**: HTTPS only, CORS configuration
3. **Authentication**: Firebase Auth with custom claims
4. **Authorization**: Firestore security rules
5. **Application**: Zod validation, rate limiting
6. **Data**: Encryption at rest and in transit

### 1.2 Principle of Least Privilege

- Users get minimum permissions needed
- Service accounts have scoped access
- API keys are restricted by domain/IP

### 1.3 Fail Secure

- Rate limiting fails closed for critical operations
- Validation errors block requests
- Unknown users are denied by default

---

## 2. Authentication & Authorization

### 2.1 Firebase Auth Best Practices

**DO**:
✅ Always verify ID tokens server-side
✅ Use custom claims for roles (not Firestore data)
✅ Require email verification for sellers
✅ Implement 2FA for admin accounts
✅ Set session timeout appropriately

**DON'T**:
❌ Trust client-side role checks
❌ Store sensitive data in custom claims
❌ Use predictable user IDs
❌ Allow password reuse

**Example**:
```javascript
// ✅ CORRECT: Verify token server-side
const decodedToken = await admin.auth().verifyIdToken(idToken);
if (decodedToken.role !== 'admin') {
  throw new Error('Unauthorized');
}

// ❌ WRONG: Trust client-side claim
if (currentUser.customClaims?.role === 'admin') {
  // User can modify this!
}
```

### 2.2 Custom Claims

**Setting Claims** (Admin SDK only):
```javascript
await admin.auth().setCustomUserClaims(uid, {
  role: 'seller',
  emailVerified: true
});
```

**Reading Claims** (Client):
```javascript
const idTokenResult = await currentUser.getIdTokenResult();
const role = idTokenResult.claims.role;
```

---

## 3. Input Validation

### 3.1 Always Validate Server-Side

**DO**:
✅ Use Zod schemas for all inputs
✅ Validate on both client and server
✅ Sanitize user-generated content
✅ Reject unexpected fields

**DON'T**:
❌ Trust client-side validation alone
❌ Use eval() or Function() on user input
❌ Allow arbitrary HTML/JavaScript

**Example**:
```javascript
// ✅ CORRECT: Server-side validation
import { OrderCreateSchema, safeValidate } from './validationSchemas';

const validation = safeValidate(OrderCreateSchema, orderData);
if (!validation.success) {
  throw new Error('Invalid order data');
}

// ❌ WRONG: No validation
const order = await createOrder(req.body); // Dangerous!
```

### 3.2 Validation Schemas

**Use type-specific validators**:
```javascript
// Different limits for different transaction types
const TransactionValidators = {
  payment_edh: TransactionSchema.extend({
    amount: z.number().min(100).max(100000),
    accountNumber: z.string().regex(/^[0-9]{8,12}$/)
  }),
  transfer: TransactionSchema.extend({
    amount: z.number().min(50).max(50000),
    phoneNumber: z.string().regex(/^[0-9]{4}-[0-9]{4}$/)
  })
};
```

---

## 4. Firestore Security Rules

### 4.1 Rule Best Practices

**DO**:
✅ Use custom claims for roles
✅ Validate data types and ranges
✅ Check ownership before allowing access
✅ Use functions to avoid repetition
✅ Test rules with emulator

**DON'T**:
❌ Allow public write access
❌ Read user roles from Firestore
❌ Use `allow read, write: if true`
❌ Trust client-provided IDs

**Example**:
```javascript
// ✅ CORRECT: Validate ownership and data
match /orders/{orderId} {
  allow create: if isAuthenticated() && 
    request.resource.data.userId == request.auth.uid &&
    request.resource.data.amount > 0 &&
    request.resource.data.amount < 10000000;
}

// ❌ WRONG: No validation
match /orders/{orderId} {
  allow read, write: if true; // Anyone can do anything!
}
```

### 4.2 Common Patterns

**Ownership Check**:
```javascript
function isOwner(userId) {
  return request.auth.uid == userId;
}

match /users/{userId} {
  allow read, write: if isOwner(userId);
}
```

**Role Check (Custom Claims)**:
```javascript
function isAdmin() {
  return request.auth.token.role == 'admin';
}

match /admin_panel/{doc} {
  allow read, write: if isAdmin();
}
```

**Data Validation**:
```javascript
match /products/{productId} {
  allow create: if request.resource.data.price > 0 &&
                   request.resource.data.price < 10000000 &&
                   request.resource.data.name.size() > 3;
}
```

---

## 5. Rate Limiting

### 5.1 Implementation

**Use rate limiting for**:
- Login attempts (5/minute)
- Order creation (10/minute)
- API calls (60/minute)
- Reviews (5/hour)

**Example**:
```javascript
import { withRateLimit } from './security/rateLimiting';

export const createOrder = withRateLimit('order', async (request) => {
  // Your logic here
});
```

### 5.2 Fail-Closed Strategy

**Critical operations** (login, signup, orders):
```javascript
if (criticalActions.includes(action)) {
  // Deny if rate limiting fails
  return { allowed: false };
}
```

**Non-critical operations** (search, messages):
```javascript
// Allow if rate limiting fails
return { allowed: true };
```

---

## 6. Payment Security

### 6.1 Webhook Verification

**ALWAYS verify webhook signatures**:
```javascript
function verifyWebhookSignature(rawBody, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  
  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 6.2 Idempotency

**Always use idempotency keys**:
```javascript
const idempotencyKey = `${userId}-${Date.now()}-${crypto.randomUUID()}`;

await createPayment({
  orderId,
  amount,
  idempotencyKey
});
```

### 6.3 Amount Validation

**Validate amounts match**:
```javascript
if (Math.abs(orderData.totalPrice - webhookAmount) > 0.01) {
  throw new Error('Amount mismatch');
}
```

---

## 7. Secrets Management

### 7.1 Environment Variables

**DO**:
✅ Use `.env.local` for local development
✅ Use Firebase Functions secrets for production
✅ Never commit secrets to Git
✅ Rotate secrets regularly

**DON'T**:
❌ Hardcode secrets in code
❌ Commit `.env` files
❌ Share secrets via email/Slack
❌ Use same secrets for dev/prod

**Example**:
```bash
# ✅ CORRECT: Use environment variables
const apiKey = process.env.STRIPE_SECRET_KEY;

# ❌ WRONG: Hardcoded
const apiKey = 'sk_live_abc123...'; // Never do this!
```

### 7.2 Firebase Functions Secrets

**Set secrets**:
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
```

**Use in code**:
```javascript
import { defineSecret } from 'firebase-functions/params';
const stripeKey = defineSecret('STRIPE_SECRET_KEY');

export const processPayment = onCall({ secrets: [stripeKey] }, async (request) => {
  const stripe = new Stripe(stripeKey.value());
});
```

---

## 8. Error Handling

### 8.1 Don't Expose Sensitive Information

**DO**:
✅ Log detailed errors server-side
✅ Return generic messages to client
✅ Use error codes, not messages
✅ Track errors in Sentry

**DON'T**:
❌ Return stack traces to client
❌ Expose database errors
❌ Reveal system information
❌ Show file paths

**Example**:
```javascript
// ✅ CORRECT: Generic client message, detailed server log
try {
  await processPayment(data);
} catch (error) {
  logger.error('Payment failed', error, { userId, amount });
  throw new Error('Payment processing failed. Please try again.');
}

// ❌ WRONG: Expose details
catch (error) {
  throw error; // Sends stack trace to client!
}
```

---

## 9. Monitoring & Alerting

### 9.1 What to Monitor

**Critical Alerts** (immediate notification):
- Failed login attempts (>5 in 1 min)
- Unusual transaction amounts (>5x average)
- Multiple orders in short time (>3 in 5 min)
- Firestore quota >95%
- Error rate >10%

**Warning Alerts** (email):
- Slow API responses (>3s)
- Firestore quota >80%
- Failed backups

### 9.2 Security Alerts

**Track suspicious activity**:
```javascript
import { alertSuspiciousActivity } from './monitoring';

if (failedLoginAttempts > 5) {
  alertSuspiciousActivity({
    type: 'multiple_failed_logins',
    userId,
    details: { attempts: failedLoginAttempts }
  });
}
```

---

## 10. Common Vulnerabilities

### 10.1 Injection Attacks

**NoSQL Injection** (Firestore):
```javascript
// ❌ WRONG: User input in query
const results = await db.collection('users')
  .where('email', '==', userInput) // Dangerous if not validated
  .get();

// ✅ CORRECT: Validate first
const email = EmailSchema.parse(userInput);
const results = await db.collection('users')
  .where('email', '==', email)
  .get();
```

### 10.2 Cross-Site Scripting (XSS)

**Sanitize user content**:
```javascript
import { sanitizeInput } from './security/rateLimiting';

const comment = sanitizeInput(userInput);
// Removes <script>, javascript:, on*= handlers
```

### 10.3 Privilege Escalation

**Always verify permissions**:
```javascript
// ❌ WRONG: Trust client-provided role
if (userData.role === 'admin') {
  // User can set this themselves!
}

// ✅ CORRECT: Check custom claims
const token = await admin.auth().verifyIdToken(idToken);
if (token.role === 'admin') {
  // Only admin SDK can set this
}
```

---

## 11. Security Checklist

### Before Deploying

- [ ] All secrets in environment variables
- [ ] Firestore rules deployed and tested
- [ ] Storage rules deployed and tested
- [ ] App Check enabled
- [ ] Sentry monitoring active
- [ ] Rate limiting configured
- [ ] Validation schemas in place
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Backup strategy implemented
- [ ] Security tests passing
- [ ] No hardcoded credentials
- [ ] Error messages don't expose sensitive data
- [ ] Logs don't contain secrets
- [ ] Dependencies up to date

### Monthly Review

- [ ] Review access logs
- [ ] Check for failed login attempts
- [ ] Review Sentry errors
- [ ] Verify backup integrity
- [ ] Update dependencies
- [ ] Rotate secrets
- [ ] Review Firestore rules
- [ ] Check quota usage

---

## 12. Incident Response

### If You Discover a Vulnerability

1. **Don't panic** - Document the issue
2. **Assess severity** - P1 (critical) to P3 (low)
3. **Notify team** - Use security@ email
4. **Patch immediately** - For P1 issues
5. **Test fix** - Verify vulnerability is closed
6. **Deploy** - Push to production
7. **Monitor** - Watch for exploitation attempts
8. **Document** - Write post-mortem

### If You're Breached

1. **Isolate** - Deploy emergency Firestore rules
2. **Assess** - Check audit logs
3. **Revoke** - Rotate all credentials
4. **Notify** - Inform affected users
5. **Patch** - Fix vulnerability
6. **Restore** - From backup if needed
7. **Report** - Follow legal requirements

---

## 13. Resources

### Documentation
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/Top10/)
- [Zod Documentation](https://zod.dev/)

### Tools
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)
- [Sentry](https://sentry.io)
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)

### Training
- Firebase Security Course
- OWASP Secure Coding Practices
- Web Security Academy

---

**Remember**: Security is not a one-time task, it's an ongoing process. Stay vigilant! 🛡️
