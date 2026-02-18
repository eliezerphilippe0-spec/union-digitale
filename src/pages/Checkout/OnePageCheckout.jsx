import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWallet } from '../../contexts/WalletContext';
import { useAffiliation } from '../../contexts/AffiliationContext';
import { paymentService } from '../../services/paymentService';
import { useNavigate, Link } from 'react-router-dom';
import { Loader, Lock, ShieldCheck, CreditCard, Smartphone, Zap, Truck, RefreshCw } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import AddressAutocomplete from '../../components/forms/AddressAutocomplete';
import OrderBump from '../../components/OrderBump';
import PickupPoints, { PICKUP_POINTS } from '../../components/shipping/PickupPoints';
import logger from '../../utils/logger';
import { buildCheckoutPayload, getCheckoutSessionId, logCheckoutEvent } from '../../utils/analytics';

const OnePageCheckout = () => {
    const { currentUser } = useAuth();
    const { cartItems, cartTotal, shippingCost, tax, finalTotal, clearCart, shippingMethod, setShippingMethod } = useCart();
    const { balance, pay } = useWallet();
    const { referralData } = useAffiliation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(currentUser?.email || '');
    const [fullName, setFullName] = useState(currentUser?.displayName || '');
    const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [department, setDepartment] = useState('Ouest');
    const [paymentMethod, setPaymentMethod] = useState('moncash');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedPickup, setSelectedPickup] = useState(null);
    const [paymentFailures, setPaymentFailures] = useState(0);
    const [guestReady, setGuestReady] = useState(false);
    const checkoutCompletedRef = useRef(false);
    const hasTrackedStart = useRef(false);
    const hasTrackedReassurance = useRef(false);
    const hasTrackedPickupVisible = useRef(false);
    const hasTrackedPickupIncentive = useRef(false);
    const hasAppliedPickupDefault = useRef(false);
    const hasUserToggledPickup = useRef(false);

    const isPhysical = cartItems.some(item => item.type === 'physical' || !item.type);
    const hasNearbyHub = isPhysical && PICKUP_POINTS?.some(point => point.available);

    const trackPickupEvent = (eventName, properties = {}) => {
        const key = `pickup_event_${eventName}`;
        const now = Date.now();
        const last = Number(localStorage.getItem(key) || 0);
        if (now - last < 2 * 60 * 1000) return; // 2 min rate-limit
        localStorage.setItem(key, String(now));
        logger.event(eventName, properties);
    };

    const PICKUP_ROLLOUT_VERSION = 'pickup_v2_rollout_1';
    const buildPickupEventPayload = () => ({
        orderValue: finalTotal,
        sessionId: getCheckoutSessionId(),
        rolloutVersion: PICKUP_ROLLOUT_VERSION,
        hasNearbyHub
    });

    const departments = [
        'Ouest', 'Nord', 'Nord-Est', 'Nord-Ouest', 'Artibonite',
        'Centre', 'Sud', 'Sud-Est', 'Grande-Anse', 'Nippes'
    ];

    // Example Bump Product (Should come from backend/config)
    const bumpProduct = {
        id: 'bump_001',
        title: 'Pack de Templates Premium',
        price: 500,
        description: 'Ajoutez 50 templates professionnels à votre commande pour seulement 500 G.',
        image: 'https://placehold.co/100x100/red/white?text=Templates',
        type: 'digital'
    };

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/cart');
        }
    }, [cartItems, navigate]);
    useEffect(() => {
        if (!isPhysical) {
            setShippingMethod('delivery');
            return;
        }
        if (!hasNearbyHub || hasAppliedPickupDefault.current || hasUserToggledPickup.current) return;
        if (shippingMethod !== 'pickup') {
            setShippingMethod('pickup');
            hasAppliedPickupDefault.current = true;
            logCheckoutEvent('checkout_pickup_default_auto', buildPickupEventPayload(), {
                key: `checkout_pickup_default_auto:${getCheckoutSessionId()}`,
                rateLimitMs: 60 * 1000
            });
        }
    }, [isPhysical, hasNearbyHub, shippingMethod, setShippingMethod]);

    useEffect(() => {
        if (!isPhysical || hasTrackedPickupVisible.current) return;
        logCheckoutEvent('checkout_pickup_visible', buildPickupEventPayload(), {
            key: `checkout_pickup_visible:${getCheckoutSessionId()}`,
            rateLimitMs: 60 * 1000
        });
        hasTrackedPickupVisible.current = true;
    }, [isPhysical, finalTotal, hasNearbyHub]);

    useEffect(() => {
        if (!isPhysical || !hasNearbyHub || hasTrackedPickupIncentive.current) return;
        logCheckoutEvent('checkout_pickup_incentive_visible', buildPickupEventPayload(), {
            key: `checkout_pickup_incentive_visible:${getCheckoutSessionId()}`,
            rateLimitMs: 60 * 1000
        });
        hasTrackedPickupIncentive.current = true;
    }, [isPhysical, hasNearbyHub, finalTotal]);

    useEffect(() => {
        if (currentUser?.uid) {
            setGuestReady(true);
        }
    }, [currentUser?.uid]);

    useEffect(() => {
        if (hasTrackedStart.current || cartItems.length === 0) return;
        logCheckoutEvent('checkout_start', buildCheckoutPayload({
            cartValue: finalTotal,
            paymentMethod: 'unknown',
            step: 'checkout'
        }), {
            key: `checkout_start:${getCheckoutSessionId()}`
        });
        hasTrackedStart.current = true;
    }, [cartItems.length, finalTotal]);

    useEffect(() => {
        if (hasTrackedReassurance.current) return;
        logCheckoutEvent('payment_reassurance_visible', {
            paymentMethod,
            sessionId: getCheckoutSessionId()
        }, {
            key: `payment_reassurance_visible:${getCheckoutSessionId()}`,
            rateLimitMs: 60 * 1000
        });
        hasTrackedReassurance.current = true;
    }, [paymentMethod]);

    useEffect(() => {
        return () => {
            if (!checkoutCompletedRef.current && cartItems.length > 0) {
                logCheckoutEvent('checkout_abandon', buildCheckoutPayload({
                    cartValue: finalTotal,
                    paymentMethod,
                    step: 'checkout'
                }), {
                    key: `checkout_abandon:${getCheckoutSessionId()}`
                });
            }
        };
    }, [cartItems.length, finalTotal, paymentMethod]);

    const ensureCheckoutUser = async () => {
        if (currentUser?.uid) return currentUser;
        const result = await signInAnonymously(auth);
        setGuestReady(true);
        return result.user;
    };

    const handlePaymentMethodSelect = (method) => {
        setPaymentMethod(method);
        logCheckoutEvent('payment_method_selected', {
            paymentMethod: method,
            sessionId: getCheckoutSessionId()
        }, {
            key: `payment_method_selected:${method}:${getCheckoutSessionId()}`,
            rateLimitMs: 60 * 1000
        });
        logCheckoutEvent('checkout_payment_method_selected', buildCheckoutPayload({
            cartValue: finalTotal,
            paymentMethod: method,
            step: 'payment'
        }), {
            key: `checkout_payment_method_selected:${method}:${getCheckoutSessionId()}`,
            rateLimitMs: 60 * 1000
        });
    };

    const handlePaymentHelpClick = () => {
        logCheckoutEvent('payment_help_clicked', {
            paymentMethod,
            sessionId: getCheckoutSessionId()
        }, {
            key: `payment_help_clicked:${paymentMethod}:${getCheckoutSessionId()}`,
            rateLimitMs: 30 * 1000
        });
    };

    const handlePayment = async (e, options = {}) => {
        e?.preventDefault?.();
        setLoading(true);
        setError('');

        try {
            if (!phone) {
                setError('Le téléphone est obligatoire pour finaliser la commande.');
                setLoading(false);
                return;
            }

            if (shippingMethod === 'pickup' && !selectedPickup) {
                setError('Veuillez sélectionner un point de retrait.');
                setLoading(false);
                return;
            }

            if (shippingMethod === 'delivery' && (!address || !city)) {
                setError('Veuillez compléter votre adresse de livraison.');
                setLoading(false);
                return;
            }

            const activeUser = await ensureCheckoutUser();

            if (options.isRetry) {
                logCheckoutEvent('checkout_payment_retry', buildCheckoutPayload({
                    cartValue: finalTotal,
                    paymentMethod,
                    step: 'payment'
                }), {
                    key: `checkout_payment_retry:${paymentMethod}:${finalTotal}`
                });
            }

            logCheckoutEvent('checkout_payment_attempt', buildCheckoutPayload({
                cartValue: finalTotal,
                paymentMethod,
                step: 'payment'
            }), {
                key: `checkout_payment_attempt:${paymentMethod}:${finalTotal}`
            });

            const pickupHubId = shippingMethod === 'pickup' && selectedPickup
                ? selectedPickup.id
                : null;

            const shippingAddress = shippingMethod === 'delivery' ? {
                fullName,
                phone,
                address,
                city,
                department,
                country: 'Haiti'
            } : null;

            const orderData = {
                items: cartItems,
                total: finalTotal,
                totalAmount: finalTotal,
                currency: 'HTG',
                customer: { name: fullName, email, phone },
                shipping: shippingMethod === 'delivery' ? { address, city, department } : null,
                shippingMethod,
                shippingAddress,
                pickupHubId,
                paymentMethod
            };

            // Format referral data for backend
            const activeReferral = referralData ? { code: referralData.sellerId, campaign: referralData.campaign } : null;

            if (paymentMethod === 'moncash') {
                const redirectUrl = await paymentService.processMonCashPayment(orderData, activeUser, activeReferral);
                if (redirectUrl) {
                    checkoutCompletedRef.current = true;
                    logCheckoutEvent('checkout_payment_success', buildCheckoutPayload({
                        cartValue: finalTotal,
                        paymentMethod,
                        step: 'payment',
                        successSource: 'redirect'
                    }), {
                        key: `checkout_payment_success:redirect:${paymentMethod}:${getCheckoutSessionId()}`
                    });
                    window.location.href = redirectUrl;
                }
            } else if (paymentMethod === 'wallet') {
                if (balance < finalTotal) throw new Error("Solde insuffisant");
                const orderId = await paymentService.createOrder({ ...orderData, status: 'paid' }, activeUser, activeReferral);
                await pay(finalTotal, orderId);
                checkoutCompletedRef.current = true;
                logCheckoutEvent('checkout_payment_success', buildCheckoutPayload({
                    cartValue: finalTotal,
                    paymentMethod,
                    step: 'payment',
                    successSource: 'confirmed'
                }), {
                    key: `checkout_payment_success:confirmed:${paymentMethod}:${getCheckoutSessionId()}`
                });
                clearCart();
                navigate(`/upsell?orderId=${orderId}`);
            }

            setPaymentFailures(0);
        } catch (err) {
            console.error(err);
            setPaymentFailures((prev) => prev + 1);
            setError(err.message || "Le paiement a échoué. Aucun débit n’a été effectué.");
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">
                
                {/* 📊 PROGRESS BAR - P1 FIX */}
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-2 md:gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gold-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                            <span className="hidden sm:block text-sm font-medium text-gray-900">Livraison</span>
                        </div>
                        <div className="w-12 md:w-24 h-1 bg-gray-200 rounded">
                            <div className="w-1/2 h-full bg-gold-500 rounded"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm">2</div>
                            <span className="hidden sm:block text-sm font-medium text-gray-500">Paiement</span>
                        </div>
                        <div className="w-12 md:w-24 h-1 bg-gray-200 rounded"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm">3</div>
                            <span className="hidden sm:block text-sm font-medium text-gray-500">Confirmation</span>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
                        <Lock className="w-6 h-6 text-green-600" />
                        Caisse Sécurisée
                    </h1>
                    <p className="mt-1 text-gray-600">Finalisez votre commande en quelques secondes.</p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 mb-6 text-xs font-semibold text-gray-700">
                    <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border">
                        <Lock className="w-3.5 h-3.5 text-green-600" /> Paiement sécurisé
                    </span>
                    <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Garantie 72h
                    </span>
                    <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border">
                        <Truck className="w-3.5 h-3.5 text-emerald-600" /> ETA estimée 2-4 jours
                    </span>
                </div>

                <div className="mb-6 bg-white border border-emerald-100 rounded-2xl p-4 md:p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Paiement 100% sécurisé, aucun débit sans confirmation.</div>
                            <div className="text-xs text-gray-600 mt-1">Vos informations sont chiffrées et protégées. Assistance rapide si besoin.</div>
                        </div>
                        <button
                            type="button"
                            onClick={handlePaymentHelpClick}
                            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-full"
                        >
                            Besoin d'aide paiement ?
                        </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200">MonCash</span>
                        <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200">NatCash</span>
                        <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200">Portefeuille UD</span>
                        <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200">🔒 SSL</span>
                    </div>
                </div>

                {!currentUser && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-sm text-emerald-900">
                            <div className="font-semibold">Continuer sans créer de compte</div>
                            <div className="text-emerald-800 text-xs">Vous pourrez créer un compte après l’achat si vous le souhaitez.</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!guestReady) {
                                        await ensureCheckoutUser();
                                    }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                            >
                                Continuer sans créer de compte
                            </button>
                            <Link to="/login" className="text-xs text-emerald-700 hover:underline">Se connecter</Link>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Details & Payment */}
                    <div className="space-y-6">

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-3">
                                <div>
                                    <div className="font-semibold">Paiement non validé</div>
                                    <div className="text-xs">{error} Vous pouvez réessayer ou choisir une autre méthode.</div>
                                </div>
                                {paymentFailures > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => handlePayment(e, { isRetry: true })}
                                        className="flex items-center gap-1 text-xs bg-red-600 text-white px-3 py-2 rounded-md"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Réessayer
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ⚡ EXPRESS CHECKOUT - P1 FIX: En premier */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="w-5 h-5 text-green-600" />
                                <h2 className="text-lg font-bold text-gray-900">Paiement Express</h2>
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Recommandé</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">Payez instantanément avec votre mobile money</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handlePaymentMethodSelect('moncash')}
                                    className={`h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                        paymentMethod === 'moncash' 
                                            ? 'bg-red-500 text-white ring-2 ring-red-600 ring-offset-2' 
                                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300'
                                    }`}
                                >
                                    <span className="text-xl">📱</span>
                                    <span>MonCash</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePaymentMethodSelect('natcash')}
                                    className={`h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                        paymentMethod === 'natcash' 
                                            ? 'bg-blue-500 text-white ring-2 ring-blue-600 ring-offset-2' 
                                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300'
                                    }`}
                                >
                                    <span className="text-xl">💳</span>
                                    <span>NatCash</span>
                                </button>
                            </div>
                            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                                <button
                                    type="button"
                                    onClick={() => handlePaymentMethodSelect('wallet')}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                                        paymentMethod === 'wallet' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <CreditCard className="w-3 h-3" />
                                    Portefeuille Union ({balance?.toLocaleString() || 0} HTG)
                                </button>
                            </div>
                        </div>

                        {/* Step 1: Contact Info */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                                <h2 className="text-xl font-bold text-gray-800">Vos Informations</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        autoComplete="name"
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                        placeholder="Jean Baptiste"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                        placeholder="jean@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (MonCash)</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        autoComplete="tel"
                                        inputMode="tel"
                                        required
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                        placeholder="+509 3XXX XXXX"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Numéro haïtien requis pour la livraison et le paiement.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Delivery vs Pickup */}
                        {isPhysical && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                                    <h2 className="text-xl font-bold text-gray-800">Livraison ou Retrait</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            hasUserToggledPickup.current = true;
                                            setShippingMethod('delivery');
                                            trackPickupEvent('pickup_toggle_delivery');
                                        }}
                                        className={`h-12 rounded-xl font-semibold border-2 transition-all ${
                                            shippingMethod === 'delivery'
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Livraison
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            hasUserToggledPickup.current = true;
                                            setShippingMethod('pickup');
                                            trackPickupEvent('pickup_toggle_pickup');
                                            logCheckoutEvent('checkout_pickup_selected', buildPickupEventPayload(), {
                                                key: `checkout_pickup_selected:${getCheckoutSessionId()}`,
                                                rateLimitMs: 60 * 1000
                                            });
                                        }}
                                        className={`h-12 rounded-xl font-semibold border-2 transition-all ${
                                            shippingMethod === 'pickup'
                                                ? 'border-gold-500 bg-amber-50 text-amber-700'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Retrait
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div />
                                    <div className="flex justify-center">
                                        <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-100 px-2 py-1 rounded-full">
                                            Recommandé
                                        </span>
                                    </div>
                                </div>

                                {hasNearbyHub && (
                                    <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                        <div className="font-semibold">Économisez sur la livraison</div>
                                        <div className="mt-1">Retrait sécurisé en 24–48h, moins d'échecs de livraison.</div>
                                    </div>
                                )}

                                {shippingMethod === 'delivery' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète *</label>
                                            <AddressAutocomplete
                                                value={address}
                                                onChange={setAddress}
                                                department={department}
                                                placeholder="Ex: Pétion-Ville, Delmas 33..."
                                                autoComplete="street-address"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Ville / Commune *</label>
                                                <input
                                                    type="text"
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    autoComplete="address-level2"
                                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                                    placeholder="Port-au-Prince"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Département *</label>
                                                <select
                                                    value={department}
                                                    onChange={(e) => setDepartment(e.target.value)}
                                                    autoComplete="address-level1"
                                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border bg-white"
                                                >
                                                    {departments.map(dept => (
                                                        <option key={dept} value={dept}>{dept}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {shippingMethod === 'pickup' && (
                                    <div className="space-y-4">
                                        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                                            Retrait disponible dans 3 hubs pilotes. Code de retrait envoyé uniquement par SMS.
                                        </div>
                                        <PickupPoints
                                            selectedPoint={selectedPickup}
                                            onSelect={(point) => {
                                                setSelectedPickup(point);
                                                trackPickupEvent('pickup_hub_selected', { hubId: point.id, hubName: point.name });
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
                                <h2 className="text-xl font-bold text-gray-800">Paiement</h2>
                            </div>

                            <div className="space-y-3">
                                {/* MonCash */}
                                <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'moncash' ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="moncash"
                                        checked={paymentMethod === 'moncash'}
                                        onChange={() => handlePaymentMethodSelect('moncash')}
                                        className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                    />
                                    <div className="ml-3 flex items-center justify-between w-full">
                                        <span className="block text-sm font-medium text-gray-900">MonCash</span>
                                        <Smartphone className="h-6 w-6 text-red-600" />
                                    </div>
                                </label>

                                {/* Wallet */}
                                <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="wallet"
                                        checked={paymentMethod === 'wallet'}
                                        onChange={() => handlePaymentMethodSelect('wallet')}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <div className="ml-3 flex items-center justify-between w-full">
                                        <div>
                                            <span className="block text-sm font-medium text-gray-900">Portefeuille UD</span>
                                            <span className="block text-xs text-gray-500">Solde: {balance.toLocaleString()} G</span>
                                        </div>
                                        <CreditCard className="h-6 w-6 text-blue-600" />
                                    </div>
                                </label>

                                {paymentFailures >= 2 && (
                                    <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg p-3">
                                        <div className="font-semibold">Un souci persiste ?</div>
                                        <div className="mt-1">Essayez une autre méthode de paiement pour finaliser rapidement.</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handlePaymentMethodSelect('moncash')}
                                                className="px-3 py-1.5 bg-white border border-amber-200 rounded-full"
                                            >
                                                MonCash
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handlePaymentMethodSelect('wallet')}
                                                className="px-3 py-1.5 bg-white border border-amber-200 rounded-full"
                                            >
                                                Portefeuille
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Summary & Bump - P2 FIX: Sticky enhanced */}
                    <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
                        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Votre Commande</h2>
                                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{cartItems.length} article{cartItems.length > 1 ? 's' : ''}</span>
                            </div>

                            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-start">
                                        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                            {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</h4>
                                            <p className="text-xs text-gray-500">Qté: {item.quantity}</p>
                                        </div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {(item.price * item.quantity).toLocaleString()} G
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Sous-total</span>
                                    <span>{cartTotal.toLocaleString()} G</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Livraison</span>
                                    <span>{shippingCost === 0 ? 'Gratuite' : `${shippingCost.toLocaleString()} G`}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Taxes</span>
                                    <span>{tax.toLocaleString()} G</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2">
                                    <span>Total</span>
                                    <span>{finalTotal.toLocaleString()} G</span>
                                </div>
                                <div className="text-xs text-emerald-700">🚚 ETA estimée : 2-4 jours</div>
                            </div>

                            {/* Order Bump */}
                            <OrderBump product={bumpProduct} />

                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-lg"
                            >
                                {loading ? <Loader className="animate-spin" /> : <Lock className="w-5 h-5" />}
                                {loading ? "Traitement..." : `Payer ${finalTotal.toLocaleString()} G`}
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                                <ShieldCheck className="w-4 h-4 text-green-600" />
                                <span>Paiement 100% Sécurisé & Chiffré</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnePageCheckout;
