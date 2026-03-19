import React from 'react';
import { Star, ShoppingCart, Heart, Zap, Eye, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { getTierBadge } from '../services/reputationService';
import { useFavorites } from '../contexts/FavoritesContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from './ui/Toast';
import Badge from './ui/Badge';

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
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ 
                y: -8,
                transition: { duration: 0.3, ease: "easeOut" }
            }}
            onClick={() => navigate(`/product/${product.id}`)}
            className="
                luxury-card
                group
                bg-white
                rounded-2xl
                border border-neutral-100
                hover:border-blue-500/20
                shadow-luxury-sm
                hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]
                transition-all duration-300
                overflow-hidden
                flex flex-col
                h-full
                cursor-pointer
            "
        >
            {/* Image Container */}
            <div className="relative h-60 bg-neutral-50 overflow-hidden group-hover:bg-neutral-100 transition-colors duration-500">
                {/* Product Image with lazy loading */}
                {product.image ? (
                    <motion.img
                        src={product.image}
                        alt={product.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                    />
                ) : (
                    /* Placeholder Image */
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-neutral-300 text-6xl font-black opacity-20">
                            {product.title?.charAt(0) || 'P'}
                        </span>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
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
                    {product.zabelyPlus && (
                        <Badge variant="premium" size="sm">
                            Zabely Plus
                        </Badge>
                    )}
                    {product.vendorTier && product.vendorTier !== 'bronze' && (
                        <Badge variant="gold" size="sm" icon={Award}>
                            {getTierBadge(product.vendorTier).label}
                        </Badge>
                    )}
                </div>

                {/* Favorite Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggleFavorite}
                    className="
                        absolute top-4 right-4
                        p-2.5
                        rounded-full
                        bg-white/95 backdrop-blur-md
                        shadow-lg
                        border border-neutral-100
                        z-10
                    "
                    aria-label={isFavorite(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                    <Heart
                        className={`w-5 h-5 transition-colors ${isFavorite(product.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-neutral-400 hover:text-red-500'
                            }`}
                    />
                </motion.button>

                {/* Quick Actions Overlay */}
                <div className="
                    absolute inset-x-0 bottom-0
                    bg-gradient-to-t from-black/80 via-black/40 to-transparent
                    flex items-end justify-center gap-2
                    pb-6 px-4
                    opacity-0 group-hover:opacity-100
                    transition-all duration-400 translate-y-4 group-hover:translate-y-0
                    backdrop-blur-[2px]
                ">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/product/${product.id}`);
                        }}
                        className="
                            bg-white
                            text-gray-900
                            font-black
                            text-[10px]
                            uppercase
                            tracking-widest
                            py-3 px-4
                            rounded-xl
                            flex items-center gap-2
                            shadow-2xl
                        "
                    >
                        <Eye className="w-4 h-4" />
                        {t('quick_view') || 'Aperçu'}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddToCart}
                        className="
                            bg-blue-600
                            hover:bg-blue-700
                            text-white
                            font-black
                            text-[10px]
                            uppercase
                            tracking-widest
                            py-3 px-4
                            rounded-xl
                            flex items-center gap-2
                            shadow-2xl shadow-blue-500/20
                        "
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {t('add') || 'Ajouter'}
                    </motion.button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col bg-white">
                {/* Title */}
                <h3 className="
                    font-black
                    text-gray-900
                    mb-2
                    line-clamp-2
                    group-hover:text-blue-600
                    transition-colors
                    leading-tight
                    min-h-[2.5rem]
                    text-base
                ">
                    {product.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < product.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-neutral-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        ({product.reviews || 0} avis)
                    </span>
                </div>

                {/* Price */}
                <div className="mt-auto">
                    <div className="flex items-end gap-2 mb-2">
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-2xl font-black text-gray-900">
                                {product.price.toLocaleString()}
                            </span>
                            <span className="text-xs font-black text-gray-900 uppercase">
                                $
                            </span>
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-400 line-through font-bold mb-0.5">
                                {product.originalPrice.toLocaleString()} $
                            </span>
                        )}
                    </div>

                    {/* Features row */}
                    <div className="flex items-center gap-3 pt-4 border-t border-neutral-50">
                        {product.zabelyPlus && (
                            <div className="flex items-center gap-1.5 text-[9px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">
                                <Zap className="w-3 h-3 fill-current" />
                                <span>Livraison 24h</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[9px] text-green-600 font-black uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg">
                            <span>Garantie</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
