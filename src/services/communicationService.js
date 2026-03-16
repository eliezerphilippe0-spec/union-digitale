/**
 * Communication Service - Handles WhatsApp, SMS and Email notifications.
 * Designed for the Haitian market (Union Digitale).
 */

const WHATSAPP_API_URL = 'https://api.twilio.com/v1/messages'; // Placeholder for real Twilio or local hook

/**
 * Sends a WhatsApp message using a template.
 * @param {string} to - Recipient phone number (e.g., +509...)
 * @param {string} templateId - ID of the template to use
 * @param {Object} variables - Key-value pairs for template replacement
 */
export const sendWhatsAppNotification = async (to, templateId, variables) => {
    try {
        const message = templates[templateId](variables);

        console.log(`[WhatsApp Notification] To: ${to} | Template: ${templateId}`);
        console.log(`[Message Content]: ${message}`);

        // In production, this would be an API call to a secure cloud function or Twilio
        // Example:
        // await axios.post('/api/notifications/whatsapp', { to, message });

        return { success: true, messageId: `mock_${Date.now()}` };
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Message templates localized for Union Digitale.
 */
const templates = {
    'booking_confirmed_client': (v) =>
        `C'est confirmé ! 💇‍♂️ Votre rendez-vous chez *${v.salonName}* pour *${v.serviceName}* est prévu le *${v.date}* à *${v.time}*.\n\n📍 Adresse: ${v.address}\n🆔 Réservation: ${v.bookingId}\n\nMerci de faire confiance à Union Digitale !`,

    'booking_confirmed_seller': (v) =>
        `Nouveau rendez-vous ! 📅 *${v.clientName}* a réservé *${v.serviceName}* pour le *${v.date}* à *${v.time}*.\n\nConsultez votre calendrier ici: https://union-digitale.ht/seller/salon/calendar\n🆔 ${v.bookingId}`,

    'booking_reminder': (v) =>
        `Petit rappel ! 🔔 Vous avez rendez-vous demain à *${v.time}* chez *${v.salonName}*.\nÀ très bientôt !`,

    'maintenance_alert_admin': (v) =>
        `⚠️ Alerte Système: Le mode maintenance a été activé par ${v.adminName}.`
};

export const NOTIFICATION_TEMPLATES = {
    BOOKING_CONFIRMED_CLIENT: 'booking_confirmed_client',
    BOOKING_CONFIRMED_SELLER: 'booking_confirmed_seller',
    BOOKING_REMINDER: 'booking_reminder',
    MAINTENANCE_ALERT: 'maintenance_alert_admin'
};

export default {
    sendWhatsAppNotification,
    NOTIFICATION_TEMPLATES
};
