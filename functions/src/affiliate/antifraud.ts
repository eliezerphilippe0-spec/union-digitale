/**
 * Affiliate Anti-Fraud System
 * Detects and prevents fraudulent affiliate activity
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ============================================================================
// FRAUD DETECTION RULES
// ============================================================================

interface FraudRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'flag' | 'hold' | 'reject' | 'ban';
}

const FRAUD_RULES: FraudRule[] = [
  {
    id: 'self_referral',
    name: 'Auto-parrainage',
    description: 'Affilié achète avec son propre code',
    severity: 'high',
    action: 'reject',
  },
  {
    id: 'same_ip',
    name: 'Même IP',
    description: 'Multiple commandes de la même IP',
    severity: 'medium',
    action: 'hold',
  },
  {
    id: 'rapid_orders',
    name: 'Commandes rapides',
    description: 'Trop de commandes en peu de temps',
    severity: 'medium',
    action: 'hold',
  },
  {
    id: 'high_refund_rate',
    name: 'Taux de remboursement élevé',
    description: 'Plus de 20% de remboursements',
    severity: 'high',
    action: 'hold',
  },
  {
    id: 'suspicious_pattern',
    name: 'Pattern suspect',
    description: 'Comportement anormal détecté',
    severity: 'medium',
    action: 'flag',
  },
  {
    id: 'duplicate_customer',
    name: 'Client dupliqué',
    description: 'Même client avec différents emails',
    severity: 'low',
    action: 'flag',
  },
];

// Thresholds
const THRESHOLDS = {
  maxOrdersPerIpPerDay: 3,
  maxOrdersPerAffiliatePerHour: 10,
  minTimeBetweenOrders: 60 * 1000, // 1 minute
  maxRefundRate: 0.20, // 20%
  suspiciousConversionRate: 0.50, // 50%+ is suspicious
  minOrderValue: 100, // HTG
};

// ============================================================================
// FRAUD DETECTION
// ============================================================================

/**
 * Check order for potential fraud
 * Called before processing affiliate commission
 */
