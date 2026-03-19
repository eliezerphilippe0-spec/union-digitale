/**
 * Affiliate Bonus System
 * Tiered bonuses based on performance thresholds
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ============================================================================
// BONUS TIERS CONFIGURATION
// ============================================================================

interface BonusTier {
  id: string;
  name: string;
  threshold: number;       // Minimum sales to reach this tier
  thresholdType: 'sales' | 'referrals' | 'earnings';
  bonusType: 'percentage' | 'fixed';
  bonusValue: number;
  color: string;
  icon: string;
}

const DEFAULT_BONUS_TIERS: BonusTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    threshold: 0,
    thresholdType: 'referrals',
    bonusType: 'percentage',
    bonusValue: 0,        // Base rate, no bonus
    color: '#CD7F32',
    icon: '🥉',
  },
  {
    id: 'silver',
    name: 'Argent',
    threshold: 10,
    thresholdType: 'referrals',
    bonusType: 'percentage',
    bonusValue: 1,        // +1% bonus
    color: '#C0C0C0',
    icon: '🥈',
  },
  {
    id: 'gold',
    name: 'Or',
    threshold: 50,
    thresholdType: 'referrals',
    bonusType: 'percentage',
    bonusValue: 2,        // +2% bonus
    color: '#FFD700',
    icon: '🥇',
  },
  {
    id: 'platinum',
    name: 'Platine',
    threshold: 100,
    thresholdType: 'referrals',
    bonusType: 'percentage',
    bonusValue: 3,        // +3% bonus
    color: '#E5E4E2',
    icon: '💎',
  },
  {
    id: 'diamond',
    name: 'Diamant',
    threshold: 500,
    thresholdType: 'referrals',
    bonusType: 'percentage',
    bonusValue: 5,        // +5% bonus
    color: '#B9F2FF',
    icon: '👑',
  },
];

// Milestone bonuses (one-time rewards)
interface MilestoneBonus {
  id: string;
  name: string;
  threshold: number;
  thresholdType: 'referrals' | 'earnings' | 'sales';
  rewardType: 'cash' | 'credit';
  rewardValue: number;
  description: string;
}

const MILESTONE_BONUSES: MilestoneBonus[] = [
  {
    id: 'first_sale',
    name: 'Première Vente',
    threshold: 1,
    thresholdType: 'referrals',
    rewardType: 'cash',
    rewardValue: 500,     // 500 G bonus
    description: 'Félicitations pour votre première vente!',
  },
  {
    id: 'ten_sales',
    name: '10 Ventes',
    threshold: 10,
    thresholdType: 'referrals',
    rewardType: 'cash',
    rewardValue: 2500,    // 2500 G bonus
    description: 'Vous avez atteint 10 ventes!',
  },
  {
    id: 'fifty_sales',
    name: '50 Ventes',
    threshold: 50,
    thresholdType: 'referrals',
    rewardType: 'cash',
    rewardValue: 10000,   // 10,000 G bonus
    description: 'Incroyable! 50 ventes réalisées!',
  },
  {
    id: 'hundred_sales',
    name: '100 Ventes',
    threshold: 100,
    thresholdType: 'referrals',
    rewardType: 'cash',
    rewardValue: 25000,   // 25,000 G bonus
    description: 'Vous êtes un super ambassadeur!',
  },
  {
    id: 'earnings_10k',
    name: '10,000 G Gagnés',
    threshold: 10000,
    thresholdType: 'earnings',
    rewardType: 'cash',
    rewardValue: 2000,    // 2000 G bonus
    description: 'Vous avez gagné plus de 10,000 G!',
  },
  {
    id: 'earnings_50k',
    name: '50,000 G Gagnés',
    threshold: 50000,
    thresholdType: 'earnings',
    rewardType: 'cash',
    rewardValue: 7500,    // 7500 G bonus
    description: 'Plus de 50,000 G de gains!',
  },
];

// ============================================================================
// TIER MANAGEMENT
// ============================================================================

/**
 * Get current tier for an affiliate
 */
