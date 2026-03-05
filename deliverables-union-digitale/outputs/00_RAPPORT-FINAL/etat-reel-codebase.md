# ÉTAT RÉEL DE LA CODEBASE — UNION DIGITALE
**Date d'analyse :** 4 mars 2026
**Source :** `union-digitale-master.zip` (repo GitHub privé : `eliezerphilippe0-spec/union-digitale`)
**Analyste :** Claude (Cowork Mode)

---

## 1. STACK TECHNIQUE DÉTECTÉ (versions exactes)

### Frontend
| Technologie | Version |
|---|---|
| **React** | 19.2.0 |
| **Vite** | 7.2.4 |
| **React Router DOM** | 7.9.6 |
| **TypeScript** (partiel) | 5.9.3 |
| **TailwindCSS** | 4.1.17 |
| **Framer Motion** | 12.23.25 |
| **Lucide React** | 0.555.0 |
| **Recharts** | 3.5.1 |
| **React Helmet Async** | 2.0.5 |
| **Sentry (React)** | 10.33.0 |
| **Leaflet / React-Leaflet** | 1.9.4 / 5.0.0 |
| **Spline (3D)** | @splinetool/react-spline 4.1.0 |

### Backend principal (Express + Prisma)
| Technologie | Version |
|---|---|
| **Node.js** | ≥ 18.0.0 |
| **Express** | 4.18.2 |
| **Prisma ORM** | 5.22.0 |
| **PostgreSQL** | (driver Prisma, version DB non fixée) |
| **JWT (jsonwebtoken)** | 9.0.2 |
| **bcryptjs** | 2.4.3 |
| **Stripe SDK (backend)** | 14.14.0 |
| **Nodemailer** | 6.9.8 |
| **node-cron** | 3.0.3 |

### Firebase / Cloud Functions
| Technologie | Version |
|---|---|
| **Firebase SDK (frontend)** | 12.6.0 |
| **Firebase Admin SDK** | 13.6.0 |
| **Firebase Functions** | 7.0.1 |
| **Firebase Functions (Cloud)** | 5.0.0 |
| **Stripe SDK (Functions)** | 20.0.0 |
| **SendGrid** | @sendgrid/mail 8.1.6 |
| **Twilio** | 5.11.2 |
| **Algolia** | algoliasearch 5.46.3 |
| **Upstash Redis** | 1.36.1 |
| **Sentry (Node)** | 10.33.0 |
| **Sharp (image)** | 0.34.5 |
| **Runtime Node Firebase** | 18 |

### Mobile (Capacitor)
| Technologie | Version |
|---|---|
| **Capacitor Core/CLI** | 7.4.4 |
| **@capacitor/android** | 7.4.4 |
| **@capacitor/ios** | 7.4.4 |
| **App ID** | `ht.uniondigitale.app` |

### Paiement
| Technologie | Version |
|---|---|
| **@stripe/react-stripe-js** | 5.4.1 |
| **@stripe/stripe-js** | 8.5.3 |
| **@paypal/react-paypal-js** | 8.9.2 |

### Tests
| Outil | Version |
|---|---|
| **Vitest** | 4.0.17 |
| **Playwright** | 1.57.0 |
| **Jest (backend + functions)** | 30.2.0 |

---

## 2. ARCHITECTURE GLOBALE

Le projet est organisé en **4 couches distinctes** :

```
union-digitale/
├── src/                   # Frontend React (SPA Vite)
├── backend/               # API REST Express + Prisma + PostgreSQL
├── functions/             # Cloud Functions Firebase (TypeScript)
├── functions-whatsapp/    # Cloud Functions WhatsApp dédiées
├── twilio-serverless/     # Fonctions Twilio Serverless
└── android/               # App Android (Capacitor)
```

**Remarque critique :** Le projet contient **deux backends distincts et parallèles** :
- Un backend Express/PostgreSQL/Prisma (`backend/`) → architecture classique REST
- Des Cloud Functions Firebase (`functions/`) → architecture serverless

Le frontend React consomme **principalement Firebase/Firestore** via le SDK client, pas l'API Express. Le backend Express semble être une architecture alternative ou en cours de remplacement.

---

## 3. ROUTES FRONTEND (App.jsx — React Router DOM v7)

