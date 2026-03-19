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
    const [selectedCategory, setSelectedCategory] = useState(category || 'all');
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [onlyInStock, setOnlyInStock] = useState(false);
    const [sortBy, setSortBy] = useState('featured');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [quickViewProduct, setQuickViewProduct] = useState(null); // QuickView integration

    // Dynamic brand extraction
    const allBrands = [...new Set(products.map(p => p.brand))].filter(Boolean);

    // Update selectedCategory if URL param changes
    useEffect(() => {
        if (category) setSelectedCategory(category);
    }, [category]);

    // Filter Logic
    const filteredProducts = products.filter(product => {
        const matchesPrice = product.price <= priceRange;
        const matchesRating = product.rating >= selectedRating;
        const matchesStock = onlyInStock ? product.inStock : true;
        const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);

        let matchesCategory = true;
        if (predefinedFilter) {
            // Special logic for "Union Basics" or "Flash Sales"
            if (predefinedFilter === 'Zabely DH') {
                matchesCategory = product.brand === 'Zabely DH' || product.title.includes('Zabely DH');
            } else if (predefinedFilter === 'Flash Sales') {
                matchesCategory = product.isOnFlashSale;
            } else if (predefinedFilter === 'New Arrivals') {
                matchesCategory = true;
            } else if (predefinedFilter === 'Best Sellers') {
                matchesCategory = true; // Logic handled in sort
            }
        } else if (category && category !== 'All') {
            // Dynamic specific category from URL
            matchesCategory =
                product.category === category ||
                (product.tags && product.tags.includes(category)) ||
                product.type === category;
            // Fallback to title search if no metadata match
            if (!matchesCategory) matchesCategory = product.title.toLowerCase().includes(category.toLowerCase());
        } else {
            matchesCategory = selectedCategory === 'all' || product.title.includes(selectedCategory);
        }

        return matchesPrice && matchesRating && matchesCategory && matchesStock && matchesBrand;
    });

    const resetFilters = () => {
        setPriceRange(150000);
        setSelectedRating(0);
        setSelectedCategory('all');
        setSelectedBrands([]);
        setOnlyInStock(false);
    };

    const toggleBrand = (brand) => {
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

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

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin w-8 h-8 text-secondary" /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{t('error_loading_products')}</div>;

    const pageTitle = predefinedFilter ? `${predefinedFilter} | ${t('catalog_general')}` : (category ? `${category} | ${t('catalog_general')}` : t('catalog_general'));

    // Filter sidebar content (reusable for both desktop and mobile)
    const FilterContent = () => (
        <div className="space-y-8">
            <div>
                <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-white">{t('filters_categories') || 'Catégories'}</h3>
                <ul className="space-y-2 text-sm">
                    {['all', 'electronics', 'local', 'energy', 'education', 'clothing', 'furniture', 'food', 'crafts'].map(cat => (
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
                                {cat === 'all' ? (t('all') || 'Tout') : (t(cat) || cat)}
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
                    setSelectedCategory('all');
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
                title={selectedCategory === 'all' ? 'Catalogue Complet' : (t(selectedCategory.toLowerCase()) || selectedCategory)}
                description={`Découvrez notre sélection de ${selectedCategory === 'all' ? 'tous nos produits' : selectedCategory} sur Zabely Haïti.`}
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
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8">
                {/* Desktop Sidebar Filters */}
                <aside className="hidden lg:block w-72 flex-shrink-0 space-y-8 bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-bold text-xl flex items-center gap-2">
                            <Filter className="w-5 h-5 text-secondary" />
                            {t('filters')}
                        </h2>
                        <button
                            onClick={resetFilters}
                            className="text-xs text-blue-600 hover:underline font-medium"
                        >
                            Réinitialiser
                        </button>
                    </div>

                    <hr className="border-gray-100" />
                    <FilterContent />
                </aside>

                {/* Product Grid */}
                <main className="fl                    {/* Active Filters Bar */}
                    {(selectedCategory !== 'all' || selectedBrands.length > 0 || onlyInStock || selectedRating > 0) && (
                        <div className="flex flex-wrap items-center gap-2 mb-6">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter mr-2">Filtres actifs:</span>
                            {selectedCategory !== 'all' && (
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-1">
                                    Catégorie: {selectedCategory}
                                    <button onClick={() => setSelectedCategory('all')} className="hover:text-red-500">×</button>
                                </span>
                            )}
                            {selectedBrands.map(brand => (
                                <span key={brand} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-100 flex items-center gap-1">
                                    {brand}
                                    <button onClick={() => toggleBrand(brand)} className="hover:text-red-500">×</button>
                                </span>
                            )}
                            {onlyInStock && (
                                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100 flex items-center gap-1">
                                    En Stock
                                    <button onClick={() => setOnlyInStock(false)} className="hover:text-red-500">×</button>
                                </span>
                            )}
                            {selectedRating > 0 && (
                                <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100 flex items-center gap-1">
                                    {selectedRating}+ Étoiles
                                    <button onClick={() => setSelectedRating(0)} className="hover:text-red-500">×</button>
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-10">
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-black text-gray-900 leading-tight">
                                {predefinedFilter || (category && category !== 'all' ? category : 'Tous les produits')}
                            </h1>
                            <p className="text-sm text-gray-500">{sortedProducts.length} articles trouvés</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('sort_by')}</span>
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-white border-none shadow-sm rounded-xl py-2 px-4 focus:ring-2 focus:ring-secondary text-sm font-bold"
                            >
                                <option value="featured">{t('sort_featured')}</option>
                                <option value="newest">{t('sort_newest')}</option>
                                <option value="price_asc">{t('sort_price_asc')}</option>
                                <option value="price_desc">{t('sort_price_desc')}</option>
                                <option value="rating">{t('sort_rating')}</option>
                            </select>
                        </div>
                    </div>
ff466e3334a2b41e0577
                            </select>
                            
                            {/* Quick category chips */}
                            {['all', 'electronics', 'local', 'fashion'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                                        selectedCategory === cat
                                            ? 'bg-gold-500 text-primary-900'
                                            : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {cat === 'all' ? t('catalog_all_label') : cat === 'electronics' ? t('catalog_hightech') : cat === 'local' ? t('catalog_local') : t('catalog_fashion')}
                                </button>
                            ))}
                            
                            {/* Active filters indicator */}
                            {(selectedRating > 0 || priceRange < 75000 || selectedCategory !== 'all') && (
                                <button
                                    onClick={() => { setSelectedCategory('all'); setPriceRange(75000); setSelectedRating(0); }}
                                    className="flex-shrink-0 px-3 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                                >
                                    ✕ Effacer
                                </button>
                            )}
                        </div>
                    </div>

                    {sortedProducts.length > 0 ? (
                        <div className={
                            viewMode === 'grid' 
                                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
                                : "flex flex-col gap-6"
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
                        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                <Filter className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('no_products_found')}</h2>
                            <p className="text-gray-500 mb-8">Essayez de modifier vos filtres ou réinitialisez-les pour voir plus de produits.</p>
                            <button
                                onClick={resetFilters}
                                className="bg-secondary text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                Réinitialiser les filtres
                            </button>
                        </div>
                    )}
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
