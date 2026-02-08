import React, { useState, useEffect } from 'react';
import ProductCard from '../components/product/ProductCard';
import QuickViewModal from '../components/product/QuickViewModal';
import { useProducts } from '../hooks/useProducts';
import { Star, Filter, Loader, X, SlidersHorizontal, Grid, List } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/common/SEO';
import { ProductGridSkeleton } from '../components/ui/Skeleton';

const Catalog = ({ predefinedFilter }) => {
    const { t } = useLanguage();
    const { category } = useParams();
    const { products, loading, error } = useProducts({ useCache: false });
    const [priceRange, setPriceRange] = useState(75000);
    const [selectedRating, setSelectedRating] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(category || 'All');
    const [sortBy, setSortBy] = useState('featured');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [quickViewProduct, setQuickViewProduct] = useState(null); // QuickView integration

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

    // Apply sorting
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price_asc':
                return a.price - b.price;
            case 'price_desc':
                return b.price - a.price;
            case 'rating':
                return b.rating - a.rating;
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'featured':
            default:
                // Featured: prioritize sponsored, then by rating
                if (a.isSponsored && !b.isSponsored) return -1;
                if (!a.isSponsored && b.isSponsored) return 1;
                return b.rating - a.rating;
        }
    });

    // Special sorting for predefined filters
    if (predefinedFilter === 'New Arrivals') {
        sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (predefinedFilter === 'Best Sellers') {
        sortedProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
    }

    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{t('error_loading_products')}</div>;

    const pageTitle = predefinedFilter ? `${predefinedFilter} | ${t('catalog_general')}` : (category ? `${category} | ${t('catalog_general')}` : t('catalog_general'));

    // Filter sidebar content (reusable for both desktop and mobile)
    const FilterContent = () => (
        <div className="space-y-8">
            <div>
                <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-white">{t('filters_categories') || 'Catégories'}</h3>
                <ul className="space-y-2 text-sm">
                    {['All', 'electronics', 'local', 'energy', 'education', 'clothing', 'furniture', 'food', 'crafts'].map(cat => (
                        <li key={cat}>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-200 hover:text-secondary dark:hover:text-secondary">
                                <input
                                    type="radio"
                                    name="category"
                                    checked={selectedCategory === cat}
                                    onChange={() => {
                                        setSelectedCategory(cat);
                                        setShowMobileFilters(false);
                                    }}
                                    className="text-secondary focus:ring-secondary"
                                />
                                {cat === 'All' ? (t('all') || 'Tout') : (t(cat) || cat)}
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-white">{t('filters_max_price') || 'Prix maximum'}</h3>
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
                <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-white">{t('filters_reviews') || 'Avis clients'}</h3>
                <ul className="space-y-2">
                    {[4, 3, 2, 1, 0].map(rating => (
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
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {rating === 0 ? (t('all') || 'Tous') : (t('and_more') || '& plus')}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Clear Filters */}
            <button
                onClick={() => {
                    setSelectedCategory('All');
                    setPriceRange(75000);
                    setSelectedRating(0);
                    setShowMobileFilters(false);
                }}
                className="w-full py-2 text-sm text-gray-600 hover:text-secondary border border-gray-300 rounded-lg hover:border-secondary transition-colors"
            >
                {t('clear_filters') || 'Réinitialiser les filtres'}
            </button>
        </div>
    );

    return (
        <div className="bg-background min-h-screen py-8">
            <SEO
                title={pageTitle}
                description="Parcourez notre large sélection de produits : High-Tech, Maison, Mode et plus encore sur Union Digitale."
            />

            {/* Mobile Filter Drawer */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/50" 
                        onClick={() => setShowMobileFilters(false)}
                    />
                    {/* Drawer */}
                    <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-neutral-800 shadow-xl overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 p-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold">{t('filters') || 'Filtres'}</h2>
                            <button 
                                onClick={() => setShowMobileFilters(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <FilterContent />
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8">
                {/* Desktop Sidebar Filters */}
                <aside className="hidden lg:block w-64 flex-shrink-0 bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm dark:shadow-none h-fit sticky top-24">
                    <FilterContent />
                </aside>

                {/* Product Grid */}
                <main className="flex-1">
                    
                    {/* 📱 STICKY FILTERS MOBILE - P2 FIX */}
                    <div className="lg:hidden sticky top-16 z-30 -mx-4 px-4 py-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-gray-200 dark:border-neutral-700 mb-4 -mt-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {/* Filter button */}
                            <button
                                onClick={() => setShowMobileFilters(true)}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-medium"
                            >
                                <Filter className="w-4 h-4" />
                                Filtres
                            </button>
                            
                            {/* Sort chip */}
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex-shrink-0 px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-gold-500"
                            >
                                <option value="featured">Populaires</option>
                                <option value="newest">Nouveaux</option>
                                <option value="price_asc">Prix ↑</option>
                                <option value="price_desc">Prix ↓</option>
                                <option value="rating">Notes</option>
                            </select>
                            
                            {/* Quick category chips */}
                            {['All', 'electronics', 'local', 'fashion'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                                        selectedCategory === cat
                                            ? 'bg-gold-500 text-primary-900'
                                            : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {cat === 'All' ? 'Tout' : cat === 'electronics' ? '📱 High-Tech' : cat === 'local' ? '🇭🇹 Local' : '👗 Mode'}
                                </button>
                            ))}
                            
                            {/* Active filters indicator */}
                            {(selectedRating > 0 || priceRange < 75000 || selectedCategory !== 'All') && (
                                <button
                                    onClick={() => { setSelectedCategory('All'); setPriceRange(75000); setSelectedRating(0); }}
                                    className="flex-shrink-0 px-3 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                                >
                                    ✕ Effacer
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Header with filters, sort, and view toggle */}
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-bold">
                                {t('results_count') || 'Résultats'} ({sortedProducts.length})
                            </h1>
                            
                            {/* Mobile Filter Button */}
                            <button
                                onClick={() => setShowMobileFilters(true)}
                                className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-sm font-medium hover:border-secondary transition-colors"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                {t('filters') || 'Filtres'}
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Toggle */}
                            <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-neutral-700 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-600 shadow-sm' : ''}`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-neutral-600 shadow-sm' : ''}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 hidden sm:inline">{t('sort_by') || 'Trier par'}</span>
                                <select 
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 rounded-lg px-3 py-2 focus:outline-none focus:border-secondary text-sm"
                                >
                                    <option value="featured">{t('sort_featured') || 'Mis en avant'}</option>
                                    <option value="newest">{t('sort_newest') || 'Nouveautés'}</option>
                                    <option value="price_asc">{t('sort_price_asc') || 'Prix croissant'}</option>
                                    <option value="price_desc">{t('sort_price_desc') || 'Prix décroissant'}</option>
                                    <option value="rating">{t('sort_rating') || 'Meilleures notes'}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters Tags */}
                    {(selectedCategory !== 'All' || selectedRating > 0 || priceRange < 75000) && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedCategory !== 'All' && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
                                    {t(selectedCategory) || selectedCategory}
                                    <button onClick={() => setSelectedCategory('All')} className="hover:text-secondary-hover">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {selectedRating > 0 && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
                                    {selectedRating}★ & plus
                                    <button onClick={() => setSelectedRating(0)} className="hover:text-secondary-hover">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {priceRange < 75000 && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
                                    Max {priceRange.toLocaleString()} G
                                    <button onClick={() => setPriceRange(75000)} className="hover:text-secondary-hover">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <ProductGridSkeleton count={8} />
                    ) : sortedProducts.length > 0 ? (
                        <div className={
                            viewMode === 'grid' 
                                ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
                                : "flex flex-col gap-4"
                        }>
                            {sortedProducts.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    onQuickView={() => setQuickViewProduct(product)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {t('no_products_found') || 'Aucun produit trouvé'}
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Essayez de modifier vos filtres ou votre recherche
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedCategory('All');
                                    setPriceRange(75000);
                                    setSelectedRating(0);
                                }}
                                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors"
                            >
                                Réinitialiser les filtres
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* QuickView Modal */}
            <QuickViewModal 
                product={quickViewProduct}
                isOpen={!!quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
            />
        </div>
    );
};

export default Catalog;
