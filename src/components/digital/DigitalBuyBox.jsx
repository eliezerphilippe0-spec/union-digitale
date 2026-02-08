/**
 * DigitalBuyBox - Inspiré Gumroad/Hotmart
 * Buy box spécialisé pour produits numériques
 */

import React, { useState } from 'react';
import { 
    Download, Zap, Shield, Gift, Clock, Tag, 
    CheckCircle, CreditCard, Smartphone, ChevronDown,
    Infinity, RefreshCcw, HeadphonesIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../ui/Toast';

const DigitalBuyBox = ({ product }) => {
    const navigate = useNavigate();
    const { addToCart, clearCart } = useCart();
    const toast = useToast();
    const [selectedPlan, setSelectedPlan] = useState('standard');
    const [showCoupon, setShowCoupon] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);

    // Pricing tiers
    const plans = {
        standard: {
            name: 'Standard',
            price: product.price,
            features: ['Accès au contenu complet', 'Téléchargements illimités', 'Mises à jour gratuites'],
        },
        premium: {
            name: 'Premium',
            price: Math.round(product.price * 1.5),
            features: ['Tout du Standard', 'Support prioritaire 24/7', 'Ressources bonus exclusives', 'Certificat de complétion'],
            badge: 'Populaire',
        },
        team: {
            name: 'Équipe',
            price: Math.round(product.price * 3),
            features: ['Tout du Premium', 'Jusqu\'à 5 utilisateurs', 'Facturation entreprise', 'Gestionnaire de compte dédié'],
        },
    };

    const currentPlan = plans[selectedPlan];
    const finalPrice = currentPlan.price * (1 - appliedDiscount);

    const handleApplyCoupon = () => {
        if (couponCode.toUpperCase() === 'BIENVENUE15') {
            setAppliedDiscount(0.15);
            toast?.success('Code promo appliqué: -15%!');
        } else if (couponCode.toUpperCase() === 'DIGITAL20') {
            setAppliedDiscount(0.20);
            toast?.success('Code promo appliqué: -20%!');
        } else {
            toast?.error('Code promo invalide');
        }
    };

    const handleBuyNow = () => {
        clearCart();
        addToCart({ ...product, price: finalPrice, selectedPlan: selectedPlan });
        navigate('/checkout');
    };

    const handleAddToCart = () => {
        addToCart({ ...product, price: finalPrice, selectedPlan: selectedPlan });
        toast?.success('Ajouté au panier!');
    };

    return (
        <div className="bg-white border-2 border-indigo-100 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <Zap className="w-5 h-5" />
                    <span className="font-bold">Accès Instantané</span>
                </div>
                <p className="text-indigo-200 text-sm">Téléchargement immédiat après paiement</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Plan Selector */}
                <div className="space-y-2">
                    {Object.entries(plans).map(([key, plan]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedPlan(key)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                                selectedPlan === key 
                                    ? 'border-indigo-500 bg-indigo-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {plan.badge && (
                                <span className="absolute -top-2 right-4 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {plan.badge}
                                </span>
                            )}
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-900">{plan.name}</span>
                                <span className="font-bold text-lg">
                                    {plan.price.toLocaleString()} <span className="text-sm text-gray-500">HTG</span>
                                </span>
                            </div>
                            <ul className="text-xs text-gray-600 space-y-1">
                                {plan.features.slice(0, 2).map((f, i) => (
                                    <li key={i} className="flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    ))}
                </div>

                {/* Price Display */}
                <div className="text-center py-4 border-y border-gray-100">
                    {appliedDiscount > 0 && (
                        <div className="text-sm text-gray-500 line-through mb-1">
                            {currentPlan.price.toLocaleString()} HTG
                        </div>
                    )}
                    <div className="text-4xl font-black text-gray-900">
                        {Math.round(finalPrice).toLocaleString()} <span className="text-lg">HTG</span>
                    </div>
                    {appliedDiscount > 0 && (
                        <div className="text-sm text-green-600 font-semibold mt-1">
                            Vous économisez {Math.round(currentPlan.price * appliedDiscount).toLocaleString()} HTG
                        </div>
                    )}
                </div>

                {/* Coupon */}
                <div>
                    <button
                        onClick={() => setShowCoupon(!showCoupon)}
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                        <Tag className="w-4 h-4" />
                        Ajouter un code promo
                        <ChevronDown className={`w-4 h-4 transition-transform ${showCoupon ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showCoupon && (
                        <div className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder="Code promo"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                onClick={handleApplyCoupon}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                            >
                                Appliquer
                            </button>
                        </div>
                    )}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleBuyNow}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Acheter maintenant
                    </button>
                    
                    <button
                        onClick={handleAddToCart}
                        className="w-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold py-3 rounded-xl transition-colors"
                    >
                        Ajouter au panier
                    </button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Shield className="w-4 h-4 text-green-500" />
                        Paiement sécurisé
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <RefreshCcw className="w-4 h-4 text-blue-500" />
                        Garantie 30 jours
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Infinity className="w-4 h-4 text-purple-500" />
                        Accès à vie
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <HeadphonesIcon className="w-4 h-4 text-amber-500" />
                        Support inclus
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="text-center pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Paiements acceptés:</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">MonCash</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded">NatCash</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs font-bold rounded">Carte</span>
                    </div>
                </div>
            </div>

            {/* Gift Option */}
            <div className="bg-amber-50 border-t border-amber-200 px-6 py-4">
                <button className="flex items-center justify-center gap-2 w-full text-amber-700 font-medium text-sm hover:text-amber-800">
                    <Gift className="w-4 h-4" />
                    Offrir ce produit
                </button>
            </div>
        </div>
    );
};

export default DigitalBuyBox;
