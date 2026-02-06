import React, { useState, useEffect } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useToast } from './ui/Toast';

const StickyAddToCart = ({ product }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const toast = useToast();

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past the main product section (roughly 400px)
            setIsVisible(window.scrollY > 400);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleAddToCart = () => {
        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }
        if (toast) {
            toast.success(`${quantity}x ${product.title} ajouté au panier !`);
        }
        setQuantity(1);
    };

    if (!isVisible || !product) return null;

    return (
        <div className="fixed bottom-16 left-0 right-0 z-40 lg:hidden animate-slide-up">
            <div className="bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700 shadow-2xl px-4 py-3 safe-area-bottom">
                <div className="flex items-center gap-3">
                    {/* Price */}
                    <div className="flex-shrink-0">
                        <div className="text-lg font-bold text-primary-900 dark:text-white">
                            {product.price?.toLocaleString()} G
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <div className="text-xs text-gray-500 line-through">
                                {product.originalPrice.toLocaleString()} G
                            </div>
                        )}
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-700 rounded-lg px-2 py-1">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-medium">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-primary-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Ajouter</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StickyAddToCart;
