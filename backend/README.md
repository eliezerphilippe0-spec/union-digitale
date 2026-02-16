# Backend — Union Digitale (MonCash / NatCash / PayPal / Stripe)

Backend API de Union Digitale (marketplace). Inclut le **moteur financier** (commissions + escrow + ledger + payouts) avec idempotency, transactions atomiques, audit trail, et intégrations paiements multi-providers:

- MonCash
- NatCash
- PayPal
- Stripe

---

## 1) Architecture (vue rapide)

### Modules clés
- Orders: création, statuts, calcul totals + init + webhooks provider
- Commission: earnings plateforme
- Escrow: fonds vendeur retenus puis libérés
- Ledger: journal financier auditable (source of truth)
- Payouts: demandes + validation admin + batch hebdo SAFE

---

## 2) Moteur financier (source of truth)

### Flux financier (normal)
1. **Paiement confirmé** (webhooks, idempotency, env vars)
   - Calcule commission
   - Hold en escrow
   - Écrit ledger (`PLATFORM_EARN`, `ESCROW_HOLD`, éventuellement `SELLER_EARN`)
2. **DELIVERED**
   - Release escrow → disponible
   - Ledger `ESCROW_RELEASE`
3. **Payout**
   - Lock (`PAYOUT_LOCK`)
   - Admin approuve / marque payé (`PAYOUT_PAID`)

### Règles de calcul
- Commission calculée sur **produits** (hors livraison/taxes)

### Invariants (DO NOT BREAK)
- `availableHTG >= 0`, `escrowHTG >= 0`, `payoutPendingHTG >= 0`
- Idempotency stricte:
  - payment webhook: 1 seul traitement par event
  - DELIVERED: 1 seul release
  - batch: 1 request par (storeId, weekStart) / batchKey

---

## 3) Modèles (résumé)

### Order (extraits)
- `subtotalProductsHTG`
- `commissionAmountHTG`
- `sellerGrossHTG`
- `sellerNetHTG`
- `escrowStatus`
- `paymentProvider`
- `paymentProviderRef` (ex: chargeId, captureId, transactionId)

### SellerBalance
- `availableHTG`
- `escrowHTG`
- `payoutPendingHTG`
- `lifetimeEarnedHTG`

### FinancialLedger (audit)
Types (exemples):
- `PLATFORM_EARN`, `ESCROW_HOLD`, `ESCROW_RELEASE`, `SELLER_EARN`
- `REFUND`, `REVERSAL`
- `PAYOUT_LOCK`, `PAYOUT_PAID`

### PayoutRequest
- `status`
- `storeId`, `amountHTG`, `weekStart`, `batchKey` (unique)

---

## 4) Paiements multi-providers (init + webhooks)

### Principe commun (important)
- Tous les providers doivent mapper vers un modèle interne unique:
  - PaymentIntent/Init (local)
  - PaymentEvent (webhook event)
  - idempotency key
- **Aucune mutation finance** (escrow/ledger/balances) hors webhook confirmé.
- Toutes mutations dans **transactions atomiques**.

---

## 5) Endpoints Payments (suggested)

### Init paiement
- Input: `orderId`, `provider`, `amountHTG`, `metadata`
- Output: provider redirect / clientSecret / paymentUrl

### Webhooks (réception)
> Chaque webhook doit:
> 1) vérifier signature (quand dispo)
> 2) extraire `providerTxId`
> 3) idempotency: si event déjà traité → no-op
> 4) si statut confirmé → appliquer finance (escrow/ledger)
> 5) retourner 200 rapidement

---

## 6) Idempotency (obligatoire)

### Clés d’idempotency recommandées
- Stripe: `event.id` (webhook)
- PayPal: `event.id` (webhook)
- MonCash: `transactionId` (ou ref unique callback)
- NatCash: `transactionId` (ou ref unique callback)

### Table / colonne conseillée (si existante)
- `paymentProviderRef` + event id (enregistrement) pour éviter doubles traitements

---

## 7) Sécurité webhooks (par provider)

### Stripe
- Vérifier signature via `STRIPE_WEBHOOK_SECRET`
- Événements utiles (exemples):
  - `payment_intent.succeeded`
  - `charge.refunded` / `charge.dispute.*`
