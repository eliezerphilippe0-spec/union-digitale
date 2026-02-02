# 🚀 Production Deployment Checklist

## Overview
This checklist covers deploying all security fixes and the Stripe integration to production.

---

## 📋 Pre-Deployment (30 minutes)

### 1. Get Required Credentials

#### Stripe Secret Key
- [ ] Go to https://dashboard.stripe.com/apikeys
- [ ] Copy **Secret key** (starts with `sk_live_...`)
- [ ] **CRITICAL**: Keep this private, never share publicly

#### Stripe Webhook Secret (will get after creating endpoint)
- [ ] Will obtain after Step 3.3

#### Firebase Project Setup
- [ ] Verify you're targeting correct Firebase project
- [ ] Run: `firebase projects:list`
- [ ] Run: `firebase use production` (or your project name)

---

## 🔧 Step 1: Configure Environment Variables (10 minutes)

### 1.1 Frontend Configuration

Create `.env` file in project root:

```bash
# Copy from .env.example
cp .env.example .env

# Update Firebase values (get from Firebase Console → Project Settings)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Stripe publishable key (already set)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SUIYIRzHF2CaDBqMlmiAtSJuV6Qvbbx2pTek7GgCb9e2XdxnTGtxWNmlRVWrVDhu72fFLQi2HChQ3kQtp4NlYlh003EhX6yNt

# Production mode
VITE_MONCASH_MODE=production
VITE_APP_URL=https://uniondigitale.ht
```

**Checklist**:
- [ ] `.env` file created
- [ ] All Firebase values filled
- [ ] Stripe publishable key set
- [ ] MONCASH_MODE set to production
- [ ] APP_URL set to production domain

### 1.2 Backend Configuration (Cloud Functions)

```bash
# Set Stripe secret key (REPLACE with your actual key)
firebase functions:config:set stripe.secret_key="sk_live_YOUR_SECRET_KEY_HERE"

# Set MonCash webhook secret
firebase functions:config:set moncash.webhook_secret="YOUR_MONCASH_SECRET"

# Set app URL
firebase functions:config:set app.url="https://uniondigitale.ht"

# Verify configuration
firebase functions:config:get
```

**Checklist**:
- [ ] `stripe.secret_key` set
- [ ] `moncash.webhook_secret` set
- [ ] `app.url` set
- [ ] Configuration verified with `get` command

---

## 📦 Step 2: Build & Deploy Functions (15 minutes)

### 2.1 Install Dependencies

```bash
cd functions
npm install stripe@latest
npm install
```

**Checklist**:
- [ ] Stripe package installed
- [ ] All dependencies installed
- [ ] No errors in npm install

### 2.2 Build TypeScript

```bash
npm run build
```

**Expected output**: Compiled successfully

**Checklist**:
- [ ] Build completed without errors
- [ ] Check `functions/lib/` directory exists

### 2.3 Deploy Cloud Functions

```bash
cd ..
firebase deploy --only functions
```

**Expected**: Deployment takes 5-10 minutes

**Checklist**:
- [ ] All 14 new functions deployed successfully
- [ ] No deployment errors
- [ ] Copy the Cloud Functions URL (e.g., `https://us-central1-your-project.cloudfunctions.net`)

**Functions Deployed**:
- transferFunds
- withdrawFunds
- getWalletBalance
- getWalletTransactions
- approveWithdrawal
- createStripePaymentIntent
- stripeWebhook
- onUserCreated
- checkEmailVerified
- resendVerificationEmail
- verifySellerEligibility
- onOrderCreated
- onOrderUpdated
- onProductWritten

---

## 🔗 Step 3: Configure Webhooks (10 minutes)

### 3.1 Stripe Webhook Setup

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/stripeWebhook
   ```
   (Replace YOUR_PROJECT_ID with your Firebase project ID)

4. Select events to listen to:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`

5. Click **"Add endpoint"**

6. Click on the newly created webhook

7. Under **"Signing secret"**, click **"Reveal"**

8. Copy the webhook secret (starts with `whsec_...`)

