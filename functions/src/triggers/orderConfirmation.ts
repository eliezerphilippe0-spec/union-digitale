import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as twilio from "twilio";
import * as sgMail from "@sendgrid/mail";

const db = admin.firestore();

// Statuts qui déclenchent la notification de confirmation
const CONFIRMED_STATUSES = ["paid", "confirmed", "processing", "pending_delivery"];

/**
 * Génère un numéro de commande lisible par l'humain
 * Format : UD-YYMMDD-XXXXXX
 * Exemple : UD-260223-847291
 */
function generateOrderNumber(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(100000 + Math.random() * 900000);
  return `UD-${yy}${mm}${dd}-${random}`;
}

/**
 * Formate un numéro de téléphone haïtien en E.164
 */
function formatHaitiPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("509") && digits.length === 11) return `+${digits}`;
  if (digits.length === 8) return `+509${digits}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  return `+509${digits}`;
}

/**
 * Attribue un numéro de commande lisible à chaque nouvelle commande
 *
 * Ce trigger est un filet de sécurité : il s'applique aux commandes créées
 * directement via paymentService.js (frontend), qui ne passent pas par createOrderSecure.
 * Les commandes créées via createOrderSecure ont déjà un orderNumber.
 */
export const assignOrderNumber = onDocumentCreated(
  "orders/{orderId}",
  async (event) => {
    const orderId = event.params.orderId;
    const order = event.data?.data();

    if (!order) return;

    // Ne pas écraser si déjà défini (ex : créé via createOrderSecure)
    if (order.orderNumber) {
      console.log(`Order ${orderId} already has orderNumber: ${order.orderNumber}`);
      return;
    }

    const orderNumber = generateOrderNumber();

    await event.data!.ref.update({
      orderNumber,
      orderNumberAssignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Numéro attribué : ${orderNumber} → ${orderId}`);
  }
);

/**
 * Envoie la confirmation de commande (WhatsApp + Email) quand une commande
 * passe à l'état payé/confirmé.
 *
 * Idempotent : vérifie le champ confirmationSentAt avant d'envoyer.
 * Non-bloquant : les erreurs de notification ne font pas échouer la fonction.
 */
