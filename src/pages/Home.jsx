/**
 * Home Page - Union Digitale
 * Optimized for conversion and Haitian market
 */

import { useProducts } from '../hooks/useProducts';
import FlashSaleCountdown from '../components/FlashSaleCountdown';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import FullWidthCTA from '../components/FullWidthCTA';
import HowItWorks from '../components/HowItWorks';
import TestimonialCarousel from '../components/TestimonialCarousel';
import TrustedBy from '../components/TrustedBy';
import ServicesPreview from '../components/ServicesPreview';
import StructuredData from '../components/StructuredData';
import SocialProofLive from '../components/SocialProofLive';
import PromoBanner from '../components/PromoBanner';
import AIRecommendations from '../components/recommendations/AIRecommendations';
import LiveStreamsList from '../components/live/LiveStreamsList';

import {
    Loader, ArrowRight, Star, TrendingUp, Sparkles, Zap, Shield, Truck, Clock,
    ChevronRight, Package, Flame, Gift
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Button from '../components/ui/Button';

const Home = () => {
    const { products, loading } = useProducts();
    const { t } = useLanguage();

    const categories = [
        {
            key: 'electronics',
            label: 'High-Tech',
            icon: '📱',
            gradient: 'from-violet-500 via-purple-500 to-indigo-500',
            count: '2,500+ produits',
            trending: true,
            badge: '🔥 Populaire'
        },
        {
            key: 'local',
            label: 'Produits Locaux',
            icon: '🇭🇹',
            gradient: 'from-green-500 via-emerald-500 to-teal-500',
            count: '100% Ayisyen',
            badge: '⭐ Authentique'
        },
        {
            key: 'energy',
            label: 'Énergie & Solaire',
            icon: '⚡',
            gradient: 'from-yellow-400 via-amber-500 to-orange-500',
            count: 'Solutions Durables',
            badge: '💡 Économique'
        },
        {
            key: 'fashion',
            label: 'Mode & Beauté',
            icon: '👗',
            gradient: 'from-pink-400 via-rose-500 to-red-500',
            count: '1,200+ articles',
            badge: '✨ Tendance'
        },
        {
            key: 'home',
            label: 'Maison & Jardin',
            icon: '🏠',
            gradient: 'from-blue-400 via-cyan-500 to-teal-500',
            count: '800+ produits'
        },
        {
            key: 'education',
            label: 'Éducation',
            icon: '📚',
            gradient: 'from-indigo-400 via-blue-500 to-cyan-500',
            count: 'Livres & Formations'
        },
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
            <StructuredData />
            
            {/* Promo Banner - First Purchase Discount */}
            <PromoBanner />
            
            {/* Flash Sale Countdown */}
            <FlashSaleCountdown />
            
            {/* Hero Section - Clear Value Proposition */}
            <Hero />

            {/* Trust Signals - Immediately After Hero */}
            <TrustedBy />

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">

                {/* Categories - Bento Grid */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                🛍️ Parcourir par Catégorie
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Trouvez exactement ce que vous cherchez</p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/catalog'}
                            className="hidden md:flex items-center gap-1 text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline"
                        >
                            Voir tout <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {categories.map((cat, index) => (
                            <div
                                key={cat.key}
                                className="group relative overflow-hidden rounded-2xl cursor-pointer border border-gray-100 dark:border-neutral-700 hover:border-transparent hover:shadow-xl transition-all duration-300"
                                onClick={() => window.location.href = `/category/${cat.key}`}
                                role="button"
                                tabIndex={0}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-90`}></div>
                                
                                <div className="relative p-4 h-32 flex flex-col justify-between">
                                    <div>
                                        {cat.badge && (
                                            <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold text-white mb-2">
                                                {cat.badge}
                                            </span>
                                        )}
                                        <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">
                                            {cat.icon}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{cat.label}</h3>
                                        <p className="text-white/70 text-xs">{cat.count}</p>
                                    </div>
                                </div>
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
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg">
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
                                onClick={() => window.location.href = '/best-sellers'}
                                className="flex items-center gap-1 text-primary-600 text-sm font-medium hover:underline"
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
                                onClick={() => window.location.href = '/category/local'}
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
                    <AIRecommendations limit={8} />
                </section>

                {/* Services Preview */}
                <ServicesPreview />

                {/* Live Shopping - Secondary */}
                <section className="mb-12">
                    <LiveStreamsList />
                </section>
            </div>

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
                            href="https://www.trustpilot.com/evaluate/uniondigitale.ht"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00b67a] text-white font-bold rounded-lg hover:bg-[#009c69] transition-colors text-sm"
                        >
                            <Star className="w-4 h-4 fill-white" />
                            Noter sur Trustpilot
                        </a>
                    </div>
                    <TestimonialCarousel />
                </div>
            </section>

            {/* How It Works */}
            <HowItWorks />

            {/* Final CTA */}
            <FullWidthCTA />

            {/* Live Social Proof Notifications */}
            <SocialProofLive products={products} />
        </div>
    );
};

export default Home;
