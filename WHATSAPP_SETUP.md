# WhatsApp Business API Setup Guide (Twilio)

This guide will help you set up Twilio WhatsApp Business API for Union Digitale to enable real WhatsApp message delivery for order confirmations, status updates, and customer support.

---

## Prerequisites

- A Twilio account ([Sign up here](https://www.twilio.com/try-twilio))
- A Facebook Business Manager account
- A verified business phone number
- Union Digitale project with environment variables configured

---

## Step 1: Create Twilio Account

1. **Sign up** at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. **Verify your email** and phone number
3. **Complete your profile** with business information
4. **Navigate to Console** at [https://console.twilio.com](https://console.twilio.com)

### Get Your Credentials

From the Twilio Console Dashboard:

1. Find your **Account SID** (starts with `AC...`)
2. Find your **Auth Token** (click to reveal)
3. **Save these securely** - you'll need them for configuration

---

## Step 2: Enable WhatsApp Business API

### Option A: Twilio WhatsApp Sandbox (Testing Only)

**Best for development and testing**

1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join the sandbox:
   - Send the provided code to the Twilio WhatsApp number
   - Example: `join <your-code>` to `+1 415 523 8886`
3. Your sandbox number: `whatsapp:+14155238886`

> [!NOTE]
> **Sandbox Limitations:**
> - Only works with numbers that have joined the sandbox
> - Messages expire after 24 hours of inactivity
> - Not suitable for production use

### Option B: WhatsApp Business API (Production)

**Required for production deployment**

1. Go to **Messaging** → **WhatsApp** → **Senders**
2. Click **Get started with WhatsApp**
3. Follow the setup wizard:
   - Connect your Facebook Business Manager
   - Verify your business
   - Submit your WhatsApp Business Profile
   - Request a phone number or use your own

> [!IMPORTANT]
> **Approval Timeline:**
> - Business verification: 1-3 business days
> - WhatsApp profile review: 1-2 business days
> - Total: 2-5 business days

---

## Step 3: Create Message Templates

WhatsApp requires pre-approved templates for business-initiated messages.

### Navigate to Templates

1. Go to **Messaging** → **WhatsApp** → **Message Templates**
2. Click **Create Template**

### Template 1: Order Confirmation

```
Name: order_confirmation
Category: TRANSACTIONAL
Language: French (fr)

Body:
Bonjour {{1}}, votre commande #{{2}} de {{3}} G a été confirmée. Merci de votre achat chez Union Digitale ! 🎉

Variables:
{{1}} = Customer name
{{2}} = Order ID
{{3}} = Amount
```

### Template 2: Order Status Update

```
Name: order_status_update
Category: TRANSACTIONAL
Language: French (fr)

Body:
Bonjour, votre commande #{{1}} {{2}}.

Variables:
{{1}} = Order ID
{{2}} = Status text (e.g., "a été expédiée 🚚")
```

### Template 3: Custom Message

```
Name: custom_message
Category: MARKETING
Language: French (fr)

Body:
{{1}}

Variables:
{{1}} = Custom message content
```

> [!WARNING]
> **Template Approval:**
> - Templates must be approved by Meta before use
> - Approval takes 1-2 business days
> - Rejected templates can be edited and resubmitted

---

## Step 4: Configure Union Digitale

### Create `.env` File

In your project root (`union-digitale/`), create a `.env` file:

```bash
# Copy from .env.example
cp .env.example .env
```

### Add Twilio Credentials

Edit `.env` and add your Twilio credentials:

```env
# Twilio WhatsApp API
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**For Sandbox (Testing):**
```env
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**For Production:**
```env
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+509XXXXXXXX
```

> [!CAUTION]
> **Security:**
> - Never commit `.env` to version control
> - `.env` is already in `.gitignore`
> - Keep your Auth Token secret

---

## Step 5: Test the Integration

### Start Development Server

```bash
npm run dev
```

### Test Order Confirmation

1. **Complete a test purchase** in your app
2. **Check the console** for WhatsApp service logs:
   ```
   [WhatsApp Service] ✅ Message sent successfully. SID: SM...
   ```
3. **Verify message received** on your WhatsApp

### Test Status Update

1. **Go to Seller Dashboard** → Orders
2. **Update an order status**
3. **Check WhatsApp** for status notification

### Check Firestore Logs

1. Open **Firebase Console** → Firestore
2. Navigate to `notifications` collection
3. Verify entries with:
   - `type: 'whatsapp'`
   - `status: 'sent'`
   - `twilioSid: 'SM...'`

---

## Step 6: Monitor & Debug

### Check Service Status

Add this to your app for debugging:

```javascript
import { whatsappService } from './services/whatsappService';

console.log('WhatsApp Status:', whatsappService.getStatus());
// Output: { configured: true, whatsappNumber: 'whatsapp:+...', mode: 'Production (Twilio API)' }
```

### View Twilio Logs

1. Go to **Monitor** → **Logs** → **Messaging**
2. Filter by **WhatsApp**
3. Check delivery status and errors

### Common Error Codes

| Code | Error | Solution |
|------|-------|----------|
| 21211 | Invalid phone number | Check phone formatting (+509...) |
| 21608 | WhatsApp not enabled | Recipient must opt-in or join sandbox |
| 20003 | Authentication failed | Verify Account SID and Auth Token |
| 63016 | Template not approved | Wait for Meta approval or use sandbox |

---

## Haiti-Specific Considerations

### Phone Number Formatting

Haiti uses country code `+509` with 8-digit numbers:

```javascript
// Accepted formats (all converted to +509XXXXXXXX):
'50912345678'     // ✅ Converted to +50912345678
'12345678'        // ✅ Converted to +50912345678
'+50912345678'    // ✅ Already formatted
'509 1234 5678'   // ✅ Spaces removed
```

### Network Providers

Ensure compatibility with major Haiti carriers:
- Digicel
- Natcom
- Access Haiti

### Language Support

Messages are in French by default. To add Haitian Creole:

1. Create Creole templates in Twilio
2. Update `whatsappService.js` to detect user language
3. Send appropriate template based on user preference

---

## Pricing Estimate

### Twilio WhatsApp Costs (Haiti)

- **Business-initiated conversations:** ~$0.005-0.01 per message
- **User-initiated conversations:** Free for 24h window
- **Template messages:** Same as business-initiated

### Monthly Cost Example

| Orders/Month | Messages | Estimated Cost |
|--------------|----------|----------------|
| 100 | 200 (confirmation + status) | $1-2 |
| 500 | 1,000 | $5-10 |
| 1,000 | 2,000 | $10-20 |

> [!TIP]
> **Cost Optimization:**
> - Batch status updates when possible
> - Use user-initiated windows (free)
> - Monitor usage in Twilio Console

---

## Production Checklist

Before going live, ensure:

- [ ] Twilio account fully verified
- [ ] WhatsApp Business API approved (not sandbox)
- [ ] All message templates approved by Meta
- [ ] Environment variables set in production
- [ ] Tested with real Haiti phone numbers (+509)
- [ ] Firestore logging working correctly
- [ ] Error handling tested (invalid numbers, API failures)
- [ ] Monitoring alerts configured
- [ ] Budget alerts set in Twilio Console

---

## Troubleshooting

### Messages Not Sending

1. **Check configuration:**
   ```javascript
   console.log(whatsappService.isConfigured()); // Should be true
   ```

2. **Verify credentials** in `.env`
3. **Check Twilio Console** for error logs
4. **Ensure recipient opted-in** (for production)

### Sandbox Issues

- **Recipient not receiving:** Have them send `join <code>` again
- **Session expired:** Rejoin the sandbox
- **Number changed:** Update `VITE_TWILIO_WHATSAPP_NUMBER`

### Template Rejected

Common rejection reasons:
- Contains promotional content in transactional template
- Missing required disclaimer
- Unclear variable usage

**Solution:** Edit template and resubmit with clearer language

---

## Next Steps

1. **Set up webhooks** (optional) to receive incoming messages
2. **Implement chatbot** for automated customer support
3. **Add WhatsApp Commerce** for product catalogs
4. **Enable WhatsApp Pay** for in-chat payments

---

## Support Resources

- **Twilio Docs:** [https://www.twilio.com/docs/whatsapp](https://www.twilio.com/docs/whatsapp)
- **WhatsApp Business API:** [https://developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- **Twilio Support:** [https://support.twilio.com](https://support.twilio.com)
- **Union Digitale Issues:** [GitHub Issues](https://github.com/your-repo/issues)

---

**Need help?** Contact the development team or open an issue on GitHub.
