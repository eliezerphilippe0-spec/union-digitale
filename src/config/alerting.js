/**
 * Union Digitale Alerting Configuration
 * 
 * Configure your alert channels here.
 */

export const ALERT_CONFIG = {
    // 1. WhatsApp Alerting (via Meta Business API or Twilio)
    whatsapp: {
        enabled: true,
        provider: 'mock', // 'meta' | 'twilio' | 'mock'

        // Meta / Facebook Developers credentials
        phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_ID || 'YOUR_PHONE_ID',
        accessToken: import.meta.env.VITE_WHATSAPP_TOKEN || 'YOUR_ACCESS_TOKEN',
        recipientPhone: import.meta.env.VITE_ADMIN_PHONE || '50930000000', // Admin number in Haiti

        // Templates (Registered in Facebook Business Manager)
        templates: {
            critical_alert: 'system_critical_alert',
            daily_report: 'system_daily_report'
        }
    },

    // 2. Email Alerting (via Firebase Extensions "Trigger Email")
    email: {
        enabled: true,
        collection: 'mail', // Collection watched by Firebase Extension
        to: ['admin@uniondigitale.ht', 'tech@antigravity.ht'],
        from: 'Union Digitale System <no-reply@uniondigitale.ht>'
    },

    // 3. Thresholds
    thresholds: {
        errorRateCritical: 10, // Max errors per minute before critical alert
        apiLatencyWarning: 2000, // ms
        storageWarning: 90 // %
    }
};

/**
 * Helper to construct the WhatsApp API payload
 */
export const getWhatsAppPayload = (message) => {
    return {
        messaging_product: "whatsapp",
        to: ALERT_CONFIG.whatsapp.recipientPhone,
        type: "template",
        template: {
            name: ALERT_CONFIG.whatsapp.templates.critical_alert,
            language: { code: "fr" },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: message } // Variable {{1}} in template
                    ]
                }
            ]
        }
    };
};
