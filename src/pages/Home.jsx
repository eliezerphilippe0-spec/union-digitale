/**
 * Home Page - Zabely
 * Optimized for conversion and Haitian market
 */

import React, { lazy, Suspense } from 'react';
import { useProducts } from '../hooks/useProducts';
import FlashSaleCountdown from '../components/marketing/FlashSaleCountdown';
import Hero from '../components/marketing/Hero';
import ProductCard from '../components/product/ProductCard';
import FullWidthCTA from '../components/marketing/FullWidthCTA';
import TrustedBy from '../components/marketing/TrustedBy';
import StructuredData from '../components/common/StructuredData';
import SEO from '../components/common/SEO';
import SocialProofLive from '../components/marketing/SocialProofLive';
import PromoBanner from '../components/marketing/PromoBanner';

// Lazy loading below-the-fold components for performance
const HowItWorks = lazy(() => import('../components/marketing/HowItWorks'));
const TestimonialCarousel = lazy(() => import('../components/marketing/TestimonialCarousel'));
const ServicesPreview = lazy(() => import('../components/ServicesPreview'));
const AIRecommendations = lazy(() => import('../components/recommendations/AIRecommendations'));
const LiveStreamsList = lazy(() => import('../components/live/LiveStreamsList'));
const ServicesHub = lazy(() => import('../components/ServicesHub'));
const DiasporaSection = lazy(() => import('../components/DiasporaSection'));

