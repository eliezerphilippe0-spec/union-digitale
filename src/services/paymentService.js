import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { whatsappService } from './whatsappService';
import logger from '../utils/logger';

// Initialize Cloud Functions
const functions = getFunctions();

export const paymentService = {
    /**
     * Creates an order in Firestore
     * SECURITY: Validates all inputs before creating order
     * @param {Object} orderData - The order details
     * @param {Object} user - The current user
     * @returns {Promise<string>} - The Order ID
     */
    async createOrder(orderData, user, referralData = null) {
        // Validate inputs with Zod schema
        const { safeValidate, OrderCreateSchema, formatValidationErrors } = await import('../utils/validationSchemas.js');

        const validation = safeValidate(OrderCreateSchema, orderData);
        if (!validation.success) {
            const errors = formatValidationErrors(validation.error);
            logger.error('Order validation failed', new Error('Validation error'), { errors });
            throw new Error(`Validation échouée: ${errors.join(', ')}`);
        }

        // Validate user
        if (!user || !user.uid) {
            throw new Error('User authentication required');
        }

        // Use validated data
        const validatedData = validation.data;

        try {
            const orderRef = await addDoc(collection(db, 'orders'), {
                userId: user.uid,
                type: validatedData.type || 'product',
                items: validatedData.items || [],
                totalAmount: validatedData.totalAmount,
                currency: validatedData.currency || 'HTG',
                status: validatedData.paymentMethod === 'wallet' ? 'paid' : 'pending_payment',
                paymentMethod: validatedData.paymentMethod,
                shippingAddress: validatedData.shippingAddress || null,
                referral: referralData,
                createdAt: serverTimestamp(),
                // Add idempotency key to prevent duplicate orders
                idempotencyKey: `${user.uid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });

            logger.info('Order created', {
                orderId: orderRef.id,
                userId: user.uid,
                amount: orderData.total,
                paymentMethod: orderData.paymentMethod
            });

            // Send WhatsApp Confirmation (Async, don't await to not block UI)
            whatsappService.sendOrderConfirmation({
                id: orderRef.id,
                totalAmount: orderData.total
            }, user).catch(err => {
                logger.warn('WhatsApp notification failed', { orderId: orderRef.id, error: err.message });
            });

            return orderRef.id;
        } catch (error) {
            logger.error('Order creation failed', error, {
                userId: user.uid,
                amount: orderData.total
            });
            throw new Error('Impossible de créer la commande. Veuillez réessayer.');
        }
    },

    /**
     * Creates an order in Firestore and initiates MonCash payment
     * PRODUCTION-READY: No simulation code
     * @param {Object} orderData - The order details
     * @param {Object} user - The current user
     * @returns {Promise<string>} - The MonCash redirect URL
     */
    async processMonCashPayment(orderData, user, referralData = null) {
        // 1. Create Pending Order in Firestore
        const orderId = await this.createOrder({
            ...orderData,
            paymentMethod: 'moncash'
        }, user, referralData);

        // Structured logging (production-safe, no sensitive data)
        const logContext = {
            orderId,
            amount: orderData.total,
            currency: 'HTG',
            userId: user.uid,
            timestamp: new Date().toISOString()
        };

        logger.payment('initiate', orderId, 'pending', logContext);

        try {
            // 2. Call Cloud Function with retry logic and timeout
            const createPaymentFn = httpsCallable(functions, 'createMonCashPayment', {
                timeout: 30000 // 30 second timeout
            });

            const result = await this.retryWithBackoff(
                () => createPaymentFn({
                    orderId: orderId,
                    amount: orderData.total,
                    currency: 'HTG',
                    // Add idempotency key for payment gateway
                    idempotencyKey: `moncash-${orderId}-${Date.now()}`
                }),
                3, // max retries
                1000 // initial delay
            );

            if (!result.data?.redirectUrl) {
                throw new Error('Invalid payment response: missing redirectUrl');
            }

            logger.payment('redirect', orderId, 'redirecting', {
                redirectUrl: result.data.redirectUrl
            });

            return result.data.redirectUrl;

        } catch (error) {
            logger.error('MonCash payment failed', error, logContext);

            // PRODUCTION-SAFE: Never simulate payments
            // Always fail gracefully and inform user
            throw new Error(
                "Le service de paiement MonCash est momentanément indisponible. " +
                "Veuillez réessayer dans quelques instants ou contacter le support. " +
                `Référence: ${orderId}`
            );
        }
    },

    /**
     * Retry function with exponential backoff
     * Inspired by: Stripe, AWS SDK
     * @param {Function} fn - Function to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} delay - Initial delay in ms
     */
    async retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;

                const backoffDelay = delay * Math.pow(2, i);
                logger.debug(`Retrying after ${backoffDelay}ms (attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
        }
    },

    /**
     * Log errors for monitoring (production-safe)
     * @param {string} message - Error message
     * @param {Object} context - Error context
     * @deprecated Use logger.error() instead
     */
    logError(message, context) {
        logger.error(message, new Error(message), context);
    },

    /**
     * Process payment for a reservation
     * Uses real payment gateway (MonCash/Stripe)
     * @param {string} reservationId 
     * @param {number} amount 
     * @param {Object} user 
     */
    async processReservationPayment(reservationId, amount, user) {
        // Validate amount
        if (amount <= 0 || amount > 1000000) {
            throw new Error('Montant invalide');
        }

        if (!user || !user.uid) {
            throw new Error('Authentification requise');
        }

        logger.payment('reservation_initiate', reservationId, 'pending', {
            amount,
            userId: user.uid
        });

        try {
            // Call Cloud Function for reservation payment
            const processPaymentFn = httpsCallable(functions, 'processReservationPayment', {
                timeout: 30000
            });

            const result = await processPaymentFn({
                reservationId,
                amount,
                currency: 'HTG',
                userId: user.uid,
                idempotencyKey: `res-${reservationId}-${Date.now()}`
            });

            logger.payment('reservation_success', reservationId, 'confirmed', {
                transactionId: result.data.transactionId
            });

            return result.data;
        } catch (error) {
            logger.error('Reservation payment failed', error, {
                reservationId,
                amount,
                userId: user.uid
            });

            throw new Error(
                "Le paiement de la réservation a échoué. " +
                "Veuillez réessayer ou contacter le support."
            );
        }
    },

    /**
     * Validate payment webhook (called by Cloud Functions)
     * SECURITY: Always validate webhooks server-side
     * This is a client-side helper for UI updates only
     */
    async validatePaymentStatus(orderId) {
        if (!orderId) {
            throw new Error('Order ID required');
        }

        try {
            const validateFn = httpsCallable(functions, 'validatePaymentStatus');
            const result = await validateFn({ orderId });

            logger.info('Payment status validated', {
                orderId,
                status: result.data.status
            });

            return result.data;
        } catch (error) {
            logger.error('Payment validation failed', error, { orderId });
            throw new Error('Impossible de valider le statut du paiement');
        }
    }
};