export const onOrderConfirmed = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    // Déclenchement uniquement lors de la TRANSITION vers un statut confirmé
    const wasConfirmed = CONFIRMED_STATUSES.includes(before.status);
    const isNowConfirmed = CONFIRMED_STATUSES.includes(after.status);

    if (wasConfirmed || !isNowConfirmed) return;

    // Garde idempotence
    if (after.confirmationSentAt) {
      console.log(`Confirmation déjà envoyée pour ${event.params.orderId}`);
      return;
    }

    const orderId = event.params.orderId;
    const userId = after.userId;
    const orderNumber = after.orderNumber || orderId;
    const totalAmount = after.totalAmount ?? after.totalPrice ?? after.total ?? 0;
    const paymentMethod = after.paymentMethod || "online";

    if (!userId) {
      console.error(`userId manquant sur la commande ${orderId}`);
      return;
    }

    try {
      // Récupérer le profil utilisateur
      const userDoc = await db.collection("users").doc(userId).get();
      const user = userDoc.data();

      if (!user) {
        console.error(`Utilisateur ${userId} introuvable`);
        return;
      }

      const customerName = user.displayName || user.firstName || "Client";
      const phone = user.phone || user.phoneNumber || null;
      const email = user.email || null;
      const totalFormatted = totalAmount.toLocaleString("fr-HT");
      const paymentLabel =
        paymentMethod === "COD_HT" ? "Paiement à la livraison (COD)" : "MonCash";

      // ─── WhatsApp ────────────────────────────────────────────────────────────
      if (phone) {
        try {
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;
          const whatsappFrom =
            process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

          if (accountSid && authToken) {
            const client = twilio.default(accountSid, authToken);
            const formattedPhone = formatHaitiPhone(phone);

            const message =
              `✅ *Commande confirmée — Union Digitale*\n\n` +
              `Bonjour ${customerName},\n\n` +
              `Votre commande a bien été reçue !\n\n` +
              `📦 Numéro : *${orderNumber}*\n` +
              `💰 Total : *${totalFormatted} HTG*\n` +
              `💳 Paiement : ${paymentLabel}\n\n` +
              `Suivez votre commande dans l'application.\n` +
              `Merci de votre confiance ! 🙏`;

            await client.messages.create({
              from: whatsappFrom,
              to: `whatsapp:${formattedPhone}`,
              body: message,
            });

            // Log dans Firestore
            await db.collection("notifications").add({
              userId,
              orderId,
              orderNumber,
              type: "order_confirmation_whatsapp",
              to: formattedPhone,
              status: "sent",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`✅ WhatsApp envoyé à ${formattedPhone} — ${orderNumber}`);
          }
        } catch (waError: any) {
          console.error("WhatsApp échoué (non-bloquant) :", waError.message);
        }
      }

      // ─── Email ───────────────────────────────────────────────────────────────
      if (email) {
        try {
          const sendgridKey = process.env.SENDGRID_API_KEY;
          const fromEmail =
            process.env.SENDGRID_FROM_EMAIL || "noreply@uniondigitale.ht";

          if (sendgridKey) {
            sgMail.setApiKey(sendgridKey);

            await sgMail.send({
              to: email,
              from: fromEmail,
              subject: `Confirmation de commande ${orderNumber} — Union Digitale`,
              html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;">
  <!-- En-tête -->
  <div style="background:#6366f1;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="color:white;margin:0;font-size:26px;letter-spacing:1px;">Union Digitale</h1>
    <p style="color:#c7d2fe;margin:4px 0 0;font-size:14px;">La marketplace d'Haïti</p>
  </div>

  <!-- Corps -->
  <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
    <h2 style="color:#111827;margin-top:0;">✅ Commande confirmée !</h2>
    <p style="color:#374151;">Bonjour <strong>${customerName}</strong>,</p>
    <p style="color:#374151;">
      Nous avons bien reçu votre commande et le paiement a été validé.
      Voici votre récapitulatif :
    </p>

    <!-- Numéro de commande -->
    <div style="background:#f5f3ff;border:2px solid #6366f1;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">
        Numéro de commande
      </p>
      <p style="margin:0;font-size:26px;font-weight:bold;color:#6366f1;letter-spacing:2px;">
        ${orderNumber}
      </p>
    </div>

    <!-- Récapitulatif -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:12px 0;color:#6b7280;">Total de la commande</td>
        <td style="padding:12px 0;font-weight:bold;text-align:right;color:#111827;">
          ${totalFormatted} HTG
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#6b7280;">Mode de paiement</td>
        <td style="padding:12px 0;text-align:right;color:#111827;">${paymentLabel}</td>
      </tr>
    </table>

    <p style="color:#374151;">
      Vous pouvez suivre l'état de votre commande à tout moment dans
      l'application <strong>Union Digitale</strong>.
    </p>

    <p style="color:#374151;margin-top:24px;">
      Merci de votre confiance et à très bientôt ! 🙏
    </p>
  </div>

  <!-- Pied -->
  <div style="text-align:center;padding:20px;color:#9ca3af;font-size:12px;">
    Union Digitale &copy; ${new Date().getFullYear()} — Haïti<br/>
    Conservez ce numéro de commande : <strong>${orderNumber}</strong>
  </div>
</div>
              `,
              text:
                `Bonjour ${customerName},\n\n` +
                `Votre commande ${orderNumber} de ${totalFormatted} HTG a été confirmée.\n` +
                `Mode de paiement : ${paymentLabel}\n\n` +
                `Merci de votre confiance !\n— Union Digitale`,
            });

            // Log dans Firestore
            await db.collection("notifications").add({
              userId,
              orderId,
              orderNumber,
              type: "order_confirmation_email",
              to: email,
              status: "sent",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`✅ Email envoyé à ${email} — ${orderNumber}`);
          }
        } catch (emailError: any) {
          console.error("Email échoué (non-bloquant) :", emailError.message);
        }
      }

      // Marquer comme envoyé (idempotence)
      await event.data!.after.ref.update({
        confirmationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Erreur confirmation commande :", error);
      // Non-bloquant : ne pas relancer
    }
  }
);
