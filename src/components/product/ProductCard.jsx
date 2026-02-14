import React from 'react';
import { Star, ShoppingCart, Heart, Zap, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/Toast';
import Badge from '../ui/Badge';

const ProductCard = ({ product, onQuickView }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { t } = useLanguage();
    const toast = useToast();

    const handleQuickView = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuickView) {
            onQuickView(product);
        } else {
            navigate(`/product/${product.id}`);
        }
    };

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
            className="
                luxury-card
                group
                bg-white
                rounded-xl
                border border-neutral-200
                hover:border-gold-400/30
                shadow-luxury-sm
                hover:shadow-luxury-xl
                transition-all duration-500
                overflow-hidden
                flex flex-col
                h-full
                cursor-pointer
            "
        >
            {/* Image Container */}
            <div className="relative h-36 sm:h-44 md:h-52 bg-neutral-100 overflow-hidden aspect-square group-hover:bg-neutral-50 transition-colors duration-500">
                {/* Product Image */}
                {((product.images && product.images[0]) || product.image) ? (
                    <img
                        src={(product.images && product.images[0]) || product.image}
                        alt={product.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                        <span className="text-neutral-300 text-6xl font-bold opacity-20">
                            {product.title?.charAt(0) || 'P'}
                        </span>
                    </div>
                )}

                {/* Shimmer Effect Overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{
                            animation: 'shimmer 2s infinite',
                            backgroundSize: '200% 100%'
                        }}
                    />
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {product.isSponsored && (
                        <Badge variant="gold" size="sm" icon={Zap}>
                            {t('sponsored') || 'Sponsorisé'}
                        </Badge>
                    )}
                    {discountPercentage > 0 && (
                        <Badge variant="error" size="sm">
                            -{discountPercentage}%
                        </Badge>
                    )}
                    {product.unionPlus && (
                        <Badge variant="premium" size="sm">
                            Union Plus
                        </Badge>
                    )}
                </div>

                {/* Favorite Button */}
                <button
                    onClick={handleToggleFavorite}
                    className="
                        absolute top-3 right-3
                        p-2.5
                        rounded-full
                        bg-white/90 backdrop-blur-sm
                        hover:bg-white
                        shadow-md
                        transition-all
                        z-10
                        hover:scale-110
                    "
                    aria-label={isFavorite(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                    <Heart
                        className={`w-5 h-5 transition-colors ${isFavorite(product.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-neutral-400 hover:text-red-500'
                            }`}
                    />
                </button>

                {/* Quick Actions Overlay (desktop hover) */}
                <div className="
                    absolute inset-0
                    bg-gradient-to-t from-black/70 via-black/30 to-transparent
                    hidden sm:flex items-end justify-center gap-2
                    pb-4 px-4
                    opacity-0 group-hover:opacity-100
                    transition-all duration-500
                    backdrop-blur-[2px]
                ">
                    <button
                        onClick={handleQuickView}
                        className="
                            glass-premium
                            hover:bg-white/90
                            text-primary-900
                            font-semibold
                            py-3 px-5
                            rounded-lg
                            flex items-center gap-2
                            shadow-luxury-md
                            transform translate-y-4 group-hover:translate-y-0
                            transition-all duration-500
                            hover:scale-105
                            btn-press
                        "
                        aria-label="Aperçu rapide du produit"
                    >
                        <Eye className="w-5 h-5" />
                        {t('quick_view') || 'Aperçu'}
                    </button>
                    <button
                        onClick={handleAddToCart}
                        className="
                            bg-gradient-to-r from-accent-600 to-accent-700
                            hover:from-accent-700 hover:to-accent-800
                            text-white
                            font-semibold
                            py-3 px-5
                            rounded-lg
                            flex items-center gap-2
                            shadow-luxury-md
                            hover:shadow-gold-glow
                            transform translate-y-4 group-hover:translate-y-0
                            transition-all duration-500
                            hover:scale-105
                            btn-press
                        "
                        aria-label="Ajouter au panier"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {t('add') || 'Ajouter'}
                    </button>
                </div>

                {/* Mobile primary action */}
                <button
                    onClick={handleAddToCart}
                    className="sm:hidden absolute bottom-3 left-3 right-3 bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold py-2 rounded-lg shadow-md"
                    aria-label="Ajouter au panier"
                >
                    {t('add') || 'Ajouter'}
                </button>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 flex-1 flex flex-col">
                {/* Title */}
                <h3 className="
                    font-semibold
                    text-primary-900
                    mb-1 sm:mb-2
                    line-clamp-2
                    group-hover:text-accent-600
                    transition-colors
                    leading-snug
                    text-sm sm:text-base
                    min-h-[2.5rem] sm:min-h-[3rem]
                ">
                    {product.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3 min-h-[18px] sm:min-h-[20px]">
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-3 h-3 sm:w-4 sm:h-4 ${i < product.rating
                                    ? 'fill-gold-500 text-gold-500'
                                    : 'text-neutral-300'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-xs sm:text-sm text-neutral-600">
                        ({product.reviews || 0})
                    </span>
                </div>

                {/* Price */}
                <div className="mt-auto">
                    <div className="flex flex-wrap items-baseline gap-1 sm:gap-2 mb-1 min-h-[24px] sm:min-h-[32px]">
                        <div className="flex items-baseline">
                            <span className="text-lg sm:text-2xl font-bold text-primary-900">
                                {product.price.toLocaleString()}
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-neutral-600 ml-0.5 sm:ml-1">
                                G
                            </span>
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs sm:text-sm text-neutral-500 line-through">
                                {product.originalPrice.toLocaleString()} G
                            </span>
                        )}
                    </div>

                    {/* Union Plus Badge */}
                    {product.unionPlus && (
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-primary-700 font-medium">
                            <Zap className="w-3.5 h-3.5 text-gold-600" />
                            <span>{t('one_day_delivery') || 'Livraison 1 jour'}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
