/**
 * Loyalty Dashboard - User Rewards & Progress
 * Gamified loyalty program interface
 */

import React from 'react';
import {
    Star, Gift, Trophy, Target, Zap, ChevronRight, Lock,
    CheckCircle, Clock, Flame, Crown, Medal, Award
} from 'lucide-react';
import { useLoyalty } from '../contexts/LoyaltyContext';

const LoyaltyDashboard = () => {
    const {
        loyaltyData,
        tiers,
        getTierInfo,
        getNextTier,
        getProgressToNextTier,
        getEarnedBadges,
        getAllBadges,
        pointsToCurrency,
    } = useLoyalty();

    const currentTier = getTierInfo();
    const nextTier = getNextTier();
    const progress = getProgressToNextTier();
    const earnedBadges = getEarnedBadges();
    const allBadges = getAllBadges();

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Hero Card */}
                <div className={`bg-gradient-to-r ${currentTier.color} rounded-3xl p-8 text-white mb-8 relative overflow-hidden`}>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="text-6xl">{currentTier.icon}</div>
                            <div>
                                <p className="text-white/70 text-sm">Votre niveau</p>
                                <h1 className="text-3xl font-bold">{currentTier.name}</h1>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Points */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                <p className="text-white/70 text-sm mb-1">Points disponibles</p>
                                <p className="text-3xl font-bold">{loyaltyData.points.toLocaleString()}</p>
                                <p className="text-white/70 text-sm">≈ {pointsToCurrency(loyaltyData.points).toLocaleString()} G</p>
                            </div>

                            {/* Lifetime Points */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                <p className="text-white/70 text-sm mb-1">Points à vie</p>
                                <p className="text-3xl font-bold">{loyaltyData.lifetimePoints.toLocaleString()}</p>
                                <p className="text-white/70 text-sm">Depuis votre inscription</p>
                            </div>

                            {/* Multiplier */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                <p className="text-white/70 text-sm mb-1">Multiplicateur</p>
                                <p className="text-3xl font-bold">x{currentTier.multiplier}</p>
                                <p className="text-white/70 text-sm">Sur tous vos achats</p>
                            </div>
                        </div>

                        {/* Progress to next tier */}
                        {nextTier && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-white/70">Prochain niveau: {nextTier.name} {nextTier.icon}</span>
                                    <span className="text-sm font-medium">
                                        {loyaltyData.lifetimePoints.toLocaleString()} / {nextTier.minPoints.toLocaleString()} pts
                                    </span>
                                </div>
                                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-white rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-sm text-white/70 mt-2">
                                    Plus que {(nextTier.minPoints - loyaltyData.lifetimePoints).toLocaleString()} points pour atteindre {nextTier.name}!
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Daily Challenges */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Flame className="w-6 h-6 text-orange-500" />
                                    Défis du jour
                                </h2>
                                <span className="text-sm text-gray-500">
                                    Réinitialisé dans 12h
                                </span>
                            </div>
                            
                            <div className="space-y-4">
                                {loyaltyData.dailyChallenges.map(challenge => {
                                    const isCompleted = challenge.progress >= challenge.target;
                                    return (
                                        <div 
                                            key={challenge.id}
                                            className={`flex items-center gap-4 p-4 rounded-xl ${
                                                isCompleted ? 'bg-green-50' : 'bg-gray-50'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                            }`}>
                                                {isCompleted ? (
                                                    <CheckCircle className="w-6 h-6 text-white" />
                                                ) : (
                                                    <Target className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-semibold ${isCompleted ? 'text-green-700' : 'text-gray-900'}`}>
                                                    {challenge.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">{challenge.description}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gold-500'}`}
                                                            style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {challenge.progress}/{challenge.target}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-sm font-bold ${isCompleted ? 'text-green-600' : 'text-gold-600'}`}>
                                                    +{challenge.points} pts
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                                <Medal className="w-6 h-6 text-gold-500" />
                                Badges ({earnedBadges.length}/{Object.keys(allBadges).length})
                            </h2>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.values(allBadges).map(badge => {
                                    const isEarned = loyaltyData.badges.includes(badge.id);
                                    return (
                                        <div 
                                            key={badge.id}
                                            className={`text-center p-4 rounded-xl ${
                                                isEarned ? 'bg-gold-50' : 'bg-gray-50 opacity-50'
                                            }`}
                                        >
                                            <div className={`text-4xl mb-2 ${!isEarned && 'grayscale'}`}>
                                                {badge.icon}
                                            </div>
                                            <h3 className="font-semibold text-sm text-gray-900">{badge.name}</h3>
                                            <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                                            {isEarned ? (
                                                <span className="inline-block mt-2 text-xs text-green-600 font-medium">
                                                    ✓ Obtenu
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 mt-2 text-xs text-gray-400">
                                                    <Lock className="w-3 h-3" /> +{badge.points} pts
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rewards to Redeem */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                                <Gift className="w-6 h-6 text-pink-500" />
                                Récompenses disponibles
                            </h2>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    { points: 500, reward: '500 G de réduction', icon: '🎫' },
                                    { points: 1000, reward: 'Livraison gratuite x3', icon: '🚚' },
                                    { points: 2500, reward: 'Produit mystère', icon: '🎁' },
                                    { points: 5000, reward: 'Accès VIP 1 mois', icon: '👑' },
                                ].map((item, index) => (
                                    <button
                                        key={index}
                                        disabled={loyaltyData.points < item.points}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                            loyaltyData.points >= item.points
                                                ? 'border-gold-200 hover:border-gold-400 bg-white'
                                                : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="text-3xl">{item.icon}</div>
                                        <div className="flex-1 text-left">
                                            <h3 className="font-semibold text-gray-900">{item.reward}</h3>
                                            <p className="text-sm text-gold-600">{item.points} points</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Current Benefits */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Crown className="w-5 h-5 text-gold-500" />
                                Vos avantages {currentTier.name}
                            </h3>
                            <ul className="space-y-3">
                                {currentTier.benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* All Tiers */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">Tous les niveaux</h3>
                            <div className="space-y-3">
                                {Object.entries(tiers).map(([key, tier]) => {
                                    const isCurrentTier = key === loyaltyData.tier;
                                    const isLocked = tier.minPoints > loyaltyData.lifetimePoints;
                                    
                                    return (
                                        <div 
                                            key={key}
                                            className={`flex items-center gap-3 p-3 rounded-xl ${
                                                isCurrentTier ? 'bg-gold-50 border-2 border-gold-200' : 
                                                isLocked ? 'opacity-50' : 'bg-gray-50'
                                            }`}
                                        >
                                            <span className="text-2xl">{tier.icon}</span>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm">{tier.name}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {tier.minPoints.toLocaleString()}+ pts
                                                </p>
                                            </div>
                                            <span className="text-xs font-medium text-gold-600">
                                                x{tier.multiplier}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* How to earn */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                Comment gagner des points?
                            </h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-600">Achat (100 G = 1 pt)</span>
                                    <span className="font-medium text-gold-600">×{currentTier.multiplier}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-600">Écrire un avis</span>
                                    <span className="font-medium text-gold-600">+25 pts</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-600">Parrainer un ami</span>
                                    <span className="font-medium text-gold-600">+200 pts</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-600">Défis quotidiens</span>
                                    <span className="font-medium text-gold-600">Variable</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoyaltyDashboard;
