# 🔐 Instructions d'Authentification Firebase

## Étape Actuelle : Authentification Requise

Firebase CLI nécessite une authentification pour déployer sur le projet `union-digitale-haiti`.

## Actions à Effectuer

### 1. Authentification

Une URL d'authentification Google s'affiche dans votre terminal. Vous devez :

1. **Copier l'URL** affichée dans le terminal
2. **Ouvrir l'URL** dans votre navigateur
3. **Se connecter** avec votre compte Google (celui qui a accès au projet Firebase)
4. **Autoriser** Firebase CLI

### 2. Après Authentification

Une fois authentifié, nous pourrons déployer :
- ✅ Firestore Rules (sécurité base de données)
- ✅ Storage Rules (sécurité fichiers)
- ✅ Cloud Functions (logique backend)

## Commandes de Déploiement

Après authentification, les commandes suivantes seront exécutées :

```bash
# Déployer Firestore Rules
firebase deploy --only firestore:rules

# Déployer Storage Rules
firebase deploy --only storage

# Déployer Cloud Functions
firebase deploy --only functions
```

## Vérification Post-Déploiement

Après le déploiement, nous vérifierons :
- ✅ Règles Firestore déployées
- ✅ Règles Storage déployées
- ✅ Cloud Functions actives
- ✅ Pas d'erreurs dans les logs

## Prochaines Étapes

Après le déploiement backend :
1. Configurer les clés de paiement LIVE
2. Tester MonCash en production
3. Valider la commission split (85/15)
