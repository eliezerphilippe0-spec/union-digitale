# Configuration des Secrets Firebase

Ce document explique comment obtenir et configurer les clés API et secrets nécessaires pour l'application Union Digitale.

## 🔑 Variables d'Environnement Requises

### 1. Firebase Configuration

**Où les obtenir**: [Firebase Console](https://console.firebase.google.com/) → Paramètres du projet → Général

```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123XYZ
```

### 2. Firebase App Check (reCAPTCHA v3)

**Étapes**:
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/security/recaptcha)
2. Créer une clé reCAPTCHA v3
3. Ajouter votre domaine (ex: `uniondigitale.com`)
4. Copier la clé du site (Site Key)

```bash
VITE_RECAPTCHA_SITE_KEY=6Lc...
```

**Configuration Firebase App Check**:
1. Aller sur [Firebase Console](https://console.firebase.google.com/) → App Check
2. Activer App Check pour votre application web
3. Sélectionner "reCAPTCHA v3" comme provider
4. Coller votre Site Key

### 3. Stripe

**Où l'obtenir**: [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

```bash
# Clé publique (safe to commit)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Clé secrète (NEVER commit - backend only)
STRIPE_SECRET_KEY=sk_live_...
```

⚠️ **Important**: 
- La clé publique (`pk_`) peut être exposée côté client
- La clé secrète (`sk_`) doit UNIQUEMENT être dans les Cloud Functions

### 4. MonCash

**Où l'obtenir**: [MonCash Developer Portal](https://moncashbutton.digicelgroup.com/Moncash-business/Login.jsp)

```bash
VITE_MONCASH_MODE=sandbox  # ou 'production'

# Backend only (Cloud Functions)
MONCASH_CLIENT_ID=your_client_id
MONCASH_SECRET_KEY=your_secret_key
```

### 5. Sentry (Monitoring)

**Où l'obtenir**: [Sentry.io](https://sentry.io/settings/projects/)

```bash
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
VITE_ENABLE_SENTRY=true
VITE_SENTRY_ENVIRONMENT=production
```

### 6. Algolia (Recherche - Optionnel)

**Où l'obtenir**: [Algolia Dashboard](https://www.algolia.com/dashboard)

```bash
VITE_ALGOLIA_APP_ID=ABC123XYZ
VITE_ALGOLIA_SEARCH_KEY=abc123...  # Search-only API key (safe)

# Backend only
ALGOLIA_ADMIN_KEY=abc123...  # Admin API key (NEVER commit)
```

## 🔒 Sécurité des Secrets

### Fichiers à NE JAMAIS Commiter

```bash
# Ajouter à .gitignore
.env
.env.local
.env.production
functions/.env
firebase-adminsdk.json
```

### Secrets Backend (Cloud Functions)

Les secrets pour les Cloud Functions doivent être configurés via Firebase CLI:

```bash
# Configurer un secret
firebase functions:secrets:set STRIPE_SECRET_KEY

# Lister les secrets
firebase functions:secrets:access

# Utiliser dans le code
import { defineSecret } from 'firebase-functions/params';
const stripeKey = defineSecret('STRIPE_SECRET_KEY');
```

## 📋 Checklist de Configuration

- [ ] Copier `.env.example` vers `.env.local`
- [ ] Remplir toutes les variables Firebase
- [ ] Configurer reCAPTCHA v3 et App Check
- [ ] Obtenir les clés Stripe (test et production)
- [ ] Configurer MonCash (sandbox puis production)
- [ ] Créer un projet Sentry et obtenir le DSN
- [ ] Configurer les secrets Cloud Functions
- [ ] Vérifier que `.env.local` est dans `.gitignore`
- [ ] Tester l'application en local
- [ ] Déployer et tester en production

## 🚨 En Cas de Fuite de Secret

Si un secret est accidentellement commité:

1. **Révoquer immédiatement** la clé compromise
2. Générer une nouvelle clé
3. Mettre à jour la configuration
4. Supprimer le secret de l'historique Git:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
5. Forcer le push: `git push origin --force --all`

## 📞 Support

Pour toute question sur la configuration des secrets:
- Documentation Firebase: https://firebase.google.com/docs
- Support Stripe: https://support.stripe.com
- Support MonCash: support@moncashbutton.digicelgroup.com
