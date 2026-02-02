# Firebase Functions WhatsApp Setup Guide

This guide will help you configure and deploy the WhatsApp integration using Firebase Functions and Twilio.

---

## Prerequisites

- Firebase project with Blaze (Pay-as-you-go) plan
- Twilio account with WhatsApp Business API access
- Firebase CLI installed globally

---

## Step 1: Install Firebase CLI

If not already installed:

```bash
npm install -g firebase-tools
```

Verify installation:

```bash
firebase --version
```

---

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser for authentication.

---

## Step 3: Configure Twilio Credentials

### For Local Development

Create or update `functions/.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### For Production (Firebase Functions Config)

Set environment variables in Firebase:

```bash
firebase functions:config:set \
  twilio.account_sid="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  twilio.auth_token="your_auth_token_here" \
  twilio.whatsapp_number="whatsapp:+14155238886"
```

**Note**: Replace with your actual Twilio credentials from https://console.twilio.com

---

## Step 4: Install Dependencies

Navigate to functions directory and install packages:

```bash
cd functions
npm install
```

This will install:
- `twilio` - WhatsApp API SDK
- `firebase-functions` - Cloud Functions runtime
- `firebase-admin` - Firebase Admin SDK

---

## Step 5: Test Locally with Emulator

Start the Firebase emulator:

```bash
# From project root
firebase emulators:start
```

This will start:
- Functions emulator on http://localhost:5001
- Firestore emulator on http://localhost:8080

Test the function:

```javascript
// In browser console at http://localhost:5173
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendWhatsApp = httpsCallable(functions, 'sendWhatsAppMessage');

await sendWhatsApp({
  to: '+50912345678',
  template: 'test',
  data: { message: 'Test message from emulator' }
});
```

---

## Step 6: Deploy to Production

### Deploy Functions Only

```bash
firebase deploy --only functions
```

### Deploy Specific Function

```bash
firebase deploy --only functions:sendWhatsAppMessage
```

### Deploy Everything

```bash
firebase deploy
```

---

## Step 7: Verify Deployment

### Check Function Logs

```bash
firebase functions:log
```

### Test in Production

1. Open your deployed app
2. Complete a test purchase
3. Check Firebase Console → Functions → Logs
4. Verify WhatsApp message received
5. Check Firestore → `notifications` collection

---

## Configuration Details

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `AC123...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `abc123...` |
| `TWILIO_WHATSAPP_NUMBER` | WhatsApp sender number | `whatsapp:+14155238886` |

### Function Features

✅ **Authentication**: Only logged-in users can send messages  
✅ **Rate Limiting**: Maximum 10 messages per minute per user  
✅ **Error Handling**: Specific error codes for debugging  
✅ **Firestore Logging**: All messages logged for audit trail  
✅ **Phone Formatting**: Automatic Haiti (+509) number formatting

---

## Troubleshooting

### Function Not Found

**Error**: `Function sendWhatsAppMessage not found`

**Solution**:
```bash
firebase deploy --only functions:sendWhatsAppMessage
```

### Authentication Error

**Error**: `Twilio authentication failed`

**Solution**:
1. Verify credentials in Firebase Console → Functions → Configuration
2. Check that credentials are correct in Twilio Console
3. Redeploy functions after updating config

### Rate Limit Exceeded

**Error**: `Rate limit exceeded: Maximum 10 messages per minute`

**Solution**: Wait 1 minute before sending more messages. This is a security feature.

### Invalid Phone Number

**Error**: `Invalid phone number format`

**Solution**: Ensure phone number is in format:
- `+50912345678` (Haiti)
- `12345678` (will be formatted to +509)
- `50912345678` (will be formatted to +509)

---

## Monitoring

### View Function Metrics

Firebase Console → Functions → Dashboard:
- Invocations count
- Error rate
- Execution time
- Memory usage

### Set Up Alerts

Firebase Console → Functions → Alerts:
- Error rate > 5%
- Execution time > 10s
- Invocations > 1000/hour

### Twilio Console

https://console.twilio.com → Messaging → Logs:
- Message delivery status
- Error codes
- Delivery timestamps

---

## Cost Estimation

### Firebase Functions

**Free Tier**:
- 2M invocations/month
- 400K GB-seconds
- 200K CPU-seconds

**Typical Usage** (100 orders/day):
- ~3,000 invocations/month
- **Cost**: FREE ✅

### Twilio WhatsApp

**Per Message**:
- Business-initiated: ~$0.005-0.01
- User-initiated (24h window): FREE

**Monthly Cost** (100 orders/day):
- ~3,000 messages/month
- **Cost**: $15-30/month

---

## Security Best Practices

✅ **Never expose credentials in frontend**  
✅ **Use Firebase Functions config for secrets**  
✅ **Enable authentication on all functions**  
✅ **Implement rate limiting**  
✅ **Log all activities to Firestore**  
✅ **Monitor for unusual activity**

---

## Next Steps

1. ✅ Deploy functions to production
2. ✅ Configure Twilio credentials
3. ✅ Test with real phone numbers
4. ⚠️ Submit WhatsApp Business templates for approval
5. ⚠️ Set up monitoring alerts
6. ⚠️ Configure budget alerts in Twilio

---

## Support Resources

- **Firebase Functions Docs**: https://firebase.google.com/docs/functions
- **Twilio WhatsApp API**: https://www.twilio.com/docs/whatsapp
- **Firebase Console**: https://console.firebase.google.com
- **Twilio Console**: https://console.twilio.com

---

## Quick Reference Commands

```bash
# Login
firebase login

# Set Twilio config
firebase functions:config:set twilio.account_sid="AC..." twilio.auth_token="..." twilio.whatsapp_number="whatsapp:+..."

# Deploy
firebase deploy --only functions

# View logs
firebase functions:log

# Test locally
firebase emulators:start
```

---

**Status**: ✅ Ready for deployment  
**Mode**: Production (Real WhatsApp messages via Twilio API)
