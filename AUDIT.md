# 📊 Audit Technique & Plan d'Action : Union Digitale

**Date :** 1 Décembre 2025
**Version Auditée :** Prototype Frontend (React/Vite)
**Statut Global :** 🚧 **25% - Prototype Haute-Fidélité (Frontend Only)**

---

## 1. 🔍 Audit Technique Complet

### 1.1 Architecture Actuelle
| Composant | Technologie | État | Analyse |
| :--- | :--- | :---: | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS | ✅ | **Excellent.** Code propre, moderne, structure modulaire. UI responsive et esthétique. |
| **Backend** | - | ❌ | **Inexistant.** Aucune API ni logique serveur. |
| **Base de Données** | - | ❌ | **Inexistante.** Données "hardcodées" dans `src/data/products.js`. Aucune persistance. |
| **Hébergement** | - | ❌ | Non configuré. |

### 1.2 Fonctionnalités
| Fonctionnalité | État | Problème Identifié |
| :--- | :---: | :--- |
| **Catalogue Produits** | ⚠️ | Affichage statique depuis un fichier JS. Pas de gestion de stock réelle. |
| **Panier** | ⚠️ | Géré en mémoire (state React) ou LocalStorage. Perdu si changement de device. |
| **Authentification** | ❌ | **Absente.** Pas de login, pas d'inscription. L'accès `/admin` est ouvert à tous. |
| **Paiement (Checkout)** | ❌ | **Simulé.** Le bouton ne fait rien. Aucune connexion à MonCash ou Stripe. |
| **Dashboard Admin** | ❌ | **Visuel uniquement.** Les graphiques et chiffres sont des données fictives. |
| **Sécurité** | ❌ | Aucune protection XSS/CSRF (car pas de back), routes admin accessibles publiquement. |

---

## 2. ✅ Checklist Opérationnelle (Roadmap 100%)

Voici la liste exhaustive des actions requises pour transformer ce prototype en application de production.

### 🚨 Priorité 1 : Fondations & Infrastructure (URGENT)
*Bloquant pour toute mise en ligne.*
- [ ] **Initialiser le Backend** : Mettre en place un serveur (Node.js, NestJS) ou une solution BaaS (Supabase/Firebase).
- [ ] **Créer la Base de Données** :
    - Table `users` (clients + admins)
    - Table `products` (stock, prix, descriptions)
    - Table `orders` (suivi des commandes)
    - Table `order_items` (liason commande-produits)
- [ ] **Connecter Frontend <-> Backend** : Remplacer les fichiers `data/*.js` par des appels API (`fetch` / `axios`).

### 🛡️ Priorité 2 : Sécurité & Utilisateurs
*Indispensable pour protéger les données et l'accès.*
- [ ] **Système d'Authentification** : Login, Register, Reset Password.
- [ ] **Protection des Routes (Guards)** :
    - Bloquer `/admin` pour les non-admins.
    - Bloquer `/checkout` ou `/profile` pour les non-connectés (optionnel mais recommandé).
- [ ] **Sécurisation des API** : Vérification des tokens (JWT) sur chaque requête serveur.

### 💳 Priorité 3 : E-commerce & Paiements
*Le cœur du business.*
- [ ] **Intégration MonCash** :
    - Créer le payload de paiement sécurisé côté serveur.
    - Gérer la redirection vers MonCash.
    - **Webhook** : Créer un endpoint pour recevoir la confirmation de paiement de MonCash.
- [ ] **Gestion des Commandes** :
    - Enregistrement de la commande en DB au statut "En attente".
    - Mise à jour en "Payé" après confirmation.
    - Envoi d'email de confirmation (SendGrid/Resend).

### ⚙️ Priorité 4 : Administration & Opérations
- [ ] **CRUD Produits** : Formulaires pour ajouter/modifier/supprimer des produits depuis l'admin.
- [ ] **Gestion des Commandes Admin** : Voir la liste des commandes, changer les statuts (Expédié, Livré).
- [ ] **Dashboard Réel** : Connecter les graphiques aux vraies données de la DB.

---

## 3. ⚠️ Risques & Points Bloquants

1.  **Sécurité des Paiements** : Actuellement, le prix pourrait être modifié par un utilisateur malin dans le code JS avant l'envoi (si on envoyait depuis le front). **Solution :** Toujours recalculer le total côté serveur.
2.  **Perte de Données** : Sans base de données, tout refresh de page remet le site à zéro (sauf si LocalStorage, mais limité).
3.  **Accès Admin** : N'importe qui connaissant l'URL `/admin` peut voir le dashboard.

---

## 4. 🚀 Plan d'Action Recommandé

Pour aller vite et bien, je recommande l'architecture **"Modern Stack"** avec **Supabase** (Backend-as-a-Service). Cela couvre la DB, l'Auth et les API instantanément.

### Phase 1 : Migration des Données (Jours 1-2)
- Créer projet Supabase.
- Migrer `products.js` vers une table SQL `products`.
- Connecter le catalogue React à Supabase.

### Phase 2 : Authentification & Admin (Jours 3-4)
- Implémenter le Login/Register.
- Verrouiller la route `/admin`.

### Phase 3 : Paiements MonCash (Jours 5-7)
- Créer une "Edge Function" pour initier le paiement MonCash (garder les clés secrètes sur le serveur).
- Gérer le retour de paiement.

### Phase 4 : Finalisation (Jours 8-10)
- Tests complets.
- Déploiement Vercel.
