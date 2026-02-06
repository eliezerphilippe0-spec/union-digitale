/**
 * Loyalty Program Context - Gamified Rewards System
 * Inspired by: Grab Rewards, Starbucks Rewards, Amazon Prime
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const LoyaltyContext = createContext();

// Tier definitions
const TIERS = {
    bronze: {
        name: 'Bronze',
        icon: '🥉',
        minPoints: 0,
        maxPoints: 999,
        color: 'from-amber-600 to-amber-700',
        benefits: ['1% cashback', 'Accès ventes flash'],
        multiplier: 1,
    },
    silver: {
        name: 'Argent',
        icon: '🥈',
        minPoints: 1000,
        maxPoints: 4999,
        color: 'from-gray-400 to-gray-500',
        benefits: ['2% cashback', 'Livraison prioritaire', 'Support prioritaire'],
        multiplier: 1.5,
    },
    gold: {
        name: 'Or',
        icon: '🥇',
        minPoints: 5000,
        maxPoints: 14999,
        color: 'from-yellow-400 to-yellow-600',
        benefits: ['3% cashback', 'Livraison gratuite', 'Accès early bird', 'Cadeaux anniversaire'],
        multiplier: 2,
    },
    platinum: {
        name: 'Platine',
        icon: '💎',
        minPoints: 15000,
        maxPoints: 49999,
        color: 'from-purple-400 to-purple-600',
        benefits: ['5% cashback', 'Livraison express gratuite', 'Conciergerie VIP', 'Événements exclusifs'],
        multiplier: 3,
    },
    diamond: {
        name: 'Diamant',
        icon: '👑',
        minPoints: 50000,
        maxPoints: Infinity,
        color: 'from-cyan-400 to-blue-600',
        benefits: ['7% cashback', 'Personal shopper', 'Retours illimités', 'Accès privé nouvelles collections'],
        multiplier: 5,
    },
};

// Achievement badges
const BADGES = {
    first_purchase: { id: 'first_purchase', name: 'Première Commande', icon: '🎉', points: 50, description: 'Effectuer votre première commande' },
    five_orders: { id: 'five_orders', name: 'Client Fidèle', icon: '⭐', points: 100, description: '5 commandes complétées' },
    ten_orders: { id: 'ten_orders', name: 'Super Client', icon: '🌟', points: 200, description: '10 commandes complétées' },
    fifty_orders: { id: 'fifty_orders', name: 'Légende', icon: '👑', points: 500, description: '50 commandes complétées' },
    first_review: { id: 'first_review', name: 'Critique', icon: '✍️', points: 25, description: 'Écrire votre premier avis' },
    ten_reviews: { id: 'ten_reviews', name: 'Influenceur', icon: '📝', points: 150, description: '10 avis publiés' },
    referral: { id: 'referral', name: 'Ambassadeur', icon: '🤝', points: 200, description: 'Parrainer un ami' },
    five_referrals: { id: 'five_referrals', name: 'Recruteur', icon: '🎯', points: 500, description: 'Parrainer 5 amis' },
    big_spender: { id: 'big_spender', name: 'Big Spender', icon: '💰', points: 300, description: 'Dépenser 50,000 G en une commande' },
    early_bird: { id: 'early_bird', name: 'Lève-tôt', icon: '🌅', points: 50, description: 'Commander avant 7h du matin' },
    night_owl: { id: 'night_owl', name: 'Noctambule', icon: '🦉', points: 50, description: 'Commander après minuit' },
    category_explorer: { id: 'category_explorer', name: 'Explorateur', icon: '🧭', points: 100, description: 'Acheter dans 5 catégories différentes' },
    streak_7: { id: 'streak_7', name: 'Série de 7', icon: '🔥', points: 100, description: 'Commander 7 jours consécutifs' },
    local_supporter: { id: 'local_supporter', name: 'Patriote', icon: '🇭🇹', points: 150, description: 'Acheter 10 produits locaux' },
};

// Daily challenges
const generateDailyChallenges = () => [
    { id: 'daily_purchase', name: 'Achat du jour', description: 'Effectuer un achat aujourd\'hui', points: 20, type: 'purchase', target: 1, progress: 0 },
    { id: 'daily_review', name: 'Partagez votre avis', description: 'Écrire un avis produit', points: 15, type: 'review', target: 1, progress: 0 },
    { id: 'daily_share', name: 'Partageur', description: 'Partager un produit sur les réseaux', points: 10, type: 'share', target: 1, progress: 0 },
    { id: 'daily_favorite', name: 'Coup de cœur', description: 'Ajouter 3 produits aux favoris', points: 10, type: 'favorite', target: 3, progress: 0 },
];

export const LoyaltyProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [loyaltyData, setLoyaltyData] = useState({
        points: 0,
        lifetimePoints: 0,
        tier: 'bronze',
        badges: [],
        dailyChallenges: generateDailyChallenges(),
        streak: 0,
        lastActivityDate: null,
        stats: {
            totalOrders: 0,
            totalSpent: 0,
            totalReviews: 0,
            totalReferrals: 0,
            categoriesPurchased: [],
        },
    });

    // Calculate current tier based on lifetime points
    const calculateTier = (lifetimePoints) => {
        if (lifetimePoints >= TIERS.diamond.minPoints) return 'diamond';
        if (lifetimePoints >= TIERS.platinum.minPoints) return 'platinum';
        if (lifetimePoints >= TIERS.gold.minPoints) return 'gold';
        if (lifetimePoints >= TIERS.silver.minPoints) return 'silver';
        return 'bronze';
    };

    // Get tier info
    const getTierInfo = (tierKey = loyaltyData.tier) => TIERS[tierKey];
    
    // Get next tier info
    const getNextTier = () => {
        const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
        const currentIndex = tierOrder.indexOf(loyaltyData.tier);
        if (currentIndex < tierOrder.length - 1) {
            return TIERS[tierOrder[currentIndex + 1]];
        }
        return null;
    };

    // Calculate progress to next tier
    const getProgressToNextTier = () => {
        const nextTier = getNextTier();
        if (!nextTier) return 100;
        
        const currentTier = getTierInfo();
        const pointsInCurrentTier = loyaltyData.lifetimePoints - currentTier.minPoints;
        const pointsNeededForNextTier = nextTier.minPoints - currentTier.minPoints;
        
        return Math.min(100, (pointsInCurrentTier / pointsNeededForNextTier) * 100);
    };

    // Add points with multiplier
    const addPoints = (basePoints, reason = 'purchase') => {
        const multiplier = getTierInfo().multiplier;
        const earnedPoints = Math.floor(basePoints * multiplier);
        
        setLoyaltyData(prev => {
            const newLifetimePoints = prev.lifetimePoints + earnedPoints;
            const newTier = calculateTier(newLifetimePoints);
            
            return {
                ...prev,
                points: prev.points + earnedPoints,
                lifetimePoints: newLifetimePoints,
                tier: newTier,
            };
        });

        return earnedPoints;
    };

    // Redeem points
    const redeemPoints = (points) => {
        if (loyaltyData.points < points) return false;
        
        setLoyaltyData(prev => ({
            ...prev,
            points: prev.points - points,
        }));
        
        return true;
    };

    // Award badge
    const awardBadge = (badgeId) => {
        if (loyaltyData.badges.includes(badgeId)) return false;
        
        const badge = BADGES[badgeId];
        if (!badge) return false;

        setLoyaltyData(prev => ({
            ...prev,
            badges: [...prev.badges, badgeId],
            points: prev.points + badge.points,
            lifetimePoints: prev.lifetimePoints + badge.points,
        }));

        return badge;
    };

    // Check and award badges based on stats
    const checkBadges = (stats) => {
        const newBadges = [];
        
        if (stats.totalOrders >= 1 && !loyaltyData.badges.includes('first_purchase')) {
            newBadges.push(awardBadge('first_purchase'));
        }
        if (stats.totalOrders >= 5 && !loyaltyData.badges.includes('five_orders')) {
            newBadges.push(awardBadge('five_orders'));
        }
        if (stats.totalOrders >= 10 && !loyaltyData.badges.includes('ten_orders')) {
            newBadges.push(awardBadge('ten_orders'));
        }
        if (stats.totalOrders >= 50 && !loyaltyData.badges.includes('fifty_orders')) {
            newBadges.push(awardBadge('fifty_orders'));
        }
        if (stats.totalReviews >= 1 && !loyaltyData.badges.includes('first_review')) {
            newBadges.push(awardBadge('first_review'));
        }
        if (stats.totalReviews >= 10 && !loyaltyData.badges.includes('ten_reviews')) {
            newBadges.push(awardBadge('ten_reviews'));
        }
        
        return newBadges.filter(Boolean);
    };

    // Update daily challenge progress
    const updateChallengeProgress = (challengeType, increment = 1) => {
        setLoyaltyData(prev => ({
            ...prev,
            dailyChallenges: prev.dailyChallenges.map(challenge => {
                if (challenge.type === challengeType && challenge.progress < challenge.target) {
                    const newProgress = Math.min(challenge.progress + increment, challenge.target);
                    // Award points if completed
                    if (newProgress === challenge.target && challenge.progress < challenge.target) {
                        addPoints(challenge.points, 'challenge');
                    }
                    return { ...challenge, progress: newProgress };
                }
                return challenge;
            }),
        }));
    };

    // Record purchase (call after successful order)
    const recordPurchase = (orderTotal, categories = []) => {
        const pointsEarned = Math.floor(orderTotal / 100); // 1 point per 100 G spent
        addPoints(pointsEarned, 'purchase');
        
        setLoyaltyData(prev => {
            const newStats = {
                ...prev.stats,
                totalOrders: prev.stats.totalOrders + 1,
                totalSpent: prev.stats.totalSpent + orderTotal,
                categoriesPurchased: [...new Set([...prev.stats.categoriesPurchased, ...categories])],
            };
            
            return {
                ...prev,
                stats: newStats,
            };
        });

        updateChallengeProgress('purchase');
        checkBadges({ ...loyaltyData.stats, totalOrders: loyaltyData.stats.totalOrders + 1 });
    };

    // Get all badges info
    const getAllBadges = () => BADGES;
    
    // Get earned badges with details
    const getEarnedBadges = () => {
        return loyaltyData.badges.map(id => BADGES[id]).filter(Boolean);
    };

    // Convert points to currency value
    const pointsToCurrency = (points) => {
        return points * 10; // 1 point = 10 G
    };

    const value = {
        // Data
        loyaltyData,
        tiers: TIERS,
        badges: BADGES,
        
        // Tier functions
        getTierInfo,
        getNextTier,
        getProgressToNextTier,
        
        // Points functions
        addPoints,
        redeemPoints,
        pointsToCurrency,
        
        // Badge functions
        awardBadge,
        getAllBadges,
        getEarnedBadges,
        
        // Activity functions
        recordPurchase,
        updateChallengeProgress,
    };

    return (
        <LoyaltyContext.Provider value={value}>
            {children}
        </LoyaltyContext.Provider>
    );
};

export const useLoyalty = () => {
    const context = useContext(LoyaltyContext);
    if (!context) {
        throw new Error('useLoyalty must be used within a LoyaltyProvider');
    }
    return context;
};

export default LoyaltyContext;
