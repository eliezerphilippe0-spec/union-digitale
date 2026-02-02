/**
 * Notification Helper Functions
 * Complete implementation for WhatsApp and Email notifications
 */

import { Twilio } from 'twilio';
import { defineSecret } from 'firebase-functions/params';

// Secrets for Twilio and SendGrid
const twilioAccountSid = defineSecret('TWILIO_ACCOUNT_SID');
const twilioAuthToken = defineSecret('TWILIO_AUTH_TOKEN');
const twilioWhatsAppNumber = defineSecret('TWILIO_WHATSAPP_NUMBER');
const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

/**
 * Send WhatsApp message via Twilio
 * @param phone - Phone number in E.164 format (e.g., +50937001234)
 * @param message - Message content (max 1600 characters)
 */
export async function sendWhatsAppMessageHelper(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validate phone number
    if (!phone || !phone.startsWith('+')) {
      console.error('Invalid phone format. Use E.164 format (e.g., +50937001234)');
      return { success: false, error: 'Invalid phone format' };
    }

    // Check if secrets are available
    if (!twilioAccountSid.value() || !twilioAuthToken.value()) {
      console.log(`📱 [DEV MODE] WhatsApp to ${phone}: ${message}`);
      return { success: true, messageId: 'dev-mode' };
    }

    const client = new Twilio(twilioAccountSid.value(), twilioAuthToken.value());

    const result = await client.messages.create({
      from: `whatsapp:${twilioWhatsAppNumber.value()}`,
      to: `whatsapp:${phone}`,
      body: message.substring(0, 1600) // WhatsApp character limit
    });

    console.log(`✅ WhatsApp sent to ${phone}: ${result.sid}`);

    return {
      success: true,
      messageId: result.sid
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp:', error);
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message'
    };
  }
}

/**
 * Send SMS message via Twilio (fallback for non-WhatsApp users)
 * @param phone - Phone number in E.164 format
 * @param message - Message content (max 160 characters for single SMS)
 */
export async function sendSMSHelper(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!phone || !phone.startsWith('+')) {
      return { success: false, error: 'Invalid phone format' };
    }

    if (!twilioAccountSid.value() || !twilioAuthToken.value()) {
      console.log(`📱 [DEV MODE] SMS to ${phone}: ${message}`);
      return { success: true, messageId: 'dev-mode' };
    }

    const client = new Twilio(twilioAccountSid.value(), twilioAuthToken.value());

    const result = await client.messages.create({
      from: twilioWhatsAppNumber.value()?.replace('whatsapp:', ''),
      to: phone,
      body: message
    });

    console.log(`✅ SMS sent to ${phone}: ${result.sid}`);

    return { success: true, messageId: result.sid };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Email template types
 */
type EmailTemplate =
  | 'order_confirmation'
  | 'order_shipped'
  | 'payment_received'
  | 'welcome'
  | 'password_reset'
  | '2fa_code'
  | 'vendor_payout'
  | 'review_request';

/**
 * Send email via SendGrid
 * @param email - Recipient email address
 * @param subject - Email subject
 * @param body - Email body (plain text)
 * @param htmlBody - Email body (HTML) - optional
 */
export async function sendEmailHelper(
  email: string,
  subject: string,
  body: string,
  htmlBody?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    if (!sendgridApiKey.value()) {
      console.log(`📧 [DEV MODE] Email to ${email}: ${subject}`);
      console.log(`Body: ${body}`);
      return { success: true, messageId: 'dev-mode' };
    }

    // Dynamic import to avoid bundling issues
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(sendgridApiKey.value());

    const msg = {
      to: email,
      from: {
        email: 'noreply@uniondigitale.ht',
        name: 'Union Digitale'
      },
      subject,
      text: body,
      html: htmlBody || generateHtmlEmail(subject, body)
    };

    const [response] = await sgMail.default.send(msg);

    console.log(`✅ Email sent to ${email}: ${response.headers['x-message-id']}`);

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string
    };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

/**
 * Generate HTML email from plain text
 */
function generateHtmlEmail(subject: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #eee;
      border-top: none;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 12px;
    }
    a {
      color: #667eea;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin:0;">Union Digitale</h1>
  </div>
  <div class="content">
    <h2>${subject}</h2>
    <p>${body.replace(/\n/g, '<br>')}</p>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Union Digitale. Tous droits réservés.</p>
    <p>Port-au-Prince, Haïti</p>
  </div>
</body>
</html>
  `;
}

/**
 * Send templated email (uses predefined templates)
 */
export async function sendTemplatedEmail(
  email: string,
  template: EmailTemplate,
  data: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const templates: Record<EmailTemplate, { subject: string; body: string }> = {
    order_confirmation: {
      subject: `Commande #${data.orderId} confirmée`,
      body: `Bonjour ${data.customerName},\n\nVotre commande #${data.orderId} a été confirmée avec succès.\n\nMontant: ${data.total} HTG\n\nMerci pour votre achat sur Union Digitale!`
    },
    order_shipped: {
      subject: `Votre commande #${data.orderId} a été expédiée`,
      body: `Bonjour ${data.customerName},\n\nBonne nouvelle! Votre commande #${data.orderId} a été expédiée.\n\nNuméro de suivi: ${data.trackingNumber || 'Non disponible'}\n\nMerci d'avoir choisi Union Digitale!`
    },
    payment_received: {
      subject: `Paiement reçu pour la commande #${data.orderId}`,
      body: `Bonjour ${data.customerName},\n\nNous avons bien reçu votre paiement de ${data.amount} HTG.\n\nVotre commande sera traitée dans les plus brefs délais.`
    },
    welcome: {
      subject: `Bienvenue sur Union Digitale!`,
      body: `Bonjour ${data.name},\n\nMerci de rejoindre Union Digitale, votre marketplace haïtienne préférée!\n\nDécouvrez des milliers de produits de vendeurs locaux.`
    },
    password_reset: {
      subject: `Réinitialisation de votre mot de passe`,
      body: `Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez ici: ${data.resetLink}\n\nCe lien expire dans 1 heure.`
    },
    '2fa_code': {
      subject: `Code de vérification: ${data.code}`,
      body: `Votre code de vérification Union Digitale est: ${data.code}\n\nCe code expire dans 5 minutes.\n\nSi vous n'avez pas demandé ce code, ignorez ce message.`
    },
    vendor_payout: {
      subject: `Paiement de ${data.amount} HTG effectué`,
      body: `Bonjour ${data.vendorName},\n\nVotre paiement de ${data.amount} HTG a été effectué avec succès.\n\nMéthode: ${data.method}\n\nMerci de vendre sur Union Digitale!`
    },
    review_request: {
      subject: `Votre avis compte! Évaluez votre achat`,
      body: `Bonjour ${data.customerName},\n\nVous avez récemment acheté "${data.productName}".\n\nPrennez quelques secondes pour laisser un avis et aider d'autres acheteurs!`
    }
  };

  const emailTemplate = templates[template];
  if (!emailTemplate) {
    return { success: false, error: 'Template not found' };
  }

  return sendEmailHelper(email, emailTemplate.subject, emailTemplate.body);
}

/**
 * Send push notification via Firebase Cloud Messaging
 */
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await import('firebase-admin');

    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    });

    console.log(`✅ Push notification sent`);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}