export const checkOrderFraud = onCall(async (request) => {
  const {
    orderId,
    affiliateId,
    customerId,
    customerEmail,
    customerIp,
    orderTotal,
    promoCode,
  } = request.data;

  if (!orderId || !affiliateId) {
    throw new HttpsError('invalid-argument', 'orderId and affiliateId required');
  }

  const fraudFlags: any[] = [];
  let riskScore = 0;
  let recommendation: 'approve' | 'hold' | 'reject' = 'approve';

  try {
    // 1. Check self-referral
    if (customerId === affiliateId) {
      fraudFlags.push({
        rule: 'self_referral',
        severity: 'high',
        details: 'Customer is the affiliate',
      });
      riskScore += 100;
      recommendation = 'reject';
    }

    // 2. Check if affiliate email matches customer email
    const affiliateDoc = await db.doc(`ambassadors/${affiliateId}`).get() ||
                          await db.doc(`affiliates/${affiliateId}`).get();
    
    if (affiliateDoc.exists) {
      const affiliateData = affiliateDoc.data()!;
      if (affiliateData.email && affiliateData.email.toLowerCase() === customerEmail?.toLowerCase()) {
        fraudFlags.push({
          rule: 'self_referral',
          severity: 'high',
          details: 'Customer email matches affiliate email',
        });
        riskScore += 80;
        recommendation = 'reject';
      }
    }

    // 3. Check IP-based orders today
    if (customerIp) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const ipOrdersQuery = await db
        .collection('orders')
        .where('affiliateId', '==', affiliateId)
        .where('customerIp', '==', customerIp)
        .where('createdAt', '>=', today)
        .get();

      if (ipOrdersQuery.size >= THRESHOLDS.maxOrdersPerIpPerDay) {
        fraudFlags.push({
          rule: 'same_ip',
          severity: 'medium',
          details: `${ipOrdersQuery.size} orders from same IP today`,
        });
        riskScore += 40;
        if (recommendation !== 'reject') recommendation = 'hold';
      }
    }

    // 4. Check rapid orders
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOrdersQuery = await db
      .collection('orders')
      .where('affiliateId', '==', affiliateId)
      .where('createdAt', '>=', oneHourAgo)
      .get();

    if (recentOrdersQuery.size >= THRESHOLDS.maxOrdersPerAffiliatePerHour) {
      fraudFlags.push({
        rule: 'rapid_orders',
        severity: 'medium',
        details: `${recentOrdersQuery.size} orders in last hour`,
      });
      riskScore += 30;
      if (recommendation !== 'reject') recommendation = 'hold';
    }

    // 5. Check minimum order value
    if (orderTotal && orderTotal < THRESHOLDS.minOrderValue) {
      fraudFlags.push({
        rule: 'suspicious_pattern',
        severity: 'low',
        details: `Order value too low: ${orderTotal} HTG`,
      });
      riskScore += 10;
    }

    // 6. Check affiliate refund rate
    const affiliateOrders = await db
      .collection('orders')
      .where('affiliateId', '==', affiliateId)
      .where('affiliateCommissionProcessed', '==', true)
      .get();

    const refundedOrders = affiliateOrders.docs.filter(
      d => d.data().status === 'refunded' || d.data().status === 'cancelled'
    );

    if (affiliateOrders.size >= 5) {
      const refundRate = refundedOrders.length / affiliateOrders.size;
      if (refundRate > THRESHOLDS.maxRefundRate) {
        fraudFlags.push({
          rule: 'high_refund_rate',
          severity: 'high',
          details: `Refund rate: ${(refundRate * 100).toFixed(1)}%`,
        });
        riskScore += 50;
        if (recommendation !== 'reject') recommendation = 'hold';
      }
    }

    // 7. Check suspicious conversion rate
    if (affiliateDoc.exists) {
      const affiliateData = affiliateDoc.data()!;
      const clicks = affiliateData.clicksCount || 0;
      const conversions = affiliateData.referralsCount || 0;

      if (clicks >= 10 && conversions / clicks > THRESHOLDS.suspiciousConversionRate) {
        fraudFlags.push({
          rule: 'suspicious_pattern',
          severity: 'medium',
          details: `Unusually high conversion rate: ${((conversions / clicks) * 100).toFixed(1)}%`,
        });
        riskScore += 25;
      }
    }

    // Log fraud check
    await db.collection('fraud_checks').add({
      orderId,
      affiliateId,
      customerId,
      customerEmail: customerEmail ? customerEmail.substring(0, 3) + '***' : null,
      customerIp: customerIp ? customerIp.split('.').slice(0, 2).join('.') + '.x.x' : null,
      orderTotal,
      promoCode,
      fraudFlags,
      riskScore,
      recommendation,
      checkedAt: FieldValue.serverTimestamp(),
    });

    // If critical, notify admins
    if (riskScore >= 80) {
      await db.collection('admin_alerts').add({
        type: 'fraud_alert',
        severity: 'high',
        title: 'Fraude potentielle détectée',
        message: `Commande ${orderId} - Score de risque: ${riskScore}`,
        orderId,
        affiliateId,
        riskScore,
        flags: fraudFlags,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      riskScore,
      recommendation,
      flags: fraudFlags,
      requiresReview: recommendation !== 'approve',
    };
  } catch (error: any) {
    console.error('Error checking fraud:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Manually review and approve/reject a flagged commission
 */
export const reviewFlaggedCommission = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  // Admin only
  const userToken = request.auth?.token;
  if (userToken?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { commissionLogId, decision, reason } = request.data;

  if (!commissionLogId || !decision) {
    throw new HttpsError('invalid-argument', 'commissionLogId and decision required');
  }

  if (!['approve', 'reject'].includes(decision)) {
    throw new HttpsError('invalid-argument', 'Decision must be approve or reject');
  }

  try {
    const commissionRef = db.doc(`affiliate_commissions_log/${commissionLogId}`);
    const commissionDoc = await commissionRef.get();

    if (!commissionDoc.exists) {
      throw new HttpsError('not-found', 'Commission not found');
    }

    const commission = commissionDoc.data()!;

    if (commission.status !== 'pending' && commission.status !== 'held') {
      throw new HttpsError('failed-precondition', 'Commission already processed');
    }

    if (decision === 'approve') {
      // Approve the commission
      await db.runTransaction(async (transaction) => {
        // Update commission log
        transaction.update(commissionRef, {
          status: 'approved',
          reviewedBy: userId,
          reviewedAt: FieldValue.serverTimestamp(),
          reviewNote: reason || 'Manually approved',
        });

        // Credit affiliate
        let affiliateRef = db.doc(`ambassadors/${commission.affiliateId}`);
        let affiliateDoc = await transaction.get(affiliateRef);

        if (!affiliateDoc.exists) {
          affiliateRef = db.doc(`affiliates/${commission.affiliateId}`);
          affiliateDoc = await transaction.get(affiliateRef);
        }

        if (affiliateDoc.exists) {
          transaction.update(affiliateRef, {
            pendingEarnings: FieldValue.increment(-commission.commission),
            totalEarnings: FieldValue.increment(commission.commission),
          });
        }

        // Update order
        if (commission.orderId) {
          transaction.update(db.doc(`orders/${commission.orderId}`), {
            affiliateCommissionStatus: 'approved',
          });
        }
      });

      console.log(`✅ Commission ${commissionLogId} approved by ${userId}`);
    } else {
      // Reject the commission
      await db.runTransaction(async (transaction) => {
        transaction.update(commissionRef, {
          status: 'rejected',
          reviewedBy: userId,
          reviewedAt: FieldValue.serverTimestamp(),
          reviewNote: reason || 'Rejected due to fraud suspicion',
        });

        // Remove from pending
        let affiliateRef = db.doc(`ambassadors/${commission.affiliateId}`);
        let affiliateDoc = await transaction.get(affiliateRef);

        if (!affiliateDoc.exists) {
          affiliateRef = db.doc(`affiliates/${commission.affiliateId}`);
          affiliateDoc = await transaction.get(affiliateRef);
        }

        if (affiliateDoc.exists) {
          transaction.update(affiliateRef, {
            pendingEarnings: FieldValue.increment(-commission.commission),
            rejectedEarnings: FieldValue.increment(commission.commission),
          });
        }

        // Update order
        if (commission.orderId) {
          transaction.update(db.doc(`orders/${commission.orderId}`), {
            affiliateCommissionStatus: 'rejected',
            affiliateCommissionRejectedReason: reason || 'Fraud suspicion',
          });
        }

        // Notify affiliate
        transaction.set(db.collection('notifications').doc(), {
          userId: commission.affiliateId,
          type: 'commission_rejected',
          title: 'Commission non validée',
          message: reason || 'Votre commission a été rejetée suite à une vérification.',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      });

      console.log(`❌ Commission ${commissionLogId} rejected by ${userId}`);
    }

    return { success: true, decision };
  } catch (error: any) {
    console.error('Error reviewing commission:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

/**
 * Get pending reviews for admin
 */
export const getPendingFraudReviews = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  // Admin only
  const userToken = request.auth?.token;
  if (userToken?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  try {
    const pendingQuery = await db
      .collection('affiliate_commissions_log')
      .where('status', 'in', ['pending', 'held'])
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const reviews = [];

    for (const doc of pendingQuery.docs) {
      const data = doc.data();

      // Get fraud check if exists
      const fraudCheckQuery = await db
        .collection('fraud_checks')
        .where('orderId', '==', data.orderId)
        .orderBy('checkedAt', 'desc')
        .limit(1)
        .get();

      const fraudCheck = fraudCheckQuery.empty ? null : fraudCheckQuery.docs[0].data();

      reviews.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || null,
        fraudCheck: fraudCheck ? {
          riskScore: fraudCheck.riskScore,
          recommendation: fraudCheck.recommendation,
          flags: fraudCheck.fraudFlags,
        } : null,
      });
    }

    return {
      success: true,
      reviews,
      count: reviews.length,
    };
  } catch (error: any) {
    console.error('Error getting pending reviews:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

/**
 * Ban an affiliate for fraud
 */
export const banAffiliate = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  // Admin only
  const userToken = request.auth?.token;
  if (userToken?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { affiliateId, reason } = request.data;

  if (!affiliateId) {
    throw new HttpsError('invalid-argument', 'affiliateId required');
  }

  try {
    // Update affiliate status
    let affiliateRef = db.doc(`ambassadors/${affiliateId}`);
    let affiliateDoc = await affiliateRef.get();

    if (!affiliateDoc.exists) {
      affiliateRef = db.doc(`affiliates/${affiliateId}`);
      affiliateDoc = await affiliateRef.get();
    }

    if (!affiliateDoc.exists) {
      throw new HttpsError('not-found', 'Affiliate not found');
    }

    await affiliateRef.update({
      status: 'banned',
      bannedAt: FieldValue.serverTimestamp(),
      bannedBy: userId,
      banReason: reason || 'Fraud',
    });

    // Deactivate all promo codes
    const promoCodes = await db
      .collection('affiliate_promo_codes')
      .where('affiliateId', '==', affiliateId)
      .get();

    const batch = db.batch();
    for (const doc of promoCodes.docs) {
      batch.update(doc.ref, { active: false, deactivatedReason: 'affiliate_banned' });
    }
    await batch.commit();

    // Reject all pending commissions
    const pendingCommissions = await db
      .collection('affiliate_commissions_log')
      .where('affiliateId', '==', affiliateId)
      .where('status', '==', 'pending')
      .get();

    const batch2 = db.batch();
    for (const doc of pendingCommissions.docs) {
      batch2.update(doc.ref, {
        status: 'rejected',
        reviewNote: 'Affiliate banned',
        reviewedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch2.commit();

    // Notify affiliate
    await db.collection('notifications').add({
      userId: affiliateId,
      type: 'account_banned',
      title: 'Compte suspendu',
      message: 'Votre compte affilié a été suspendu pour violation des conditions d\'utilisation.',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`🚫 Affiliate ${affiliateId} banned by ${userId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error banning affiliate:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

// ============================================================================
// SCHEDULED JOBS
// ============================================================================

/**
 * Daily fraud analysis
 * Runs every day at 4 AM
 */
export const dailyFraudAnalysis = onSchedule('0 4 * * *', async () => {
  console.log('Starting daily fraud analysis...');

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all commissions from yesterday
    const commissionsQuery = await db
      .collection('affiliate_commissions_log')
      .where('createdAt', '>=', yesterday)
      .where('createdAt', '<', today)
      .get();

    // Group by affiliate
    const affiliateStats: Record<string, {
      orders: number;
      total: number;
      ips: Set<string>;
    }> = {};

    for (const doc of commissionsQuery.docs) {
      const data = doc.data();
      const affiliateId = data.affiliateId;

      if (!affiliateStats[affiliateId]) {
        affiliateStats[affiliateId] = { orders: 0, total: 0, ips: new Set() };
      }

      affiliateStats[affiliateId].orders++;
      affiliateStats[affiliateId].total += data.commission || 0;
    }

    // Flag suspicious affiliates
    for (const [affiliateId, stats] of Object.entries(affiliateStats)) {
      // Too many orders from single affiliate
      if (stats.orders > 20) {
        await db.collection('admin_alerts').add({
          type: 'suspicious_activity',
          severity: 'medium',
          title: 'Activité suspecte',
          message: `Affilié ${affiliateId}: ${stats.orders} commandes hier`,
          affiliateId,
          stats,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    console.log(`✅ Daily fraud analysis complete: ${commissionsQuery.size} commissions analyzed`);
  } catch (error) {
    console.error('Error in daily fraud analysis:', error);
    throw error;
  }
});
