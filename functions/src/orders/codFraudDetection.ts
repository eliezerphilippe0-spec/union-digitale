import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

const COD_REFUSAL_LIMIT = 2;
const REFUSAL_WINDOW_DAYS = 90;

/**
 * Détection automatique de fraude COD — Union Digitale
 *
 * Se déclenche à chaque mise à jour d'une commande.
 * Si le statut passe à 'refused' ou 'returned' pour une commande COD :
 *   → Compte les refus récents de cet utilisateur
 *   → Après 2 refus en 90 jours → flag codBlocked: true sur le user
 *   → Crée une alerte dans fraud_alerts pour l'admin
 */
export const onCODOrderStatusUpdate = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Ignorer si le statut n'a pas changé
    if (before.status === after.status) return;

    // Uniquement pour les commandes COD qui passent en refus ou retour
    const isRefusal = ["refused", "returned"].includes(after.status);
    const isCOD = after.paymentMethod === "COD_HT";

    if (!isRefusal || !isCOD) return;

    const userId = after.userId;
    if (!userId) {
      console.error("COD fraud detection: missing userId on order", event.params.orderId);
      return;
    }

    try {
      // Fenêtre temporelle : 90 jours en arrière
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - REFUSAL_WINDOW_DAYS);

      // Compter tous les refus COD récents de cet utilisateur
      const refusalsSnapshot = await db
        .collection("orders")
        .where("userId", "==", userId)
        .where("paymentMethod", "==", "COD_HT")
        .where("status", "in", ["refused", "returned"])
        .where("updatedAt", ">=", admin.firestore.Timestamp.fromDate(windowStart))
        .get();

      const refusalCount = refusalsSnapshot.size;

      // Enregistrer l'événement de refus dans cod_refusals
      await db.collection("cod_refusals").add({
        userId,
        orderId: event.params.orderId,
        orderStatus: after.status,
        totalRefusalsInWindow: refusalCount,
        windowDays: REFUSAL_WINDOW_DAYS,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(
        `COD refusal logged for user ${userId}. Total in window: ${refusalCount}`
      );

      // Seuil dépassé → bloquer le COD pour cet utilisateur
      if (refusalCount >= COD_REFUSAL_LIMIT) {
        // Mise à jour atomique du user doc
        await db
          .collection("users")
          .doc(userId)
          .update({
            codBlocked: true,
            codBlockedAt: admin.firestore.FieldValue.serverTimestamp(),
            codBlockedReason: `${refusalCount} refus de livraison en ${REFUSAL_WINDOW_DAYS} jours`,
          });

        // Créer une alerte admin dans fraud_alerts
        await db.collection("fraud_alerts").add({
          type: "COD_SERIAL_REFUSAL",
          userId,
          triggeredByOrderId: event.params.orderId,
          refusalCount,
          windowDays: REFUSAL_WINDOW_DAYS,
          severity: "high",
          status: "open",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(
          `🚨 COD BLOCKED for user ${userId} after ${refusalCount} refusals in ${REFUSAL_WINDOW_DAYS} days`
        );
      }
    } catch (error) {
      console.error("COD fraud detection error:", error);
      // Ne pas relancer : un échec de logging ne doit pas bloquer le système
    }
  }
);
