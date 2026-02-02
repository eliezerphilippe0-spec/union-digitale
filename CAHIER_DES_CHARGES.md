# 📄 Cahier des Charges Fonctionnel & Technique : Union Digitale

**Version :** 1.0
**Date :** 10 Décembre 2025
**Projet :** Plateforme E-commerce Hybride & Écosystème Vendeur (KonvesIA)

---

## 1. 🎯 Contexte et Vision du Projet

**Union Digitale** a pour ambition de devenir la référence du e-commerce en Haïti ("L'Amazon Haïtien"), en offrant un écosystème complet pour les acheteurs et une suite d'outils ultra-puissante pour les vendeurs (**KonvesIA**).

### Objectifs Principaux
1.  **Centraliser le commerce** : Réunir produits physiques, digitaux (livres, musique), véhicules et services sur une seule plateforme.
2.  **Booster les Vendeurs** : Fournir des outils IA (Intelligence Artificielle) pour automatiser le marketing et les ventes via WhatsApp.
3.  **Localisation Forte** : Adapter l'expérience aux réalités haïtiennes (Paiement MonCash, Kreyòl, WhatsApp-first).

---

## 2. 🏗️ Architecture Technique (Validée)

Le projet repose sur une architecture **Serverless** moderne pour garantir scalabilité et faible coût de maintenance.

*   **Frontend :** React 19, Vite, Tailwind CSS 4.0.
*   **Backend :** Firebase (Cloud Functions, Firestore, Auth, Storage).
*   **Mobile :** Capacitor (Wrapper pour Android/iOS).
*   **Performance :** Lazy Loading (Code Splitting) implémenté sur les gros modules.
*   **PWA :** Support Offline via `vite-plugin-pwa`.

---

## 3. 🛒 Module 1 : Front-Office Client (Storefront)

C'est la face visible par le grand public. Elle doit être fluide, rapide et incitative.

### 3.1 Catalogue & Navigation
*   **Recherche Avancée :** Barre de recherche avec autocomplétion.
*   **Filtres Multiples :** Prix, Marque, Catégorie, Note (Étoiles).
*   **Rayons Spécialisés :**
    *   *Marketplace Générale :* Mode, Maison, Électronique.
    *   *Union Auto :* Vente et location de véhicules (détails techniques, inspection).
    *   *Contenu Digital :* Librairie (E-books), Musique (Streaming/Achat).

### 3.2 Expérience Utilisateur
*   **Multi-langue :** Français, Kreyòl (HT), Anglais, Espagnol.
*   **Mon Compte :**
    *   *Portefeuille (Wallet) :* Solde rechargeable, cashback.
    *   *Bibliothèque :* Accès aux produits digitaux achetés.
    *   *Favoris & Listes d'envies.*

### 3.3 Tunnel d'Achat (Checkout)
*   **One-Page Checkout :** Panier -> Livraison -> Paiement sur une seule page optimisée.
*   **Méthodes de Paiement :**
    *   International : Stripe (Cartes), PayPal.
    *   Local : MonCash (Intégration native ou via intermédiaire), Paiement à la livraison.

---

## 4. 🚀 Module 2 : Back-Office Vendeur (KonvesIA Ultimate)

C'est le cœur de l'innovation. Un tableau de bord premium pour les vendeurs "Pro".

### 4.1 Intelligence Artificielle (KonvesIA)
*   **WhatsApp Viral (Auto-Pilote) :**
    *   Génération de liens "Click-to-Chat" avec messages pré-remplis par IA.
    *   *Exemple :* "🔥 Gwo Espesyal sou Tenis Nike..." généré automatiquement.
*   **Assistant Marketing (Kanpay) :**
    *   Rédaction automatique de descriptions produits et posts Facebook/Instagram.
*   **Chat Intelligent (Voice-to-Invoice) :**
    *   Le vendeur dicte une commande vocalement dans le chat.
    *   L'IA transcrit et **crée automatiquement la facture** dans le système financier.

### 4.2 Gestion Financière
*   **Tableau de Bord :** Chiffre d'affaires, Marge nette, Dépenses.
*   **Facturation :** Gestion des factures clients, statuts de paiement.

### 4.3 Funnel Builder (Constructeur de Tunnels)
*   Outil "Drag & Drop" pour créer des pages de vente (Landing Pages) spécifiques hors du catalogue général.

---

## 5. 👑 Module 3 : Administration & Programmes

### 5.1 Super Admin
*   **Gestion Globale :** Stock, Utilisateurs, Validation des Vendeurs (KYC).
*   **Modération :** Validation des annonces avant publication.

### 5.2 Programmes Spéciaux
*   **Union Plus (Fidélité) :** Abonnement type "Prime" (Livraison gratuite, offres exclusives).
*   **Programme Ambassadeur :** Système d'affiliation complet avec liens de parrainage et tableau de bord des commissions.

---

## 6. 🔒 Sécurité & Conformité

*   **Rôles & Permissions (RBAC) :**
    *   Séparation stricte entres rôles `client`, `seller`, `admin` via `firestore.rules`.
*   **Protection des Données :**
    *   Isolation des données clients.
    *   Protection des URL de téléchargement (produits digitaux).

---

## 7. 📅 Livrables Attendus pour la V1 (MVP)

1.  **Code Source Complet :** Repository Git propre et documenté.
2.  **Build de Production :** Application optimisée prête à être déployée (Vercel/Netlify).
3.  **Documentation API :** Si backend externe utilisé (actuellement Serverless).
4.  **Tests de Validation :** Preuve de fonctionnement du Checkout et des modules IA.
