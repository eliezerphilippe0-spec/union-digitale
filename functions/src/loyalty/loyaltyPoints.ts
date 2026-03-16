import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

// 1 point par 100 HTG dépensés
const POINTS_PER_100_HTG = 1;

// Statuts qui déclenchent l'attribution de points
const PAID_STATUSES = ["paid", "delivered", "delivered_paid"];

/**
 * Attribution automatique de points de fidélité — Union Digitale
 *
 * Se déclenche à chaque mise à jour d'une commande.
 * Quand le statut passe à 'paid', 'delivered' ou 'delivered_paid' :
 *   → Calcule les points (1 pt / 100 HTG)
 *   → Incrémente users.points de façon atomique
 *   → Enregistre la transaction dans points_transactions
 *   → Idempotent : vérifie qu'on n'a pas déjà attribué les points pour cette commande
 */
export const onOrderPaidAwardPoints = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Ignorer si le statut n'a pas changé
    if (before.status === after.status) return;

    // Uniquement quand on transite VERS un statut payé/livré
    const wasAlreadyPaid = PAID_STATUSES.includes(before.status);
    const isNowPaid = PAID_STATUSES.includes(after.status);

    if (wasAlreadyPaid || !isNowPaid) return;

    const userId = after.userId;
    const orderId = event.params.orderId;

    // Le montant total de la commande (on cherche dans plusieurs champs selon le flux)
    const totalAmount =
      after.totalAmount ?? after.totalPrice ?? after.total ?? 0;

    if (!userId || totalAmount <= 0) return;

    try {
      // Vérification d'idempotence : les points ont-ils déjà été attribués ?
      const existingSnapshot = await db
        .collection("points_transactions")
        .where("orderId", "==", orderId)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        console.log(`Points already awarded for order ${orderId}, skipping.`);
        return;
      }

      const pointsToAward =
        Math.floor(totalAmount / 100) * POINTS_PER_100_HTG;

      if (pointsToAward <= 0) {
        console.log(
          `Order ${orderId} total (${totalAmount} HTG) too low to earn points.`
        );
        return;
      }

      // Opération atomique : mise à jour points + enregistrement transaction
      const batch = db.batch();

      // Incrémenter le compteur de points du user
      const userRef = db.collection("users").doc(userId);
      batch.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToAward),
        totalPointsEarned: admin.firestore.FieldValue.increment(pointsToAward),
        pointsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Enregistrer la transaction de points pour transparence
      const pointsTxRef = db.collection("points_transactions").doc();
      batch.set(pointsTxRef, {
        userId,
        orderId,
        points: pointsToAward,
        totalAmount,
        reason: "purchase",
        orderStatus: after.status,
        paymentMethod: after.paymentMethod || "unknown",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      console.log(
        `✅ Awarded ${pointsToAward} points to user ${userId} for order ${orderId} (${totalAmount} HTG)`
      );
    } catch (error) {
      console.error("Loyalty points error:", error);
    }
  }
);
