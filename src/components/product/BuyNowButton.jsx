/**
 * BuyNowButton - Inspiré Amazon One-Click
 * Achat immédiat avec confirmation rapide
 */

import React, { useState } from 'react';
import { Zap, Loader, Check, CreditCard, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const BuyNowButton = ({ 
    product, 
    quantity = 1,
    variant = "primary", // primary, compact
    className = "" 
}) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { addToCart, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleBuyNow = async () => {
        if (!currentUser) {
            // Redirect to login with return URL
            navigate(`/login?redirect=/product/${product.id}&action=buy`);
            return;
        }

        if (variant === 'primary') {
            setShowConfirm(true);
        } else {
            executeBuy();
        }
    };

    const executeBuy = () => {
        setLoading(true);
        
        // Clear cart and add only this product
        clearCart();
        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }
        
        // Small delay for UX feedback
        setTimeout(() => {
            setLoading(false);
            navigate('/checkout');
        }, 500);
    };

    const totalPrice = product.price * quantity;

    // Confirmation Modal
    if (showConfirm) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(false)} />
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8 text-gold-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Achat Express</h3>
                        <p className="text-gray-600">Confirmez votre achat immédiat</p>
                    </div>

                    {/* Product Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="flex gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">{product.title?.charAt(0) || '📦'}</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 line-clamp-2">{product.title}</p>
                                <p className="text-sm text-gray-500">Qté: {quantity}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-gray-900">{totalPrice.toLocaleString()} HTG</p>
                            </div>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center justify-center gap-4 mb-6 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            Paiement sécurisé
                        </span>
                        <span className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            MonCash / NatCash
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={executeBuy}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-primary-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Confirmer
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Button
    return (
        <button
            onClick={handleBuyNow}
            disabled={loading}
            className={`
                ${variant === 'primary' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-4 px-8 text-lg' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 text-sm'
                }
                font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50
                ${className}
            `}
        >
            {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    <Zap className={variant === 'primary' ? 'w-6 h-6' : 'w-4 h-4'} />
                    {variant === 'primary' ? 'Acheter maintenant' : 'Achat express'}
                </>
            )}
        </button>
    );
};

export default BuyNowButton;
