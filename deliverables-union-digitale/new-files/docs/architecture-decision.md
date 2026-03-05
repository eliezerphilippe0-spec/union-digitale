# Architecture Decision: Firebase Functions vs Express+Prisma Backend

## Executive Summary

Union Digitale uses a hybrid backend architecture that separates concerns between Firebase Functions and a dedicated Express+Prisma backend. This decision maximizes scalability, reliability, and cost-efficiency for a Haitian e-commerce and services platform.

## Architecture Decision Table

| Concern | Firebase Functions | Express + Prisma | Rationale |
|---------|-------------------|------------------|-----------|
| **Authentication** | ✓ Primary | Secondary (token validation) | Firebase Auth provides out-of-box security, user management, and 2FA support |
| **Real-time Notifications** | ✓ Primary | - | Firebase Cloud Messaging (FCM) integrates seamlessly with mobile apps |
| **File Storage** | ✓ Primary (Firebase Storage) | - | Cloud Storage handles media uploads with CDN distribution |
| **Real-time Features** | ✓ Primary (Firestore) | - | Firestore Realtime Database for live order updates and bidding |
| **Payments Processing** | - | ✓ Primary | Requires PCI-compliant infrastructure and complex transaction logic |
| **Order Management** | - | ✓ Primary | Structured relational data with complex business logic |
| **Escrow Services** | - | ✓ Primary | Requires strict transaction integrity and audit trails |
| **Risk & Fraud Engine** | - | ✓ Primary | ML-driven analysis and decision-making with persistent state |

## Technology Stack

### Firebase Functions
- **Purpose**: Serverless auth, notifications, storage, and real-time sync
- **Databases**: Firestore, Firebase Storage, Firebase Auth
- **Languages**: Node.js, TypeScript
- **Deployment**: Firebase Console or `firebase deploy`
- **Pricing**: Pay-per-use, scales automatically

### Express + Prisma Backend
- **Purpose**: Stateful services with complex business logic (payments, orders, escrow)
- **Database**: PostgreSQL with Prisma ORM
- **Languages**: Node.js, TypeScript
- **Deployment**: Docker containers on Cloud Run or Kubernetes
- **Pricing**: Fixed infrastructure cost with auto-scaling

## Detailed Rationale

### Why Firebase for Auth & Notifications?

1. **Security**: Firebase Auth manages password hashing, token validation, and session management.
2. **Compliance**: Built-in support for GDPR, HIPAA-compliant user data management.
3. **Scalability**: Handles millions of concurrent users without infrastructure setup.
4. **Mobile-First**: Firebase Cloud Messaging integrates directly with iOS and Android apps.
5. **Cost**: Free tier covers small deployments; pay-per-use scales with growth.

### Why Express+Prisma for Payments & Orders?

1. **PCI Compliance**: Stripe/PayPal integrations require strict compliance and audit trails.
2. **Data Integrity**: Payments and escrow require ACID transactions impossible with Firestore.
3. **Complex Business Logic**:
   - Multi-step order workflows
   - Conditional payment routing (Stripe vs PayPal vs Mobile Money)
   - Escrow release logic with dispute handling
   - Risk scoring engine with ML integration
4. **Relational Data**: Orders have complex relationships (buyer, seller, items, payments, disputes).
5. **Stateful Processing**: Payment webhooks, recurring billing, and transaction queues need persistent state.

### Migration Path from Monolithic Firebase

**Old Architecture**: Everything in Firestore (authentication, orders, payments, storage)

**Problems Identified**:
1. No ACID transactions for payments → Risk of double-charging or failed transactions
2. Complex business logic scattered across Firestore rules → Maintenance nightmare
3. Payment PII stored in Firestore → Security risk, PCI non-compliance
4. No audit trail → Regulatory non-compliance

**New Hybrid Architecture**:
1. Phase 1 (Current): Firebase handles auth/storage, Express handles new orders
2. Phase 2: Migrate legacy Firestore orders to PostgreSQL
3. Phase 3: Implement escrow service on Express backend
4. Phase 4: Deploy risk engine with ML models

## API Gateway Pattern

The `APIGateway` class (in `src/lib/api/gateway.ts`) automatically routes requests:

```typescript
// Frontend code is agnostic to backend
const user = await apiGet('/api/orders');      // Routes to Express
const file = await apiPost('/uploadFile', {    // Routes to Firebase
  bucket: 'union-digitale',
  path: '/receipts/order-123.pdf'
});
```

The gateway:
- Routes based on endpoint path patterns
- Injects Firebase auth tokens automatically
- Implements 15-second timeout for slow networks
- Handles errors with typed APIError class
- Supports both JSON and binary responses

## Deployment Strategy

### Firebase Functions Deployment
```bash
firebase deploy --only functions
```

### Express Backend Deployment
```bash
gcloud builds submit --tag gcr.io/union-digitale/api
gcloud run deploy union-digitale-api --image gcr.io/union-digitale/api
```

## Monitoring & Observability

| Metric | Firebase | Express |
|--------|----------|---------|
| Logs | Cloud Logging + Firebase Console | Cloud Logging + Prisma query logs |
| Errors | Firebase Crashlytics | Sentry/LogRocket + custom error handlers |
| Performance | Firebase Performance Monitoring | APM tools (Datadog, New Relic) |
| Database | Firestore metrics | Prisma introspection + PostgreSQL metrics |

## Cost Estimation (Monthly)

### Firebase Functions
- 1M function invocations: ~$0.40
- 10GB Firestore storage: ~$1.00
- 50GB data transfer: ~$2.50
- **Total**: ~$4-10/month (small scale)

### Express Backend on Cloud Run
- 1000 CPU-hours: ~$25
- 2000GB RAM-hours: ~$25
- PostgreSQL Cloud SQL (small instance): ~$50
- **Total**: ~$100-150/month (production scale)

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Vendor lock-in to Google Cloud | Use standard Node.js, PostgreSQL, Docker for portability |
| Inconsistent auth between backends | Validate JWT tokens in Express; share Firebase Secret key |
| Data sync issues | No two-way sync; Firebase is source-of-truth for users, Express for orders |
| Network latency | 15-second timeout, client-side retry logic, async processing for non-critical operations |

## Future Enhancements

1. **Caching Layer**: Redis for order and product caching
2. **Message Queue**: Cloud Pub/Sub for async payment processing
3. **Event Sourcing**: Store all payment events for audit compliance
4. **ML Models**: Deploy TensorFlow models on Cloud AI Platform for risk scoring
5. **GraphQL**: Add GraphQL endpoint for efficient mobile data fetching

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Prisma ORM Documentation](https://www.prisma.io/docs/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [PCI DSS Compliance Guide](https://www.pcisecuritystandards.org/)
