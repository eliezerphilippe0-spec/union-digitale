import { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePerformance } from '../../contexts/PerformanceContext';
import { ShoppingBag, TrendingUp, Shield, ArrowRight, Star, CheckCircle2, Truck, CreditCard, RefreshCcw, Search, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import CountUpAnimation from './CountUpAnimation';

const SplineBackground = lazy(() => import('./SplineBackground'));

const Hero = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { shouldReduceAnimations, isSlowConnection } = usePerformance();
    const [isDesktop, setIsDesktop] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    // Popular searches for suggestions
    const popularSearches = ['iPhone', 'Café Haïtien', 'Panneau Solaire', 'MacBook', 'Vêtements'];

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

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

    // Trust badges data
    const trustBadges = [
        { icon: Truck, text: 'Livraison gratuite dès 2000 HTG', color: 'text-green-400' },
        { icon: RefreshCcw, text: 'Satisfait ou remboursé 30j', color: 'text-blue-400' },
        { icon: Shield, text: 'Paiement 100% sécurisé', color: 'text-purple-400' },
    ];

    return (
        <div className="relative min-h-[55vh] md:min-h-[50vh] lg:min-h-[60vh] overflow-hidden bg-[#0a0f1a]">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1829] to-[#0a1628]"></div>
                
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
                    </div>
                )}

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}></div>

                {/* Floating orbs */}
                <div className="absolute top-20 left-[15%] w-2 h-2 bg-blue-500 rounded-full animate-float opacity-60 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
                <div className="absolute top-40 right-[20%] w-3 h-3 bg-purple-500 rounded-full animate-float opacity-50" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-32 left-[25%] w-2 h-2 bg-gold-500 rounded-full animate-float opacity-40" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Spline 3D - Desktop Only */}
            {isDesktop && !isSlowConnection && (
                <Suspense fallback={<div />}>
                    <SplineBackground className="absolute inset-y-0 -right-20 w-[600px] h-full z-10 opacity-20" />
                </Suspense>
            )}

            {/* Main Content */}
            <div className="relative z-20 container mx-auto px-4 py-12 md:py-16 lg:py-20">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left Content */}
                    <div className={`max-w-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        
                        {/* Location Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
                            <span className="text-2xl">🇭🇹</span>
                            <span className="text-sm text-gray-300 font-medium">
                                La Marketplace #1 en Haïti
                            </span>
                            <span className="relative flex h-2 w-2 ml-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        </div>

                        {/* 🔍 SEARCH BAR - P1 FIX: Prominent search */}
                        <form onSubmit={handleSearch} className="relative max-w-xl mb-6">
                            <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}>
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                                    placeholder="Rechercher un produit, une marque..."
                                    className="w-full h-14 pl-12 pr-32 rounded-2xl bg-white/10 backdrop-blur-xl border-2 border-white/20 focus:border-gold-400/60 text-white placeholder-gray-400 outline-none transition-all duration-300 text-lg"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-primary-900 font-bold px-6 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2"
                                >
                                    <Search className="w-4 h-4" />
                                    <span className="hidden sm:inline">Chercher</span>
                                </button>
                            </div>
                            
                            {/* Popular searches */}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <span className="text-xs text-gray-500">Populaires:</span>
                                {popularSearches.map((term, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => { setSearchQuery(term); navigate(`/catalog?search=${encodeURIComponent(term)}`); }}
                                        className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-full border border-white/10 transition-all"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </form>

                        {/* Main Headline - CLEAR VALUE PROPOSITION */}
                        <h1 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] mb-4 tracking-tight">
                            <span className="text-white">
                                Achetez en Haïti.
                            </span>
                            <br />
                            <span className="relative inline-block">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-300">
                                    Payez avec MonCash.
                                </span>
                            </span>
                        </h1>

                        {/* Subtitle - Clear description */}
                        <p className="text-lg md:text-xl text-gray-300 mb-3 leading-relaxed max-w-xl">
                            <strong className="text-white">10,000+ produits</strong> de{' '}
                            <strong className="text-white">500+ vendeurs haïtiens vérifiés</strong>.
                            Livraison partout en Haïti.
                        </p>

                        {/* Payment Methods Inline */}
                        <div className="flex items-center gap-3 mb-6 flex-wrap">
                            <span className="text-sm text-gray-400">Paiements acceptés:</span>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded">MonCash</span>
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">NatCash</span>
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded">Visa/MC</span>
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">Cash</span>
                            </div>
                        </div>

                        {/* CTA Buttons - CLEAR ACTION */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-8">
                            <Button
                                variant="primary"
                                size="xl"
                                icon={ShoppingBag}
                                onClick={() => window.location.href = '/deals'}
                                className="group relative overflow-hidden bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-primary-900 font-bold shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:shadow-[0_0_60px_rgba(212,175,55,0.4)] transition-all duration-300"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    🔥 Voir les Promos (-50%)
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                            <Button
                                variant="secondary"
                                size="xl"
                                onClick={() => window.location.href = '/catalog'}
                                className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white font-semibold transition-all duration-300"
                            >
                                Explorer le Catalogue
                            </Button>
                        </div>

                        {/* Trust Badges - VISIBLE GUARANTEES */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                            {trustBadges.map((badge, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 backdrop-blur rounded-lg border border-white/10">
                                    <badge.icon className={`w-4 h-4 ${badge.color}`} />
                                    <span className="text-xs text-gray-300 font-medium">{badge.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Social Proof Stats */}
                        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {['👨🏾', '👩🏽', '👨🏿', '👩🏾'].map((emoji, i) => (
                                        <span key={i} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm border-2 border-[#0a0f1a]">
                                            {emoji}
                                        </span>
                                    ))}
                                </div>
                                <div className="text-sm">
                                    <span className="text-white font-semibold">2,847</span>
                                    <span className="text-gray-400"> achats aujourd'hui</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <div className="flex">
                                    {[1,2,3,4,5].map(i => (
                                        <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />
                                    ))}
                                </div>
                                <span className="text-white font-semibold ml-1">4.9</span>
                                <span className="text-gray-400 text-sm">(10k+ avis)</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Product Cards */}
                    <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                        <div className="relative h-[400px] md:h-[450px]">
                            {/* Main featured card */}
                            <div 
                                className="absolute top-0 right-0 md:right-10 w-64 md:w-72 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-5 shadow-2xl hover:scale-105 transition-transform duration-500 cursor-pointer group"
                                style={isDesktop ? { transform: `translate(${-mousePosition.x * 0.05}px, ${-mousePosition.y * 0.05}px)` } : {}}
                                onClick={() => window.location.href = '/catalog?category=electronics'}
                            >
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                    -30%
                                </div>
                                <div className="w-full h-32 md:h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-3 flex items-center justify-center">
                                    <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform">📱</span>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 text-xs font-semibold rounded-full">POPULAIRE</span>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                                        <span className="text-gray-400 text-xs">4.9</span>
                                    </div>
                                </div>
                                <h3 className="text-white font-semibold mb-1">iPhone 15 Pro Max</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-gold-400 font-bold">89,999 HTG</p>
                                    <p className="text-gray-500 text-sm line-through">129,999 HTG</p>
                                </div>
                            </div>

                            {/* Secondary card */}
                            <div 
                                className="absolute top-32 md:top-28 left-0 w-48 md:w-56 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-3 md:p-4 shadow-xl hover:scale-105 transition-transform duration-500 cursor-pointer"
                                style={isDesktop ? { transform: `translate(${mousePosition.x * 0.08}px, ${mousePosition.y * 0.08}px)` } : {}}
                                onClick={() => window.location.href = '/catalog?category=local'}
                            >
                                <span className="absolute -top-2 -left-2 text-2xl">🇭🇹</span>
                                <div className="w-full h-24 md:h-28 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl mb-2 flex items-center justify-center">
                                    <span className="text-3xl md:text-4xl">☕</span>
                                </div>
                                <h3 className="text-white font-medium text-sm mb-1">Café Haïtien Premium</h3>
                                <p className="text-green-400 font-semibold text-sm">850 HTG</p>
                                <span className="text-xs text-gray-400">100% Ayisyen</span>
                            </div>

                            {/* Third card */}
                            <div 
                                className="absolute bottom-16 md:bottom-12 right-4 md:right-16 w-44 md:w-48 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-3 shadow-xl hover:scale-105 transition-transform duration-500 cursor-pointer"
                                style={isDesktop ? { transform: `translate(${-mousePosition.x * 0.06}px, ${mousePosition.y * 0.06}px)` } : {}}
                            >
                                <div className="w-full h-20 md:h-24 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl mb-2 flex items-center justify-center">
                                    <span className="text-3xl md:text-4xl">⚡</span>
                                </div>
                                <h3 className="text-white font-medium text-sm mb-1">Panneau Solaire 400W</h3>
                                <p className="text-gold-400 font-semibold text-sm">35,000 HTG</p>
                            </div>

                            {/* Live Stats card */}
                            <div 
                                className="absolute bottom-0 left-4 md:left-10 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-2xl rounded-2xl border border-green-500/20 px-4 py-3 shadow-xl"
                                style={isDesktop ? { transform: `translate(${mousePosition.x * 0.05}px, ${-mousePosition.y * 0.05}px)` } : {}}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-green-400" />
                                        </div>
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
                                    </div>
                                    <div>
                                        <p className="text-green-400 font-bold">+247 ventes</p>
                                        <p className="text-gray-400 text-xs">dans les dernières 24h</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 dark:from-neutral-900 to-transparent z-30"></div>
        </div>
    );
};

export default Hero;
