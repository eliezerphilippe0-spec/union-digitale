# 📂 Union Digitale - Dossier de Passation

Ce dossier contient le code source complet et la documentation technique pour le projet Union Digitale (incluant le module KonvesIA).

## 📄 Documents Inclus
- **`CAHIER_DES_CHARGES.md`** : Spécifications fonctionnelles et techniques complètes.
- **`AUDIT_REPORT.md`** : État des lieux de la sécurité, performance et architecture.
- **`README.md`** : Instructions d'installation standard.

## 🚀 Démarrage Rapide (Pour les Développeurs)

### Pré-requis
- Node.js (v18+)
- Firebase CLI (`npm install -g firebase-tools`)

### Installation & Lancement
```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev
# Le site sera accessible sur http://localhost:5173
```

### Build de Production
```bash
npm run build
# Les fichiers statiques seront générés dans le dossier /dist
```

## 🔑 Accès & Configuration
- **Firebase** : Le projet utilise Firebase. Configurez votre propre projet via `.firebaserc` et `src/lib/firebase.js`.
- **Règles de Sécurité** : Voir `firestore.rules`.
- **Fonctions Cloud** : Le code backend se trouve dans le dossier `/functions`.

---
*Généré par Antigravity le 10 Décembre 2025.*
