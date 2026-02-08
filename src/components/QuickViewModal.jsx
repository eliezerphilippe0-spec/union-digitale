/**
 * QuickViewModal - P2 Fix: Aperçu rapide produit
 * Modal avec infos essentielles sans quitter la page
 */

import React, { useState } from 'react';
import { X, Star, ShoppingCart, Heart, Truck, Shield, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNavigate } from 'react-router-dom';

const QuickViewModal = ({ product, isOpen, onClose }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);

    if (!isOpen || !product) return null;

    const images = product.images?.length > 0 ? product.images : [product.image];
    const discountPercentage = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const handleAddToCart = () => {
        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="grid md:grid-cols-2 gap-0">
                    {/* Image Section */}
                    <div className="relative bg-gray-100 aspect-square md:aspect-auto md:h-[500px]">
                        {/* Main Image */}
                        <div className="w-full h-full flex items-center justify-center p-8">
                            <span className="text-8xl text-gray-300">
                                {product.title?.charAt(0) || '📦'}
                            </span>
                        </div>

                        {/* Discount Badge */}
                        {discountPercentage > 0 && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                -{discountPercentage}%
                            </div>
                        )}

                        {/* Image Navigation */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveImage(prev => prev > 0 ? prev - 1 : images.length - 1)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg hover:bg-white"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setActiveImage(prev => prev < images.length - 1 ? prev + 1 : 0)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg hover:bg-white"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                                
                                {/* Dots */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${
                                                idx === activeImage ? 'bg-gold-500 w-6' : 'bg-white/60'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="p-6 md:p-8 flex flex-col">
                        {/* Brand */}
                        <span className="text-sm text-gold-600 font-medium mb-1">{product.brand}</span>
                        
                        {/* Title */}
                        <h2 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">
                            {product.title}
                        </h2>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-gold-500 fill-gold-500' : 'text-gray-300'}`} 
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-600">
                                {product.rating} ({product.reviews || 0} avis)
                            </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-3xl font-black text-gray-900">
                                {product.price?.toLocaleString()} HTG
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-lg text-gray-400 line-through">
                                    {product.originalPrice.toLocaleString()} HTG
                                </span>
                            )}
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Truck className="w-4 h-4 text-green-600" />
                                Livraison rapide
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Shield className="w-4 h-4 text-blue-600" />
                                Garantie 30 jours
                            </div>
                        </div>

                        {/* Features Preview */}
                        {product.features && (
                            <ul className="text-sm text-gray-600 space-y-1 mb-6 flex-1">
                                {product.features.slice(0, 3).map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        <span className="line-clamp-1">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Quantity & Actions */}
                        <div className="mt-auto space-y-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">Quantité:</span>
                                <div className="flex items-center border border-gray-300 rounded-lg">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="p-2 hover:bg-gray-100 transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-12 text-center font-medium">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="p-2 hover:bg-gray-100 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-primary-900 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    Ajouter au panier
                                </button>
                                <button
                                    onClick={() => toggleFavorite(product.id)}
                                    className={`p-3 rounded-xl border-2 transition-all ${
                                        isFavorite(product.id)
                                            ? 'bg-red-50 border-red-200 text-red-500'
                                            : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500'
                                    }`}
                                >
                                    <Heart className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                                </button>
                            </div>

                            {/* View Full Details */}
                            <button
                                onClick={() => { onClose(); navigate(`/product/${product.id}`); }}
                                className="w-full text-center text-sm text-gold-600 hover:text-gold-700 font-medium py-2 hover:underline"
                            >
                                Voir tous les détails →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickViewModal;
