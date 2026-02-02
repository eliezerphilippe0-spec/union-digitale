const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    admin.initializeApp();
}

// Twilio Configuration
const TWILIO_ACCOUNT_SID = functions.config().twilio?.account_sid;
const TWILIO_AUTH_TOKEN = functions.config().twilio?.auth_token;
const TWILIO_WHATSAPP_NUMBER = functions.config().twilio?.whatsapp_number || 'whatsapp:+14155238886';

let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('[Twilio] Client initialized successfully');
} else {
    console.warn('[Twilio] Missing credentials - WhatsApp messages will fail');
}

/**
 * Format phone number for Haiti
 */
function formatHaitiPhoneNumber(phoneNumber) {
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
 * Send WhatsApp Message via Twilio - Functions v1 API
 */
exports.sendWhatsAppMessage = functions.https.onCall(async (data, context) => {
    const { to, template, data: messageData } = data;
    const uid = context.auth?.uid;

    // Authentication check
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    // Validation
    if (!to || !template || !messageData || !messageData.message) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Rate limiting
    const oneMinuteAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 60000);
    const recentMessages = await admin.firestore().collection('notifications')
        .where('userId', '==', uid)
        .where('type', '==', 'whatsapp')
        .where('createdAt', '>', oneMinuteAgo)
        .get();

    if (recentMessages.size >= 10) {
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
    }

    const formattedPhone = formatHaitiPhoneNumber(to);
    const messageBody = messageData.message;

    console.log(`[WhatsApp] Sending ${template} to ${formattedPhone}`);

    let status = 'failed';
    let twilioSid = null;
    let error = null;

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
            console.log(`[WhatsApp] ✅ Message sent. SID: ${twilioSid}`);
        } catch (err) {
            error = err.message;
            status = 'failed';
            console.error('[WhatsApp] ❌ Error:', err.message);
            throw new functions.https.HttpsError('internal', err.message);
        }
    } else {
        throw new functions.https.HttpsError('failed-precondition', 'WhatsApp service not configured');
    }

    // Log to Firestore
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
    } catch (firestoreError) {
        console.error('[WhatsApp] Firestore error:', firestoreError.message);
    }

    return {
        success: status === 'sent',
        status: status,
        twilioSid: twilioSid,
        message: 'WhatsApp message sent successfully'
    };
});
