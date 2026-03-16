import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
    Star, Crown, Gift, Zap, Sparkles, TrendingUp,
    ChevronRight, ArrowRight, ShieldCheck, Award,
    CheckCircle2, Clock, History
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const LoyaltyProgram = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const points = currentUser?.points || 0;

    // Tier logic
    const getTier = (pts) => {
        if (pts >= 10000) return { name: 'Platinum', color: 'from-slate-400 to-slate-600', icon: Crown, min: 10000 };
        if (pts >= 5000) return { name: 'Gold', color: 'from-amber-400 to-amber-600', icon: Award, min: 5000 };
        if (pts >= 1000) return { name: 'Silver', color: 'from-gray-300 to-gray-500', icon: Star, min: 1000 };
        return { name: 'Bronze', color: 'from-orange-400 to-orange-600', icon: Sparkles, min: 0 };
    };

    const currentTier = getTier(points);
    const nextTier = points < 1000 ? getTier(1000) : points < 5000 ? getTier(5000) : points < 10000 ? getTier(10000) : null;
    const progress = nextTier ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;

    const tiers = [
        { name: 'Bronze', points: '0+', color: 'bg-orange-500', icon: Sparkles, benefits: ['1% Cashback', 'Support standard'] },
        { name: 'Silver', points: '1,000+', color: 'bg-gray-400', icon: Star, benefits: ['2% Cashback', 'Ventes flash anticipées', 'Support prioritaire'] },
        { name: 'Gold', points: '5,000+', color: 'bg-amber-500', icon: Award, benefits: ['5% Cashback', 'Livraison gratuite Union Plus', 'Cadeau d\'anniversaire'] },
        { name: 'Platinum', points: '10,000+', color: 'bg-slate-600', icon: Crown, benefits: ['10% Cashback', 'Concierge dédié', 'Accès événements VIP', 'Retours illimités'] },
    ];

    const rewards = [
        { id: 1, title: 'Coupon 500 HTG', cost: 1000, icon: Gift, type: 'Voucher' },
        { id: 2, title: 'Livraison Gratuite', cost: 500, icon: Zap, type: 'Service' },
        { id: 3, title: 'Union Plus (1 mois)', cost: 2500, icon: Crown, type: 'Subscription' },
        { id: 4, title: 'Mystery Box Digital', cost: 750, icon: Sparkles, type: 'Special' },
    ];

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-20">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 text-white py-12 md:py-20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-16">
                        {/* Points Card */}
                        <div className="flex-shrink-0 relative group">
                            <div className="absolute inset-0 bg-gold-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full border-4 border-white/10 flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl relative">
                                <div className="text-gold-400 mb-1">
                                    <Sparkles className="w-8 h-8 animate-bounce-soft" />
                                </div>
                                <div className="text-4xl md:text-5xl font-black">{points.toLocaleString()}</div>
                                <div className="text-sm font-bold tracking-widest uppercase opacity-70">Points</div>

                                {/* Tier badge overlay */}
                                <div className={`absolute -bottom-4 px-6 py-2 rounded-full bg-gradient-to-r ${currentTier.color} text-white font-bold shadow-xl flex items-center gap-2 border-2 border-white/20`}>
                                    <currentTier.icon className="w-4 h-4" />
                                    {currentTier.name}
                                </div>
                            </div>
                        </div>

                        <div className="flex-grow text-center md:text-left">
                            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight italic">
                                Union <span className="text-gold-400">Club</span>
                            </h1>
                            <p className="text-xl text-primary-100 mb-8 max-w-xl font-medium">
                                Bienvenue dans notre programme de fidélité. Chaque achat vous rapproche de récompenses exceptionnelles.
                            </p>

                            {nextTier && (
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-md">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-sm font-bold text-primary-200">
                                            Prochain palier : <span className="text-white">{nextTier.name}</span>
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {points}/{nextTier.min} pts
                                        </span>
                                    </div>
                                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${nextTier.color} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(212,175,55,0.5)]`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="mt-3 text-xs text-gray-400 font-medium italic">
                                        Encore <span className="text-white">{(nextTier.min - points).toLocaleString()} pts</span> pour débloquer de nouveaux avantages !
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-10 relative z-20">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Tiers & Benefits */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                            <div className="p-8 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Crown className="text-gold-500" />
                                    Paliers & Avantages
                                </h2>
                                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Union Club Benefits</span>
                            </div>

                            <div className="p-8">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {tiers.map((tier) => (
                                        <div
                                            key={tier.name}
                                            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${currentTier.name === tier.name
                                                    ? 'border-gold-500 bg-gold-50/50 dark:bg-gold-500/5 ring-4 ring-gold-500/10'
                                                    : 'border-neutral-100 dark:border-neutral-700 hover:border-neutral-200 dark:hover:border-neutral-600'
                                                }`}
                                        >
                                            {currentTier.name === tier.name && (
                                                <div className="absolute -top-3 -right-3 bg-gold-500 text-white rounded-full p-1.5 shadow-lg">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`w-12 h-12 rounded-xl ${tier.color} flex items-center justify-center text-white shadow-lg`}>
                                                    <tier.icon size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{tier.name}</h3>
                                                    <p className="text-xs text-neutral-500 font-bold">{tier.points} Points</p>
                                                </div>
                                            </div>

                                            <ul className="space-y-2">
                                                {tier.benefits.map((benefit, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                                        <ShieldCheck className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                                                        {benefit}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* How to earn */}
                        <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-8">
                            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                <TrendingUp className="text-green-500" />
                                Comment gagner des points ?
                            </h2>
                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="group cursor-pointer">
                                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Zap className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h4 className="font-bold mb-1">Achats Directs</h4>
                                    <p className="text-sm text-neutral-500 leading-relaxed">Gagnez 1 point pour chaque 100 HTG dépensés sur la marketplace.</p>
                                </div>
                                <div className="group cursor-pointer">
                                    <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Star className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h4 className="font-bold mb-1">Avis Produits</h4>
                                    <p className="text-sm text-neutral-500 leading-relaxed">Recevez 50 points pour chaque avis détaillé et vérifié publié.</p>
                                </div>
                                <div className="group cursor-pointer">
                                    <div className="w-14 h-14 bg-gold-100 dark:bg-gold-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Gift className="text-gold-600 dark:text-gold-400" />
                                    </div>
                                    <h4 className="font-bold mb-1">Parrainage</h4>
                                    <p className="text-sm text-neutral-500 leading-relaxed">Gagnez 200 points quand un ami passe sa première commande.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Rewards & Actions */}
                    <div className="space-y-8">
                        {/* Current Rewards */}
                        <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                            <div className="p-6 bg-neutral-900 text-white flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Gift className="text-gold-400" size={20} />
                                    Récompenses
                                </h3>
                                <button className="text-xs text-gold-400 font-bold hover:underline">Tout voir</button>
                            </div>
                            <div className="p-4 space-y-3">
                                {rewards.map((reward) => (
                                    <div
                                        key={reward.id}
                                        className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-400 group-hover:bg-gold-500 group-hover:text-white transition-colors">
                                                <reward.icon size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{reward.title}</p>
                                                <p className="text-[10px] uppercase font-black text-neutral-400 tracking-widest">{reward.type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black text-sm ${points >= reward.cost ? 'text-green-600' : 'text-neutral-400'}`}>
                                                {reward.cost} <span className="text-[10px] font-bold">PTS</span>
                                            </p>
                                            <button
                                                disabled={points < reward.cost}
                                                className={`text-[10px] font-black uppercase text-blue-500 hover:underline disabled:hidden`}
                                            >
                                                Échanger
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/20">
                                <p className="text-xs text-neutral-500 text-center">
                                    Les récompenses sont envoyées directement par email ou créditées sur votre compte.
                                </p>
                            </div>
                        </div>

                        {/* Points History Snippet */}
                        <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-8">
                            <h3 className="font-bold mb-6 flex items-center gap-2">
                                <History size={20} className="text-neutral-400" />
                                Activités Récentes
                            </h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-px bg-neutral-200 dark:bg-neutral-700 relative">
                                        <div className="absolute top-0 -left-1 w-2 h-2 rounded-full bg-blue-500"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Bienvenue au Club</p>
                                        <p className="text-xs text-neutral-500 mb-1">Points bonus de bienvenue</p>
                                        <span className="text-[10px] font-black text-green-500">+100 PTS</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 opacity-50">
                                    <div className="w-px bg-neutral-200 dark:bg-neutral-700 relative">
                                        <div className="absolute top-0 -left-1 w-2 h-2 rounded-full bg-neutral-400"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Premier Achat</p>
                                        <p className="text-xs text-neutral-500 mb-1">Commande #12345</p>
                                        <span className="text-[10px] font-black text-neutral-400">À venir...</span>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-8 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2">
                                Voir tout l'historique
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="container mx-auto px-4 mt-16">
                <div className="bg-gradient-to-r from-gold-500 to-amber-500 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-gold-500/20">
                    <div className="text-center md:text-left mb-8 md:mb-0">
                        <h2 className="text-3xl font-black text-primary-900 mb-2 italic">Prêt à dépenser ?</h2>
                        <p className="text-primary-900/80 font-bold">Accumulez des points en explorant nos milliers de produits.</p>
                    </div>
                    <Button
                        size="xl"
                        variant="primary"
                        onClick={() => navigate('/catalog')}
                        className="bg-primary-900 text-white hover:bg-primary-800 px-12 shadow-xl hover:scale-105 transition-all"
                    >
                        Parcourir le Catalogue
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LoyaltyProgram;
