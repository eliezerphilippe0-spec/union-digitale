import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';

export const StripeForm = ({ onSuccess, orderId }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        if (!orderId) {
            setError('Order ID is required');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            // Step 1: Create Payment Intent via Cloud Function
            const createPaymentIntent = httpsCallable(functions, 'createStripePaymentIntent');
            const response = await createPaymentIntent({ orderId });

            const { clientSecret } = response.data;

            if (!clientSecret) {
                throw new Error('Failed to get client secret');
            }

            // Step 2: Confirm card payment
            const cardElement = elements.getElement(CardElement);

            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: cardElement
                    }
                }
            );

            if (confirmError) {
                setError(confirmError.message);
                setProcessing(false);
                return;
            }

            // Payment succeeded
            if (paymentIntent.status === 'succeeded') {
                import logger from '../../utils/logger';

                // ... existing code ...

                logger.payment('stripe_payment', paymentIntent.id, 'succeeded', {
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency
                });

                setProcessing(false);
                onSuccess(paymentIntent);
            } else {
                setError('Payment status: ' + paymentIntent.status);
                setProcessing(false);
            }

        } catch (err) {
            console.error('Stripe payment error:', err);
            setError(err.message || 'Payment failed');
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-md bg-white">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Détails de la carte</label>
                <div className="p-3 border border-gray-300 rounded-md">
                    <CardElement options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }} />
                </div>
            </div>
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {processing && <Loader className="animate-spin w-4 h-4" />}
                {processing ? 'Traitement...' : 'Payer avec Stripe'}
            </button>
        </form>
    );
};
