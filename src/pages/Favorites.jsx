import React from 'react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useLanguage } from '../contexts/LanguageContext';
import { products } from '../data/products';
import ProductCard from '../components/product/ProductCard';
import { Heart } from 'lucide-react';

const Favorites = () => {
    const { favorites, loading } = useFavorites();
    const { t } = useLanguage();

    const favoriteProducts = products.filter(p => favorites.includes(p.id));

    if (loading) {
        return <div className="p-8 text-center">{t('loading')}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <Heart className="fill-red-500 text-red-500" /> {t('my_favorites')}
            </h1>

            {favoriteProducts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{t('empty_favorites_title')}</h2>
                    <p className="text-gray-500">{t('empty_favorites_desc')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {favoriteProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Favorites;
