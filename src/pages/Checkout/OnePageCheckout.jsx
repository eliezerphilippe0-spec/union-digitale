import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWallet } from '../../contexts/WalletContext';
import { useAffiliation } from '../../contexts/AffiliationContext';
import { paymentService } from '../../services/paymentService';
import { useNavigate } from 'react-router-dom';
import { Loader, Lock, ShieldCheck, CreditCard, Smartphone, Zap } from 'lucide-react';
import AddressAutocomplete from '../../components/forms/AddressAutocomplete';
import OrderBump from '../../components/OrderBump';

const OnePageCheckout = () => {
    const { currentUser } = useAuth();
    const { cartItems, cartTotal, shippingCost, tax, finalTotal, clearCart } = useCart();
    const { balance, pay } = useWallet();
    const { referralData } = useAffiliation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(currentUser?.email || '');
    const [fullName, setFullName] = useState(currentUser?.displayName || '');
    const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [department, setDepartment] = useState('Ouest');
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('moncash');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const orderData = {
                items: cartItems,
                total: cartTotal,
                customer: { name: fullName, email, phone },
                shipping: { address, city, department, notes: deliveryNotes },
                paymentMethod
            };

            // Format referral data for backend
            const activeReferral = referralData ? { code: referralData.sellerId, campaign: referralData.campaign } : null;

            if (paymentMethod === 'moncash') {
                const redirectUrl = await paymentService.processMonCashPayment(orderData, currentUser, activeReferral);
                // In a real app, we might clear cart after confirmation, but for MonCash redirect we might wait.
                // For now, assuming redirect happens immediately.
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                }
            } else if (paymentMethod === 'wallet') {
                if (balance < finalTotal) throw new Error("Solde insuffisant");
                const orderId = await paymentService.createOrder({ ...orderData, status: 'paid' }, currentUser, activeReferral);
                await pay(finalTotal, orderId);
                clearCart();
                navigate(`/upsell?orderId=${orderId}`); // Redirect to Upsell instead of Confirmation
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Une erreur est survenue.");
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

                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
                        <Lock className="w-6 h-6 text-green-600" />
                        Caisse Sécurisée
                    </h1>
                    <p className="mt-1 text-gray-600">Finalisez votre commande en quelques secondes.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Details & Payment */}
                    <div className="space-y-6">

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
                                    onClick={() => setPaymentMethod('moncash')}
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
                                    onClick={() => setPaymentMethod('natcash')}
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
                                    onClick={() => setPaymentMethod('wallet')}
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
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                        placeholder="509 3XXX XXXX"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Shipping Address */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                                <h2 className="text-xl font-bold text-gray-800">Adresse de Livraison</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète *</label>
                                    {/* P3 FIX: AddressAutocomplete */}
                                    <AddressAutocomplete
                                        value={address}
                                        onChange={setAddress}
                                        department={department}
                                        placeholder="Ex: Pétion-Ville, Delmas 33..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ville / Commune *</label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
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
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border bg-white"
                                        >
                                            {departments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions de livraison (optionnel)</label>
                                    <textarea
                                        value={deliveryNotes}
                                        onChange={(e) => setDeliveryNotes(e.target.value)}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                        placeholder="Ex: Près de l'église, portail bleu..."
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </div>

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
                                        onChange={() => setPaymentMethod('moncash')}
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
                                        onChange={() => setPaymentMethod('wallet')}
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
                                    <span>Taxes</span>
                                    <span>{tax.toLocaleString()} G</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2">
                                    <span>Total</span>
                                    <span>{finalTotal.toLocaleString()} G</span>
                                </div>
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
