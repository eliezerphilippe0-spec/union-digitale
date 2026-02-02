/**
 * Twilio WhatsApp API Configuration
 * 
 * NOTE: The Twilio SDK cannot run in the browser (client-side).
 * For production, WhatsApp integration must be done via Firebase Functions (backend).
 * 
 * This module provides configuration and validation for future backend integration.
 */

// Load credentials from environment variables
const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const whatsappNumber = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER;

// Check if credentials are configured (not placeholders)
const hasValidCredentials =
    accountSid &&
    authToken &&
    whatsappNumber &&
    accountSid !== 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' &&
    authToken !== 'votre_auth_token_ici';

// Log configuration status
if (hasValidCredentials) {
    console.log(
        '%c[Twilio Config] ✅ Credentials detected',
        'background: #25D366; color: white; padding: 4px; border-radius: 4px;',
        '\n⚠️ Note: Real WhatsApp sending requires Firebase Functions (backend).',
        '\nCurrent mode: Simulation with credential logging'
    );
} else {
    console.warn(
        '[Twilio Config] ⚠️ Missing or placeholder credentials.\n' +
        'WhatsApp messages will be simulated only.\n' +
        'To configure, add real credentials to .env file:\n' +
        '- VITE_TWILIO_ACCOUNT_SID\n' +
        '- VITE_TWILIO_AUTH_TOKEN\n' +
        '- VITE_TWILIO_WHATSAPP_NUMBER'
    );
}

export const twilioConfig = {
    accountSid: accountSid,
    authToken: authToken, // Note: Never expose in production! Use backend only.
    whatsappNumber: whatsappNumber,
    isConfigured: hasValidCredentials,
    mode: 'simulation', // Always simulation in browser
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