- Toujours lire la source de vérité dans l’event (montant/currency).

### PayPal
- Vérifier signature via webhook verification (si implémenté)
- Événements utiles:
  - `PAYMENT.CAPTURE.COMPLETED`

### MonCash / NatCash
- Si signature/HMAC disponible → vérifier
- Sinon, appliquer:
  - allowlist IP (si possible)
  - callback token secret
  - double-check serveur via endpoint “verify transaction” (si provider le permet)
- idempotency stricte sur `transactionId`

> IMPORTANT: si verification provider existe (MonCash/NatCash), préférer:
> webhook/callback → verify server-to-server → then finalize.

---

## 8) Refunds / disputes (flow)

### Refund (avant DELIVERED)
- Reversal escrow + ledger
- Optionnel: reversal commission selon politique

### Refund (après RELEASE)
- Créer ledger
- Appliquer un ajustement vendeur:
  - si `availableHTG >= refundAmount`: déduire
  - sinon: marquer store en **negative** (ou bloquer payouts) selon policy

### Dispute / chargeback (Stripe/PayPal)
- Bloquer payouts (`riskFlag`)
- Geler soldes si nécessaire
- Journaliser event ledger + admin alert

---

## 9) Batch payout hebdo (SAFE)

Le batch **ne paie jamais**. Il:
- crée `PayoutRequest` en `REQUESTED`
- lock les fonds (`PAYOUT_LOCK`)
- move `availableHTG → payoutPendingHTG`

### Scheduler
- Lundi 09:00 (node-cron)
- Endpoint admin manuel:
  - `POST /api/payouts/batch/run?DRY_RUN=true`

### Eligibility
- min: `PAYOUT_MIN_HTG` (def: 2000)
- exclude:
  - `riskFlag`
  - `kycStatus` pas `VERIFIED`
  - `payoutPendingHTG > 0`
- si champs absents → guard + skip reason

### Idempotency
- `batchKey` unique
- unique par `(storeId, weekStart)` acceptable aussi

---

## 10) Prisma & DB

### Dev
```bash
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

### Prod
```bash
npx prisma migrate deploy
```

Éviter `prisma db push` en production (préférer migrations versionnées).

---

## 11) Tests (minimum)

Exécution
```bash
npm test
```

Couverture recommandée
- Stripe/PayPal webhooks idempotents (double event)
- MonCash/NatCash callback idempotent + verify (si dispo)
- DELIVERED double call → 1 release
- refund/cancel avant/après release
- batch: seuil, double-run, concurrence, rollback atomique si ledger fail

---

## 12) Environment variables (paiements & finance)

Finance
- `PAYOUT_MIN_HTG=2000`

Stripe
- `STRIPE_SECRET_KEY=...`
- `STRIPE_WEBHOOK_SECRET=...`

PayPal
- `PAYPAL_CLIENT_ID=...`
- `PAYPAL_CLIENT_SECRET=...`
- `PAYPAL_WEBHOOK_ID=...` (si vérification webhook)

MonCash / NatCash (exemples)
- `MONCASH_CLIENT_ID=...`
- `MONCASH_CLIENT_SECRET=...`
- `MONCASH_WEBHOOK_SECRET=...` (si supporté)
- `NATCASH_CLIENT_ID=...`
- `NATCASH_CLIENT_SECRET=...`
- `NATCASH_WEBHOOK_SECRET=...`

Ajoute ici les URLs de callback/return selon ton infra (staging/prod).

---

## 13) Observabilité & debug

Logs structurés (JSON)

Événements:
- `payment_webhook_received`
- `payment_confirmed_finance_applied`
- `escrow_hold/release/reversal`
- `payout_lock/paid`
- `payout_batch_run`

Pour debug finance: fournir
- `orderId`, `storeId`
- provider, `providerEventId`, `providerTxId`
- `batchKey` (si payout)
- extrait ledger correspondant

---

## 14) Release checklist (finance)

Avant tag:
- migrations OK
- suite tests OK
- invariants OK (no negative, idempotency)
- webhooks sécurisés (signature/verify)
- batch SAFE validé (DRY_RUN + run réel staging)