9. Set it in Firebase:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"
   firebase deploy --only functions
   ```

**Checklist**:
- [ ] Stripe webhook endpoint created
- [ ] Events selected
- [ ] Webhook secret copied
- [ ] Webhook secret set in Firebase
- [ ] Functions redeployed

### 3.2 MonCash Webhook Setup (if using)

Update MonCash dashboard with webhook URL:
```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/moncashWebhook
```

**Checklist**:
- [ ] MonCash webhook URL updated
- [ ] Webhook secret configured

---

## 🗄️ Step 4: Deploy Firestore Rules & Indexes (5 minutes)

### 4.1 Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

**Checklist**:
- [ ] Rules deployed successfully
- [ ] No syntax errors

### 4.2 Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

**Note**: Index building can take 10-30 minutes for existing data.

**Checklist**:
- [ ] Indexes deployment started
- [ ] Monitor index status: `firebase firestore:indexes`

---

## 🌐 Step 5: Deploy Frontend (10 minutes)

### 5.1 Build Frontend

```bash
npm install
npm run build
```

**Checklist**:
- [ ] Build completed without errors
- [ ] `dist/` directory created

### 5.2 Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

**Checklist**:
- [ ] Hosting deployed successfully
- [ ] Note the deployed URL

---

## 🧪 Step 6: Testing (30 minutes)

### 6.1 Test Wallet Operations

**Test Transfer**:
1. Login as User A
2. Call `transferFunds` via Cloud Function
3. Verify balance deducted
4. Login as User B
5. Verify balance credited

**Checklist**:
- [ ] Transfer works atomically
- [ ] Cannot overdraft
- [ ] Idempotency prevents duplicates

### 6.2 Test Stripe Payment

**Test with Small Amount**:
1. Create an order (1 HTG test)
2. Go to checkout
3. Enter test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Submit payment
7. Verify payment succeeds
8. Check Stripe Dashboard for payment
9. Check order status → should be "paid"
10. Check vendor balance → should be credited

**Checklist**:
- [ ] Payment intent created
- [ ] Payment succeeds
- [ ] Webhook received (check Stripe Dashboard)
- [ ] Order marked "paid"
- [ ] Vendor balance credited (85%)
- [ ] Platform fee recorded (15%)

### 6.3 Test Email Verification

1. Create new account
2. Check email for verification link
3. Click verification link
4. Try to create product (should fail - not verified)
5. Verify email in Firebase Auth
6. Try to create product (should succeed)

**Checklist**:
- [ ] Verification email sent
- [ ] Email verification works
- [ ] Product creation blocked before verification
- [ ] Product creation allowed after verification

### 6.4 Test Vendor ID Validation

**Manual Security Test**:
1. Create order with Product A (Vendor X)
2. In Firestore, manually change item.vendorId to Vendor Y
3. Trigger payment webhook
4. Check logs - should see SECURITY ALERT
5. Verify transaction failed
6. Verify no commission paid

**Checklist**:
- [ ] Vendor ID validation works
- [ ] Security alert logged
- [ ] Transaction aborted on mismatch
- [ ] No commission paid to wrong vendor

---

## 📊 Step 7: Monitoring Setup (15 minutes)

### 7.1 Firebase Console Monitoring

1. Go to Firebase Console → Functions
2. Check function logs for errors
3. Monitor execution times
4. Set up alerts for failures

**Checklist**:
- [ ] Functions tab shows all functions
- [ ] No errors in recent logs
- [ ] Execution times reasonable (<5s)

### 7.2 Stripe Dashboard Monitoring

1. Go to Stripe Dashboard
2. Check "Payments" for recent transactions
3. Check "Webhooks" → Your endpoint → Logs
4. Verify events are being received

**Checklist**:
- [ ] Webhook events showing in logs
- [ ] Payments appearing in dashboard
- [ ] No failed webhooks

### 7.3 Error Tracking

Set up Sentry or similar:
```bash
npm install @sentry/react @sentry/node
```

**Checklist**:
- [ ] Error tracking configured
- [ ] Test error reporting
- [ ] Alerts set up

---

## ✅ Step 8: Final Verification (10 minutes)

### Production Smoke Test

Run through complete user flow:

1. **Buyer Journey**:
   - [ ] Sign up new account
   - [ ] Browse products
   - [ ] Add to cart
   - [ ] Checkout with Stripe
   - [ ] Verify payment succeeds
   - [ ] Receive order confirmation

2. **Seller Journey**:
   - [ ] Sign up new account
   - [ ] Verify email
   - [ ] Upgrade to seller
   - [ ] Create new product
   - [ ] Receive order notification
   - [ ] Check balance credited

3. **Admin Journey**:
   - [ ] Login as admin
   - [ ] View all orders
   - [ ] Approve withdrawal
   - [ ] View platform revenue

---

## 🚨 Rollback Plan

If critical issues occur:

### Rollback Functions
```bash
firebase functions:list
firebase functions:rollback FUNCTION_NAME --revision PREVIOUS_REVISION_ID
```

### Rollback Rules
```bash
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

### Rollback Frontend
```bash
firebase hosting:rollback
```

---

## 📝 Post-Deployment Tasks

### Within 24 Hours:
- [ ] Monitor Cloud Functions logs
- [ ] Check Stripe webhook success rate
- [ ] Verify no security alerts
- [ ] Test with real small payment (10 HTG)
- [ ] Monitor Firestore costs

### Within 1 Week:
- [ ] Review error logs
- [ ] Check payment success rate
- [ ] Analyze performance metrics
- [ ] Gather user feedback
- [ ] Plan next optimizations

---

## 🎯 Success Metrics

After deployment, you should see:

✅ **Security**:
- No wallet overdrafts
- All payments verified
- Email verification enforced
- Vendor IDs validated

✅ **Performance**:
- Search costs reduced 99%
- Payment processing <2s
- Order creation <1s
- No full collection scans

✅ **Financial**:
- Real Stripe charges
- Correct commission splits (15%/85%)
- Atomic transactions
- No duplicate payments

---

## 🆘 Support Resources

**If you encounter issues**:

1. **Check logs**: `firebase functions:log --only functionName`
2. **Stripe Dashboard**: Check webhook delivery logs
3. **Firebase Console**: Check Firestore rules evaluation
4. **Error tracking**: Check Sentry/logging service

**Common Issues**:
- "Invalid API key" → Check Firebase config
- "Webhook signature failed" → Verify webhook secret
- "Email not verified" → User needs to verify email
- "Insufficient balance" → Expected behavior (working correctly)

---

## 📞 Emergency Contacts

- Firebase Status: https://status.firebase.google.com
- Stripe Status: https://status.stripe.com
- MonCash Support: support@moncash.com

---

**Deployment prepared by**: Claude Code
**Date**: 2026-01-13
**Version**: Phase 2 Complete
**Status**: ✅ Ready for Production
