# 🚀 Union Digitale - Plateforme E-Commerce Multi-Vendeurs

[![Firebase](https://img.shields.io/badge/Firebase-12.6.0-orange)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-19.2.0-blue)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-purple)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.17-cyan)](https://tailwindcss.com/)

**Union Digitale** est la première plateforme e-commerce multi-vendeurs d'Haïti, offrant une expérience d'achat complète avec support pour les produits physiques, digitaux, l'immobilier, les services, et les véhicules.

## ✨ Fonctionnalités Principales

### 🛒 E-Commerce Complet
- **Multi-vendeurs** : Marketplace avec gestion indépendante des boutiques
- **Produits digitaux** : Téléchargement automatique, bibliothèque utilisateur
- **Immobilier** : Vente/location de propriétés avec système de réservation
- **Services** : Réservation en ligne avec calendrier
- **Véhicules** : Vente et location de voitures

### 💳 Paiements
- **MonCash** : Intégration native pour Haïti
- **Stripe & PayPal** : Support international
- **Commission automatique** : 85% vendeur / 15% plateforme

### 🤖 Intelligence Artificielle
- **KonvesIA** : Assistant virtuel pour génération de liens viraux
- **Factures vocales** : Génération automatique
- **Recommandations** : Personnalisation basée sur l'IA

### 🌍 Multilingue
- Français, Créole Haïtien, Anglais, Espagnol

### 📱 Progressive Web App (PWA)
- Installation sur mobile/desktop
- Fonctionnement hors-ligne
- Notifications push

## 🏗️ Architecture Technique

```
Frontend:  React 19 + Vite 7 + Tailwind CSS 4
Backend:   Firebase (Serverless)
├─ Firestore (Database)
├─ Cloud Functions (Business Logic)
├─ Storage (Files & Images)
├─ Authentication (Multi-provider)
└─ Hosting (Static Site)
```

## 📦 Installation

### Prérequis
- Node.js ≥ 18.x
- npm ≥ 9.x
- Compte Firebase

### Configuration

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/union-digitale.git
cd union-digitale
```

2. **Installer les dépendances**
```bash
npm install
cd functions && npm install && cd ..
```

3. **Configurer Firebase**

Créez un fichier `.env` à la racine :
```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_projet_id
VITE_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Paiements (Production)
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_PAYPAL_CLIENT_ID=...
VITE_MONCASH_CLIENT_ID=...
VITE_MONCASH_MODE=production
```

4. **Démarrer le serveur de développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🚀 Déploiement

### Production Firebase

1. **Build de production**
```bash
npm run build
```

2. **Déployer Firestore Rules**
```bash
firebase deploy --only firestore:rules
```

3. **Déployer Cloud Functions**
```bash
firebase deploy --only functions
```

4. **Déployer Hosting**
```bash
firebase deploy --only hosting
```

5. **Déploiement complet**
```bash
firebase deploy
```

### Variables d'environnement Production

⚠️ **CRITIQUE** : Avant le déploiement, assurez-vous que :
- ✅ `VITE_MONCASH_MODE=production`
- ✅ Clés Stripe/PayPal en mode LIVE
- ✅ Pas de secrets dans le code source

## 📁 Structure du Projet

```
union-digitale/
├── src/
│   ├── components/       # Composants réutilisables
│   ├── pages/           # Pages de l'application
│   ├── contexts/        # React Contexts (Auth, Cart, etc.)
│   ├── hooks/           # Custom React Hooks
│   ├── services/        # Services (API, Firebase)
│   ├── styles/          # CSS et design tokens
│   └── utils/           # Utilitaires
├── functions/           # Cloud Functions Firebase
├── public/              # Assets statiques
├── firestore.rules      # Règles de sécurité Firestore
├── storage.rules        # Règles de sécurité Storage
└── firebase.json        # Configuration Firebase
```

## 🔒 Sécurité

### Firestore Rules
Les règles de sécurité sont configurées pour :
- ✅ Isolation des données vendeurs
- ✅ Protection des commandes (lecture propriétaire uniquement)
- ✅ Accès admin contrôlé par rôle
- ✅ Anti-spam sur les transactions

### Authentification
- Email/Password avec vérification
- Google OAuth
- Téléphone (SMS) pour Haïti (+509)

## 🧪 Tests

### Tests E2E (Playwright)
```bash
cd tests
npm install
npx playwright test
```

### Lighthouse (Performance)
```bash
npx playwright test --grep @lighthouse
```

**Scores cibles** : ≥90 sur Performance, Accessibility, Best Practices, SEO

## 📊 Monitoring

### Firebase Console
- **Quotas** : Surveiller l'utilisation (alerte à 80%)
- **Logs** : Cloud Functions logs
- **Analytics** : Événements utilisateurs

### Alertes
Les Cloud Functions envoient des alertes pour :
- Quotas Firebase > 80%
- Erreurs de paiement
- Transactions suspectes

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Documentation Complémentaire

- [Guide de Déploiement](./DEPLOYMENT_GUIDE.md)
- [Validation Checklist](./VALIDATION_CHECKLIST.md)
- [Audit Report](./AUDIT_REPORT.md)
- [API Documentation](./README_DIGITAL.md)

## 📞 Support

- **Email** : support@uniondigitale.ht
- **WhatsApp** : +509 XXXX XXXX
- **Documentation** : https://docs.uniondigitale.ht

## 📄 Licence

Copyright © 2026 Union Digitale. Tous droits réservés.

---

**Fait avec ❤️ en Haïti 🇭🇹**
