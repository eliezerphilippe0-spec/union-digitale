import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Search, MapPin, Zap, ShieldCheck, Star, ArrowRight, Smartphone, Laptop, ShoppingBag, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from './ui/Button';

// Spline background (lazy loaded for performance)
const Spline = lazy(() => import('@splinetool/react-spline'));

// Local Error Boundary for Spline
class SplineErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Spline Error caught:", error, errorInfo);
        this.props.onError();
    }
    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

const Hero = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [splineError, setSplineError] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const popularSearches = [
        t('popular_phones') || 'Téléphones',
        t('popular_shoes') || 'Chaussures',
        t('popular_fashion') || 'Mode',
        t('popular_solar') || 'Solaire',
        t('popular_laptops') || 'Laptops',
    ];

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 20
            }
        }
    };

    const floatVariants = {
        animate: {
            y: [0, -15, 0],
            transition: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#0A0F1C]">
            {/* --- Background: Spline + Gradients --- */}
            <div className="absolute inset-0 z-0">
                {!splineError ? (
                    <SplineErrorBoundary onError={() => setSplineError(true)}>
                        <Suspense fallback={<div className="w-full h-full bg-[#0A0F1C]" />}>
                            <Spline 
                                scene="https://prod.spline.design/6Wq1Q7YELSpE2x2R/scene.splinecode" 
                                className="opacity-60 scale-110 lg:scale-100"
                                onLoad={() => console.log('Spline Loaded')}
                                onError={() => setSplineError(true)}
                            />
                        </Suspense>
                    </SplineErrorBoundary>
                ) : (
                    <div className="absolute inset-0 bg-[#0A0F1C]">
                        <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: `radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 50%), 
                                             radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 40%)`
                        }} />
                    </div>
                )}
                {/* Overlays for readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F1C] via-[#0A0F1C]/80 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0F1C] z-10" />
                
                {/* Decorative floating orbs */}
                <div className="absolute top-20 left-[15%] w-2 h-2 bg-blue-500 rounded-full blur-sm opacity-40 animate-pulse" />
                <div className="absolute bottom-40 right-[10%] w-3 h-3 bg-purple-500 rounded-full blur-md opacity-30 animate-pulse delay-700" />
            </div>

            <div className="container mx-auto px-4 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    
                    {/* --- Left Column: Content --- */}
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-2xl"
                    >
                        {/* Super-App Badge */}
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-4 py-2 mb-8 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest text-blue-100/80">
                                {t('superapp_tagline') || 'Tout en un, partout pour vous'}
                            </span>
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.1] tracking-tight mb-6">
                            {t('hero_title_prefix')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                                {t('hero_title_suffix')}
                            </span>
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-lg md:text-xl text-blue-100/60 leading-relaxed mb-10 max-w-lg font-medium">
                            {t('hero_desc') || "Découvrez l'écosystème Zabely. Hyper-logistique, paiements sécurisés et marketplace premium en une seule application."}
                        </motion.p>

                        {/* Search Bar Refined */}
                        <motion.div variants={itemVariants} className="mb-8">
                            <form 
                                onSubmit={handleSearch}
                                className="relative group bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)] transition-all duration-500"
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-2">
                                    <div className="relative flex-1 w-full pl-4 flex items-center gap-3">
                                        <Search className="text-blue-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder={t('search_placeholder') || 'Cherchez un produit, un service...'}
                                            className="w-full bg-transparent border-none text-white placeholder-blue-100/30 focus:ring-0 py-4 text-base font-medium"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 group-hover:px-10"
                                    >
                                        <span>{t('hero_cta') || 'Explorer'}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>

                            {/* Popular Chips */}
                            <div className="flex flex-wrap items-center gap-2 mt-5">
                                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mr-2">
                                    {t('popular') || 'Tendance :'}
                                </span>
                                {popularSearches.map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => navigate(`/catalog?q=${encodeURIComponent(term)}`)}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 rounded-full text-white/80 text-[11px] font-bold transition-all duration-300 backdrop-blur-sm"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Trust Signals */}
                        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-8">
                            <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                                <ShieldCheck className="text-green-400 w-5 h-5" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest tracking-tighter">Paiements Sécurisés</span>
                            </div>
                            <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                </div>
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">4.9/5 Trustpilot</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* --- Right Column: Decorative (Interactive Floating Cards) --- */}
                    <div className="hidden lg:block relative h-full min-h-[500px]">
                        {/* Dynamic Floating Elements */}
                        <motion.div 
                            variants={floatVariants}
                            animate="animate"
                            className="absolute top-0 right-10 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl z-20 w-64"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                                    <Smartphone className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Marketplace</p>
                                    <p className="text-sm text-white font-bold">Tech & High-Tech</p>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: "85%" }}
                                    transition={{ duration: 2, delay: 1 }}
                                    className="h-full bg-blue-500" 
                                />
                            </div>
                        </motion.div>

                        <motion.div 
                            variants={floatVariants}
                            animate="animate"
                            style={{ transitionDelay: '1s' }}
                            className="absolute bottom-10 left-0 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl z-20 w-64"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                                    <ShoppingBag className="text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Global</p>
                                    <p className="text-sm text-white font-bold">Diaspora ↔ Ayiti</p>
                                </div>
                            </div>
                            <div className="flex -space-x-2">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0F1C] bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                                    </div>
                                ))}
                                <div className="w-8 h-8 rounded-full border-2 border-[#0A0F1C] bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                                    +12k
                                </div>
                            </div>
                        </motion.div>

                        {/* Center Visual Hub */}
                        <motion.div 
                            variants={floatVariants}
                            animate="animate"
                            style={{ transitionDelay: '0.5s' }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-full shadow-2xl z-10 w-80 h-80 flex items-center justify-center"
                        >
                            <div className="relative">
                                <Laptop className="w-32 h-32 text-blue-400/10" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-24 h-24 rounded-full bg-blue-500/20 animate-ping absolute" />
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-luxury-xl">
                                        <Zap className="text-blue-500 w-8 h-8" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
            
            {/* Bottom Gradient Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50/10 to-transparent pointer-events-none" />
        </section>
    );
};

export default Hero;
