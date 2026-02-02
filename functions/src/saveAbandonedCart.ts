import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { sendWhatsAppMessageHelper, sendEmailHelper } from "./utils/notifications";

const db = admin.firestore();

// Runs every hour to check for abandoned carts
export const saveAbandonedCart = onSchedule("every 1 hours", async (event) => {
    const now = admin.firestore.Timestamp.now();
    const oneHourAgo = new Date(now.toMillis() - 60 * 60 * 1000);

    // Find carts modified > 1 hour ago but not converted
    const cartsSnapshot = await db.collection('abandoned_carts')
        .where('updatedAt', '<', oneHourAgo)
        .where('status', '==', 'active')
        .where('recoveryAttempts', '<', 3) // Don't spam
        .limit(50)
        .get();

    const batch = db.batch();

    for (const doc of cartsSnapshot.docs) {
        const cart = doc.data();

        // Logic to decide which message to send based on attempts
        let message = "";
        let attempt = cart.recoveryAttempts || 0;

        if (attempt === 0) {
            message = "Vous avez oublié quelque chose dans votre panier ! Terminez votre commande maintenant.";
            if (cart.userPhone) await sendWhatsAppMessageHelper(cart.userPhone, message);
        } else if (attempt === 1) {
            message = "Votre panier expire bientôt. Voici un lien pour finaliser.";
            if (cart.userEmail) await sendEmailHelper(cart.userEmail, "Panier en attente", message);
        }

        batch.update(doc.ref, {
            recoveryAttempts: admin.firestore.FieldValue.increment(1),
            lastAttemptAt: now
        });
    }

    await batch.commit();
    console.log(`Processed ${cartsSnapshot.size} abandoned carts.`);
});
