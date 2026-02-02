import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { Star, Filter, Loader } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';

const Catalog = ({ predefinedFilter }) => {
    const { t } = useLanguage();
    const { category } = useParams(); // Get category keyword from URL
    const { products, loading, error } = useProducts({ useCache: false }); // Disable cache for fresh data
    const [priceRange, setPriceRange] = useState(75000);
    const [selectedRating, setSelectedRating] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(category || 'All');

    // Update selectedCategory if URL param changes
    useEffect(() => {
        if (category) setSelectedCategory(category);
    }, [category]);

    // Filter Logic
    const filteredProducts = products.filter(product => {
        const matchesPrice = product.price <= priceRange;
        const matchesRating = product.rating >= selectedRating;

        let matchesCategory = true;
        if (predefinedFilter) {
            // Special logic for "Union Basics" or "Flash Sales"
            if (predefinedFilter === 'Union DH') {
                matchesCategory = product.brand === 'Union DH' || product.title.includes('Union DH');
            } else if (predefinedFilter === 'Flash Sales') {
                matchesCategory = product.isOnFlashSale;
            } else if (predefinedFilter === 'New Arrivals') {
                matchesCategory = true;
            } else if (predefinedFilter === 'Best Sellers') {
                matchesCategory = true; // Logic handled in sort
            }
        } else if (category) {
            // Dynamic specific category from URL
            matchesCategory =
                product.category === category ||
                (product.tags && product.tags.includes(category)) ||
                product.type === category;
            // Fallback to title search if no metadata match
            if (!matchesCategory) matchesCategory = product.title.toLowerCase().includes(category.toLowerCase());
        } else {
            matchesCategory = selectedCategory === 'All' || product.title.includes(selectedCategory);
        }

        return matchesPrice && matchesRating && matchesCategory;
    });

    // Special sorting for New Arrivals if needed
    if (predefinedFilter === 'New Arrivals') {
        filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin w-8 h-8 text-secondary" /></div>;
    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin w-8 h-8 text-secondary" /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{t('error_loading_products')}</div>;

    const pageTitle = predefinedFilter ? `${predefinedFilter} | ${t('catalog_general')}` : (category ? `${category} | ${t('catalog_general')}` : t('catalog_general'));

    return (
        <div className="bg-background min-h-screen py-8">
            <SEO
                title={pageTitle}
                description="Parcourez notre large sélection de produits : High-Tech, Maison, Mode et plus encore sur Union Digitale."
            />
            <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-64 flex-shrink-0 space-y-8 bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm dark:shadow-none">
                    <div>
                        <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-white">{t('filters_categories')}</h3>
                        <ul className="space-y-2 text-sm">
                            {['All', 'electronics', 'local', 'energy', 'education', 'clothing', 'furniture', 'food', 'crafts'].map(cat => (
                                <li key={cat}>
                                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-200 hover:text-secondary dark:hover:text-secondary">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={selectedCategory === cat}
                                            onChange={() => setSelectedCategory(cat)}
                                            className="text-secondary focus:ring-secondary"
                                        />
                                        {cat === 'All' ? t('all') : (t(cat) || cat)}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-white">{t('filters_max_price')}</h3>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">0 G</span>
                            <input
                                type="range"
                                min="0"
                                max="150000"
                                value={priceRange}
                                onChange={(e) => setPriceRange(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-secondary"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-300">150k G</span>
                        </div>
                        <div className="text-center font-bold text-secondary">{priceRange.toLocaleString()} G</div>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-white">{t('filters_reviews')}</h3>
                        <ul className="space-y-2">
                            {[4, 3, 2, 1].map(rating => (
                                <li
                                    key={rating}
                                    className={`flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 p-1 rounded ${selectedRating === rating ? 'bg-gray-100 dark:bg-neutral-700 font-bold' : ''}`}
                                    onClick={() => setSelectedRating(rating)}
                                >
                                    <div className="flex text-secondary">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-current' : 'text-gray-300 dark:text-gray-500'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('and_more')}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Product Grid */}
                <main className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">{t('results_count')} ({filteredProducts.length})</h1>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">{t('sort_by')}</span>
                            <select className="border border-gray-300 rounded p-1 focus:outline-none focus:border-secondary">
                                <option>{t('sort_featured')}</option>
                                <option>{t('sort_price_asc')}</option>
                                <option>{t('sort_price_desc')}</option>
                                <option>{t('sort_rating')}</option>
                            </select>
                        </div>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            {t('no_products_found')}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Catalog;