export const getAffiliateTier = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  try {
    // Get affiliate data
    let affiliateDoc = await db.doc(`ambassadors/${userId}`).get();
    if (!affiliateDoc.exists) {
      affiliateDoc = await db.doc(`affiliates/${userId}`).get();
    }

    if (!affiliateDoc.exists) {
      throw new HttpsError('not-found', 'Affiliate not found');
    }

    const affiliate = affiliateDoc.data()!;
    const referralsCount = affiliate.referralsCount || 0;

    // Determine current tier
    let currentTier = DEFAULT_BONUS_TIERS[0];
    let nextTier: BonusTier | null = null;

    for (let i = 0; i < DEFAULT_BONUS_TIERS.length; i++) {
      const tier = DEFAULT_BONUS_TIERS[i];
      if (referralsCount >= tier.threshold) {
        currentTier = tier;
        nextTier = DEFAULT_BONUS_TIERS[i + 1] || null;
      }
    }

    // Calculate progress to next tier
    let progress = 100;
    let remaining = 0;
    if (nextTier) {
      const currentThreshold = currentTier.threshold;
      const nextThreshold = nextTier.threshold;
      progress = Math.min(
        100,
        ((referralsCount - currentThreshold) / (nextThreshold - currentThreshold)) * 100
      );
      remaining = nextThreshold - referralsCount;
    }

    return {
      success: true,
      currentTier: {
        ...currentTier,
        bonusDescription: currentTier.bonusValue > 0
          ? `+${currentTier.bonusValue}% sur chaque vente`
          : 'Taux de base',
      },
      nextTier: nextTier ? {
        ...nextTier,
        bonusDescription: `+${nextTier.bonusValue}% sur chaque vente`,
      } : null,
      progress: Math.round(progress),
      remaining,
      referralsCount,
    };
  } catch (error: any) {
    console.error('Error getting affiliate tier:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

/**
 * Check and award milestone bonuses
 */
export const checkMilestoneBonuses = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  try {
    // Get affiliate data
    let affiliateRef = db.doc(`ambassadors/${userId}`);
    let affiliateDoc = await affiliateRef.get();

    if (!affiliateDoc.exists) {
      affiliateRef = db.doc(`affiliates/${userId}`);
      affiliateDoc = await affiliateRef.get();
    }

    if (!affiliateDoc.exists) {
      throw new HttpsError('not-found', 'Affiliate not found');
    }

    const affiliate = affiliateDoc.data()!;
    const referralsCount = affiliate.referralsCount || 0;
    const totalEarnings = affiliate.totalEarnings || 0;
    const claimedMilestones = affiliate.claimedMilestones || [];

    const newBonuses: any[] = [];

    for (const milestone of MILESTONE_BONUSES) {
      // Skip if already claimed
      if (claimedMilestones.includes(milestone.id)) continue;

      // Check if threshold reached
      let currentValue = 0;
      switch (milestone.thresholdType) {
        case 'referrals':
          currentValue = referralsCount;
          break;
        case 'earnings':
          currentValue = totalEarnings;
          break;
      }

      if (currentValue >= milestone.threshold) {
        // Award bonus
        await db.runTransaction(async (transaction) => {
          // Update affiliate
          transaction.update(affiliateRef, {
            claimedMilestones: FieldValue.arrayUnion(milestone.id),
            totalEarnings: FieldValue.increment(milestone.rewardValue),
            bonusEarnings: FieldValue.increment(milestone.rewardValue),
          });

          // Log bonus
          transaction.set(db.collection('affiliate_bonuses').doc(), {
            affiliateId: userId,
            milestoneId: milestone.id,
            milestoneName: milestone.name,
            amount: milestone.rewardValue,
            description: milestone.description,
            claimedAt: FieldValue.serverTimestamp(),
          });

          // Create notification
          transaction.set(db.collection('notifications').doc(), {
            userId,
            type: 'bonus_earned',
            title: `🎉 Bonus débloqué: ${milestone.name}`,
            message: `${milestone.description} +${milestone.rewardValue.toLocaleString()} G`,
            amount: milestone.rewardValue,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });
        });

        newBonuses.push({
          ...milestone,
          amount: milestone.rewardValue,
        });

        console.log(`✅ Milestone bonus awarded: ${milestone.name} to ${userId}`);
      }
    }

    return {
      success: true,
      newBonuses,
      message: newBonuses.length > 0
        ? `${newBonuses.length} bonus débloqué(s)!`
        : 'Aucun nouveau bonus',
    };
  } catch (error: any) {
    console.error('Error checking milestones:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

/**
 * Get available and claimed milestones
 */
export const getAffiliateMilestones = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  try {
    let affiliateDoc = await db.doc(`ambassadors/${userId}`).get();
    if (!affiliateDoc.exists) {
      affiliateDoc = await db.doc(`affiliates/${userId}`).get();
    }

    if (!affiliateDoc.exists) {
      throw new HttpsError('not-found', 'Affiliate not found');
    }

    const affiliate = affiliateDoc.data()!;
    const claimedMilestones = affiliate.claimedMilestones || [];
    const referralsCount = affiliate.referralsCount || 0;
    const totalEarnings = affiliate.totalEarnings || 0;

    const milestones = MILESTONE_BONUSES.map(milestone => {
      let currentValue = 0;
      switch (milestone.thresholdType) {
        case 'referrals':
          currentValue = referralsCount;
          break;
        case 'earnings':
          currentValue = totalEarnings;
          break;
      }

      const claimed = claimedMilestones.includes(milestone.id);
      const progress = Math.min(100, (currentValue / milestone.threshold) * 100);

      return {
        ...milestone,
        claimed,
        progress: Math.round(progress),
        currentValue,
        canClaim: !claimed && currentValue >= milestone.threshold,
      };
    });

    return {
      success: true,
      milestones,
      totalBonusEarned: affiliate.bonusEarnings || 0,
    };
  } catch (error: any) {
    console.error('Error getting milestones:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

/**
 * Calculate bonus-adjusted commission rate
 */
export async function getAdjustedCommissionRate(
  baseRate: number,
  affiliateId: string
): Promise<{ rate: number; bonus: number; tier: string }> {
  try {
    let affiliateDoc = await db.doc(`ambassadors/${affiliateId}`).get();
    if (!affiliateDoc.exists) {
      affiliateDoc = await db.doc(`affiliates/${affiliateId}`).get();
    }

    if (!affiliateDoc.exists) {
      return { rate: baseRate, bonus: 0, tier: 'Bronze' };
    }

    const affiliate = affiliateDoc.data()!;
    const referralsCount = affiliate.referralsCount || 0;

    // Find current tier
    let currentTier = DEFAULT_BONUS_TIERS[0];
    for (const tier of DEFAULT_BONUS_TIERS) {
      if (referralsCount >= tier.threshold) {
        currentTier = tier;
      }
    }

    const bonusRate = currentTier.bonusValue / 100;
    const adjustedRate = baseRate + bonusRate;

    return {
      rate: adjustedRate,
      bonus: currentTier.bonusValue,
      tier: currentTier.name,
    };
  } catch (error) {
    console.error('Error getting adjusted rate:', error);
    return { rate: baseRate, bonus: 0, tier: 'Bronze' };
  }
}

// ============================================================================
// SCHEDULED JOBS
// ============================================================================

/**
 * Monthly tier recalculation and notifications
 * Runs on the 1st of each month at 3 AM
 */
export const monthlyTierUpdate = onSchedule('0 3 1 * *', async () => {
  console.log('Starting monthly tier update...');

  try {
    // Get all affiliates
    const ambassadors = await db.collection('ambassadors').get();
    const affiliates = await db.collection('affiliates').get();

    const allAffiliates = [
      ...ambassadors.docs.map(d => ({ ref: d.ref, data: d.data() })),
      ...affiliates.docs.map(d => ({ ref: d.ref, data: d.data() })),
    ];

    let updatedCount = 0;

    for (const { ref, data } of allAffiliates) {
      const referralsCount = data.referralsCount || 0;
      const currentLevel = data.level || 'Bronze';

      // Determine new tier
      let newTier = DEFAULT_BONUS_TIERS[0];
      for (const tier of DEFAULT_BONUS_TIERS) {
        if (referralsCount >= tier.threshold) {
          newTier = tier;
        }
      }

      // Check if tier changed
      if (newTier.name !== currentLevel) {
        await ref.update({
          level: newTier.name,
          levelUpdatedAt: FieldValue.serverTimestamp(),
        });

        // Notify if upgraded
        if (DEFAULT_BONUS_TIERS.findIndex(t => t.name === newTier.name) >
            DEFAULT_BONUS_TIERS.findIndex(t => t.name === currentLevel)) {
          await db.collection('notifications').add({
            userId: ref.id,
            type: 'tier_upgrade',
            title: `🎉 Niveau ${newTier.icon} ${newTier.name} atteint!`,
            message: `Félicitations! Vous bénéficiez maintenant de +${newTier.bonusValue}% sur chaque vente.`,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });
        }

        updatedCount++;
      }
    }

    console.log(`✅ Monthly tier update complete: ${updatedCount} affiliates updated`);
  } catch (error) {
    console.error('Error in monthly tier update:', error);
    throw error;
  }
});
