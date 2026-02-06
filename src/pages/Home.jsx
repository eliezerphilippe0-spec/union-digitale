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
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import AIRecommendations from '../components/recommendations/AIRecommendations';
import LiveStreamsList from '../components/live/LiveStreamsList';


import {
    Loader, ArrowRight, Star, TrendingUp, Sparkles, Zap, Shield, Truck, Clock,
    ChevronRight, Package
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Button from '../components/ui/Button';

const Home = () => {
    const { products, loading } = useProducts();
    const { t } = useLanguage();

    const categories = [
        {
            key: 'electronics', // Was high_tech
            label: t('high_tech') || 'High-Tech',
            icon: '📱',
            gradient: 'from-violet-500 via-purple-500 to-indigo-500',
            bgGlow: 'bg-violet-500/20',
            count: 'Top Qualité',
            trending: true
        },
        {
            key: 'local',
            label: t('local_products') || 'Produits Locaux',
            icon: '🇭🇹',
            gradient: 'from-green-500 via-emerald-500 to-teal-500',
            bgGlow: 'bg-green-500/20',
            count: '100% Ayisyen'
        },
        {
            key: 'energy',
            label: t('energy_solar') || 'Énergie & Solaire',
            icon: '⚡',
            gradient: 'from-yellow-400 via-amber-500 to-orange-500',
            bgGlow: 'bg-yellow-500/20',
            count: 'Solutions Durables'
        },
        {
            key: 'education',
            label: t('education_culture') || 'Éducation & Culture',
            icon: '📚',
            gradient: 'from-blue-400 via-cyan-500 to-sky-500',
            bgGlow: 'bg-blue-500/20',
            count: 'Livres & Formations'
        }
    ];



    const features = [
        {
            icon: Truck,
            title: t('value_delivery') || 'Livraison Express',
            desc: t('value_delivery_desc') || 'Gratuite dès 50$',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            icon: Shield,
            title: t('value_quality') || 'Qualité Garantie',
            desc: t('value_quality_desc') || '100% authentique',
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            icon: Clock,
            title: t('value_support') || 'Support 24/7',
            desc: t('value_support_desc') || 'Toujours disponible',
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            icon: Zap,
            title: t('value_fast') || 'Paiement Sécurisé',
            desc: t('value_fast_desc') || 'SSL crypté',
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
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
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">{t('loading') || 'Chargement...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
            <StructuredData />
            <FlashSaleCountdown />
            <Hero />

            {/* Features Bar - Style Dashboard moderne */}
            <section className="relative -mt-20 z-40 px-4">
                <div className="container mx-auto">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-700 p-4 md:p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer group">
                                    <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{feature.title}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted By Section */}
            <TrustedBy />

            {/* Live Shopping Streams */}
            <LiveStreamsList />

            {/* Services Preview Section */}
            <ServicesPreview />

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">



                {/* Categories - Bento Grid Style */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-3">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{t('explore') || 'Explorer'}</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {t('browse_categories') || 'Parcourir par Catégorie'}
                            </h2>
                        </div>
                        <button
                            onClick={() => window.location.href = '/catalog'}
                            className="hidden md:flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
                        >
                            {t('view_all') || 'Voir tout'} <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {categories.map((cat, index) => (
                            <div
                                key={cat.key}
                                className="group relative overflow-hidden rounded-2xl cursor-pointer border border-gray-100 dark:border-neutral-700 hover:border-transparent transition-all duration-300"
                                onClick={() => window.location.href = `/category/${cat.key}`}
                                style={{ animationDelay: `${index * 100}ms` }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Voir la catégorie ${cat.label}`}
                            >
                                {/* Background gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-90`}></div>

                                {/* Pattern overlay */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px)`,
                                        backgroundSize: '24px 24px'
                                    }}></div>
                                </div>

                                {/* Content */}
                                <div className="relative p-5 h-44 flex flex-col justify-between">
                                    <div>
                                        {cat.trending && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold text-white uppercase tracking-wider mb-2">
                                                <TrendingUp className="w-3 h-3" />
                                                Trending
                                            </span>
                                        )}
                                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                                            {cat.icon}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-0.5">{cat.label}</h3>
                                        <p className="text-white/70 text-sm">{cat.count} {t('products') || 'produits'}</p>
                                    </div>

                                    {/* Arrow */}
                                    <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                        <ArrowRight className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Best Sellers */}
                <section className="mb-16">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
                                    <Star className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                        {t('best_sellers_tech') || 'Meilleures Ventes'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {t('best_sellers_desc') || 'Les produits les plus populaires'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.location.href = '/best-sellers'}
                                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
                            >
                                {t('view_all') || 'Voir tout'} <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                {products.slice(0, 4).map((product, index) => (
                                    <div
                                        key={product.id}
                                        className="stagger-item opacity-0"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Promo + Insight Grid - Inspiré du dashboard */}
                <section className="mb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Grande promo */}
                        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 p-8">
                            {/* Background effects */}
                            <div className="absolute inset-0">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/20 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
                            </div>

                            <div className="relative z-10">
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/20 backdrop-blur-sm rounded-full text-gold-400 text-xs font-bold uppercase tracking-wider mb-4">
                                    <Zap className="w-3 h-3" />
                                    {t('limited_offer') || 'Offre Limitée'}
                                </span>
                                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight">
                                    {t('promo_title') || 'Jusqu\'à 50% de réduction'}
                                </h2>
                                <p className="text-gray-300 text-sm mb-6 max-w-md">
                                    {t('promo_desc') || 'Sur une sélection de produits high-tech. Offre valable jusqu\'à épuisement des stocks.'}
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => window.location.href = '/deals'}
                                        className="bg-gold-500 hover:bg-gold-400 text-primary-900 font-semibold text-sm"
                                    >
                                        {t('shop_now') || 'Acheter maintenant'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="text-white border border-white/20 hover:bg-white/10 text-sm"
                                    >
                                        {t('learn_more') || 'En savoir plus'}
                                    </Button>
                                </div>
                            </div>

                            {/* Badge flottant */}
                            <div className="absolute top-6 right-6 px-3 py-1.5 bg-green-500 rounded-full text-white font-bold text-sm shadow-lg animate-bounce-soft">
                                -50%
                            </div>
                        </div>


                    </div>
                </section>

                {/* AI Recommendations - Personalized */}
                <section className="mb-12">
                    <AIRecommendations limit={8} />
                </section>
            </div>

            {/* Testimonials */}
            <section className="py-16 bg-white dark:bg-neutral-800 border-y border-gray-100 dark:border-neutral-700">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-50 dark:bg-gold-900/30 rounded-full mb-3">
                            <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                            <span className="text-sm font-medium text-gold-600 dark:text-gold-400">4.9/5 {t('rating') || 'Note moyenne'}</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('testimonials_title') || 'Ce que disent nos clients'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl mx-auto mb-6">
                            {t('testimonials_desc') || 'Découvrez les expériences de milliers de clients satisfaits'}
                        </p>

                        <a
                            href="https://www.trustpilot.com/evaluate/uniondigitale.ht"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-2 bg-[#00b67a] text-white font-bold rounded-lg hover:bg-[#009c69] transition-colors shadow-lg shadow-green-500/20"
                        >
                            <Star className="w-4 h-4 fill-white" />
                            {t('leave_review') || 'Noter sur Trustpilot'}
                        </a>
                    </div>
                    <TestimonialCarousel />
                </div>
            </section>

            {/* How It Works */}
            <HowItWorks />

            {/* Full Width CTA */}
            <FullWidthCTA />

            {/* Live Social Proof Notifications */}
            <SocialProofLive products={products} />
        </div>
    );
};

export default Home;
