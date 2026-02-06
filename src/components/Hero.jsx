import { useState, useEffect, Suspense, lazy } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePerformance } from '../contexts/PerformanceContext';
import { ShoppingBag, TrendingUp, Shield, ArrowRight, Play, Star, CheckCircle2 } from 'lucide-react';
import Button from './ui/Button';
import CountUpAnimation from './CountUpAnimation';
import QuickCategories from './QuickCategories';

const SplineBackground = lazy(() => import('./SplineBackground'));

const Hero = () => {
    const { t } = useLanguage();
    const { shouldReduceAnimations, isSlowConnection } = usePerformance();
    const [isDesktop, setIsDesktop] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsDesktop(window.innerWidth > 768);
        setIsVisible(true);
        const handleResize = () => setIsDesktop(window.innerWidth > 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (shouldReduceAnimations) return;
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth - 0.5) * 40,
                y: (e.clientY / window.innerHeight - 0.5) * 40
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [shouldReduceAnimations]);

    return (
        <div className="relative min-h-[60vh] md:min-h-[55vh] lg:min-h-[65vh] overflow-hidden bg-[#0a0f1a]">
            {/* Exceptional Animated Background - Inspired by Linear/Vercel */}
            <div className="absolute inset-0">
                {/* Base dark gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1829] to-[#0a1628]"></div>

                {/* Animated aurora gradient - Optimized, Desktop Only */}
                {isDesktop && !shouldReduceAnimations && (
                    <div className="absolute inset-0 opacity-40">
                        <div
                            className="absolute top-0 -left-1/4 w-[80%] h-[80%] rounded-full animate-aurora"
                            style={{
                                background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
                                transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`,
                            }}
                        ></div>
                        <div
                            className="absolute top-1/4 right-0 w-[70%] h-[70%] rounded-full animate-aurora-delayed"
                            style={{
                                background: 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
                                transform: `translate(${-mousePosition.x * 0.2}px, ${-mousePosition.y * 0.2}px)`,
                            }}
                        ></div>
                        <div
                            className="absolute -bottom-1/4 left-1/3 w-[60%] h-[60%] rounded-full animate-aurora"
                            style={{
                                background: 'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
                                animationDelay: '2s',
                                transform: `translate(${mousePosition.x * 0.15}px, ${mousePosition.y * 0.15}px)`,
                            }}
                        ></div>
                    </div>
                )}

                {/* Noise texture overlay */}
                <div className="absolute inset-0 opacity-[0.015]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}></div>

                {/* Grid pattern - Subtle */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}></div>

                {/* Floating orbs with glow */}
                <div className="absolute top-20 left-[15%] w-2 h-2 bg-blue-500 rounded-full animate-float opacity-60 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
                <div className="absolute top-40 right-[20%] w-3 h-3 bg-purple-500 rounded-full animate-float opacity-50 shadow-[0_0_25px_rgba(168,85,247,0.5)]" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-32 left-[25%] w-2 h-2 bg-pink-500 rounded-full animate-float opacity-40 shadow-[0_0_15px_rgba(236,72,153,0.5)]" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 right-[10%] w-4 h-4 bg-gold-500 rounded-full animate-float opacity-30 shadow-[0_0_30px_rgba(212,175,55,0.5)]" style={{ animationDelay: '0.5s' }}></div>

                {/* Gradient lines */}
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>
                <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-500/10 to-transparent"></div>
            </div>

            {/* Spline 3D - Desktop Only */}
            {isDesktop && !isSlowConnection && (
                <Suspense fallback={<div />}>
                    <SplineBackground className="absolute inset-y-0 -right-20 w-[600px] h-full z-10 opacity-30" />
                </Suspense>
            )}

            {/* Main Content */}
            <div className="relative z-20 container mx-auto px-4 py-16 md:py-24 lg:py-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className={`max-w-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {/* Badge - Modern pill style */}
                        <div className="inline-flex items-center gap-3 px-4 py-2 mb-8 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-colors group cursor-pointer">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-sm text-gray-300 font-medium">
                                {t('promotions_active') || 'Promotions actives'}
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-sm text-gold-400 font-semibold">
                                {t('free_shipping') || 'Livraison gratuite dès 50$'}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>

                        {/* Main Headline - Optimized Responsive */}
                        <h1 className="text-[2.25rem] sm:text-5xl md:text-[3.25rem] lg:text-[4rem] font-bold leading-[1.1] mb-6 tracking-tight">
                            <span className="text-white">
                                {t('hero_title_prefix') || "Une Boutique."}
                            </span>
                            <br />
                            <span className="relative inline-block">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-300">
                                    {t('hero_title_suffix') || "Tous les Clients."}
                                </span>
                                {/* Underline decoration */}
                                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                                    <path d="M1 5.5C47 2 154 2 199 5.5" stroke="url(#gold-gradient)" strokeWidth="3" strokeLinecap="round" />
                                    <defs>
                                        <linearGradient id="gold-gradient" x1="0" y1="0" x2="200" y2="0">
                                            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
                                            <stop offset="50%" stopColor="#D4AF37" />
                                            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.3" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="text-lg md:text-xl text-gray-400 mb-4 leading-relaxed max-w-xl" style={{ transitionDelay: '100ms' }}>
                            {t('hero_desc') || "Créez votre boutique une fois, touchez vos clients partout."}
                        </p>

                        {/* Universal Access Icons */}
                        <div className="flex items-center gap-4 mb-10 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                                <span className="text-2xl">📱</span>
                                <span className="text-sm text-gray-300 font-medium">Android</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                                <span className="text-2xl">🍎</span>
                                <span className="text-sm text-gray-300 font-medium">iPhone</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                                <span className="text-2xl">💻</span>
                                <span className="text-sm text-gray-300 font-medium">Ordinateur</span>
                            </div>
                        </div>

                        {/* CTA Buttons - Modern style */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-12">
                            <Button
                                variant="primary"
                                size="xl"
                                icon={ShoppingBag}
                                onClick={() => window.location.href = '/catalog'}
                                className="group relative overflow-hidden bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-primary-900 font-semibold shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:shadow-[0_0_60px_rgba(212,175,55,0.4)] transition-all duration-300"
                                aria-label="Explorer le catalogue de produits Union Digitale"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {t('hero_cta') || 'Explorer le Catalogue'}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                            <Button
                                variant="secondary"
                                size="xl"
                                icon={Play}
                                onClick={() => window.location.href = '/seller/dashboard'}
                                className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all duration-300"
                                aria-label="Devenir vendeur sur la plateforme Union Digitale"
                            >
                                {t('hero_cta_seller') || 'Devenir Vendeur'}
                            </Button>
                        </div>

                        {/* Trust Signals - Minimal modern style */}
                        <div className="flex flex-wrap items-center gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm">{t('hero_trust_secure') || 'Paiement Sécurisé'}</p>
                                    <p className="text-gray-500 text-xs">SSL 256-bit</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm">
                                        <CountUpAnimation end={500} suffix="+" className="inline" /> {t('hero_trust_vendors') || 'Vendeurs'}
                                    </p>
                                    <p className="text-gray-500 text-xs">{t('verified') || 'Vérifiés'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
                                    <Star className="w-5 h-5 text-gold-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm">4.9/5</p>
                                    <p className="text-gray-500 text-xs">10k+ {t('reviews') || 'avis'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Categories - Above the Fold */}
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <p className="text-gray-400 text-sm mb-4 text-center">{t('browse_categories') || 'Parcourir par catégorie'}</p>
                            <QuickCategories />
                        </div>
                    </div>

                    {/* Right Content - Featured Products Preview (Mobile) */}
                    {!isDesktop && (
                        <div className={`relative mt-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                            {/* Static product cards for mobile - Bento style */}
                            <div className="relative h-[400px] flex justify-center items-center">
                                {/* Main featured card */}
                                <div className="absolute top-0 w-64 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-5 shadow-2xl group">
                                    <div className="w-full h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-3 flex items-center justify-center overflow-hidden">
                                        <span className="text-5xl">📱</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-1 bg-gold-500/20 text-gold-400 text-xs font-semibold rounded-full">NOUVEAU</span>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                                            <span className="text-gray-400 text-xs">4.9</span>
                                        </div>
                                    </div>
                                    <h3 className="text-white font-semibold mb-1 text-base">iPhone 15 Pro Max</h3>
                                    <p className="text-gold-400 font-bold text-base">1,299 $</p>
                                </div>

                                {/* Secondary card */}
                                <div className="absolute bottom-0 left-0 w-48 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-3 shadow-xl">
                                    <div className="w-full h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl mb-2 flex items-center justify-center">
                                        <span className="text-3xl">👟</span>
                                    </div>
                                    <h3 className="text-white font-medium text-sm mb-1">Nike Air Max</h3>
                                    <p className="text-green-400 font-semibold text-sm">189 $</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right Content - Featured Products Preview (Desktop) */}
                    {isDesktop && (
                        <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                            {/* Floating product cards - Bento style */}
                            <div className="relative h-[500px]">
                                {/* Main featured card */}
                                <div className="absolute top-0 right-0 w-72 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 shadow-2xl hover:scale-105 transition-transform duration-500 cursor-pointer group"
                                    style={{ transform: `translate(${-mousePosition.x * 0.05}px, ${-mousePosition.y * 0.05}px)` }}>
                                    <div className="w-full h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                                        <span className="text-6xl group-hover:scale-110 transition-transform">📱</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-gold-500/20 text-gold-400 text-xs font-semibold rounded-full">NOUVEAU</span>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                                            <span className="text-gray-400 text-xs">4.9</span>
                                        </div>
                                    </div>
                                    <h3 className="text-white font-semibold mb-1">iPhone 15 Pro Max</h3>
                                    <p className="text-gold-400 font-bold">1,299 $</p>
                                </div>

                                {/* Secondary card */}
                                <div className="absolute top-32 left-0 w-56 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 shadow-xl hover:scale-105 transition-transform duration-500 cursor-pointer"
                                    style={{ transform: `translate(${mousePosition.x * 0.08}px, ${mousePosition.y * 0.08}px)` }}>
                                    <div className="w-full h-28 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl mb-3 flex items-center justify-center">
                                        <span className="text-4xl">👟</span>
                                    </div>
                                    <h3 className="text-white font-medium text-sm mb-1">Nike Air Max</h3>
                                    <p className="text-green-400 font-semibold text-sm">189 $</p>
                                </div>

                                {/* Third card */}
                                <div className="absolute bottom-20 right-20 w-48 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 shadow-xl hover:scale-105 transition-transform duration-500 cursor-pointer"
                                    style={{ transform: `translate(${-mousePosition.x * 0.06}px, ${mousePosition.y * 0.06}px)` }}>
                                    <div className="w-full h-24 bg-gradient-to-br from-gold-500/20 to-amber-500/20 rounded-xl mb-3 flex items-center justify-center">
                                        <span className="text-4xl">⌚</span>
                                    </div>
                                    <h3 className="text-white font-medium text-sm mb-1">Apple Watch</h3>
                                    <p className="text-gold-400 font-semibold text-sm">399 $</p>
                                </div>

                                {/* Stats floating card */}
                                <div className="absolute bottom-0 left-10 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-2xl rounded-2xl border border-green-500/20 px-5 py-4 shadow-xl"
                                    style={{ transform: `translate(${mousePosition.x * 0.05}px, ${-mousePosition.y * 0.05}px)` }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-green-400 font-bold text-lg">+127%</p>
                                            <p className="text-gray-400 text-xs">{t('sales_this_month') || 'Ventes ce mois'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neutral-50 dark:from-neutral-900 to-transparent z-30"></div>
        </div>
    );
};

export default Hero;
