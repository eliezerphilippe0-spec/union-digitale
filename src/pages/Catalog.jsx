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
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [onlyInStock, setOnlyInStock] = useState(false);

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
            if (predefinedFilter === 'Union DH') {
                matchesCategory = product.brand === 'Union DH' || product.title.includes('Union DH');
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
            matchesCategory = selectedCategory === 'All' || product.title.includes(selectedCategory);
        }

        return matchesPrice && matchesRating && matchesCategory && matchesStock && matchesBrand;
    });

    const resetFilters = () => {
        setPriceRange(150000);
        setSelectedRating(0);
        setSelectedCategory('All');
        setSelectedBrands([]);
        setOnlyInStock(false);
    };

    const toggleBrand = (brand) => {
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    // Special sorting for New Arrivals if needed
    if (predefinedFilter === 'New Arrivals') {
        filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin w-8 h-8 text-secondary" /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{t('error_loading_products')}</div>;

    const pageTitle = predefinedFilter ? `${predefinedFilter} | ${t('catalog_general')}` : (category ? `${category} | ${t('catalog_general')}` : t('catalog_general'));

    return (
        <div className="bg-background min-h-screen py-8">
            <SEO
                title={selectedCategory === 'All' ? 'Catalogue Complet' : (t(selectedCategory.toLowerCase()) || selectedCategory)}
                description={`Découvrez notre sélection de ${selectedCategory === 'All' ? 'tous nos produits' : selectedCategory} sur Union Digitale Haïti.`}
            />
            <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-72 flex-shrink-0 space-y-8 bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gray-100">
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

                    <div>
                        <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-400">{t('filters_categories')}</h3>
                        <ul className="space-y-2 text-sm">
                            {['All', 'electronics', 'local', 'energy', 'education', 'clothing', 'furniture', 'food', 'crafts'].map(cat => (
                                <li key={cat}>
                                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-200 hover:text-secondary group">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={selectedCategory === cat}
                                            onChange={() => setSelectedCategory(cat)}
                                            className="text-secondary focus:ring-secondary w-4 h-4"
                                        />
                                        <span className={selectedCategory === cat ? 'font-bold text-gray-900' : ''}>
                                            {cat === 'All' ? t('all') : (t(cat) || cat)}
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-400">Marques</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                            {allBrands.map(brand => (
                                <label key={brand} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 group">
                                    <input
                                        type="checkbox"
                                        checked={selectedBrands.includes(brand)}
                                        onChange={() => toggleBrand(brand)}
                                        className="rounded text-secondary focus:ring-secondary w-4 h-4"
                                    />
                                    <span className={selectedBrands.includes(brand) ? 'font-bold text-gray-900' : ''}>{brand}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-400">{t('filters_max_price')}</h3>
                        <div className="space-y-4">
                            <input
                                type="range"
                                min="0"
                                max="150000"
                                step="1000"
                                value={priceRange}
                                onChange={(e) => setPriceRange(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-secondary"
                            />
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="text-xs text-gray-400">Max:</span>
                                <span className="font-bold text-secondary text-lg">{priceRange.toLocaleString()} G</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-400">Disponibilité</h3>
                        <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={onlyInStock}
                                    onChange={() => setOnlyInStock(!onlyInStock)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">En Stock uniquement</span>
                        </label>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-400">{t('filters_reviews')}</h3>
                        <ul className="space-y-1">
                            {[4, 3, 2, 1].map(rating => (
                                <li
                                    key={rating}
                                    className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors ${selectedRating === rating ? 'bg-secondary/10 font-bold' : ''}`}
                                    onClick={() => setSelectedRating(rating)}
                                >
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-current' : 'text-gray-200'}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-500">{t('and_more')}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Product Grid */}
                <main className="flex-1">
                    {/* Active Filters Bar */}
                    {(selectedCategory !== 'All' || selectedBrands.length > 0 || onlyInStock || selectedRating > 0) && (
                        <div className="flex flex-wrap items-center gap-2 mb-6">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter mr-2">Filtres actifs:</span>
                            {selectedCategory !== 'All' && (
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-1">
                                    Catégorie: {selectedCategory}
                                    <button onClick={() => setSelectedCategory('All')} className="hover:text-red-500">×</button>
                                </span>
                            )}
                            {selectedBrands.map(brand => (
                                <span key={brand} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-100 flex items-center gap-1">
                                    {brand}
                                    <button onClick={() => toggleBrand(brand)} className="hover:text-red-500">×</button>
                                </span>
                            ))}
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
                                {predefinedFilter || (category && category !== 'All' ? category : 'Tous les produits')}
                            </h1>
                            <p className="text-sm text-gray-500">{filteredProducts.length} articles trouvés</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('sort_by')}</span>
                            <select className="bg-white border-none shadow-sm rounded-xl py-2 px-4 focus:ring-2 focus:ring-secondary text-sm font-bold">
                                <option>{t('sort_featured')}</option>
                                <option>{t('sort_price_asc')}</option>
                                <option>{t('sort_price_desc')}</option>
                                <option>{t('sort_rating')}</option>
                            </select>
                        </div>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
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
                </main>
            </div>
        </div>
    );
};

export default Catalog;
