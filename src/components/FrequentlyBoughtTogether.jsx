/**
 * FrequentlyBoughtTogether - Inspiré Amazon
 * "Achetés ensemble fréquemment" bundle avec réduction
 */

import React, { useState } from 'react';
import { Plus, Check, ShoppingCart, Sparkles } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useToast } from './ui/Toast';

const FrequentlyBoughtTogether = ({ mainProduct, relatedProducts = [] }) => {
    const { addToCart } = useCart();
    const toast = useToast();
    const [selectedProducts, setSelectedProducts] = useState(
        [mainProduct.id, ...relatedProducts.slice(0, 2).map(p => p.id)]
    );

    // Take max 2 related products
    const bundleProducts = [mainProduct, ...relatedProducts.slice(0, 2)];
    
    const toggleProduct = (productId) => {
        if (productId === mainProduct.id) return; // Can't deselect main product
        setSelectedProducts(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const selectedItems = bundleProducts.filter(p => selectedProducts.includes(p.id));
    const totalPrice = selectedItems.reduce((sum, p) => sum + p.price, 0);
    const bundleDiscount = selectedItems.length >= 3 ? 0.10 : selectedItems.length >= 2 ? 0.05 : 0;
    const discountedPrice = totalPrice * (1 - bundleDiscount);
    const savings = totalPrice - discountedPrice;

    const handleAddBundle = () => {
        selectedItems.forEach(product => addToCart(product));
        toast?.success(`${selectedItems.length} articles ajoutés au panier!`);
    };

    if (relatedProducts.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 my-6">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900">Fréquemment achetés ensemble</h3>
                {bundleDiscount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        -{Math.round(bundleDiscount * 100)}% BUNDLE
                    </span>
                )}
            </div>

            {/* Products Row */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4">
                {bundleProducts.map((product, idx) => (
                    <React.Fragment key={product.id}>
                        {/* Product Card */}
                        <button
                            onClick={() => toggleProduct(product.id)}
                            disabled={product.id === mainProduct.id}
                            className={`relative flex-shrink-0 w-32 p-3 rounded-xl border-2 transition-all ${
                                selectedProducts.includes(product.id)
                                    ? 'border-amber-400 bg-white shadow-md'
                                    : 'border-gray-200 bg-white/50 opacity-60'
                            } ${product.id === mainProduct.id ? 'cursor-default' : 'cursor-pointer hover:border-amber-300'}`}
                        >
                            {/* Checkbox */}
                            <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedProducts.includes(product.id)
                                    ? 'bg-amber-500 border-amber-500 text-white'
                                    : 'border-gray-300 bg-white'
                            }`}>
                                {selectedProducts.includes(product.id) && <Check className="w-3 h-3" />}
                            </div>

                            {/* Product Image */}
                            <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                                <span className="text-3xl">{product.title?.charAt(0) || '📦'}</span>
                            </div>

                            {/* Product Info */}
                            <p className="text-xs text-gray-700 line-clamp-2 mb-1 font-medium">{product.title}</p>
                            <p className="text-sm font-bold text-gray-900">{product.price?.toLocaleString()} HTG</p>

                            {product.id === mainProduct.id && (
                                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    CE PRODUIT
                                </span>
                            )}
                        </button>

                        {/* Plus Sign */}
                        {idx < bundleProducts.length - 1 && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <Plus className="w-4 h-4 text-amber-600" />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Bundle Summary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-amber-200">
                <div>
                    <p className="text-sm text-gray-600">
                        Prix total pour {selectedItems.length} article{selectedItems.length > 1 ? 's' : ''}:
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900">
                            {Math.round(discountedPrice).toLocaleString()} HTG
                        </span>
                        {savings > 0 && (
                            <>
                                <span className="text-lg text-gray-400 line-through">
                                    {totalPrice.toLocaleString()} HTG
                                </span>
                                <span className="text-sm font-bold text-green-600">
                                    Économisez {Math.round(savings).toLocaleString()} HTG
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleAddBundle}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                    <ShoppingCart className="w-5 h-5" />
                    Ajouter les {selectedItems.length} au panier
                </button>
            </div>
        </div>
    );
};

export default FrequentlyBoughtTogether;
