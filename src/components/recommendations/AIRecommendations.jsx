/**
 * AI Recommendations Component
 * Displays personalized product recommendations
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock, Heart, ChevronRight, RefreshCw } from 'lucide-react';
import ProductCard from '../ProductCard';
import recommendationService, { EVENT_TYPES } from '../../services/recommendationService';
import { useProducts } from '../../hooks/useProducts';

// Section wrapper component
const RecommendationSection = ({ title, subtitle, icon: Icon, products, onSeeAll, loading }) => {
    if (loading) {
        return (
            <div className="py-6">
                <div className="flex items-center gap-3 mb-4 px-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                    <div>
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-1" />
                    </div>
                </div>
                <div className="flex gap-4 overflow-x-auto px-4 pb-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-44 flex-shrink-0">
                            <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
                            <div className="h-4 w-full bg-gray-200 rounded animate-pulse mt-2" />
                            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mt-1" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!products || products.length === 0) return null;

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">{title}</h2>
                        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                    </div>
                </div>
                {onSeeAll && (
                    <button 
                        onClick={onSeeAll}
                        className="flex items-center gap-1 text-gold-600 text-sm font-medium hover:text-gold-700"
                    >
                        Voir tout <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide">
                {products.map(product => (
                    <div key={product.id} className="w-44 flex-shrink-0">
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
            <div className="space-y-6">
                <RecommendationSection loading />
                <RecommendationSection loading />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Refresh Button */}
            <div className="flex justify-end px-4">
                <button
                    onClick={generateRecommendations}
                    disabled={isRefreshing}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gold-600 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Actualiser
                </button>
            </div>

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
                <div className="mx-4 bg-gradient-to-r from-gold-50 to-amber-50 rounded-2xl p-4 border border-gold-100">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-gold-500" />
                        Souvent achetés ensemble
                    </h3>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {/* Current product */}
                        <div className="flex-shrink-0 w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-3xl">{currentProduct.image || '📦'}</span>
                        </div>
                        <span className="text-2xl text-gray-400">+</span>
                        {/* Recommended products */}
                        {recommendations.boughtTogether.map((product, index) => (
                            <React.Fragment key={product.id}>
                                <div className="flex-shrink-0 w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="text-3xl">{product.image || '📦'}</span>
                                </div>
                                {index < recommendations.boughtTogether.length - 1 && (
                                    <span className="text-2xl text-gray-400">+</span>
                                )}
                            </React.Fragment>
                        ))}
                        <span className="text-2xl text-gray-400">=</span>
                        <div className="flex-shrink-0 bg-gold-500 text-white px-4 py-2 rounded-xl font-bold">
                            Économisez 15%
                        </div>
                    </div>
                    <button className="w-full mt-3 bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 rounded-xl transition-colors">
                        Ajouter tout au panier
                    </button>
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
                title="Tendances"
                subtitle="Les plus populaires du moment"
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
