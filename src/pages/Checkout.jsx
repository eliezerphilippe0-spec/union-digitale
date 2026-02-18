import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import useGeolocation from '../hooks/useGeolocation';
import { useWallet } from '../contexts/WalletContext';
import { paymentService } from '../services/paymentService';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, Wallet } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/common/SEO';
import { useAffiliation } from '../contexts/AffiliationContext';
import logger from '../utils/logger';
import { buildCheckoutPayload, getCheckoutSessionId, logCheckoutEvent } from '../utils/analytics';

// Payment Integrations
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripeForm } from '../components/payments/StripeForm';
import { PayPalPayment } from '../components/payments/PayPalButton';

// Initialize Stripe (Test Key or Env Variable)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

const Checkout = () => {
    const { currentUser } = useAuth();
    const { cartItems, cartTotal, clearCart, shippingCost, tax, finalTotal } = useCart();
    const { balance, creditLimit, pay } = useWallet();
    const { t } = useLanguage();
    const { referralData } = useAffiliation();
    const navigate = useNavigate();

    const [paymentMethod, setPaymentMethod] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { location: geoData, loading: geoLoading, getLocation } = useGeolocation();
    const hasTrackedStart = useRef(false);
    const hasTrackedReassurance = useRef(false);

    // Feature: Upsell (Order Bump)
    const [warrantyAdded, setWarrantyAdded] = useState(false);
    const WARRANTY_PRICE = 500;

    const totalWithBump = finalTotal + (warrantyAdded ? WARRANTY_PRICE : 0);
    const monthlyPayment = Math.ceil(totalWithBump / 3);

    useEffect(() => {
        if (cartItems.length === 0) {
            // navigate('/cart');
        }
    }, [cartItems, navigate]);

    useEffect(() => {
        if (hasTrackedStart.current) return;
        if (cartItems.length > 0) {
            logCheckoutEvent('checkout_started', {
                item_count: cartItems.length,
                total_value: finalTotal
            });
            hasTrackedStart.current = true;
        }
    }, [cartItems.length, finalTotal]);

    useEffect(() => {
        if (geoData) {
            // Update address logic would go here, potentially pre-filling form if we had one in state
            // For now we just log or could update a context if there was one for shipping address
            logger.info("Location detected:", geoData);
        }
    }, [geoData]);

    useEffect(() => {
        if (hasTrackedReassurance.current) return;
        logCheckoutEvent('checkout_payment_reassurance_visible', buildCheckoutPayload({
            paymentMethod: paymentMethod || 'none',
            step: 'payment'
        }), {
            key: 'checkout_payment_reassurance_visible',
            rateLimitMs: 60000
        });
        hasTrackedReassurance.current = true;
    }, [paymentMethod]);

    const selectPaymentMethod = (method) => {
        setPaymentMethod(method);
        logCheckoutEvent('checkout_payment_method_selected', buildCheckoutPayload({
            cartValue: totalWithBump,
            paymentMethod: method,
            step: 'payment'
        }), {
            key: `checkout_payment_method_selected:${method}:${getCheckoutSessionId()}`,
            rateLimitMs: 60 * 1000
        });
    };

    const handleWarrantyToggle = (checked) => {
        setWarrantyAdded(checked);
        logCheckoutEvent('checkout_order_bump_toggled', {
            enabled: checked,
            delta: WARRANTY_PRICE
        }, {
            key: `checkout_order_bump_toggled:${checked}`
        });
    };

    const reportPaymentError = (message, methodOverride) => {
        const method = methodOverride || paymentMethod || 'unknown';
        logCheckoutEvent('checkout_payment_error', {
            ...buildCheckoutPayload({ paymentMethod: method, step: 'payment' }),
            reason: message ? String(message).slice(0, 120) : 'unknown'
        }, {
            key: `checkout_payment_error:${method}`
        });
        setError(message || t('payment_error') || "Erreur de paiement");
    };

    const handleRetryPayment = () => {
        setError('');
        if (paymentMethod === 'stripe' || paymentMethod === 'paypal') {
            document.getElementById('payment-methods')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        handlePayment();
    };

    const handleSwitchMethod = () => {
        setError('');
        setPaymentMethod('');
        document.getElementById('payment-methods')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleGenericPaymentSuccess = async (method, transactionDetails = null) => {
        setLoading(true);
        logCheckoutEvent('checkout_payment_attempt', {
            method,
            total_value: totalWithBump
        }, {
            key: `checkout_payment_attempt:${method}`
        });
        try {
            const isPhysical = cartItems.some(item => item.type === 'physical' || !item.type);
            const orderItems = [...cartItems];
            if (warrantyAdded) {
                orderItems.push({
                    id: 'warranty-2y',
                    title: 'Garantie Étendue (2 ans)',
                    price: WARRANTY_PRICE,
                    quantity: 1,
                    type: 'service',
                    image: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png'
                });
            }

            const orderData = {
                items: orderItems,
                total: totalWithBump,
                finalTotal: totalWithBump,
                paymentMethod: method,
                shippingAddress: isPhysical ? {
                    name: currentUser.displayName || 'Client',
                    address: '15 Rue Pan-Américaine',
                    city: 'Pétion-Ville',
                    country: 'Haïti'
                } : null,
                transactionDetails
            };

            const orderId = await paymentService.createOrder(orderData, currentUser, referralData);
            logCheckoutEvent('checkout_payment_success', {
                method,
                total_value: totalWithBump
            }, {
                key: `checkout_payment_success:${method}`
            });
            logCheckoutEvent('checkout_completed', {
                total_value: totalWithBump
            });
            clearCart();
            navigate(`/order-confirmation/${orderId}`);
        } catch (err) {
            console.error(err);
            logCheckoutEvent('checkout_payment_failed', {
                method,
                reason: err?.message || 'unknown'
            }, {
                key: `checkout_payment_failed:${method}`
            });
            reportPaymentError("Erreur lors de la finalisation de la commande.", method);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (!paymentMethod) {
            setError(t('select_payment_method'));
            return;
        }

        setError('');

        if (paymentMethod === 'stripe' || paymentMethod === 'paypal') {
            // These are handled by their respective components rendering in the UI
            // We scroll to them or they are already visible
            return;
        }

        logCheckoutEvent('checkout_payment_attempt', {
            method: paymentMethod,
            total_value: totalWithBump
        }, {
            key: `checkout_payment_attempt:${paymentMethod}`
        });

        setLoading(true);

        try {
            const isPhysical = cartItems.some(item => item.type === 'physical' || !item.type);

            const orderItems = [...cartItems];
            if (warrantyAdded) {
                orderItems.push({
                    id: 'warranty-2y',
                    title: 'Garantie Étendue (2 ans)',
                    price: WARRANTY_PRICE,
                    quantity: 1,
                    type: 'service',
                    image: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png'
                });
            }

            const orderData = {
                items: orderItems,
                total: cartTotal + (warrantyAdded ? WARRANTY_PRICE : 0),
                finalTotal: totalWithBump,
                shippingAddress: isPhysical ? {
                    name: currentUser.displayName || 'Client',
                    address: '15 Rue Pan-Américaine',
                    city: 'Pétion-Ville',
                    country: 'Haïti'
                } : null
            };

            if (paymentMethod === 'moncash') {
                const redirectUrl = await paymentService.processMonCashPayment({ ...orderData, amount: totalWithBump }, currentUser, referralData);
                logCheckoutEvent('checkout_payment_initiated', {
                    method: 'moncash',
                    total_value: totalWithBump
                }, {
                    key: 'checkout_payment_initiated:moncash'
                });
                clearCart();
                if (redirectUrl.startsWith('/')) {
                    navigate(redirectUrl);
                } else {
                    window.location.href = redirectUrl;
                }
            } else if (paymentMethod === 'wallet') {
                if (balance < totalWithBump) {
                    throw new Error(t('insufficient_balance') || "Solde insuffisant");
                }

                const orderId = await paymentService.createOrder({ ...orderData, paymentMethod: 'wallet', total: totalWithBump }, currentUser, referralData);
                await pay(totalWithBump, orderId);
                logCheckoutEvent('checkout_payment_success', {
                    method: 'wallet',
                    total_value: totalWithBump
                }, {
                    key: 'checkout_payment_success:wallet'
                });
                logCheckoutEvent('checkout_completed', {
                    total_value: totalWithBump
                });
                clearCart();
                navigate(`/order-confirmation/${orderId}`);
            } else if (paymentMethod === 'union_pay_3x') {
                if (creditLimit < totalWithBump) throw new Error('Limite de crédit dépassée.');

                setTimeout(async () => {
                    const orderId = await paymentService.createOrder({ ...orderData, paymentMethod: 'union_pay_3x', total: totalWithBump }, currentUser, referralData);
                    logCheckoutEvent('checkout_payment_success', {
                        method: 'union_pay_3x',
                        total_value: totalWithBump
                    }, {
                        key: 'checkout_payment_success:union_pay_3x'
                    });
                    logCheckoutEvent('checkout_completed', {
                        total_value: totalWithBump
                    });
                    clearCart();
                    navigate(`/order-confirmation/${orderId}`);
                }, 1500);
            } else {
                // Card generic fallback
                setTimeout(() => {
                    logCheckoutEvent('checkout_payment_success', {
                        method: paymentMethod,
                        total_value: totalWithBump
                    }, {
                        key: `checkout_payment_success:${paymentMethod}`
                    });
                    logCheckoutEvent('checkout_completed', {
                        total_value: totalWithBump
                    });
                    alert(`${paymentMethod} simulation: Success`);
                    clearCart();
                    navigate('/');
                }, 1500);
            }

        } catch (err) {
            console.error(err);
            logCheckoutEvent('checkout_payment_failed', {
                method: paymentMethod,
                reason: err?.message || 'unknown'
            }, {
                key: `checkout_payment_failed:${paymentMethod}`
            });
            reportPaymentError(err.message || t('payment_error') || "Erreur de paiement");
        } finally {
            setLoading(false);
        }
    };

    // Render Stripe/PayPal forms Conditionally
    const renderPaymentForm = () => {
        if (paymentMethod === 'stripe') {
            return (
                <div className="mt-4 animate-fadeIn">
                    <Elements stripe={stripePromise}>
                        <StripeForm onSuccess={() => handleGenericPaymentSuccess('stripe')} />
                    </Elements>
                </div>
            );
        }
        if (paymentMethod === 'paypal') {
            return (
                <div className="mt-4 animate-fadeIn bg-white p-4 rounded-lg border border-blue-100">
                    <PayPalPayment
                        amount={totalWithBump}
                        onSuccess={(details) => handleGenericPaymentSuccess('paypal', details)}
                        onError={(err) => reportPaymentError("Erreur PayPal", 'paypal')}
                    />
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-100 min-h-screen py-8">
            <SEO title="Checkout" description="Finalisez votre commande Union Digitale en toute sécurité." />
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-medium">{t('checkout_title')}</h1>
                    <div className="text-gray-500 text-sm">{t('secure_payment')}</div>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">{t('secure_payment')}</span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Livraison locale</span>
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">Support 7j/7</span>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleRetryPayment}
                                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                            >
                                Réessayer le paiement
                            </button>
                            <button
                                type="button"
                                onClick={handleSwitchMethod}
                                className="px-3 py-1.5 rounded-md border border-red-300 text-red-700 text-xs font-semibold hover:bg-red-50"
                            >
                                Choisir une autre méthode
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Forms */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Shipping Address - Only for Physical Items */}
                        {cartItems.some(item => item.type === 'physical' || !item.type) && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold mb-4 flex justify-between">
                                    <span>{t('shipping_address_title')}</span>
                                    <div className="flex gap-4 items-center">
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Pré-remplie</span>
                                        <button
                                            type="button"
                                            onClick={getLocation}
                                            disabled={geoLoading}
                                            className="text-sm font-normal text-green-600 hover:underline flex items-center gap-1"
                                        >
                                            <div className="w-4 h-4">{geoLoading ? '...' : '📍'}</div> {t('locate_btn')}
                                        </button>
                                        <span className="text-blue-600 text-sm font-normal cursor-pointer hover:underline">{t('edit')}</span>
                                    </div>
                                </h2>
                                <div className="text-sm text-gray-700">
                                    <p>{currentUser?.displayName || t('shipping_guest')}</p>
                                    <p>15 Rue Pan-Américaine</p>
                                    <p>Pétion-Ville, Ouest</p>
                                    <p>Haïti</p>
                                </div>
                            </div>
                        )}

                        {/* Payment Method */}
                        <div className="bg-white p-6 rounded shadow-sm" id="payment-methods">
                            <h2 className="text-lg font-bold mb-4 flex justify-between">
                                <span>{t('payment_method_title')}</span>
                            </h2>

                            <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex flex-wrap items-center gap-3">
                                <span className="font-semibold">Paiement 100% sécurisé</span>
                                <span className="text-xs bg-white/70 px-2 py-1 rounded-full">Validation immédiate</span>
                                <span className="text-xs bg-white/70 px-2 py-1 rounded-full">Assistance 7j/7</span>
                                <span className="text-xs bg-white/70 px-2 py-1 rounded-full">Données chiffrées</span>
                            </div>

                            <div className="space-y-4">
                                {/* Union Pay 3x (BNPL) */}
                                <div
                                    className={`border rounded-lg p-4 cursor-pointer flex items-center gap-4 transition-colors ${paymentMethod === 'union_pay_3x' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => selectPaymentMethod('union_pay_3x')}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'union_pay_3x'}
                                        onChange={() => selectPaymentMethod('union_pay_3x')}
                                        className="accent-primary w-5 h-5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 flex items-center gap-2">
                                            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded font-bold">Union Pay</span>
                                            <span>{t('pay_3x_free')}</span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            <span>{t('pay_today')} </span>
                                            <span className="font-bold text-primary">{monthlyPayment.toLocaleString()} G</span>
                                            <div className="text-xs text-green-600 mt-0.5">
                                                {t('borrowing_capacity')} {creditLimit?.toLocaleString()} G
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Wallet Option */}
                                <div
                                    className={`border rounded-lg p-4 cursor-pointer flex items-center gap-4 transition-colors ${paymentMethod === 'wallet' ? 'border-secondary bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => selectPaymentMethod('wallet')}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'wallet'}
                                        onChange={() => selectPaymentMethod('wallet')}
                                        className="accent-secondary w-5 h-5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 flex items-center gap-2">
                                            <Wallet className="w-5 h-5 text-secondary" />
                                            <span>{t('wallet_option')}</span>
                                        </div>
                                        <div className="text-sm text-gray-500 flex justify-between items-center mt-1">
                                            <span>{t('use_balance')}</span>
                                            <span className={`font-bold ${balance >= totalWithBump ? 'text-green-600' : 'text-red-600'}`}>
                                                {t('balance')} {balance.toLocaleString()} G
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* MonCash Option */}
                                <div
                                    className={`border rounded-lg p-4 cursor-pointer flex items-center gap-4 transition-colors ${paymentMethod === 'moncash' ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => selectPaymentMethod('moncash')}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'moncash'}
                                        onChange={() => selectPaymentMethod('moncash')}
                                        className="accent-red-600 w-5 h-5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 flex items-center gap-2">
                                            <span className="text-red-600 font-extrabold text-xl tracking-tighter">MonCash</span>
                                            <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">{t('moncash_recommended')}</span>
                                        </div>
                                        <div className="text-sm text-gray-500">{t('pay_with_moncash_desc')}</div>
                                    </div>
                                </div>

                                {/* Stripe Option */}
                                <div
                                    className={`border rounded-lg p-4 cursor-pointer flex items-center gap-4 transition-colors ${paymentMethod === 'stripe' ? 'border-secondary bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => selectPaymentMethod('stripe')}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'stripe'}
                                        onChange={() => selectPaymentMethod('stripe')}
                                        className="accent-secondary w-5 h-5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 flex items-center gap-2">
                                            <span className="text-indigo-600 font-bold">{t('stripe_label')}</span>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5" />
                                        </div>
                                        <div className="text-sm text-gray-500">{t('stripe_desc')}</div>

                                        {/* Render Form INSIDE logic if selected */}
                                        {paymentMethod === 'stripe' && renderPaymentForm()}
                                    </div>
                                </div>

                                {/* PayPal Option */}
                                <div
                                    className={`border rounded-lg p-4 cursor-pointer flex items-center gap-4 transition-colors ${paymentMethod === 'paypal' ? 'border-secondary bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => selectPaymentMethod('paypal')}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'paypal'}
                                        onChange={() => selectPaymentMethod('paypal')}
                                        className="accent-secondary w-5 h-5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 flex items-center gap-2">
                                            <span className="text-blue-700 font-bold">PayPal</span>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" />
                                        </div>
                                        <div className="text-sm text-gray-500">{t('paypal_desc')}</div>

                                        {/* Render Form INSIDE logic if selected */}
                                        {paymentMethod === 'paypal' && renderPaymentForm()}
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white p-6 rounded shadow-sm sticky top-4 border border-gray-200">

                            {/* Order Bump: Warranty */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={warrantyAdded}
                                        onChange={(e) => handleWarrantyToggle(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-secondary rounded focus:ring-secondary"
                                    />
                                    <div className="text-sm">
                                        <span className="font-bold text-gray-900">{t('warranty_offer')}</span>
                                        <p className="text-gray-600 text-xs mt-0.5">{t('warranty_desc')}</p>
                                        <div className="font-bold text-red-700 mt-1">+ {WARRANTY_PRICE.toLocaleString()} G</div>
                                    </div>
                                </label>
                            </div>

                            {/* Standard Button (Hidden for Stripe/PayPal to avoid double click, or triggers logic) */}
                            {paymentMethod !== 'stripe' && paymentMethod !== 'paypal' && (
                                <button
                                    onClick={handlePayment}
                                    disabled={loading}
                                    className="w-full bg-secondary hover:bg-secondary-hover text-white font-medium py-2 rounded shadow-sm transition-colors mb-4 text-sm flex justify-center items-center gap-2"
                                >
                                    {loading ? <Loader className="animate-spin w-4 h-4" /> : null}
                                    {paymentMethod === 'moncash' ? t('pay_with_moncash_btn') :
                                        paymentMethod === 'wallet' ? t('pay_with_wallet_btn') :
                                            paymentMethod === 'union_pay_3x' ? t('pay_with_union_pay_btn') :
                                                t('pay_now_btn')}
                                </button>
                            )}

                            {/* Message for Stripe/PayPal */}
                            {(paymentMethod === 'stripe' || paymentMethod === 'paypal') && (
                                <div className="text-center text-sm text-gray-500 mb-4 italic">
                                    {t('complete_payment_form')}
                                </div>
                            )}

                            <p className="text-xs text-center text-gray-500 mb-4 border-b pb-4">
                                {t('terms_condition')}
                            </p>

                            <h3 className="font-bold text-lg mb-4">{t('order_summary')}</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>{t('items_total')}</span>
                                    <span>{cartTotal.toLocaleString()} G</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('shipping_total')}</span>
                                    <span>{shippingCost === 0 ? <span className="text-green-600 font-bold">{t('free_shipping')}</span> : `${shippingCost.toLocaleString()} G`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('total_ht')}</span>
                                    <span>{cartTotal.toLocaleString()} G</span>
                                </div>
                                {warrantyAdded && (
                                    <div className="flex justify-between text-yellow-700 bg-yellow-50 px-1 -mx-1 rounded">
                                        <span>{t('warranty_label')}</span>
                                        <span>{WARRANTY_PRICE.toLocaleString()} G</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>{t('tax')}</span>
                                    <span>{tax.toLocaleString()} G</span>
                                </div>
                                <div className="flex justify-between font-bold text-red-700 text-lg border-t pt-4 mt-2">
                                    <span>{t('total_amount')}</span>
                                    <span>{totalWithBump.toLocaleString()} G</span>
                                </div>
                            </div>

                            <details className="mt-5 border-t pt-4">
                                <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
                                    {t('review_items_title')} ({cartItems.length})
                                </summary>
                                <div className="mt-3 space-y-3">
                                    <div className="text-xs text-green-700 font-bold">{t('estimated_delivery')}</div>
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center text-xs text-gray-400 overflow-hidden rounded-md">
                                                {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <span>{t('img_placeholder')}</span>}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-xs">{item.title}</div>
                                                <div className="text-xs text-red-700 font-bold">{item.price.toLocaleString()} G</div>
                                                <div className="text-[10px] text-gray-500">{t('qty')} {item.quantity}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile sticky pay bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{t('total_amount')}</span>
                    <span className="text-lg font-bold text-red-700">{totalWithBump.toLocaleString()} G</span>
                </div>
                {paymentMethod === 'stripe' || paymentMethod === 'paypal' ? (
                    <div className="text-center text-sm text-gray-600">{t('complete_payment_form')}</div>
                ) : (
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-secondary hover:bg-secondary-hover text-white font-medium py-2 rounded-lg shadow-sm transition-colors text-sm flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader className="animate-spin w-4 h-4" /> : null}
                        {paymentMethod === 'moncash' ? t('pay_with_moncash_btn') :
                            paymentMethod === 'wallet' ? t('pay_with_wallet_btn') :
                                paymentMethod === 'union_pay_3x' ? t('pay_with_union_pay_btn') :
                                    t('pay_now_btn')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Checkout;
