import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as twilio from 'twilio';

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

let twilioClient: twilio.Twilio | null = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    twilioClient = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('[Twilio] Client initialized successfully');
} else {
    console.warn('[Twilio] Missing credentials - WhatsApp messages will fail');
}

/**
 * Helper: Format phone number for Haiti
 */
function formatHaitiPhoneNumber(phoneNumber: string): string | null {
    if (!phoneNumber) return null;
    const digits = phoneNumber.replace(/\D/g, '');

    if (digits.startsWith('509') && digits.length === 11) {
        return `+${digits}`;
    } else if (digits.length === 8) {
        return `+509${digits}`;
    } else if (digits.startsWith('1') && digits.length === 11) {
        return `+${digits}`;
    }

    if (phoneNumber.startsWith('+')) {
        return phoneNumber;
    }

    return `+509${digits}`;
}

/**
 * Send WhatsApp Message via Twilio
 * Callable function for sending WhatsApp messages from frontend
 */
export const sendWhatsAppMessage = functions.https.onCall(async (data, context) => {
    const { to, template, data: messageData } = data;
    const uid = context.auth?.uid;

    // Authentication check
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to send WhatsApp messages');
    }

    // Validation
    if (!to || !template || !messageData || !messageData.message) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: to, template, data.message');
    }

    // Rate limiting: Check recent messages from this user
    const oneMinuteAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 60000);
    const recentMessages = await admin.firestore().collection('notifications')
        .where('userId', '==', uid)
        .where('type', '==', 'whatsapp')
        .where('createdAt', '>', oneMinuteAgo)
        .count()
        .get();

    if (recentMessages.data().count >= 10) {
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded: Maximum 10 messages per minute');
    }

    const formattedPhone = formatHaitiPhoneNumber(to);
    const messageBody = messageData.message;

    console.log(`[WhatsApp] Sending ${template} to ${formattedPhone} for user ${uid}`);

    let status = 'failed';
    let twilioSid: string | null = null;
    let error: string | null = null;

    // Send via Twilio
    if (twilioClient && formattedPhone) {
        try {
            const twilioResponse = await twilioClient.messages.create({
                from: TWILIO_WHATSAPP_NUMBER,
                to: `whatsapp:${formattedPhone}`,
                body: messageBody
            });

            twilioSid = twilioResponse.sid;
            status = 'sent';
            console.log(`[WhatsApp] ✅ Message sent successfully. SID: ${twilioSid}`);
        } catch (err: any) {
            error = err.message;
            status = 'failed';
            console.error('[WhatsApp] ❌ Twilio API Error:', err.message, err.code);

            // Return specific error messages
            if (err.code === 21211) {
                throw new functions.https.HttpsError('invalid-argument', 'Invalid phone number format');
            } else if (err.code === 21608) {
                throw new functions.https.HttpsError('failed-precondition', 'WhatsApp not enabled for this number or recipient not opted-in');
            } else if (err.code === 20003) {
                throw new functions.https.HttpsError('failed-precondition', 'Twilio authentication failed. Check server configuration.');
            }
        }
    } else {
        error = 'Twilio client not initialized';
        throw new functions.https.HttpsError('failed-precondition', 'WhatsApp service not configured on server');
    }

    // Log to Firestore for audit trail
    try {
        await admin.firestore().collection('notifications').add({
            userId: uid,
            type: 'whatsapp',
            to: formattedPhone,
            template: template,
            data: messageData,
            messageBody: messageBody,
            status: status,
            twilioSid: twilioSid,
            error: error,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (firestoreError: any) {
        console.error('[WhatsApp] Failed to log to Firestore:', firestoreError.message);
        // Don't throw - message was sent successfully
    }

    return {
        success: status === 'sent',
        status: status,
        twilioSid: twilioSid,
        message: status === 'sent' ? 'WhatsApp message sent successfully' : 'Failed to send WhatsApp message'
    };
});
