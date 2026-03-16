import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

const PAID_STATUSES = ["paid", "completed", "delivered", "delivered_paid"];

/**
 * Nombre de téléchargements autorisés par achat (modèle Apple / Steam)
 * L'acheteur peut re-télécharger jusqu'à 5 fois.
 * Un nouvel achat du même produit ajoute 5 téléchargements supplémentaires.
 */
const MAX_DOWNLOADS_PER_PURCHASE = 5;

/**
 * Crée les droits d'accès (entitlements) aux produits digitaux
 * quand une commande passe à l'état payé/livré.
 *
 * Modèle inspiré de Apple App Store & Steam :
 *   - Les droits sont liés au COMPTE, pas à l'appareil
 *   - Chaque achat donne droit à MAX_DOWNLOADS_PER_PURCHASE téléchargements
 *   - Racheter le même produit ajoute des téléchargements (pas de duplication)
 *   - Idempotent : les transitions ultérieures vers paid sont ignorées
 */
export const onOrderPaidGrantEntitlements = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    // Uniquement lors de la TRANSITION vers un statut payé
    const wasAlreadyPaid = PAID_STATUSES.includes(before.status);
    const isNowPaid = PAID_STATUSES.includes(after.status);

    if (wasAlreadyPaid || !isNowPaid) return;

    const orderId = event.params.orderId;
    const userId = after.userId;
    const orderNumber = after.orderNumber || orderId;

    if (!userId || !Array.isArray(after.items) || after.items.length === 0) return;

    // Filtrer uniquement les produits digitaux
    const digitalItems = (after.items as any[]).filter(
      (item) => item.isDigital || item.type === "digital"
    );

    if (digitalItems.length === 0) return;

    console.log(
      `🎁 Attribution de ${digitalItems.length} entitlement(s) — commande ${orderNumber} → user ${userId}`
    );

    const batch = db.batch();

    for (const item of digitalItems) {
      const productId = item.productId || item.id;
      if (!productId) continue;

      const entitlementRef = db
        .collection("users")
        .doc(userId)
        .collection("entitlements")
        .doc(productId);

      const existing = await entitlementRef.get();

      if (existing.exists) {
        // Rachat du même produit → ajouter des téléchargements supplémentaires
        const current = existing.data()!;
        batch.update(entitlementRef, {
          maxDownloads: (current.maxDownloads || 0) + MAX_DOWNLOADS_PER_PURCHASE,
          renewCount: (current.renewCount || 0) + 1,
          lastRenewedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastOrderId: orderId,
          lastOrderNumber: orderNumber,
        });
        console.log(
          `♻️ Renouvellement entitlement produit ${productId} : +${MAX_DOWNLOADS_PER_PURCHASE} téléchargements`
        );
      } else {
        // Premier achat → créer le droit d'accès
        batch.set(entitlementRef, {
          userId,
          productId,
          orderId,
          orderNumber,
          itemName: item.name || item.title || "Produit digital",
          downloadCount: 0,
          maxDownloads: MAX_DOWNLOADS_PER_PURCHASE,
          renewCount: 0,
          grantedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastDownloadAt: null,
          lastOrderId: orderId,
          lastOrderNumber: orderNumber,
        });
        console.log(`✅ Entitlement créé pour produit ${productId}`);
      }
    }

    await batch.commit();
    console.log(
      `✅ ${digitalItems.length} entitlement(s) committé(s) pour la commande ${orderNumber}`
    );
  }
);
