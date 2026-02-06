import React from 'react';
import { 
  Star, Gift, TrendingUp, Award, Target,
  Clock, ChevronRight, Zap, Shield
} from 'lucide-react';
import { useLoyalty } from '../contexts/LoyaltyContext';

const tierColors = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-purple-400 to-purple-700',
  diamond: 'from-cyan-300 to-blue-600'
};

const tierIcons = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑'
};

export default function LoyaltyDashboard() {
  const { 
    points, 
    tier, 
    badges, 
    dailyChallenges, 
    streakDays,
    completeDailyChallenge,
    redeemReward
  } = useLoyalty();

  const rewards = [
    { id: 1, name: '5% de réduction', points: 500, icon: '🏷️' },
    { id: 2, name: 'Livraison gratuite', points: 800, icon: '🚚' },
    { id: 3, name: '10% de réduction', points: 1200, icon: '🎁' },
    { id: 4, name: 'Accès VIP ventes flash', points: 2000, icon: '⚡' },
    { id: 5, name: 'Produit mystère', points: 3000, icon: '🎲' },
  ];

  const nextTierPoints = {
    bronze: 1000,
    silver: 5000,
    gold: 15000,
    platinum: 50000,
    diamond: Infinity
  };

  const progress = tier === 'diamond' ? 100 : (points / nextTierPoints[tier]) * 100;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className={`bg-gradient-to-r ${tierColors[tier]} text-white px-4 py-8`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80">Votre niveau</p>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {tierIcons[tier]} {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Points disponibles</p>
            <p className="text-3xl font-bold">{points.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress to next tier */}
        {tier !== 'diamond' && (
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
        <p className="text-xs mt-2 opacity-80">
          {tier === 'diamond' 
            ? '👑 Niveau maximum atteint!' 
            : `${nextTierPoints[tier] - points} points pour le niveau suivant`
          }
        </p>
      </div>

      {/* Streak */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap className="text-orange-500" size={24} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Série en cours</p>
              <p className="text-sm text-gray-600">{streakDays} jours consécutifs</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-500">{streakDays}🔥</p>
          </div>
        </div>
      </div>

      {/* Daily Challenges */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Défis du jour</h2>
          <span className="text-sm text-gray-500">
            {dailyChallenges.filter(c => c.completed).length}/{dailyChallenges.length} complétés
          </span>
        </div>

        <div className="space-y-3">
          {dailyChallenges.map(challenge => (
            <div 
              key={challenge.id}
              className={`bg-white rounded-xl p-4 border ${
                challenge.completed ? 'border-green-200 bg-green-50' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    challenge.completed ? 'bg-green-100' : 'bg-primary-50'
                  }`}>
                    {challenge.completed ? (
                      <Award className="text-green-600" size={20} />
                    ) : (
                      <Target className="text-primary-600" size={20} />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${challenge.completed ? 'text-green-700' : 'text-gray-900'}`}>
                      {challenge.title}
                    </p>
                    <p className="text-xs text-gray-500">{challenge.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-primary-600">
                    +{challenge.points} pts
                  </span>
                  {challenge.completed && (
                    <p className="text-xs text-green-600">✓ Complété</p>
                  )}
                </div>
              </div>
              
              {!challenge.completed && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progression</span>
                    <span>{challenge.progress}/{challenge.target}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-full rounded-full transition-all"
                      style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">Mes badges</h2>
        <div className="grid grid-cols-4 gap-3">
          {badges.map(badge => (
            <div 
              key={badge.id}
              className={`text-center p-3 rounded-xl ${
                badge.unlocked ? 'bg-white shadow' : 'bg-gray-100 opacity-50'
              }`}
            >
              <span className="text-3xl">{badge.icon}</span>
              <p className="text-xs mt-1 font-medium text-gray-700">{badge.name}</p>
              {!badge.unlocked && (
                <p className="text-xs text-gray-400">🔒</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rewards Catalog */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">Échangez vos points</h2>
        <div className="space-y-3">
          {rewards.map(reward => {
            const canRedeem = points >= reward.points;
            return (
              <div 
                key={reward.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{reward.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{reward.name}</p>
                    <p className="text-sm text-primary-600 font-semibold">{reward.points} points</p>
                  </div>
                </div>
                <button
                  onClick={() => canRedeem && redeemReward(reward)}
                  disabled={!canRedeem}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    canRedeem
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {canRedeem ? 'Échanger' : 'Insuffisant'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="px-4 mt-6 mb-8">
        <h2 className="text-lg font-semibold mb-3">Avantages {tier}</h2>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <ul className="space-y-3">
            {tier === 'bronze' && (
              <>
                <li className="flex items-center gap-2 text-sm">
                  <Star className="text-amber-600" /> 1 point par 100 FCFA dépensés
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Gift className="text-amber-600" /> Offres anniversaire
                </li>
              </>
            )}
            {tier === 'silver' && (
              <>
                <li className="flex items-center gap-2 text-sm">
                  <Star className="text-gray-500" /> 1.5x points sur tous les achats
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <TrendingUp className="text-gray-500" /> Accès ventes privées
                </li>
              </>
            )}
            {tier === 'gold' && (
              <>
                <li className="flex items-center gap-2 text-sm">
                  <Star className="text-yellow-500" /> 2x points sur tous les achats
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Zap className="text-yellow-500" /> Livraison prioritaire
                </li>
              </>
            )}
            {(tier === 'platinum' || tier === 'diamond') && (
              <>
                <li className="flex items-center gap-2 text-sm">
                  <Star className="text-purple-500" /> 3x points sur tous les achats
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Shield className="text-purple-500" /> Support client prioritaire
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Gift className="text-purple-500" /> Cadeaux exclusifs mensuels
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
