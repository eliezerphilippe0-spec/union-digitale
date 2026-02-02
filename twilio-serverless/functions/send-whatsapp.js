const admin = require('firebase-admin');

// Initialize Firebase Admin (once)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
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
 * Twilio Serverless Function: Send WhatsApp Message
 */
exports.handler = async function (context, event, callback) {
    // CORS headers
    const response = new Twilio.Response();
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.appendHeader('Content-Type', 'application/json');

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return callback(null, response);
    }

    try {
        const { to, template, data, idToken } = typeof event === 'string' ? JSON.parse(event) : event;

        // 1. Verify Firebase ID Token
        let uid;
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            uid = decodedToken.uid;
        } catch (error) {
            response.setStatusCode(401);
            response.setBody({ error: 'Unauthorized: Invalid Firebase token' });
            return callback(null, response);
        }

        // 2. Validation
        if (!to || !template || !data || !data.message) {
            response.setStatusCode(400);
            response.setBody({ error: 'Missing required fields' });
            return callback(null, response);
        }

        // 3. Rate Limiting
        const oneMinuteAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 60000);
        const recentMessages = await admin.firestore().collection('notifications')
            .where('userId', '==', uid)
            .where('type', '==', 'whatsapp')
            .where('createdAt', '>', oneMinuteAgo)
            .get();

        if (recentMessages.size >= 10) {
            response.setStatusCode(429);
            response.setBody({ error: 'Rate limit exceeded: Maximum 10 messages per minute' });
            return callback(null, response);
        }

        // 4. Format phone and prepare message
        const formattedPhone = formatHaitiPhoneNumber(to);
        const messageBody = data.message;

        console.log(`[WhatsApp] Sending ${template} to ${formattedPhone} for user ${uid}`);

        // 5. Send via Twilio
        const client = context.getTwilioClient();
        let twilioSid = null;
        let status = 'failed';

        try {
            const twilioResponse = await client.messages.create({
                from: context.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
                to: `whatsapp:${formattedPhone}`,
                body: messageBody
            });

            twilioSid = twilioResponse.sid;
            status = 'sent';
            console.log(`[WhatsApp] ✅ Message sent. SID: ${twilioSid}`);
        } catch (err) {
            console.error('[WhatsApp] ❌ Twilio Error:', err.message);
            response.setStatusCode(500);
            response.setBody({ error: `Failed to send WhatsApp: ${err.message}` });
            return callback(null, response);
        }

        // 6. Log to Firestore
        try {
            await admin.firestore().collection('notifications').add({
                userId: uid,
                type: 'whatsapp',
                to: formattedPhone,
                template: template,
                data: data,
                messageBody: messageBody,
                status: status,
                twilioSid: twilioSid,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (firestoreError) {
            console.error('[WhatsApp] Firestore logging error:', firestoreError.message);
        }

        // 7. Return success
        response.setStatusCode(200);
        response.setBody({
            success: true,
            status: status,
            twilioSid: twilioSid,
            message: 'WhatsApp message sent successfully'
        });

        return callback(null, response);

    } catch (error) {
        console.error('[WhatsApp] Unexpected error:', error);
        response.setStatusCode(500);
        response.setBody({ error: error.message });
        return callback(null, response);
    }
};
