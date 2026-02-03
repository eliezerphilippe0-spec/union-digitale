/**
 * Affiliate Tier Progress Component
 * Shows current tier, progress to next tier, and milestones
 */

import React, { useState, useEffect } from 'react';
import { Award, Gift, ChevronRight, Check, Lock, Loader2, TrendingUp } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

interface Tier {
  id: string;
  name: string;
  threshold: number;
  bonusValue: number;
  bonusDescription: string;
  color: string;
  icon: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  threshold: number;
  rewardValue: number;
  claimed: boolean;
  canClaim: boolean;
  progress: number;
  currentValue: number;
}

interface TierData {
  currentTier: Tier;
  nextTier: Tier | null;
  progress: number;
  remaining: number;
  referralsCount: number;
}

export default function AffiliateTierProgress() {
  const [tierData, setTierData] = useState<TierData | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Get tier data
      const getTier = httpsCallable(functions, 'getAffiliateTier');
      const tierResult = await getTier({});
      setTierData((tierResult.data as any));

      // Get milestones
      const getMilestones = httpsCallable(functions, 'getAffiliateMilestones');
      const milestonesResult = await getMilestones({});
      setMilestones((milestonesResult.data as any).milestones || []);
    } catch (error) {
      console.error('Error loading tier data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function claimMilestones() {
    try {
      setClaiming(true);
      const checkBonuses = httpsCallable(functions, 'checkMilestoneBonuses');
      const result = await checkBonuses({});
      const data = result.data as any;

      if (data.newBonuses && data.newBonuses.length > 0) {
        alert(`🎉 ${data.newBonuses.length} bonus réclamé(s)!`);
        loadData(); // Reload
      } else {
        alert('Aucun nouveau bonus disponible');
      }
    } catch (error) {
      console.error('Error claiming milestones:', error);
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!tierData) return null;

  const tierColors: Record<string, string> = {
    Bronze: 'from-amber-600 to-amber-700',
    Argent: 'from-gray-400 to-gray-500',
    Or: 'from-yellow-400 to-yellow-500',
    Platine: 'from-purple-400 to-purple-500',
    Diamant: 'from-cyan-400 to-blue-500',
  };

  const hasClaimable = milestones.some(m => m.canClaim);

  return (
    <div className="space-y-6">
      {/* Current Tier Card */}
      <div className={`bg-gradient-to-br ${tierColors[tierData.currentTier.name] || tierColors.Bronze} rounded-xl p-6 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{tierData.currentTier.icon}</span>
            <div>
              <p className="text-sm opacity-80">Niveau actuel</p>
              <h3 className="text-2xl font-bold">{tierData.currentTier.name}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Bonus</p>
            <p className="text-xl font-bold">
              {tierData.currentTier.bonusValue > 0
                ? `+${tierData.currentTier.bonusValue}%`
                : 'Base'}
            </p>
          </div>
        </div>

        {tierData.nextTier && (
          <>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progression vers {tierData.nextTier.name}</span>
              <span>{tierData.referralsCount} / {tierData.nextTier.threshold} ventes</span>
            </div>
            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${tierData.progress}%` }}
              />
            </div>
            <p className="text-sm opacity-80 mt-2">
              Plus que {tierData.remaining} vente(s) pour débloquer +{tierData.nextTier.bonusValue}%
            </p>
          </>
        )}

        {!tierData.nextTier && (
          <p className="text-center text-lg mt-4">
            🏆 Niveau maximum atteint!
          </p>
        )}
      </div>

      {/* All Tiers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Niveaux & Bonus
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { name: 'Bronze', icon: '🥉', threshold: 0, bonus: 0 },
            { name: 'Argent', icon: '🥈', threshold: 10, bonus: 1 },
            { name: 'Or', icon: '🥇', threshold: 50, bonus: 2 },
            { name: 'Platine', icon: '💎', threshold: 100, bonus: 3 },
            { name: 'Diamant', icon: '👑', threshold: 500, bonus: 5 },
          ].map((tier, index) => {
            const isCurrentTier = tier.name === tierData.currentTier.name;
            const isUnlocked = tierData.referralsCount >= tier.threshold;

            return (
              <div
                key={tier.name}
                className={`flex items-center justify-between p-4 ${
                  isCurrentTier ? 'bg-orange-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tier.icon}</span>
                  <div>
                    <p className={`font-medium ${isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                      {tier.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tier.threshold === 0 ? 'Début' : `${tier.threshold} ventes`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${isUnlocked ? 'text-green-600' : 'text-gray-400'}`}>
                    {tier.bonus > 0 ? `+${tier.bonus}%` : 'Base'}
                  </span>
                  {isUnlocked ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-500" />
            Objectifs & Bonus
          </h3>
          {hasClaimable && (
            <button
              onClick={claimMilestones}
              disabled={claiming}
              className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {claiming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Gift className="w-4 h-4" />
              )}
              Réclamer
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`p-4 ${milestone.claimed ? 'bg-green-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {milestone.claimed ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                  ) : milestone.canClaim ? (
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
                      <Gift className="w-5 h-5 text-orange-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className={`font-medium ${milestone.claimed ? 'text-green-700' : 'text-gray-900'}`}>
                      {milestone.name}
                    </p>
                    <p className="text-sm text-gray-500">{milestone.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${milestone.claimed ? 'text-green-600' : 'text-orange-500'}`}>
                    +{milestone.rewardValue.toLocaleString()} G
                  </p>
                  {!milestone.claimed && (
                    <p className="text-xs text-gray-500">
                      {milestone.currentValue}/{milestone.threshold}
                    </p>
                  )}
                </div>
              </div>
              {!milestone.claimed && (
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      milestone.canClaim ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
