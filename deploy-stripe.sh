#!/bin/bash

echo "🚀 Stripe Configuration & Deployment Script"
echo "==========================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install: npm install -g firebase-tools"
    exit 1
fi

echo "📝 Step 1: Configure Firebase Functions"
echo "----------------------------------------"
echo "You need your Stripe SECRET KEY (sk_live_...)"
echo "Get it from: https://dashboard.stripe.com/apikeys"
echo ""
read -p "Enter your Stripe SECRET KEY (sk_live_...): " STRIPE_SECRET_KEY

if [[ ! $STRIPE_SECRET_KEY =~ ^sk_live_ ]]; then
    echo "⚠️  Warning: Key doesn't start with sk_live_. Are you sure this is your production key?"
    read -p "Continue anyway? (y/n): " confirm
    if [[ $confirm != "y" ]]; then
        exit 1
    fi
fi

# Set Stripe secret key
firebase functions:config:set stripe.secret_key="$STRIPE_SECRET_KEY"

echo ""
echo "📝 Step 2: Set App URL"
echo "----------------------"
read -p "Enter your app URL (e.g., https://uniondigitale.ht): " APP_URL
firebase functions:config:set app.url="$APP_URL"

echo ""
echo "📝 Step 3: Install Dependencies"
echo "--------------------------------"
cd functions
npm install stripe@latest
npm run build
cd ..

echo ""
echo "📝 Step 4: Deploy Cloud Functions"
echo "----------------------------------"
firebase deploy --only functions

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to: https://dashboard.stripe.com/webhooks"
echo "2. Click 'Add endpoint'"
echo "3. Use URL: $(firebase functions:config:get | grep -o 'https://[^/]*.cloudfunctions.net')/stripeWebhook"
echo "4. Select events: payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled"
echo "5. Copy the webhook signing secret (whsec_...)"
echo "6. Run: firebase functions:config:set stripe.webhook_secret=\"whsec_...\""
echo "7. Deploy again: firebase deploy --only functions"
echo ""
echo "🧪 Test with: Test card 4242 4242 4242 4242"
