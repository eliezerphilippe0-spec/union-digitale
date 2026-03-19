import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingBag, Shield, Truck, CreditCard, Search, ArrowRight, Star } from 'lucide-react';
import Button from '../ui/Button';

const Hero = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    // Popular searches for suggestions
    const popularSearches = ['iPhone', 'Café Haïtien', 'Panneau Solaire', 'Vêtements', 'Génératrice'];

    const trustBadges = [
        { icon: Truck, text: t('hero_trust_delivery'), desc: 'Partout en Haïti' },
        { icon: Shield, text: t('hero_trust_secure'), desc: 'Paiement garanti' },
        { icon: CreditCard, text: 'MonCash & Cartes', desc: 'Acceptés' },
    ];

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div className="bg-[#f5f7fa] dark:bg-neutral-900 pb-8 pt-4">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* Main Banner Area (Left/Center) */}
                    <div className="flex-1 rounded-2xl overflow-hidden bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 relative">
                        {/* Background subtle flat color */}
                        <div className="absolute inset-0 bg-primary-50/50 dark:bg-primary-900/10"></div>
                        
                        <div className="relative p-8 md:p-12 h-full flex flex-col justify-center">
                            {/* Super Search Bar (Amazon/Mercado Libre Style) */}
                            <form onSubmit={handleSearch} className="w-full max-w-2xl mb-8">
                                <div className={`relative flex items-center bg-white dark:bg-neutral-900 rounded-xl border-2 transition-colors duration-200 ${searchFocused ? 'border-primary-500 ring-4 ring-primary-500/20' : 'border-gray-200 dark:border-neutral-700 hover:border-primary-300'}`}>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setSearchFocused(true)}
                                        onBlur={() => setSearchFocused(false)}
                                        placeholder="Trouvez tout ce dont vous avez besoin..."
                                        className="w-full py-4 pl-5 pr-12 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-lg"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-primary-900 font-bold rounded-lg transition-colors flex items-center justify-center"
                                        aria-label="Search"
                                    >
                                        <Search className="w-5 h-5 mx-2" />
                                    </button>
                                </div>
                                
                                {/* Popular searches */}
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Populaire :</span>
                                    {popularSearches.map((term, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => { setSearchQuery(term); navigate(`/catalog?search=${encodeURIComponent(term)}`); }}
                                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors cursor-pointer"
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </form>

                            {/* Value Proposition */}
                            <div className="max-w-xl">
                                <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
                                    Achetez en toute confiance <br/>
                                    <span className="text-primary-600 dark:text-primary-400">partout en Haïti.</span>
                                </h1>
                                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
                                    Des millions de produits. Des centaines de vendeurs locaux vérifiés. Paiement sécurisé par <strong>MonCash</strong> ou <strong>Carte Bancaire</strong>.
                                </p>
                                
                                <div className="flex flex-wrap gap-4">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        icon={ShoppingBag}
                                        onClick={() => window.location.href = '/deals'}
                                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4"
                                    >
                                        Voir les Offres du Jour
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => window.location.href = '/catalog'}
                                        className="px-8 py-4 font-semibold border-2"
                                    >
                                        Parcourir le Catalogue
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side Column (Deals / Promotions) */}
                    <div className="w-full lg:w-80 flex flex-col gap-4">
                        {/* Daily Deal Card */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-200 dark:border-neutral-700 h-full flex flex-col cursor-pointer hover:border-primary-300 transition-colors" onClick={() => navigate('/catalog?category=electronics')}>
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-gray-900 dark:text-white">Deal du Jour</span>
                                <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-2 py-1 rounded">-30%</span>
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-neutral-700/50 rounded-xl flex items-center justify-center mb-4 min-h-[120px]">
                                <span className="text-6xl">📱</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">iPhone 15 Pro Max</h3>
                            <div className="flex items-center gap-1 mb-2">
                                <div className="flex text-gold-400">
                                    <Star className="w-3 h-3 fill-current" />
                                    <Star className="w-3 h-3 fill-current" />
                                    <Star className="w-3 h-3 fill-current" />
                                    <Star className="w-3 h-3 fill-current" />
                                    <Star className="w-3 h-3 fill-current" />
                                </div>
                                <span className="text-xs text-gray-500">(540)</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">89 990 HTG</span>
                                <span className="text-sm text-gray-500 line-through pb-0.5">129 990</span>
                            </div>
                        </div>

                        {/* Local Promo Card */}
                         <div className="bg-emerald-700 rounded-2xl p-5 text-white cursor-pointer hover:bg-emerald-800 transition-colors" onClick={() => navigate('/category/local')}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl">🇭🇹</span>
                                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/30">100% Ayisyen</span>
                            </div>
                            <h3 className="font-bold text-lg mb-1 mt-2">Soutenez le local</h3>
                            <p className="text-green-50 text-sm mb-3 opacity-90">Découvrez les produits fabriqués en Haïti.</p>
                            <span className="inline-flex items-center text-sm font-semibold group">
                                Explorer la sélection <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Trust Signals Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {trustBadges.map((badge, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white dark:bg-neutral-800 p-4 rounded-xl border border-gray-200 dark:border-neutral-700">
                            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center flex-shrink-0">
                                <badge.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{badge.text}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{badge.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Hero;
