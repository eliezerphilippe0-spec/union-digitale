# 📋 Guide de Déploiement - Union Digitale

## 🎯 Checklist Pré-Déploiement

### 1. Configuration Environnement

- [ ] Fichier `.env` configuré avec clés production
- [ ] `VITE_MONCASH_MODE=production`
- [ ] Clés Stripe en mode LIVE (`pk_live_...`)
- [ ] Clés PayPal en mode LIVE
- [ ] Variables Firebase correctes

### 2. Build & Tests

- [ ] `npm run build` réussit sans erreurs
- [ ] Lighthouse score ≥90 sur tous les critères
- [ ] Tests E2E passent (flow acheteur + vendeur)
- [ ] Tests MonCash sandbox validés (3 transactions)

### 3. Firebase

- [ ] Firestore Rules déployées et testées
- [ ] Storage Rules déployées
- [ ] Cloud Functions déployées
- [ ] Indexes Firestore créés

### 4. Sécurité

- [ ] Pas de secrets dans le code source
- [ ] CORS configuré correctement
- [ ] Rate limiting actif
- [ ] Règles Firestore testées avec différents rôles

## 🚀 Procédure de Déploiement

### Étape 1 : Préparation

```bash
# Vérifier la version Node
node --version  # Doit être ≥18.x

# Installer les dépendances
npm install
cd functions && npm install && cd ..

# Build de production
npm run build
```

### Étape 2 : Tests Finaux

```bash
# Tester le build localement
npm run preview

# Lancer les tests E2E
cd tests
npx playwright test
```

### Étape 3 : Déploiement Firebase

```bash
# Login Firebase
firebase login

# Sélectionner le projet
firebase use production

# Déployer Firestore Rules
firebase deploy --only firestore:rules

# Déployer Storage Rules
firebase deploy --only storage

# Déployer Cloud Functions
firebase deploy --only functions

# Déployer Hosting
firebase deploy --only hosting
```

### Étape 4 : Vérification Post-Déploiement

```bash
# Ouvrir l'application
firebase open hosting:site

# Vérifier les logs
firebase functions:log
```

## ✅ Validation Post-Déploiement

### Tests Critiques

1. **Flow Acheteur**
   - [ ] Parcourir le catalogue
   - [ ] Ajouter au panier
   - [ ] Checkout avec MonCash
   - [ ] Recevoir confirmation

2. **Flow Vendeur**
   - [ ] Ajouter un produit
   - [ ] Recevoir une commande
   - [ ] Vérifier la commission (85%)

3. **MonCash Production**
   - [ ] Transaction réelle de test (25 HTG)
   - [ ] Webhook reçu
   - [ ] Commission split correcte

### Monitoring

- [ ] Firebase Console : Quotas < 80%
- [ ] Logs : Pas d'erreurs critiques
- [ ] Analytics : Tracking actif

## 🔄 Rollback

En cas de problème :

```bash
# Revenir à la version précédente
firebase hosting:rollback

# Restaurer les Functions
firebase deploy --only functions --version <previous-version>
```

## 📊 Métriques de Succès

- **Uptime** : 100% sur 24h
- **Lighthouse** : ≥90 sur mobile
- **Temps de réponse** : <2s
- **Erreurs** : <0.1%

## 🆘 Support d'Urgence

- **Firebase Status** : https://status.firebase.google.com
- **MonCash Support** : support@moncash.com
- **Contact Technique** : tech@uniondigitale.ht
