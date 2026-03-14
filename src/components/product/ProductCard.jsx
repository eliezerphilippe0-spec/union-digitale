import React from 'react';
import { Star, ShoppingCart, Heart, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/Toast';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { t } = useLanguage();
    const toast = useToast();

    const handleToggleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(product.id);

        if (toast) {
            if (isFavorite(product.id)) {
                toast.info(t('removed_from_favorites') || 'Retiré des favoris');
            } else {
                toast.success(t('added_to_favorites') || 'Ajouté aux favoris');
            }
        }
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);

        if (toast) {
            toast.success(`${product.title} ${t('added_to_cart') || 'ajouté au panier'} !`);
        }
    };

    const discountPercentage = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    return (
        <div
            onClick={() => navigate(`/product/${product.id}`)}
            className="group bg-white rounded-xl border border-gray-200 hover:border-primary-400 transition-all duration-200 overflow-hidden flex flex-col h-full cursor-pointer"
        >
            {/* Image Container - Fixed Aspect Ratio */}
            <div className="relative aspect-square w-full bg-white p-2">
                {((product.images && product.images[0]) || product.image) ? (
                    <img
                        src={(product.images && product.images[0]) || product.image}
                        alt={product.title}
                        loading="lazy"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                        <span className="text-gray-300 text-4xl font-bold opacity-30">
                            {product.title?.charAt(0) || 'P'}
                        </span>
                    </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
                    {product.isSponsored && (
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                            Sponsorisé
                        </span>
                    )}
                    {discountPercentage > 0 && (
                        <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                            -{discountPercentage}%
                        </span>
                    )}
                </div>

                {/* Favorite Button */}
                <button
                    onClick={handleToggleFavorite}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white border border-gray-200 hover:border-gray-300 transition-colors z-10"
                    aria-label={isFavorite(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                    <Heart
                        className={`w-4 h-4 transition-colors ${isFavorite(product.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-400 hover:text-red-500'
                            }`}
                    />
                </button>
            </div>

            {/* Product Info */}
            <div className="p-3 flex-1 flex flex-col border-t border-gray-100">
                {/* Title */}
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm leading-tight group-hover:text-primary-600 transition-colors">
                    {product.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                    <div className="flex text-gold-400">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-3 h-3 ${i < (product.rating || 4) ? 'fill-current' : 'text-gray-200'}`}
                            />
                        ))}
                    </div>
                    <span className="text-[11px] text-gray-500">
                        ({product.reviews || Math.floor(Math.random() * 500 + 10)})
                    </span>
                </div>

                {/* Price Box */}
                <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold text-gray-900">
                            {product.price.toLocaleString()} <span className="text-sm font-normal">HTG</span>
                        </span>
                    </div>
                    {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[11px] text-gray-500 line-through block mb-2">
                            {product.originalPrice.toLocaleString()} HTG
                        </span>
                    )}

                    {/* Union Plus & Delivery */}
                    {product.unionPlus ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-primary-700 mb-2">
                            <span className="bg-primary-100 px-1 rounded text-primary-800 italic">Union Plus</span>
                            <span className="text-gray-500 font-normal">Livraison GRATUITE</span>
                        </div>
                    ) : (
                        <p className="text-[11px] text-gray-500 mb-2">Livraison rapide disponible</p>
                    )}

                    {/* Add to Cart Button (Hover on Desktop, Fixed on Mobile) */}
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 border border-primary-200 hover:border-primary-600"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Ajouter</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
