/**
 * Stripe Service
 * Gère les paiements par carte bancaire (Visa, Mastercard) pour la diaspora.
 * Dépendance: npm install stripe
 */
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

class StripeService {

    /**
     * Créer un lien de paiement (Checkout Session)
     * @param {number} amount - Montant (ex: 50.00)
     * @param {string} currency - Devise (usd, eur)
     * @param {string} orderId - ID unique de la commande
     * @param {string} itemsDescription - Description des articles
     * @param {string} successUrl - URL de redirection succès (optionnel)
     * @param {string} cancelUrl - URL de redirection annulation (optionnel)
     */
    async createPaymentLink(amount, currency, orderId, itemsDescription, successUrl, cancelUrl) {
        try {
            // Determinate URLs
            const appUrl = process.env.APP_URL || 'http://localhost:5173'; // Fallback for dev
            const sUrl = successUrl || `${appUrl}/order-confirmation/${orderId}?session_id={CHECKOUT_SESSION_ID}`;
            const cUrl = cancelUrl || `${appUrl}/checkout?canceled=true`;

            // 1. Créer une session de paiement
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: currency.toLowerCase(),
                        product_data: {
                            name: `Union Digitale #${orderId}`,
                            description: itemsDescription || 'Achat Boutique Union Digitale',
                            // images: ['https://uniondigitale.ht/logo.png'], // Optionnel
                        },
                        unit_amount: Math.round(amount * 100), // Stripe utilise les centimes (50$ = 5000)
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: sUrl,
                cancel_url: cUrl,
                metadata: {
                    orderId: orderId,
                    type: 'order'
                }
            });

            console.log(`💳 Lien Stripe généré pour ${amount} ${currency}`);
            return session.url;

        } catch (error) {
            console.error("❌ Erreur Stripe:", error.message);
            throw error;
        }
    }

    /**
     * Créer une session pour l'abonnement Vendeur
     * @param {string} vendorId - UID du vendeur
     * @param {string} email - Email du vendeur
     * @param {string} priceId - ID du prix Stripe (ex: price_12345)
     */
    async createVendorSubscriptionLink(vendorId, email, priceId) {
        try {
            const appUrl = process.env.APP_URL || 'http://localhost:5173';

            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1
                    }
                ],
                customer_email: email, // Pre-fill email
                metadata: {
                    vendorId: vendorId,
                    type: 'vendor_subscription'
                },
                success_url: `${appUrl}/admin/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${appUrl}/admin/subscription?canceled=true`
            });

            return session.url;
        } catch (error) {
            console.error("❌ Erreur Stripe Subscription:", error.message);
            throw error;
        }
    }
}

module.exports = new StripeService();