### Routes publiques (MainLayout)
| Path | Composant |
|---|---|
| `/` | Home |
| `/product/:id` | ProductDetails |
| `/cart` | Cart |
| `/checkout` | OnePageCheckout |
| `/order-confirmation` | OrderConfirmation |
| `/catalog`, `/category/:category` | Catalog |
| `/union-dh`, `/flash-sales`, `/deals`, `/new-arrivals`, `/best-sellers` | Catalog (filtres) |
| `/vendors`, `/vendor/:vendorId` | VendorsPage / VendorShop |
| `/services`, `/services/:id` | ServiceCatalog / ServiceDetails |
| `/cars`, `/car/:id` | CarsCatalog / CarDetails |
| `/real-estate`, `/real-estate/:id` | RealEstateCatalog / RealEstateDetails |
| `/learn`, `/learn/course/:id`, `/learn/my-courses` | LearnCatalog / CourseDetails |
| `/travel` | Travel |
| `/tracking/:orderId` | TrackingPage |
| `/loyalty`, `/rewards` | LoyaltyDashboard |
| `/wallet` | Wallet |
| `/ambassador/*` | Programme Ambassadeur (Landing / Onboarding / Dashboard / Resources) |
| `/digital/product/:id`, `/digital/checkout/:id` | Produits numériques |
| `/pay`, `/pay/transfer`, `/pay/credit` | PayHub / Transfer / Credit |
| `/utilities/*` | UtilitiesHub / ElectricityPayment / MobileRecharge |
| `/services/recharge-moncash` etc. | Services financiers haïtiens |
| `/gift-cards`, `/union-plus`, `/fierte-union` | UnionPlus / GiftCards |

### Routes Admin
| Path | Composant |
|---|---|
| `/admin` | AdminDashboard |
| `/admin/products` | AdminProducts |
| `/admin/orders` | AdminOrders |
| `/admin/moderation` | StoreModeration |
| `/admin/users` | AdminUsers |
| `/admin/payouts` | AdminPayouts |
| `/admin/risk-monitoring` | RiskMonitoring |
| `/admin/trust` | TrustMonitoring |
| `/admin/compliance` | ComplianceDashboard |
| `/admin/system-status` | SystemStatus |
| `/admin/subscription` | AdminSubscription |

### Routes Vendeur
| Path | Composant |
|---|---|
| `/seller/dashboard` | DashboardUltimate |
| `/seller/dashboard-pro` | SellerDashboard |
| `/seller/products/new` | AddProduct |
| `/seller/services/new` | AddService |
| `/seller/cars/new` | AddCar |
| `/seller/real-estate/new` | AddRealEstate |
| `/seller/analytics` | AdvancedAnalytics |
| `/seller/pos` | POSTerminal |
| `/seller/credit` | SellerCredit |
| `/seller/smart-audit` | SmartAudit |
| `/seller/verify` | KYCVerification |

**Total : ~80 routes distinctes**

---

## 4. SCHÉMA BASE DE DONNÉES (Prisma — PostgreSQL)

Le schéma est **complet et production-ready**. Modèles principaux :

