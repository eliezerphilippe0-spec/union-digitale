/**
 * Express Checkout - 1-Click Purchase
 * Inspired by: Shop Pay, Amazon 1-Click, Apple Pay
 */

import React, { useState, useEffect } from 'react';
import { Zap, CreditCard, MapPin, Check, Loader, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWallet } from '../../contexts/WalletContext';
import { useToast } from '../ui/Toast';

const ExpressCheckout = ({ product, quantity = 1, onSuccess, onCancel }) => {
    const { currentUser } = useAuth();
    const { addToCart } = useCart();
    const { balance, pay } = useWallet();
    const toast = useToast();
    
    const [savedMethods, setSavedMethods] = useState([]);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('confirm'); // 'confirm' | 'processing' | 'success'

    // Mock saved payment methods (in production, fetch from backend)
    useEffect(() => {
        if (currentUser) {
            setSavedMethods([
                { id: 'wallet', type: 'wallet', name: 'Portefeuille UD', balance: balance, icon: '💳' },
                { id: 'moncash_saved', type: 'moncash', name: 'MonCash •••• 4532', lastUsed: true, icon: '📱' },
            ]);
            setSavedAddresses([
                { id: 'addr_1', name: 'Domicile', address: '123 Rue Example', city: 'Port-au-Prince', department: 'Ouest', isDefault: true },
                { id: 'addr_2', name: 'Bureau', address: '456 Ave Business', city: 'Pétion-Ville', department: 'Ouest', isDefault: false },
            ]);
            
            // Auto-select defaults
            setSelectedMethod('wallet');
            setSelectedAddress('addr_1');
        }
    }, [currentUser, balance]);

    const total = product.price * quantity;
    const canUseWallet = balance >= total;

    const handleExpressCheckout = async () => {
        if (!selectedMethod || !selectedAddress) {
            toast?.error('Veuillez sélectionner un mode de paiement et une adresse');
            return;
        }

        setLoading(true);
        setStep('processing');

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (selectedMethod === 'wallet') {
                if (!canUseWallet) {
                    throw new Error('Solde insuffisant');
                }
                await pay(total, `express_${Date.now()}`);
            }

            setStep('success');
            
            // Simulate order creation delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            toast?.success('Commande confirmée ! 🎉');
            onSuccess?.({
                orderId: `ORD-${Date.now()}`,
                total,
                product,
                quantity,
                paymentMethod: selectedMethod,
                address: savedAddresses.find(a => a.id === selectedAddress),
            });
        } catch (error) {
            toast?.error(error.message || 'Erreur lors du paiement');
            setStep('confirm');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-scale-in">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Commande Confirmée!</h2>
                    <p className="text-gray-600 mb-4">Votre commande est en route</p>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-500">Total payé</p>
                        <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()} G</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-gold-400 to-gold-600 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Achat Express</h2>
                            <p className="text-xs text-gray-500">Paiement en 1 clic</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>

                {/* Product Summary */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">{product.image || '📦'}</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900 line-clamp-2">{product.title}</h3>
                            <p className="text-sm text-gray-500">Qté: {quantity}</p>
                            <p className="text-lg font-bold text-gold-600">{total.toLocaleString()} G</p>
                        </div>
                    </div>
                </div>

                {/* Payment Method Selection */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Payer avec
                    </h3>
                    <div className="space-y-2">
                        {savedMethods.map(method => (
                            <button
                                key={method.id}
                                onClick={() => setSelectedMethod(method.id)}
                                disabled={method.type === 'wallet' && !canUseWallet}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                    selectedMethod === method.id
                                        ? 'border-gold-500 bg-gold-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                } ${method.type === 'wallet' && !canUseWallet ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="text-2xl">{method.icon}</span>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900">{method.name}</p>
                                    {method.type === 'wallet' && (
                                        <p className={`text-xs ${canUseWallet ? 'text-green-600' : 'text-red-500'}`}>
                                            Solde: {method.balance?.toLocaleString()} G
                                            {!canUseWallet && ' (insuffisant)'}
                                        </p>
                                    )}
                                    {method.lastUsed && <p className="text-xs text-gray-500">Dernière utilisée</p>}
                                </div>
                                {selectedMethod === method.id && (
                                    <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Delivery Address Selection */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Livrer à
                    </h3>
                    <div className="space-y-2">
                        {savedAddresses.map(addr => (
                            <button
                                key={addr.id}
                                onClick={() => setSelectedAddress(addr.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                    selectedAddress === addr.id
                                        ? 'border-gold-500 bg-gold-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900">{addr.name}</p>
                                    <p className="text-xs text-gray-500">{addr.address}, {addr.city}</p>
                                </div>
                                {selectedAddress === addr.id && (
                                    <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                <div className="px-6 py-4 bg-gray-50">
                    <button
                        onClick={handleExpressCheckout}
                        disabled={loading || !selectedMethod || !selectedAddress}
                        className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Traitement...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                Payer {total.toLocaleString()} G
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
                        <Shield className="w-4 h-4" />
                        Paiement sécurisé et crypté
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpressCheckout;
