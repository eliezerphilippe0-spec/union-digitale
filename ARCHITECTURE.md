# Union Digitale - Architecture Technique

## Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────────┤
│  React Web  │  iOS App    │ Android App │   PWA       │    Admin Panel      │
│  (Vite)     │ (Capacitor) │ (Capacitor) │             │                     │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴──────────┬──────────┘
       │             │             │             │                  │
       └─────────────┴─────────────┴─────────────┴──────────────────┘
                                   │
                     ┌─────────────▼─────────────┐
                     │    Firebase Hosting       │
                     │    (CDN Global)           │
                     └─────────────┬─────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       │                           │                           │
       ▼                           ▼                           ▼
┌──────────────┐          ┌───────────────┐          ┌───────────────┐
│   Firebase   │          │ Cloud         │          │   Firebase    │
│   Auth       │          │ Functions v2  │          │   Storage     │
│              │          │ (Node.js 18)  │          │   (GCS)       │
│ - Email/Pass │          │               │          │               │
│ - Google     │          │ ┌───────────┐ │          │ - Products    │
│ - Phone      │          │ │  Orders   │ │          │ - Vendors     │
│ - Custom     │          │ │  Reviews  │ │          │ - Users       │
│   Claims     │          │ │  Chat     │ │          │               │
└──────────────┘          │ │  Payments │ │          └───────┬───────┘
                          │ │  Search   │ │                  │
                          │ │  Cache    │ │                  ▼
                          │ │  Auth     │ │          ┌───────────────┐
                          │ │  Audit    │ │          │     Sharp     │
                          │ └───────────┘ │          │ (Image Opt.)  │
                          └───────┬───────┘          └───────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   Firestore   │         │    Algolia    │         │ Upstash Redis │
│   (NoSQL)     │         │   (Search)    │         │   (Cache)     │
│               │         │               │         │               │
│ Collections:  │         │ - Products    │         │ - Popular     │
│ - users       │◄────────│ - typo-tol.   │         │ - Stats       │
│ - products    │  sync   │ - facets      │         │ - Categories  │
│ - orders      │         │ - geo         │         │               │
│ - reviews     │         └───────────────┘         └───────────────┘
│ - messages    │
│ - coupons     │
│ - auditLogs   │
└───────────────┘
        │
        │ Triggers
        ▼
┌───────────────────────────────────────────────────────────────────┐
│                     BACKGROUND TRIGGERS                            │
├───────────────┬───────────────┬───────────────┬───────────────────┤
│ onDocumentWritten  │ onObjectFinalized │ onSchedule     │ onCall  │
│ - Rating update    │ - Image optimize  │ - Cleanup      │ - API   │
│ - Vendor stats     │ - WebP convert    │ - Reports      │         │
│ - Audit logs       │ - Thumbnails      │ - Alerts       │         │
└───────────────┴───────────────┴───────────────┴───────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│    Stripe     │          │   MonCash     │          │    Twilio     │
│  (Payments)   │          │  (Haiti Pay)  │          │ (SMS/WhatsApp)│
└───────────────┘          └───────────────┘          └───────────────┘
                                   │
                                   ▼
                          ┌───────────────┐
                          │   SendGrid    │
                          │   (Emails)    │
                          └───────────────┘
                                   │
                                   ▼
                          ┌───────────────┐
                          │    Sentry     │
                          │  (Monitoring) │
                          └───────────────┘
