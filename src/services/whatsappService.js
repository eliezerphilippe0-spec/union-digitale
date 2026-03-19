import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatHaitiPhoneNumber } from '../config/twilioConfig';

/**
 * WhatsApp Service - Twilio Serverless Integration
 * 
 * This service calls Twilio Serverless Functions to send real WhatsApp messages.
 * The function runs on Twilio infrastructure with Firebase authentication.
 */

// Twilio Serverless Function URL (set in .env)
const TWILIO_FUNCTION_URL = import.meta.env.VITE_TWILIO_FUNCTION_URL;

export const whatsappService = {
    /**
     * Sends a WhatsApp message via Twilio Serverless Function
     * @param {string} to - Phone number (will be formatted for Haiti)
     * @param {string} template - Template name (for logging)
     * @param {Object} data - Message data
     * @param {string} data.message - The actual message content to send
     * @returns {Promise<boolean>} - Success status
     */
    async sendMessage(to, template, data) {
        const formattedPhone = formatHaitiPhoneNumber(to);
        const messageBody = data.message || JSON.stringify(data);

        console.log(
            `%c[WhatsApp Service] 📱 Sending ${template} to ${formattedPhone}`,
            'background: #25D366; color: white; padding: 4px; border-radius: 4px;'
        );
        console.log('Message:', messageBody);

        // Check if Twilio Function URL is configured
        if (!TWILIO_FUNCTION_URL) {
            console.warn('[WhatsApp Service] ⚠️ VITE_TWILIO_FUNCTION_URL not configured. Message simulated only.');

            // Fallback to Firestore logging
            try {
                await addDoc(collection(db, 'notifications'), {
                    type: 'whatsapp',
                    to: formattedPhone,
                    template: template,
                    data: data,
                    messageBody: messageBody,
                    status: 'simulated',
                    error: 'Twilio Function URL not configured',
                    createdAt: serverTimestamp()
                });
            } catch (error) {
                console.error('[WhatsApp Service] Firestore error:', error.message);
            }

            return false;
        }

        try {
            // Get Firebase ID Token for authentication
            const user = auth.currentUser;
            if (!user) {
                throw new Error('User must be logged in');
            }

            const idToken = await user.getIdToken();

            // Call Twilio Serverless Function
            const response = await fetch(TWILIO_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: formattedPhone,
                    template: template,
                    data: {
                        ...data,
                        message: messageBody
                    },
                    idToken: idToken
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log(
                    '%c[WhatsApp Service] ✅ Message sent successfully',
                    'background: #0088cc; color: white; padding: 4px; border-radius: 4px;',
                    `\nTwilio SID: ${result.twilioSid}`
                );
                return true;
            } else {
                console.error('[WhatsApp Service] ❌ Failed to send:', result.error || result.message);
                return false;
            }

        } catch (error) {
            console.error('[WhatsApp Service] ❌ Error calling Twilio Function:', error.message);

            // Fallback logging to Firestore
            try {
                await addDoc(collection(db, 'notifications'), {
                    type: 'whatsapp',
                    to: formattedPhone,
                    template: template,
                    data: data,
                    messageBody: messageBody,
                    status: 'failed',
                    error: error.message,
                    createdAt: serverTimestamp()
                });
            } catch (firestoreError) {
                console.error('[WhatsApp Service] Firestore error:', firestoreError.message);
            }

            return false;
        }
    },

    /**
     * Sends Order Confirmation formatted like Amazon
     * @param {Object} order - Order object with id and totalAmount
     * @param {Object} user - User object with displayName and phoneNumber
     * @returns {Promise<boolean>}
     */
    async sendOrderConfirmation(order, user) {
        const customerName = user.displayName || 'Client';
        
        let itemsList = '';
        if (order.items && order.items.length > 0) {
            itemsList = '\n*Articles :*\n' + order.items.map(item => `- ${item.quantity}x ${item.title}`).join('\n');
        }

        let shippingInfo = '';
        if (order.shipping && order.shipping.address) {
            shippingInfo = `\n\n*Livraison :*\nPrévue sous 24h à 48h\nAdresse : ${order.shipping.address}${order.shipping.city ? ', ' + order.shipping.city : ''}`;
        }

        const orderNumber = order.id ? order.id.slice(-6).toUpperCase() : 'N/A';
        const totalFormatted = order.totalAmount ? order.totalAmount.toLocaleString() : '0';

        const message = `📦 *CONFIRMATION DE COMMANDE* 📦\n` +
            `\nBonjour ${customerName},\n` +
            `Merci pour votre achat sur Zabely !\n` +
            `Votre commande a été confirmée et est en cours de préparation.\n` +
            `\n*Détails de la commande :*\n` +
            `N° de commande : #${orderNumber}\n` +
            `Total : ${totalFormatted} HTG\n` +
            `${itemsList}${shippingInfo}\n` +
            `\nSuivez l'état de votre commande ici :\n` +
            `https://zabely.ht/tracking/${order.id}\n` +
            `\nMerci pour votre confiance !`;

        return this.sendMessage(
            user.phoneNumber || '+50900000000',
            'order_confirmation',
            {
                orderId: order.id,
                amount: order.totalAmount,
                customerName: customerName,
                message: message
            }
        );
    },

    /**
     * Sends COD Deposit Confirmation
     */
    async sendCODDepositConfirmation(order, user) {
        const message = `Bonjour ${user.displayName || 'Client'}, nous avons bien reçu votre acompte de ${order.depositAmount} G pour la commande #${order.id}. La livraison est maintenant confirmée ! 🚚`;
        return this.sendMessage(user.phoneNumber, 'cod_deposit_received', { orderId: order.id, message });
    },

    /**
     * Sends COD Confirmation Request (Day of delivery)
     */
    async sendCODConfirmationRequest(order, user) {
        const message = `Bonjour ${user.displayName || 'Client'}, votre commande #${order.id} est prévue pour livraison AUJOURD'HUI. Pouvez-vous confirmer votre présence et le paiement de ${order.remainingCOD} G ? Répondez OUI pour confirmer.`;
        return this.sendMessage(user.phoneNumber, 'cod_confirmation_request', { orderId: order.id, message });
    },

    /**
     * Sends COD Out for Delivery Notification
     */
    async sendCODOutForDelivery(order, user, courierName, courierPhone) {
        const message = `Votre commande #${order.id} est en route ! 🛵 Livreur: ${courierName} (${courierPhone}). Prévoyez ${order.remainingCOD} G pour la livraison.`;
        return this.sendMessage(user.phoneNumber, 'cod_out_for_delivery', { orderId: order.id, message });
    },

    /**
     * Sends COD Delivered & Paid Notification
     */
    async sendCODDelivered(order, user) {
        const message = `Félicitations ! Votre commande #${order.id} a été livrée et payée. Merci de votre confiance ! 🎉`;
        return this.sendMessage(user.phoneNumber, 'cod_delivered_paid', { orderId: order.id, message });
    },

    /**
     * Sends Order Status Update
     * @param {string} orderId - Order ID
     * @param {string} newStatus - New order status
     * @param {Object} user - User object with phoneNumber
     * @returns {Promise<boolean>}
     */
    async sendStatusUpdate(orderId, newStatus, user) {
        const statusMessages = {
            'processing': 'est en cours de préparation ⏳',
            'shipped': 'a été expédiée 🚚',
            'out_for_delivery': 'est en route pour livraison 🛵',
            'delivered': 'a été livrée ✅',
            'delivered_paid': 'a été livrée et payée ✅',
            'cancelled': 'a été annulée ❌',
            'refused': 'a été refusée à la livraison ❌'
        };

        const statusText = statusMessages[newStatus] || newStatus;
        const message = `Bonjour, votre commande #${orderId} ${statusText}.`;

        return this.sendMessage(
            user.phoneNumber || '+50900000000',
            'order_status_update',
            {
                orderId: orderId,
                status: newStatus,
                statusText: statusText,
                message: message
            }
        );
    },

    /**
     * Sends a custom WhatsApp message
     * @param {string} phoneNumber - Recipient phone number
     * @param {string} message - Message content
     * @returns {Promise<boolean>}
     */
    async sendCustomMessage(phoneNumber, message) {
        return this.sendMessage(
            phoneNumber,
            'custom_message',
            { message }
        );
    },

    /**
     * Check if WhatsApp service is configured
     * @returns {boolean}
     */
    isConfigured() {
        return !!TWILIO_FUNCTION_URL;
    },

    /**
     * Get configuration status for debugging
     * @returns {Object}
     */
    getStatus() {
        return {
            configured: !!TWILIO_FUNCTION_URL,
            functionUrl: TWILIO_FUNCTION_URL || 'Not configured',
            mode: TWILIO_FUNCTION_URL ? 'Production (Twilio Serverless)' : 'Simulation',
            note: 'WhatsApp messages sent via Twilio Serverless Functions'
        };
    }
};
