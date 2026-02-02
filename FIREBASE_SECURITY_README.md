# 🔐 Firebase Security Configuration

## Quick Start

Run the security setup checker:

```bash
# Windows PowerShell
.\scripts\setup-security.ps1

# Or with Node.js
node scripts/setup-security.js
```

## What's Been Configured

### ✅ Files Protecting Sensitive Data

Your `.gitignore` now protects:

```
.env
.env.local
.env.*.local
*-firebase-adminsdk-*.json
firebase-adminsdk.json
serviceAccountKey.json
```

### ✅ Environment Configuration Files Created

- **Root**: `.env.local` - Frontend environment variables
- **Functions**: `functions/.env.local` - Backend Firebase Admin SDK config
- **Root**: `.gitignore` - Updated with security patterns
- **Functions**: `functions/.gitignore` - Firebase credentials protection

---

## Step-by-Step Setup

### 1. Regenerate Firebase Service Account Keys

Your old key has been exposed and should be rotated immediately.

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **union-digitale-9748e**
3. Settings ⚙️ → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### 2. Store Service Account Key Safely

```bash
# Place the new key in the functions directory
# It will be automatically ignored by git
cp union-digitale-9748e-firebase-adminsdk-*.json functions/firebase-adminsdk.json
```

### 3. Configure Root Environment (.env.local)

Get credentials from Firebase Console:

```env
# Firebase Web Config (from Firebase Console > Project Settings)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=union-digitale-9748e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=union-digitale-9748e
VITE_FIREBASE_STORAGE_BUCKET=union-digitale-9748e.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=1:your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-your_measurement_id

# Payment Gateways
VITE_STRIPE_PUBLIC_KEY=pk_test_your_key
VITE_PAYPAL_CLIENT_ID=your_paypal_id
VITE_MONCASH_CLIENT_ID=your_moncash_id
VITE_MONCASH_SECRET_KEY=your_moncash_secret
VITE_MONCASH_MODE=sandbox

# Twilio WhatsApp
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_token
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Monitoring
VITE_SENTRY_DSN=your_sentry_dsn

# API
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Configure Functions Environment (functions/.env.local)

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=union-digitale-9748e
FIREBASE_ADMIN_SDK_KEY_PATH=./firebase-adminsdk.json

# Optional: Enable Firestore emulator for local dev
# FIREBASE_EMULATOR_HOST=localhost:8080
```

### 5. Remove Old Credentials from Git (if committed)

If the old credentials were already committed:

```bash
# Remove from git history
git filter-branch --tree-filter 'rm -f union-digitale-9748e-firebase-adminsdk-fbsvc-f9b6d19a97.json' HEAD

# Force push (careful!)
git push origin --force --all
```

---

## Verify Setup

### Check Files Are Protected

```bash
# Should return empty (no exposed keys)
git ls-files | grep -i "adminsdk\|\.env\.local"

# Should show 0 matches
find . -name "*firebase-adminsdk*.json" -not -path "./node_modules/*"
```

### Test Environment Loading

```bash
# In Node.js/Functions
npm install
npm run build

# In frontend
npm install
npm run build
```

---

## Security Best Practices

✅ **DO:**
- Use `.env.local` for all sensitive credentials
- Regenerate keys regularly (monthly recommended)
- Use environment-specific keys (dev, staging, prod)
- Store backups of service account keys securely offline
- Monitor Firebase Console for unexpected access

❌ **DON'T:**
- Commit `.env.local` or `*firebase-adminsdk*.json` files
- Share credentials via email, Slack, or chat
- Use production keys for development
- Leave credentials in source code
- Commit to public repositories

---

## Troubleshooting

### Firebase Functions Can't Load Admin SDK

```javascript
// Ensure this path is correct in your code:
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

### Environment Variables Not Loading in Functions

```bash
# Restart the emulator or redeploy
firebase functions:log
firebase deploy --only functions
```

### .env.local Changes Not Reflected

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## File Structure

```
union-digitale/
├── .env.local                    # Root env vars (ignored by git)
├── .gitignore                    # Updated with security patterns
├── functions/
│   ├── .env.local               # Functions env vars (ignored by git)
│   ├── .gitignore               # Firebase credentials protection
│   └── firebase-adminsdk.json    # Service account (ignored by git)
├── scripts/
│   ├── setup-security.ps1        # Windows setup helper
│   └── setup-security.js         # Node.js setup helper
└── FIREBASE_SECURITY_SETUP.md    # Detailed security guide
```

---

## Documentation

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Environment Variables in Vite](https://vitejs.dev/guide/env-and-mode.html)
- [Cloud Functions Security](https://cloud.google.com/functions/docs/securing)
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)

---

**Last Updated**: 2026-01-13  
**Status**: 🔒 Secured & Ready