```

---

## Stack Technologique

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 19.x | UI Framework |
| Vite | 7.x | Build Tool |
| Tailwind CSS | 4.x | Styling |
| Capacitor | 7.x | Mobile (iOS/Android) |
| React Router | 7.x | Navigation |
| Zustand | 5.x | State Management |
| React Query | 5.x | Data Fetching |
| Framer Motion | 12.x | Animations |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Firebase Functions | v2 | Serverless API |
| Node.js | 18 | Runtime |
| TypeScript | 4.9 | Type Safety |
| Firebase Admin | 12.x | Backend SDK |

### Base de Données
| Service | Usage |
|---------|-------|
| Cloud Firestore | Primary Database |
| Upstash Redis | Caching Layer |
| Algolia | Full-text Search |

### Services Externes
| Service | Usage |
|---------|-------|
| Stripe | Paiements internationaux |
| MonCash | Paiements locaux Haïti |
| PayPal | Paiements alternatifs |
| Twilio | SMS & WhatsApp |
| SendGrid | Emails transactionnels |
| Sentry | Error Tracking |

---

## Flux de Données

### 1. Flux de Commande

```
┌─────────┐     ┌─────────┐     ┌──────────────┐     ┌─────────────┐
│ Panier  │────▶│Checkout │────▶│createOrderSecure│──▶│ Validation  │
└─────────┘     └─────────┘     └──────────────┘     └──────┬──────┘
                                                            │
    ┌───────────────────────────────────────────────────────┘
    │
    ▼
┌───────────────┐     ┌─────────────┐     ┌─────────────────┐
│ Price Check   │────▶│ Stock Check │────▶│ Coupon Validate │
│ (Server-side) │     │             │     │                 │
└───────────────┘     └─────────────┘     └────────┬────────┘
                                                    │
    ┌───────────────────────────────────────────────┘
    │
    ▼
┌───────────────┐     ┌─────────────┐     ┌─────────────────┐
│ Create Order  │────▶│ Payment     │────▶│ Vendor Notify   │
│ (Firestore)   │     │ (MonCash/   │     │ (WhatsApp/Email)│
│               │     │  Stripe)    │     │                 │
└───────────────┘     └─────────────┘     └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Webhook Handler │
                    │ (Payment Confirm│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Update Order    │
                    │ Status + Audit  │
                    └─────────────────┘
```

### 2. Flux de Recherche

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User Search │────▶│ Algolia     │────▶│ Results     │
│ Input       │     │ Search API  │     │ (<100ms)    │
└─────────────┘     └─────────────┘     └─────────────┘

Background Sync:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Product     │────▶│ Firestore   │────▶│ Algolia     │
│ Change      │     │ Trigger     │     │ Index       │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 3. Flux de Cache

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Client      │────▶│ Cloud       │────▶│ Redis Check │
│ Request     │     │ Function    │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┤
                    │                          │
              Cache HIT                  Cache MISS
                    │                          │
                    ▼                          ▼
            ┌───────────────┐          ┌───────────────┐
            │ Return Cached │          │ Query         │
            │ Data          │          │ Firestore     │
            └───────────────┘          └───────┬───────┘
                                               │
                                               ▼
                                       ┌───────────────┐
                                       │ Store in      │
                                       │ Redis + TTL   │
                                       └───────────────┘
```

---

## Sécurité

### Couches de Sécurité

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: Network                         │
│            Firebase Security Rules + HTTPS                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 2: Auth                            │
│         Firebase Auth + Custom Claims + 2FA                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 3: Rate Limiting                     │
│              Redis-based per-user/per-action                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 4: Validation                        │
│          Server-side price/input/vendor validation          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 5: Audit                           │
│              Complete audit trail for compliance            │
└─────────────────────────────────────────────────────────────┘
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Products: public read, vendor write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth.token.role == 'vendor'
                   && request.auth.token.vendorId == resource.data.vendorId;
    }

    // Orders: user can read own, vendor can read assigned
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.userId
                  || request.auth.token.vendorId in resource.data.vendorIds;
      allow create: if request.auth != null;
      allow update: if request.auth.token.role == 'vendor'
                    || request.auth.token.role == 'admin';
    }

    // Reviews: authenticated users can create, read public
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }

    // Messages: only participants
    match /messages/{messageId} {
      allow read, write: if request.auth.uid in resource.data.participants;
    }

    // Audit logs: admin only
    match /auditLogs/{logId} {
      allow read: if request.auth.token.role == 'admin';
      allow write: if false; // Only functions can write
    }
  }
}
```

---

## Scalabilité

### Phase 1: 0-10K Users ($320/mois)
```
┌───────────────┐
│ Single Region │
│  us-central1  │
│               │
│ Firestore:    │
│  10GB storage │
│  50K reads/d  │
│               │
│ Functions:    │
│  2M invoc./mo │
│               │
│ Redis:        │
│  10K cmd/day  │
│               │
│ Algolia:      │
│  10K records  │
│  100K search  │
└───────────────┘
```

### Phase 2: 10K-50K Users ($500/mois)
```
┌───────────────┐     ┌───────────────┐
│   us-east1    │     │ europe-west1  │
│               │     │               │
│  Firestore    │◄───▶│  Firestore    │
│  (Primary)    │     │  (Replica)    │
│               │     │               │
│  Functions    │     │  Functions    │
│  Redis        │     │  Redis        │
└───────────────┘     └───────────────┘
        │                     │
        └──────────┬──────────┘
                   │
          ┌───────────────┐
          │   CDN Global  │
          │  (Cloudflare) │
          └───────────────┘
