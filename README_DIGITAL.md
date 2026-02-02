# Module Produits Digitaux - Union Digitale

Ce module ajoute une fonctionnalité complète de vente de produits numériques (formations, ebooks, etc.) avec un checkout optimisé type SamCart.

## Structure du Projet

```
/union-digitale/
├─ /src/
│  ├─ /pages/digital/       # Pages React (Product, Checkout, Upsell)
│  ├─ /components/digital/  # Composants (Form, OrderBump, Card)
├─ /functions/src/          # Cloud Functions TypeScript
```

## Installation & Configuration

### 1. Backend (Cloud Functions)

Le backend utilise maintenant TypeScript. Vous devez configurer l'environnement :

1.  Allez dans le dossier functions : `cd functions`
2.  Installez les dépendances :
    ```bash
    npm install firebase-functions@latest firebase-admin axios
    npm install --save-dev typescript @types/node firebase-functions-test
    ```
3.  Initialisez TypeScript (si ce n'est pas fait) :
    ```bash
    npx tsc --init
    ```
4.  Assurez-vous que votre `package.json` (dans functions) a :
    ```json
    "main": "lib/index.js",
    "scripts": {
      "build": "tsc",
      "serve": "npm run build && firebase emulators:start --only functions",
      "deploy": "npm run build && firebase deploy --only functions"
    }
    ```
5.  Créez un fichier `functions/src/index.ts` qui exporte vos nouvelles fonctions :
    ```typescript
    export * from './createOrder';
    export * from './moncashWebhook';
    export * from './generateDownloadLinks';
    export * from './oneClickUpsell';
    export * from './saveAbandonedCart';
    ```

### 2. Frontend

1.  Les nouvelles routes sont pré-configurées dans `App.jsx`.
2.  Assurez-vous que `react-router-dom` et `lucide-react` sont installés (déjà le cas normalement).

## Déploiement

1.  **Build Functions** :
    ```bash
    cd functions
    npm run build
    ```
2.  **Deploy Firebase** :
    ```bash
    firebase deploy
    ```

## Utilisation

- **Page Produit** : `/digital/product/{id}`
- **Test Checkout** : Utilisez le bouton "Commencer" sur la page produit.
- **Upsell** : Après le succès du checkout (simulation), vous serez redirigé vers l'upsell.

## Webhooks

- **MonCash** : Configurez votre URL de webhook MonCash sur : `https://us-central1-union-digitale-9748e.cloudfunctions.net/moncashWebhook`

---
*Généré par Antigravity*