| Modèle | Description |
|---|---|
| `User` | Acheteurs/Vendeurs/Admins avec loyalty points, cashback, wallet |
| `Address` | Adresses de livraison (Départements d'Haïti) |
| `Store` | Boutiques vendeurs avec KYC, risk level, trust score, commissions |
| `Product` | Produits avec inventaire, SKU, SEO, variantes, multi-images |
| `Category` | Catégories hiérarchiques (parent/child) |
| `Order` | Commandes avec escrow, commission, points appliqués |
| `OrderItem` | Lignes de commande (snapshot prix) |
| `CartItem` | Panier persistant |
| `Review` | Avis vérifiés acheteurs |
| `Favorite` | Liste de favoris |
| `Payout` | Versements vendeurs (MonCash, virement) |
| `Notification` | Notifications in-app |
| `CashbackTransaction` | Système de cashback avec expiration |
| `PointsWallet` + `PointsLedger` | Programme de points fidélité (double-entry) |
| `SellerBalance` + `FinancialLedger` | Ledger financier escrow/payout |
| `PayoutRequest` | Demandes de versement avec workflow d'approbation |
| `RiskEvent` + `RiskRuleConfig` + `RiskSnapshot` | Moteur de risque anti-fraude |
| `TrustEvent` | Scoring confiance vendeur (5 tiers : ELITE→RESTRICTED) |
| `JobLock` | Gestion des jobs CRON distribués |

**Énumérations clés :**
- `PaymentMethod` : `CASH_ON_DELIVERY`, `MONCASH`, `NATCASH`, `CARD`, `BANK_TRANSFER`
- `EscrowStatus` : `NONE`, `HELD`, `RELEASED`, `REVERSED`
| `TrustTier` : `ELITE`, `TRUSTED`, `STANDARD`, `WATCH`, `RESTRICTED`
- `RiskLevel` : `NORMAL`, `WATCH`, `HIGH`, `FROZEN`

---

## 5. INTÉGRATIONS PAIEMENT TROUVÉES DANS LE CODE

### ✅ Stripe (Cartes internationales)
- **Frontend** : `src/components/payments/StripeForm.jsx` — CardElement Stripe.js + confirmation PaymentIntent
- **Cloud Functions** : `functions/src/payments/stripePayment.ts` — création PaymentIntent côté serveur
- **Backend Express** : `backend/src/routes/payments.js` + `backend/src/services/` (route dédiée)
- **Config** : clé publique via `VITE_STRIPE_PUBLISHABLE_KEY`, clé secrète via `STRIPE_SECRET_KEY`
- **État** : ✅ **Intégration complète et fonctionnelle** (code réel, pas de simulation)

### ✅ MonCash (Digicel Haïti — Mobile Money)
- **Frontend** : `src/services/monCashPayoutService.js`
- **Backend** : `backend/src/services/moncashService.js`
- **Cloud Functions** : `functions/src/moncashWebhook.ts`, `functions/src/webhooks/moncashWebhook.ts`
- **Page dédiée** : `src/pages/services/RechargeMonCash.jsx`
- **Config** : `MONCASH_CLIENT_ID`, `MONCASH_CLIENT_SECRET`, mode sandbox/production
- **État** : ✅ **Intégration présente** (webhook + payout), mode sandbox par défaut

### ✅ NatCash (Natcom Haïti — Mobile Money)
- **Frontend** : `src/services/natCashPayoutService.js`
- **Backend** : `backend/src/services/natcashService.js`
- **Page dédiée** : `src/pages/services/RechargeNatCash.jsx`
- **Config** : `NATCASH_MERCHANT_ID`, `NATCASH_SECRET_KEY`, `NATCASH_MERCHANT_NUMBER`
- **État** : ✅ **Intégration présente**, mode sandbox par défaut

### ✅ PayPal
- **Frontend** : `src/components/payments/PayPalButton.jsx`
- **Dépendance** : `@paypal/react-paypal-js` 8.9.2
- **État** : ✅ **Composant présent** (intégration SDK React)

### ⚠️ Cash à la livraison (COD)
- `PaymentMethod.CASH_ON_DELIVERY` dans le schéma Prisma
- Flux géré dans `paymentService.js` (`status: 'paid'` si méthode `wallet`)
- **État** : ✅ Présent dans le schéma et le service

### Services financiers haïtiens (pages UI uniquement)
- Paiement EDH (électricité) : `src/pages/services/PaiementEDH.jsx`
- Paiement CAMEP (eau) : `src/pages/services/PaiementCAMEP.jsx`
- Transfert d'argent : `src/pages/services/TransfertArgent.jsx`
- **État** : ⚠️ **UI présente, backend de connexion aux APIs réelles non vérifié**

---

## 6. INTERNATIONALISATION (i18n)

### Architecture
- **Système custom** (pas de bibliothèque i18n externe type i18next)
- Fichier centralisé : `src/data/translations.js` — **7 067 lignes**
- Context React : `src/contexts/LanguageContext.jsx`
- Fonction `t(key)` — fallback sur la clé si traduction absente

### Langues présentes
| Langue | Clé | Statut |
|---|---|---|
| **Français** | `fr` | ✅ Langue principale, très complète |
| **Créole haïtien** | `ht` | ✅ Présent (53 occurrences `ht:` dans le fichier) |
| Anglais | `en` | ❓ Non confirmé explicitement dans l'analyse |

### Structure
- Pas de fichiers `/public/locales/*.json` — tout est inline dans un seul fichier JS
- Stockage de la préférence : `localStorage` (`union_digitale_lang`)

### Limitations
- Pas de gestion RTL
- Pas de formatage de nombres/devises localisé
- Pas de pluralisation avancée

---

## 7. CONFIGURATION DÉPLOIEMENT DÉTECTÉE

### Hébergement cible : **Firebase Hosting**
- Fichier `firebase.json` : `dist/` → Firebase Hosting (SPA rewrite `**` → `index.html`)
- Projet Firebase ID : `union-digitale-9748e` (dans `.env.example` functions)
- Cache `.firebase/` présent → déjà configuré localement

### Cloud Functions
- 2 codebases Firebase Functions :
  - `functions/` (TypeScript, codebase `default`, Node 18)
  - `functions-whatsapp/` (JavaScript, codebase `whatsapp`, Node 18)
- Script Twilio Serverless séparé (`twilio-serverless/`)

### CI/CD : **GitHub Actions** (`.github/workflows/ci.yml`)
- Pipeline complet : Lint → Tests (Vitest + Jest) → Build → E2E (Playwright) → Security Scan (Snyk) → Deploy Firebase
- Deploy automatique sur push `main` → production Firebase
- Deploy preview sur Pull Request
- **Problème notable** : toutes les étapes critiques ont `|| true` (échecs ignorés)

### Mobile
- Android : Capacitor 7, `ht.uniondigitale.app`, keystore configuré
- iOS : scheme `uniondigitale`, splash orange `#f97316`
- Build script : `scripts/build-mobile.sh`

### Scripts de déploiement
- `scripts/deploy-prod.sh` + `scripts/deploy-prod.ps1` (cross-platform)
- `deploy-stripe.sh`
- `scripts/validate-env.js` (validation des variables d'environnement)

### Variables d'environnement requises
**Frontend (VITE_*)** : Firebase config (7 vars), Stripe publishable key, MonCash mode, Algolia, Sentry, App URL
**Backend Express** : DATABASE_URL (PostgreSQL), JWT secret, Stripe secret + webhook, MonCash credentials, NatCash credentials, SMTP, CASHBACK/POINTS config, CRON config
**Functions** : Firebase Admin SDK, SendGrid, Algolia admin, Stripe secret, Twilio, Sentry, Redis (Upstash)

---

## 8. FONCTIONNALITÉS IMPLÉMENTÉES vs. MANQUANTES

### ✅ IMPLÉMENTÉ (code présent et structuré)

**Core E-commerce**
- Catalogue produits avec filtres, pagination (`ProductListPaginated.tsx`)
- Panier persistant (Firebase + état React)
- Checkout one-page avec multi-méthodes de paiement
- Confirmation de commande + suivi (`TrackingPage`, `ShippingTracker.tsx`)
- Gestion favoris, avis clients (vérifiés), questions-réponses
- Quick view modal, zoom image, variantes produit

**Vendeurs**
- Onboarding vendeur multi-étapes
- KYC Verification (`KYCVerification.jsx`)
- Dashboard vendeur ultimate + analytics avancées
- POS Terminal (Point de vente physique)
- Ajout produits/services/voitures/immobilier
- Branding boutique, gestion stock
- Crédit vendeur (`SellerCredit.jsx`)

**Paiements & Finance**
- Stripe complet (PaymentIntent, webhooks)
- MonCash + NatCash (mobile money haïtien)
- PayPal
- Système d'escrow (fonds retenus jusqu'à livraison)
- Ledger financier double-entry
- Versements vendeurs avec workflow d'approbation

**Fidélité & Marketing**
- Programme points (earn/redeem/expire)
- Cashback avec expiration
- Dashboard fidélité (`LoyaltyDashboard.jsx`)
- Gift cards (UI)
- Programme ambassadeur complet (Landing/Onboarding/Dashboard/Resources)
- Funnel Builder (`FunnelBuilder.jsx`)
- Flash sales countdown, upsell, one-click upsell
- Promo codes, order bumps
- Virtual fitting room (IA taille)

**Produits numériques**
- Page produit digital + checkout dédié
- Génération liens téléchargement signés (`functions/src/digital/signedUrls.ts`)
- Gestion bibliothèque (`MyLibrary.jsx`)
- Certificats de cours (`CertificateViewer.tsx`, `generateCertificate.ts`)
- Cours en ligne (LearnCatalog, CourseDetails, MyCourses)

**Sécurité & Monitoring**
- Moteur de risque anti-fraude (RiskEngine, jobs CRON quotidiens)
- Trust scoring vendeurs (5 niveaux, recalcul quotidien)
- Rate limiting, audit logging (Cloud Functions)
- App Check Firebase (reCAPTCHA v3)
- Firestore Security Rules détaillées
- Sentry monitoring (front + back)
- Snyk security scanning (CI)

**Infrastructure**
- PWA (Service Worker, manifest, push notifications)
- Application Android (Capacitor)
- Recherche Algolia (sync Firestore → Algolia)
- Cache Redis (Upstash) pour les requêtes coûteuses
- CI/CD GitHub Actions complet
- Compression gzip + brotli
- Code splitting intelligent (vendor chunks)
- SEO (react-helmet-async, sitemap.xml, robots.txt, structured data)
- WhatsApp notifications (Twilio + Cloud Functions dédiées)
- Notifications email (SendGrid + Nodemailer)
- Live shopping (`LiveShopping.jsx`, `LiveStreamsList.jsx`)
- AI Recommendations (`AIRecommendations.jsx`, Gemini API)
- Carte/géolocalisation (Leaflet)

**Admin**
- Dashboard admin complet
- Modération boutiques, produits, utilisateurs
- Monitoring risque et confiance en temps réel
- Gestion payouts, compliance, abonnements
- System status

### ⚠️ PARTIELLEMENT IMPLÉMENTÉ / À VÉRIFIER

| Fonctionnalité | Observation |
|---|---|
| **Double backend** | Backend Express et Firebase Functions coexistent — architecture non unifiée, risque de dérive |
| **MonCash/NatCash production** | Code présent, mode `sandbox` par défaut dans tous les `.env.example` |
| **Services utilitaires** (EDH, CAMEP) | UI présente mais connexion aux APIs réelles à vérifier |
| **iOS App** | Config Capacitor présente, pas de dossier `ios/` dans le ZIP analysé |
| **Live Shopping** | Composants présents, infrastructure streaming non détectée |
| **Twilio Serverless** | Dossier séparé, intégration à valider avec les Functions Firebase |
| **CreoleHaïtien** | 53 clés `ht:` dans translations.js — couverture partielle vs. le français |

### ❌ ABSENT / NON TROUVÉ

| Fonctionnalité | Observation |
|---|---|
| **Fichiers `/public/locales/`** | Pas de structure de fichiers i18n standard — système custom inline |
| **`next.config.js`** | Le projet n'utilise **pas Next.js** — c'est Vite/React SPA |
| **Tests unitaires frontend** | Vitest configuré mais aucun fichier de test `*.test.jsx` trouvé dans `src/` |
| **Gestion multi-devises live** | HTG assumé, pas de conversion temps réel |
| **Mode hors-ligne complet** | PWA configuré mais capacités offline non vérifiées |

---

## 9. PROBLÈMES CRITIQUES DÉTECTÉS

### 🔴 Build Cassé
Le fichier `build-error.txt` confirme une **erreur de build en production** :
```
[vite:esbuild] src/pages/Catalog.jsx:
The character "}" is not valid inside a JSX element
```
→ Syntaxe JSX invalide dans `Catalog.jsx` ligne ~122 (bloc `<Star>` avec expression conditionnelle)
→ **La CI/CD déploierait un build cassé** (le workflow utilise `|| true` sur toutes les étapes critiques)

### 🟠 Architecture duale non résolue
Le projet maintient deux backends en parallèle (Express/PostgreSQL + Firebase/Firestore). Le frontend consomme Firebase directement. Le backend Express semble sous-utilisé mais contient les jobs CRON critiques (risk engine, trust engine, payout batch).

### 🟡 Variables d'environnement non configurées
Tous les `.env.example` utilisent des valeurs placeholder. La prod nécessite la configuration complète de ~30 variables réparties sur 3 contextes.

### 🟡 CI/CD avec `|| true` partout
Les étapes de lint, test, e2e, security ont toutes `|| true` → les échecs de tests ne bloquent pas le déploiement en production.

---

## 10. SCORE RÉEL vs. ESTIMÉ

| Dimension | Score estimé (audit) | Score réel (codebase) | Écart |
|---|---|---|---|
| **Fonctionnalités e-commerce core** | 70% | **85%** | +15% |
| **Intégrations paiement** | 50% | **80%** | +30% |
| **Qualité code / architecture** | 60% | **65%** | +5% |
| **Tests** | 30% | **25%** | -5% |
| **Production-readiness** | 40% | **45%** | +5% |
| **i18n / localisation** | 40% | **55%** | +15% |
| **Sécurité** | 60% | **70%** | +10% |
| **CI/CD / DevOps** | 50% | **60%** | +10% |
| **SCORE GLOBAL** | **~50%** | **~61%** | **+11%** |

**Conclusion :** La codebase est **significativement plus avancée** que ce que l'audit estimait, notamment sur les paiements (Stripe/MonCash/NatCash tous intégrés) et les fonctionnalités métier (fidélité, escrow, risk engine). Le principal frein à la mise en production est le **build cassé** (`Catalog.jsx`) et l'**architecture duale** non consolidée entre Firebase et Express.

---

*Rapport généré automatiquement par analyse statique du code source. Aucune exécution du code n'a été effectuée.*
