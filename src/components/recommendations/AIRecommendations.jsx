/**
 * AI Recommendations Component
 * Displays personalized product recommendations
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock, Heart, ChevronRight, RefreshCw } from 'lucide-react';
import ProductCard from '../product/ProductCard';
import recommendationService, { EVENT_TYPES } from '../../services/recommendationService';
import { useProducts } from '../../hooks/useProducts';

// Section wrapper component
const RecommendationSection = ({ title, subtitle, icon: Icon, products, onSeeAll, loading }) => {
    if (loading) {
        return (
            <div className="py-4 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3 mb-3 px-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                    <div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-48 bg-gray-100 rounded animate-pulse mt-1" />
                    </div>
                </div>
                <div className="flex gap-3 overflow-x-auto px-4 pb-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-40 flex-shrink-0">
                            <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
                            <div className="h-4 w-full bg-gray-200 rounded animate-pulse mt-2" />
                            <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse mt-1" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!products || products.length === 0) return null;

    return (
        <div className="py-6 border-b border-gray-100 last:border-0 bg-white">
            <div className="flex items-center justify-between mb-4 px-4 w-full">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg leading-tight">{title}</h2>
                        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                {onSeeAll && (
                    <button 
                        onClick={onSeeAll}
                        className="flex items-center gap-1 text-primary-600 text-sm font-semibold hover:underline"
                    >
                        Voir tout <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide">
                {products.map(product => (
                    <div key={product.id} className="w-40 sm:w-48 flex-shrink-0">
                        <ProductCard product={product} compact />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Main AI Recommendations Component
const AIRecommendations = ({ currentProduct = null, limit = 8 }) => {
    const { products, loading } = useProducts();
    const [recommendations, setRecommendations] = useState({
        forYou: [],
        similar: [],
        recentlyViewed: [],
        trending: [],
        boughtTogether: [],
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Generate recommendations when products load
    useEffect(() => {
        if (products.length > 0) {
            generateRecommendations();
        }
    }, [products, currentProduct]);

    const generateRecommendations = () => {
        setIsRefreshing(true);
        
        // Small delay to show loading state
        setTimeout(() => {
            const excludeIds = currentProduct ? [currentProduct.id] : [];

            setRecommendations({
                forYou: recommendationService.getRecommendations(products, {
                    limit,
                    excludeIds,
                }),
                similar: currentProduct 
                    ? recommendationService.getSimilarProducts(currentProduct, products, 4)
                    : [],
                recentlyViewed: recommendationService.getRecentlyViewed(products),
                trending: products
                    .filter(p => !excludeIds.includes(p.id))
                    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
                    .slice(0, 6),
                boughtTogether: currentProduct
                    ? recommendationService.getFrequentlyBoughtTogether(currentProduct, products)
                    : [],
            });
            
            setIsRefreshing(false);
        }, 300);
    };

    // Track product view when currentProduct changes
    useEffect(() => {
        if (currentProduct) {
            recommendationService.trackEvent(EVENT_TYPES.VIEW, {
                productId: currentProduct.id,
                category: currentProduct.category,
                brand: currentProduct.brand,
                price: currentProduct.price,
                tags: currentProduct.tags,
            });
        }
    }, [currentProduct?.id]);

    if (loading) {
        return (
            <div className="space-y-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
                <RecommendationSection loading />
                <RecommendationSection loading />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
            {/* Refresh Button - Hidden if currentProduct is set (usually means we are on product page) */}
            {!currentProduct && (
                <div className="flex justify-end pt-3 px-4 bg-white">
                    <button
                        onClick={generateRecommendations}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary-600 transition-colors bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                </div>
            )}

            {/* Similar Products (if viewing a product) */}
            {currentProduct && recommendations.similar.length > 0 && (
                <RecommendationSection
                    title="Vous aimerez aussi"
                    subtitle={`Similaire à ${currentProduct.title}`}
                    icon={Heart}
                    products={recommendations.similar}
                />
            )}

            {/* Frequently Bought Together (if viewing a product) */}
            {currentProduct && recommendations.boughtTogether.length > 0 && (
                <div className="px-4 py-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-gold-500 fill-gold-500" />
                        Souvent achetés ensemble
                    </h3>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 flex-nowrap w-full md:w-auto">
                            {/* Current product */}
                            <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 p-2">
                                {currentProduct.images && currentProduct.images[0] ? (
                                    <img src={currentProduct.images[0]} alt={currentProduct.title} className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-3xl text-gray-300">📦</span>
                                )}
                            </div>
                            <span className="text-xl text-gray-400 font-light">+</span>
                            
                            {/* Recommended products */}
                            {recommendations.boughtTogether.map((product, index) => (
                                <React.Fragment key={product.id}>
                                    <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 p-2 relative group cursor-pointer" onClick={() => window.location.href=`/product/${product.id}`}>
                                         {product.images && product.images[0] ? (
                                            <img src={product.images[0]} alt={product.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <span className="text-3xl text-gray-300">📦</span>
                                        )}
                                    </div>
                                    {index < recommendations.boughtTogether.length - 1 && (
                                        <span className="text-xl text-gray-400 font-light">+</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        
                        <div className="w-full md:w-px md:h-20 bg-gray-200 mx-2 hidden md:block"></div>
                        
                        <div className="w-full md:w-auto flex flex-col gap-3 ml-auto shrink-0">
                            <div className="flex items-center justify-between md:justify-start gap-3">
                                <span className="text-sm text-gray-600">Prix total:</span>
                                <span className="text-lg font-bold text-gray-900">
                                   {/* Mock total calculation */}
                                   {((currentProduct.price + recommendations.boughtTogether.reduce((sum, p) => sum + p.price, 0)) * 0.85).toLocaleString()} HTG
                                </span>
                            </div>
                            <div className="bg-green-50 text-green-700 px-3 py-1 rounded text-xs font-bold inline-block w-fit mb-1 border border-green-200">
                                Économisez 15% en lot
                            </div>
                            <button className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
                                Ajouter le lot au panier
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recently Viewed */}
            {recommendations.recentlyViewed.length > 0 && (
                <RecommendationSection
                    title="Vus récemment"
                    subtitle="Continuez où vous en étiez"
                    icon={Clock}
                    products={recommendations.recentlyViewed}
                />
            )}

            {/* For You - Personalized */}
            <RecommendationSection
                title="Recommandé pour vous"
                subtitle="Basé sur vos préférences"
                icon={Sparkles}
                products={recommendations.forYou}
                onSeeAll={() => window.location.href = '/catalog?filter=recommended'}
            />

            {/* Trending */}
            <RecommendationSection
                title="Tendances actuelles"
                subtitle="Les plus populaires de la semaine"
                icon={TrendingUp}
                products={recommendations.trending}
                onSeeAll={() => window.location.href = '/best-sellers'}
            />
        </div>
    );
};

// Export individual section component for use elsewhere
export { RecommendationSection };
export default AIRecommendations;