```

### Phase 3: 50K-500K Users ($5000+/mois)
```
┌───────────────────────────────────────────────────┐
│                  GLOBAL DISTRIBUTION              │
├───────────────┬───────────────┬───────────────────┤
│   Americas    │    Europe     │    Africa/ME      │
│  us-central1  │  europe-west1 │   africa-south1   │
│  us-east1     │  europe-west4 │                   │
└───────┬───────┴───────┬───────┴─────────┬─────────┘
        │               │                 │
        └───────────────┼─────────────────┘
                        │
                ┌───────────────┐
                │   BigQuery    │
                │  (Analytics)  │
                └───────────────┘
                        │
                ┌───────────────┐
                │   Dataflow    │
                │  (Real-time)  │
                └───────────────┘
```

---

## Monitoring

### Dashboard Sentry
```
┌──────────────────────────────────────────────────────────────┐
│                     SENTRY DASHBOARD                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Errors (24h): 12        │  Performance Score: 87%           │
│  ▼ -40% from yesterday   │  ▲ +5% from yesterday             │
│                          │                                    │
│  ┌─────────────────────┐ │  ┌─────────────────────┐          │
│  │ Top Errors          │ │  │ Slow Transactions   │          │
│  │ 1. PaymentFailed: 5 │ │  │ 1. getVendorStats   │          │
│  │ 2. NetworkError: 4  │ │  │ 2. createOrder      │          │
│  │ 3. ValidationErr: 3 │ │  │ 3. searchProducts   │          │
│  └─────────────────────┘ │  └─────────────────────┘          │
│                          │                                    │
└──────────────────────────────────────────────────────────────┘
```

### Métriques Clés
| Métrique | Cible | Actuel |
|----------|-------|--------|
| Error Rate | <1% | 0.3% |
| p95 Latency | <500ms | 320ms |
| Uptime | 99.9% | 99.95% |
| Cache Hit Rate | >60% | 72% |
| Search Latency | <100ms | 45ms |

---

## Déploiement

### CI/CD Pipeline

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Push   │────▶│  Lint   │────▶│  Test   │────▶│  Build  │
│  Code   │     │         │     │         │     │         │
└─────────┘     └─────────┘     └─────────┘     └────┬────┘
                                                      │
    ┌─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   E2E       │────▶│   Security   │────▶│   Deploy    │
│   Tests     │     │   Scan       │     │   Preview   │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
                          (PR Merged to main)    │
                                                 ▼
                                         ┌─────────────┐
                                         │   Deploy    │
                                         │   Prod      │
                                         └─────────────┘
```

### Commandes de déploiement
```bash
# Preview (PR)
firebase hosting:channel:deploy pr-123

# Production
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:indexes
```

---

## Contacts

- **Architecture**: architecture@uniondigitale.ht
- **DevOps**: devops@uniondigitale.ht
- **Security**: security@uniondigitale.ht

---

*Document créé: Janvier 2026*
*Version: 2.0*
