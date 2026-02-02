# Union Digitale - API Documentation

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#authentification)
3. [Cloud Functions API](#cloud-functions-api)
4. [Modèles de données](#modèles-de-données)
5. [Codes d'erreur](#codes-derreur)

---

## Vue d'ensemble

Union Digitale utilise Firebase comme backend avec les services suivants:
- **Firebase Auth**: Authentification
- **Cloud Firestore**: Base de données NoSQL
- **Cloud Functions v2**: API serverless
- **Firebase Storage**: Stockage de fichiers
- **Firebase Hosting**: Hébergement web

### Base URL
```
Production: https://us-central1-[PROJECT_ID].cloudfunctions.net/
```

### Format de réponse
Toutes les réponses suivent ce format:
```json
{
  "success": true,
  "data": { ... }
}
```

Ou en cas d'erreur:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur"
  }
}
```

---

## Authentification

### Méthodes supportées
- Email/Password
- Google OAuth
- Phone (SMS)

### Token d'authentification
Toutes les requêtes authentifiées doivent inclure le header:
```
Authorization: Bearer <firebase_id_token>
```

### Custom Claims (Roles)
```typescript
{
  role: 'buyer' | 'vendor' | 'admin',
  vendorId?: string,
  twoFactorVerified?: boolean
}
```

---

## Cloud Functions API

### Orders

#### `createOrderSecure`
Crée une commande sécurisée avec validation des prix.

**Type**: `onCall`

**Paramètres**:
```typescript
{
  items: Array<{
    productId: string;
    vendorId: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    notes?: string;
  };
  paymentMethod: 'moncash' | 'stripe' | 'paypal';
  couponCode?: string;
}
```

**Réponse**:
```typescript
{
  orderId: string;
  total: number;
  discount: number;
  paymentUrl?: string;
}
```

---

### Reviews

#### `submitProductReview`
Soumet un avis pour un produit acheté.

**Type**: `onCall`

**Paramètres**:
```typescript
{
  productId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  comment: string;
  images?: string[];
}
```

**Réponse**:
```typescript
{
  success: true;
  reviewId: string;
}
```

**Erreurs possibles**:
- `unauthenticated`: Non connecté
- `permission-denied`: N'a pas acheté le produit
- `already-exists`: Déjà reviewé

#### `getProductReviews`
Récupère les avis d'un produit.

**Paramètres**:
```typescript
{
  productId: string;
  limit?: number;  // défaut: 20
  sortBy?: 'recent' | 'highest' | 'lowest' | 'helpful';
}
```

#### `markReviewHelpful`
Marque un avis comme utile.

**Paramètres**:
```typescript
{
  reviewId: string;
}
```

#### `reportReview`
Signale un avis inapproprié.

**Paramètres**:
```typescript
{
  reviewId: string;
  reason: string;
}
```

---

### Chat

#### `getOrCreateConversation`
Obtient ou crée une conversation avec un vendeur.

**Paramètres**:
```typescript
{
  vendorId: string;
  productId?: string;  // Optionnel: lié à un produit
}
```

**Réponse**:
```typescript
{
  conversationId: string;
  buyerId: string;
  vendorId: string;
  // ... autres champs
}
```

#### `sendMessage`
Envoie un message dans une conversation.

**Paramètres**:
```typescript
{
  conversationId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  attachments?: string[];
}
```

#### `getMessages`
Récupère les messages d'une conversation.

**Paramètres**:
```typescript
{
  conversationId: string;
  limit?: number;  // défaut: 50
}
```

#### `markMessagesRead`
Marque les messages comme lus.

**Paramètres**:
```typescript
{
  conversationId: string;
}
```

#### `getUserConversations`
Liste toutes les conversations de l'utilisateur.

**Réponse**:
```typescript
{
  conversations: Array<{
    id: string;
    role: 'buyer' | 'vendor';
    lastMessage: string;
    unreadBuyer: number;
    unreadVendor: number;
    // ...
  }>;
}
```

---

### Promotions

#### `createCoupon`
Crée un coupon (vendeur/admin uniquement).

**Paramètres**:
```typescript
{
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  usageLimit?: number;
  perUserLimit?: number;
  startDate: string;  // ISO date
  endDate: string;    // ISO date
}
```

#### `applyCoupon`
Applique un coupon au panier.

**Paramètres**:
```typescript
{
  code: string;
  cartItems: Array<{
    productId: string;
    vendorId: string;
    category: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
}
```

**Réponse**:
```typescript
{
  valid: true;
  couponId: string;
  code: string;
  type: string;
  discount: number;
  freeShipping: boolean;
  message: string;
}
```

#### `getAvailableCoupons`
Liste les coupons disponibles pour l'utilisateur.

---

### Search (Algolia)

#### `reindexAllProducts`
Réindexe tous les produits dans Algolia (admin uniquement).

**Type**: `onCall`

**Réponse**:
```typescript
{
  success: true;
  indexed: number;
}
```

---

### Cache (Redis)

#### `getPopularProducts`
Récupère les produits populaires (cachés).

**Paramètres**:
```typescript
{
  limit?: number;  // défaut: 20
}
```

#### `getVendorStats`
Récupère les statistiques d'un vendeur (cachées).

**Paramètres**:
```typescript
{
  vendorId: string;
}
```

**Réponse**:
```typescript
{
  totalSales: number;
  totalOrders: number;
  activeProducts: number;
  pendingOrders: number;
  averageRating: number;
}
```

#### `getProductsByCategory`
Récupère les produits par catégorie (cachés).

**Paramètres**:
```typescript
{
  category: string;
  limit?: number;
}
```

---

### Two-Factor Authentication

#### `enable2FA`
Active la 2FA pour le compte.

**Paramètres**:
```typescript
{
  method: 'sms' | 'email';
}
```

#### `verify2FASetup`
Vérifie le code et active la 2FA.

**Paramètres**:
```typescript
{
  code: string;  // Code à 6 chiffres
}
```

**Réponse**:
```typescript
{
  success: true;
  backupCodes: string[];  // 10 codes de secours
  message: string;
}
```

#### `send2FACode`
Envoie un code 2FA pour connexion.

#### `verify2FACode`
Vérifie le code 2FA.

**Paramètres**:
```typescript
{
  code: string;
}
```

#### `useBackupCode`
Utilise un code de secours.

**Paramètres**:
```typescript
{
  backupCode: string;
}
```

#### `disable2FA`
Désactive la 2FA (requiert mot de passe).

---

### Audit Logs

#### `getAuditLogs`
Récupère les logs d'audit (admin uniquement).

**Paramètres**:
```typescript
{
  action?: string;
  severity?: 'info' | 'warning' | 'critical';
  userId?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}
```

---

## Modèles de données

### User
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: 'buyer' | 'vendor' | 'admin';
  createdAt: Timestamp;

  // Vendor specific
  storeName?: string;
  storeDescription?: string;
  vendorRating?: number;
  vendorReviewCount?: number;

  // 2FA
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'email';
}
```

### Product
```typescript
{
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  category: string;
  brand?: string;
  images: string[];
  vendorId: string;
  vendorName: string;
  stock: number;
  status: 'active' | 'inactive' | 'draft';
  rating: number;
  reviewCount: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  salesCount: number;
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Order
```typescript
{
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    productName: string;
    productImage: string;
    vendorId: string;
    vendorName: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    notes?: string;
  };
  paymentMethod: 'moncash' | 'stripe' | 'paypal';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Review
```typescript
{
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  productId: string;
  productName: string;
  vendorId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  comment: string;
  images?: string[];
  helpful: number;
  reported: boolean;
  verified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Conversation
```typescript
{
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhoto?: string;
  vendorId: string;
  vendorName: string;
  vendorPhoto?: string;
  productId?: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  unreadBuyer: number;
  unreadVendor: number;
  status: 'active' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Message
```typescript
{
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'buyer' | 'vendor';
  content: string;
  type: 'text' | 'image' | 'file';
  attachments?: string[];
  read: boolean;
  createdAt: Timestamp;
}
```

### Coupon
```typescript
{
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  vendorId?: string;
  usageLimit?: number;
  usageCount: number;
  perUserLimit: number;
  startDate: Timestamp;
  endDate: Timestamp;
  active: boolean;
  createdBy: string;
  createdAt: Timestamp;
}
```

### AuditLog
```typescript
{
  id: string;
  userId: string;
  action: string;
  severity: 'info' | 'warning' | 'critical';
  resourceType?: string;
  resourceId?: string;
  details?: object;
  ip?: string;
  userAgent?: string;
  timestamp: Timestamp;
}
```

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| `unauthenticated` | Non authentifié |
| `permission-denied` | Accès refusé |
| `not-found` | Ressource non trouvée |
| `already-exists` | Ressource existe déjà |
| `invalid-argument` | Paramètre invalide |
| `failed-precondition` | Précondition non remplie |
| `resource-exhausted` | Limite atteinte (rate limit) |
| `deadline-exceeded` | Timeout / Code expiré |
| `internal` | Erreur interne |

---

## Rate Limits

| Action | Limite |
|--------|--------|
| Login | 5/minute |
| Signup | 3/heure |
| Order | 10/minute |
| Review | 5/heure |
| Message | 30/minute |
| Search | 100/minute |
| API (default) | 60/minute |

---

## Webhooks

### MonCash Webhook
```
POST /moncashWebhook
Content-Type: application/json

{
  "transactionId": "string",
  "orderId": "string",
  "amount": number,
  "status": "success" | "failed"
}
```

### Stripe Webhook
```
POST /stripeWebhook
Content-Type: application/json
Stripe-Signature: <signature>

{
  // Stripe event payload
}
```

---

## SDKs et Exemples

### JavaScript/React
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Appeler une fonction
const createOrder = httpsCallable(functions, 'createOrderSecure');
const result = await createOrder({
  items: [...],
  shippingAddress: {...},
  paymentMethod: 'moncash'
});

console.log(result.data.orderId);
```

### curl
```bash
# Obtenir un token
TOKEN=$(firebase auth:sign-in-with-email-link --email user@example.com)

# Appeler une fonction
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": {"productId": "abc123"}}' \
  https://us-central1-PROJECT_ID.cloudfunctions.net/getProductReviews
```

---

## Contact Support

- Email: dev@uniondigitale.ht
- Documentation: https://docs.uniondigitale.ht
- Status: https://status.uniondigitale.ht

---

*Dernière mise à jour: Janvier 2026*
*Version API: 2.0*
