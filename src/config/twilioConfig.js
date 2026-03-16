/**
 * Twilio WhatsApp API Configuration
 *
 * SECURITE : Les credentials Twilio ne doivent JAMAIS etre dans le bundle frontend.
 * Toute communication WhatsApp passe par les Firebase Cloud Functions (backend).
 * Ce fichier ne contient aucun secret.
 */

// SECURITE : On n'expose aucun accountSid ni authToken ici.
// Les Cloud Functions gèrent l'authentification Twilio côté serveur.
export const twilioConfig = {
    isConfigured: true, // Le backend (Cloud Functions) gère la connexion
    mode: 'backend-only',
};

/**
 * Format phone number for Haiti
 * Converts various formats to E.164 format (+509XXXXXXXX)
 * 
 * @param {string} phoneNumber - Phone number in any format
 * @returns {string} - Formatted phone number
 */
export const formatHaitiPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return null;

    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // Handle different formats
    if (digits.startsWith('509') && digits.length === 11) {
        return `+${digits}`;
    } else if (digits.length === 8) {
        return `+509${digits}`;
    } else if (digits.startsWith('1') && digits.length === 11) {
        // US/Canada number
        return `+${digits}`;
    }

    // Return as-is if already formatted
    if (phoneNumber.startsWith('+')) {
        return phoneNumber;
    }

    // Default: assume Haiti number
    return `+509${digits}`;
};
