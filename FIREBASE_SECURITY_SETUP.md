# 🔐 FIREBASE SECURITY SETUP GUIDE

## ⚠️ CRITICAL: Your Firebase Credentials Have Been Exposed

Your Firebase Admin SDK key file was found in a public location:
- **File**: `union-digitale-9748e-firebase-adminsdk-fbsvc-f9b6d19a97.json`
- **Location**: Downloads folder (potentially in version control)

### 🚨 IMMEDIATE ACTIONS REQUIRED:

#### 1. **Regenerate Firebase Service Account Keys**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Project: `union-digitale-9748e`
   - Settings ⚙️ → Service Accounts
   - Delete the old key and generate a new one
   - Save the new JSON file

#### 2. **Delete Old Credentials from Version Control** (if committed)
   ```powershell
   # Remove from git history
   git filter-branch --tree-filter 'rm -f union-digitale-9748e-firebase-adminsdk-fbsvc-f9b6d19a97.json' HEAD
   git push origin --force --all
   ```

#### 3. **Configure Local Environment**

   **Root project** (.env.local):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_PROJECT_ID=union-digitale-9748e
   # ... other credentials
   ```

   **Firebase Functions** (functions/.env.local):
   ```env
   FIREBASE_ADMIN_SDK_KEY_PATH=./firebase-adminsdk.json
   ```

#### 4. **Store Service Account Key Safely**
   ```bash
   # Create functions directory (if not exists)
   mkdir -p functions
   
   # Copy the NEW service account key file here
   cp union-digitale-9748e-firebase-adminsdk-*.json functions/firebase-adminsdk.json
   
   # Ensure it's NEVER committed (already in .gitignore)
   ```

---

## ✅ Security Checklist

- [ ] Regenerated Firebase service account keys
- [ ] Removed old credentials from git history
- [ ] Created `.env.local` files with credentials
- [ ] Moved `firebase-adminsdk.json` to `functions/` directory
- [ ] Verified `.gitignore` includes all sensitive files
- [ ] Deleted credentials from Downloads folder
- [ ] Updated Firebase Console rules to restrict access

---

## 📋 Files Now Protected by .gitignore

```
.env
.env.local
.env.*.local
*-firebase-adminsdk-*.json
firebase-adminsdk.json
serviceAccountKey.json
firebase-key.json
```

---

## 🔗 Related Documentation

- [Firebase Security Best Practices](https://firebase.google.com/docs/projects/manage-installations)
- [Environment Variables in Vite](https://vitejs.dev/guide/env-and-mode.html)
- [Cloud Functions Security](https://cloud.google.com/functions/docs/securing)

---

## 🚀 Next Steps

1. ✅ Regenerate keys
2. ✅ Update `.env.local` files
3. ✅ Store service account in `functions/firebase-adminsdk.json`
4. ✅ Run: `npm install` and `npm run build` to verify setup
5. ✅ Deploy with: `firebase deploy`

---

**Generated**: 2026-01-13 | **Status**: 🔒 Secured
