import { useProducts } from '../hooks/useProducts';
import FlashSaleCountdown from '../components/FlashSaleCountdown';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import FullWidthCTA from '../components/FullWidthCTA';
import HowItWorks from '../components/HowItWorks';
import TestimonialCarousel from '../components/TestimonialCarousel';
import TrustedBy from '../components/TrustedBy';
import ServicesPreview from '../components/ServicesPreview';
import FlashSales from '../components/FlashSales';
import ServicesHub from '../components/ServicesHub';
import DiasporaSection from '../components/DiasporaSection';
import StructuredData from '../components/StructuredData';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';


import {
    Loader, ArrowRight, Star, TrendingUp, Sparkles, Zap, Shield, Truck, Clock,
    ChevronRight, Package
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

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
            trending: true
        },
        {
            key: 'local',
            label: t('local_products') || 'Produits Locaux',
            icon: '🇭🇹',
            gradient: 'from-emerald-900 via-emerald-800 to-teal-900',
            bgGlow: 'bg-emerald-500/20',
            count: '100% Ayisyen'
        },
        {
            key: 'energy',
            label: t('energy_solar') || 'Énergie & Solaire',
            icon: '⚡',
            gradient: 'from-amber-700 via-amber-800 to-orange-900',
            bgGlow: 'bg-gold-500/20',
            count: 'Solutions Durables'
        },
        {
            key: 'education',
            label: t('education_culture') || 'Éducation & Culture',
            icon: '📚',
            gradient: 'from-indigo-900 via-blue-900 to-primary-900',
            bgGlow: 'bg-indigo-500/20',
            count: 'Livres & Formations'
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
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">{t('loading') || 'Chargement...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
            <SEO
                title="Accueil"
                description="Union Digitale : La première Super-App d'Haïti. E-commerce, Services, Éducation et Transferts d'Argent."
            />
            <StructuredData />
            <FlashSaleCountdown />
            <Hero />

            {/* Services Hub */}
            <ServicesHub />

            {/* Flash Sales (Daily Deals) */}
            <FlashSales />

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">




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
                                onClick={() => navigate('/best-sellers')}
                                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
                            >
                                {t('view_all') || 'Voir tout'} <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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



                {/* Recommended Products */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {t('recommended_for_you') || 'Recommandé pour Vous'}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                {t('recommended_desc') || 'Sélection personnalisée basée sur vos préférences'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.slice(4, 8).map((product, index) => (
                            <div
                                key={product.id}
                                className="stagger-item opacity-0"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Diaspora Section */}
            <DiasporaSection />

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
        </div>
    );
};

export default Home;