import {
    Loader, ArrowRight, Star, TrendingUp, Sparkles, Zap, Shield, Truck, Clock,
    ChevronRight, Package, Flame, Gift
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

// Simple loader for lazy components
const SectionLoader = () => (
    <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 text-gold-500 animate-spin" />
    </div>
);

const Home = () => {
    const { products, loading } = useProducts();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const categories = [
        {
            key: 'electronics',
            label: t('high_tech') || 'High-Tech',
            icon: '📱',
            gradient: 'from-primary-900 via-primary-800 to-indigo-900',
            bgGlow: 'bg-primary-500/20',
            count: 'Top Qualité',
            trending: true,
            badge: '🔥 Top'
        },
        {
            key: 'local',
            label: 'Produits Locaux',
            icon: '🇭🇹',
            gradient: 'from-emerald-900 via-emerald-800 to-teal-900',
            bgGlow: 'bg-emerald-500/20',
            count: '100% Ayisyen',
            badge: '⭐ Local'
        },
        {
            key: 'energy',
            label: 'Énergie & Solaire',
            icon: '⚡',
            gradient: 'from-amber-700 via-amber-800 to-orange-900',
            bgGlow: 'bg-gold-500/20',
            count: 'Solaire',
            badge: '💡 Éco'
        },
        {
            key: 'fashion',
            label: 'Mode & Beauté',
            icon: '👗',
            gradient: 'from-pink-400 via-rose-500 to-red-500',
            count: '1,2k',
            badge: '✨ Trend'
        },
        {
            key: 'home',
            label: 'Maison & Jardin',
            icon: '🏠',
            gradient: 'from-blue-400 via-cyan-500 to-teal-500',
            count: '800+',
        },
        {
            key: 'education',
            label: 'Éducation',
            icon: '📚',
            gradient: 'from-indigo-900 via-blue-900 to-primary-900',
            bgGlow: 'bg-indigo-500/20',
            count: 'Livres',
        }
    ];

    const features = [
        {
            icon: Truck,
            title: t('value_delivery') || 'Livraison Express',
            desc: t('value_delivery_desc') || 'Gratuite dès 50$',
            color: 'text-primary-600',
            bg: 'bg-primary-50'
        },
        {
            icon: Shield,
            title: t('value_quality') || 'Qualité Garantie',
            desc: t('value_quality_desc') || '100% authentique',
            color: 'text-primary-600',
            bg: 'bg-primary-50'
        },
        {
            icon: Clock,
            title: t('value_support') || 'Support 24/7',
            desc: t('value_support_desc') || 'Toujours disponible',
            color: 'text-primary-600',
            bg: 'bg-primary-50'
        },
        {
            icon: Zap,
            title: t('value_fast') || 'Paiement Sécurisé',
            desc: t('value_fast_desc') || 'SSL crypté',
            color: 'text-primary-600',
            bg: 'bg-primary-50'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-gold-500/30 animate-ping"></div>
                        <Loader className="w-16 h-16 text-gold-500 animate-spin" />
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
            <SEO title="Zabely" description="Marketplace haïtienne pour produits et services, paiements sécurisés et livraison rapide." />
            <StructuredData />
            
            {/* Promo Banner - First Purchase Discount */}
            <PromoBanner />
            
            {/* Flash Sale Countdown */}
            <FlashSaleCountdown />
            
            {/* Hero Section - Clear Value Proposition */}
            <div className="md:hidden px-4 pt-6 pb-4">
                <div className="rounded-2xl bg-white border border-gray-200 p-5">
                    <h1 className="text-2xl font-bold text-gray-900">{t('hero_title_prefix')} {t('hero_title_suffix')}</h1>
                    <p className="text-gray-600 mt-2">{t('hero_desc')}</p>
                    <div className="mt-4 flex gap-2">
                        <Button onClick={() => navigate('/catalog')}>{t('hero_cta')}</Button>
                        <Button variant="outline" onClick={() => navigate('/seller/register')}>{t('hero_cta_seller')}</Button>
                    </div>
                </div>
            </div>
            <div className="hidden md:block">
                <Hero />
            </div>

            {/* Services Hub - High Priority for Zabely */}
            <Suspense fallback={<SectionLoader />}>
                <ServicesHub />
            </Suspense>

            {/* Trust Signals - Immediately After Hero */}
            <TrustedBy />

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">

                {/* Quick picks */}
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{t('best_sellers')}</h2>
                        <Button variant="ghost" onClick={() => window.location.href='/catalog'} className="text-sm">{t('see_all')}</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {products.slice(0,4).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>

                {/* Categories - Circular E-commerce Style */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                Parcourir par Catégorie
                            </h2>
                        </div>
                        <button
                            onClick={() => navigate('/catalog')}
                            className="hidden md:flex items-center gap-1 text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline"
                        >
                            Voir tout <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {categories.map((cat) => (
                            <div
                                key={cat.key}
                                className="group flex flex-col items-center gap-3 cursor-pointer"
                                onClick={() => navigate(`/category/${cat.key}`)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex flex-col items-center justify-center relative transition-all group-hover:-translate-y-1 group-hover:border-primary-300">
                                    {cat.badge && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10">
                                            {cat.badge.replace(/[^a-zA-Z]/g, '')}
                                        </span>
                                    )}
                                    <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                                </div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                                    {cat.label}
                                </h3>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Flash Sales / Promos - HIGH PRIORITY */}
                <section className="mb-12">
                    <div className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-2xl p-1">
                        <div className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 px-6 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl animate-pulse">🔥</span>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Ventes Flash</h3>
                                        <p className="text-white/80 text-xs">Jusqu'à -50% • Quantités limitées</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.location.href = '/deals'}
                                    className="bg-white text-red-500 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors"
                                >
                                    Voir tout →
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {products.slice(0, 4).map((product, index) => (
                                        <div key={product.id} className="relative">
                                            <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                -{Math.floor(Math.random() * 30 + 20)}%
                                            </div>
                                            <ProductCard product={product} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Best Sellers */}
                <section className="mb-12">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center">
                                    <Star className="w-5 h-5 text-white fill-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                        Meilleures Ventes
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Les produits préférés de nos clients
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/best-sellers')}
                                className="flex items-center gap-1 text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline"
                            >
                                Voir tout <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {products.slice(0, 8).map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Produits Locaux - Haiti Focus */}
                <section className="mb-12">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-4xl">🇭🇹</span>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        Produits 100% Haïtiens
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Soutenez l'économie locale
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/category/local')}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
                            >
                                Découvrir →
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {products.slice(4, 8).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* AI Recommendations */}
                <section className="mb-12">
                    <Suspense fallback={<SectionLoader />}>
                        <AIRecommendations limit={8} />
                    </Suspense>
                </section>

                {/* Services Preview */}
                <Suspense fallback={<SectionLoader />}>
                    <ServicesPreview />
                </Suspense>

                {/* Live Shopping - Secondary */}
                <section className="mb-12">
                    <Suspense fallback={<SectionLoader />}>
                        <LiveStreamsList />
                    </Suspense>
                </section>
            </div>

            {/* Diaspora Section */}
            <DiasporaSection />

            {/* Testimonials */}
            <section className="py-12 bg-white dark:bg-neutral-800 border-y border-gray-100 dark:border-neutral-700">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-50 dark:bg-gold-900/30 rounded-full mb-3">
                            <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                            <span className="text-sm font-medium text-gold-600 dark:text-gold-400">4.9/5 Note moyenne</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Ce que disent nos clients
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl mx-auto mb-4">
                            Rejoignez des milliers de clients satisfaits
                        </p>
                        <a
                            href="https://www.trustpilot.com/evaluate/zabely.ht"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00b67a] text-white font-bold rounded-lg hover:bg-[#009c69] transition-colors text-sm"
                        >
                            <Star className="w-4 h-4 fill-white" />
                            Noter sur Trustpilot
                        </a>
                    </div>
                    <Suspense fallback={<SectionLoader />}>
                        <TestimonialCarousel />
                    </Suspense>
                </div>
            </section>

            {/* How It Works */}
            <Suspense fallback={<SectionLoader />}>
                <HowItWorks />
            </Suspense>

            {/* Final CTA */}
            <FullWidthCTA />

            {/* Live Social Proof Notifications */}
            <SocialProofLive products={products} />
        </div>
    );
};

export default Home;
