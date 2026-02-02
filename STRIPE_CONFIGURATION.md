# Stripe Configuration Guide

## 🔑 API Keys Overview

You have two types of Stripe keys:

### Publishable Key (Frontend - SAFE to expose)
```
pk_live_51SUIYIRzHF2CaDBqMlmiAtSJuV6Qvbbx2pTek7GgCb9e2XdxnTGtxWNmlRVWrVDhu72fFLQi2HChQ3kQtp4NlYlh003EhX6yNt
```
- ✅ Use in frontend (.env file)
- ✅ Included in client bundle
- ✅ Safe to commit to version control (with .env)

### Secret Key (Backend - MUST KEEP SECRET)
```
sk_live_... (DO NOT share publicly)
```
- ❌ NEVER put in frontend
- ❌ NEVER commit to git
- ✅ Only in Cloud Functions config
- ✅ Only in Firebase environment variables

---

## 📝 Configuration Steps

### Step 1: Configure Frontend (.env file)

Create/update `.env` file in project root:

```bash
# Stripe Publishable Key (safe to commit)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SUIYIRzHF2CaDBqMlmiAtSJuV6Qvbbx2pTek7GgCb9e2XdxnTGtxWNmlRVWrVDhu72fFLQi2HChQ3kQtp4NlYlh003EhX6yNt

# Other config
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### Step 2: Initialize Stripe in Frontend

Update `src/lib/stripe.js` (or create it):

```javascript
import { loadStripe } from '@stripe/stripe-js';

// Get publishable key from environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set');
}

// Initialize Stripe
export const stripePromise = loadStripe(stripePublishableKey);
```

### Step 3: Configure Cloud Functions Backend

**CRITICAL**: Get your secret key from Stripe Dashboard:
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_live_...`)
3. NEVER share this key publicly

Then set it in Firebase:

```bash
# Set Stripe secret key (REPLACE with your actual secret key)
firebase functions:config:set stripe.secret_key="sk_live_YOUR_ACTUAL_SECRET_KEY_HERE"

# Set webhook secret (get this after creating webhook endpoint)
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET_HERE"

# Set app URL for redirects
firebase functions:config:set app.url="https://uniondigitale.ht"

# View current config
firebase functions:config:get
```

### Step 4: Deploy Cloud Functions

```bash
cd functions
npm install stripe@latest
npm run build
firebase deploy --only functions
```

### Step 5: Create Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. **Endpoint URL**:
   ```
   https://YOUR_PROJECT_ID.cloudfunctions.net/stripeWebhook
   ```
   (Replace YOUR_PROJECT_ID with your Firebase project ID)

4. **Events to send**:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`

5. Click "Add endpoint"
6. Click on the webhook → "Signing secret" → Reveal → Copy
7. Set in Firebase:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   firebase deploy --only functions
   ```

---

## 🧪 Testing

### Test Mode (Development)

For development, use test keys instead:

```bash
# Frontend .env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SUIYIRz... (your test publishable key)

# Backend Firebase config
firebase functions:config:set stripe.secret_key="sk_test_..." (your test secret key)
```

**Test Cards**:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

### Production Mode

1. Switch to live keys in both frontend and backend
2. Test with small real transaction (1 HTG)
3. Verify webhook receives event
4. Check order marked as "paid"
5. Verify vendor balance credited

---

## 🔍 Verification Checklist

After configuration:

- [ ] Frontend has publishable key in .env
- [ ] stripePromise initialized correctly
- [ ] Cloud Functions has secret key set
- [ ] Cloud Functions deployed successfully
- [ ] Webhook endpoint created in Stripe
- [ ] Webhook secret set in Firebase config
- [ ] Test payment completes successfully
- [ ] Webhook processes payment correctly
- [ ] Order status updates to "paid"
- [ ] Vendor receives commission

---

## 🐛 Troubleshooting

### "Stripe is not defined"
- Check VITE_STRIPE_PUBLISHABLE_KEY is set in .env
- Restart dev server after .env changes
- Check import: `import { loadStripe } from '@stripe/stripe-js'`

### "Invalid API key"
- Verify secret key starts with `sk_live_` (production) or `sk_test_` (test)
- Check Firebase config: `firebase functions:config:get`
- Redeploy after config changes

### "Webhook signature verification failed"
- Get signing secret from Stripe Dashboard → Webhooks → Your endpoint
- Set correct secret: `firebase functions:config:set stripe.webhook_secret="whsec_..."`
- Redeploy functions

### "Payment succeeds but order not marked paid"
- Check Cloud Functions logs: `firebase functions:log`
- Verify webhook URL is correct
- Check webhook receives events in Stripe Dashboard

---

## 📚 Additional Resources

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe API Docs: https://stripe.com/docs/api
- Stripe Testing: https://stripe.com/docs/testing
- Firebase Functions Config: https://firebase.google.com/docs/functions/config-env

---

## 🔒 Security Best Practices

1. ✅ **NEVER commit secret keys** to git
2. ✅ Use different keys for test/production
3. ✅ Rotate keys if accidentally exposed
4. ✅ Monitor Stripe Dashboard for suspicious activity
5. ✅ Enable Stripe Radar (fraud detection)
6. ✅ Set spending limits in Stripe Dashboard

---

## 💰 Haiti-Specific Configuration

Since you're in Haiti, note:

1. **Currency**: Stripe supports HTG (Haitian Gourde)
   - Update in `stripePayment.ts`: `currency: 'htg'`
   - Or keep USD and show HTG equivalent

2. **Payment Methods**:
   - Cards work internationally
   - Local methods may require additional setup

3. **Payout Schedule**:
   - Check Stripe's payout schedule for Haiti
   - May need to verify business details

4. **Tax/VAT**:
   - Consider Haitian tax requirements
   - May need to collect TPS (Taxe sur Produits et Services)

---

**Next Steps**:
1. Get your secret key from Stripe Dashboard
2. Set it in Firebase config
3. Deploy functions
4. Create webhook endpoint
5. Test with small real payment
