/**
 * Affiliate Commission System
 * Handles commission calculation, attribution, and payouts
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// Default commission rates by category
const DEFAULT_COMMISSION_RATES: Record<string, number> = {
  electronics: 0.03,      // 3%
  fashion: 0.08,          // 8%
  beauty: 0.10,           // 10%
  digital: 0.15,          // 15%
  courses: 0.20,          // 20%
  services: 0.10,         // 10%
  real_estate: 0.02,      // 2%
  vehicles: 0.02,         // 2%
  food: 0.05,             // 5%
  default: 0.05,          // 5%
};

// ============================================================================
// PROMO CODE MANAGEMENT
// ============================================================================

/**
 * Generate a unique promo code for an affiliate
 */
export const generateAffiliatePromoCode = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const { preferredCode, discountType, discountValue } = request.data;

  try {
    // Verify user is an affiliate/ambassador
    let affiliateDoc = await db.collection('ambassadors').doc(userId).get();
    let affiliateType = 'ambassador';

    if (!affiliateDoc.exists) {
      affiliateDoc = await db.collection('affiliates').doc(userId).get();
      affiliateType = 'affiliate';
    }

    if (!affiliateDoc.exists) {
      throw new HttpsError('permission-denied', 'Not an affiliate');
    }

    const affiliate = affiliateDoc.data()!;

    // Check existing codes count (limit 5 per affiliate)
    const existingCodes = await db
      .collection('affiliate_promo_codes')
      .where('affiliateId', '==', userId)
      .where('active', '==', true)
      .get();

    if (existingCodes.size >= 5) {
      throw new HttpsError('resource-exhausted', 'Maximum 5 active promo codes');
    }

    // Generate or validate code
    let code = preferredCode?.toUpperCase().replace(/[^A-Z0-9]/g, '') || '';

    if (code.length < 4 || code.length > 15) {
      // Generate random code
      code = `${affiliate.code || 'UD'}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    // Check uniqueness
    const codeExists = await db
      .collection('affiliate_promo_codes')
      .where('code', '==', code)
      .get();

    if (!codeExists.empty) {
      throw new HttpsError('already-exists', 'Code already exists');
    }

    // Create promo code
    const promoData = {
      code,
      affiliateId: userId,
      affiliateCode: affiliate.code,
      affiliateType,
      discountType: discountType || 'percentage',
      discountValue: discountValue || 10, // 10% default
      active: true,
      usageCount: 0,
      usageLimit: null, // Unlimited
      expiresAt: null, // Never expires
      createdAt: FieldValue.serverTimestamp(),
    };

    const promoRef = await db.collection('affiliate_promo_codes').add(promoData);

    console.log(`✅ Promo code created: ${code} for affiliate ${userId}`);

    return {
      success: true,
      promoCode: {
        id: promoRef.id,
        code,
        discountType: promoData.discountType,
        discountValue: promoData.discountValue,
      },
    };
  } catch (error: any) {
    console.error('Error generating promo code:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

/**
 * Validate and apply a promo code
 */
export const validatePromoCode = onCall(async (request) => {
  const { code, cartTotal } = request.data;

  if (!code) {
    throw new HttpsError('invalid-argument', 'Code required');
  }

  try {
    const promoQuery = await db
      .collection('affiliate_promo_codes')
      .where('code', '==', code.toUpperCase())
      .where('active', '==', true)
      .limit(1)
      .get();

    if (promoQuery.empty) {
      return { valid: false, error: 'Code invalide' };
    }

    const promoDoc = promoQuery.docs[0];
    const promo = promoDoc.data();

    // Check expiry
    if (promo.expiresAt && promo.expiresAt.toDate() < new Date()) {
      return { valid: false, error: 'Code expiré' };
    }

    // Check usage limit
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return { valid: false, error: 'Code épuisé' };
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = (cartTotal || 0) * (promo.discountValue / 100);
    } else {
      discount = promo.discountValue;
    }

    return {
      valid: true,
      promoId: promoDoc.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discount,
      affiliateId: promo.affiliateId,
    };
  } catch (error: any) {
    console.error('Error validating promo code:', error);
    throw new HttpsError('internal', error.message);
  }
});

// ============================================================================
// COMMISSION CALCULATION
// ============================================================================

/**
 * Get commission rate for a product
 */
export const getAffiliateCommissionRate = onCall(async (request) => {
  const { productId, categoryId, vendorId, affiliateId } = request.data;

  try {
    let rate = DEFAULT_COMMISSION_RATES.default;

    // 1. Check product-specific commission
    if (productId) {
      const productCommission = await db
        .doc(`affiliate_commissions/product_${productId}`)
        .get();

      if (productCommission.exists) {
        return { rate: productCommission.data()!.rate, source: 'product' };
      }
    }

    // 2. Check category commission
    if (categoryId) {
      const categoryCommission = await db
        .doc(`affiliate_commissions/category_${categoryId}`)
        .get();

      if (categoryCommission.exists) {
        return { rate: categoryCommission.data()!.rate, source: 'category' };
      }

      // Check default category rates
      if (DEFAULT_COMMISSION_RATES[categoryId]) {
        rate = DEFAULT_COMMISSION_RATES[categoryId];
      }
    }

    // 3. Check vendor custom rate
    if (vendorId) {
      const vendorDoc = await db.doc(`vendors/${vendorId}`).get();
      if (vendorDoc.exists && vendorDoc.data()?.affiliateCommissionRate) {
        return { rate: vendorDoc.data()!.affiliateCommissionRate, source: 'vendor' };
      }
    }

    // 4. Check affiliate custom rate
    if (affiliateId) {
      const affiliateDoc = await db.doc(`ambassadors/${affiliateId}`).get();
      if (affiliateDoc.exists && affiliateDoc.data()?.customCommissionRate) {
        return { rate: affiliateDoc.data()!.customCommissionRate, source: 'affiliate' };
      }
    }

    return { rate, source: 'default' };
  } catch (error: any) {
    console.error('Error getting commission rate:', error);
    return { rate: DEFAULT_COMMISSION_RATES.default, source: 'default' };
  }
});

/**
 * Set commission rate for product or category (admin only)
 */
export const setAffiliateCommissionRate = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  // Verify admin
  const userToken = request.auth?.token;
  if (userToken?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { type, id, rate } = request.data;

  if (!type || !id || rate === undefined) {
    throw new HttpsError('invalid-argument', 'type, id, and rate required');
  }

  if (rate < 0 || rate > 1) {
    throw new HttpsError('invalid-argument', 'Rate must be between 0 and 1');
  }

  try {
    const docId = `${type}_${id}`;
    await db.doc(`affiliate_commissions/${docId}`).set({
      type,
      targetId: id,
      rate,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId,
    });

    console.log(`✅ Commission rate set: ${type}/${id} = ${rate * 100}%`);

    return { success: true };
  } catch (error: any) {
    console.error('Error setting commission rate:', error);
    throw new HttpsError('internal', error.message);
  }
});

// ============================================================================
// ORDER ATTRIBUTION
// ============================================================================

/**
 * Process affiliate commission for an order
 * Called after successful payment
 */
export const processAffiliateCommission = onCall(async (request) => {
  const { orderId, affiliateData } = request.data;

  if (!orderId || !affiliateData?.affiliateId) {
    return { success: false, error: 'Missing order or affiliate data' };
  }

  try {
    return await db.runTransaction(async (transaction) => {
      // Get order
      const orderRef = db.doc(`orders/${orderId}`);
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new HttpsError('not-found', 'Order not found');
      }

      const order = orderDoc.data()!;

      // Check if already processed
      if (order.affiliateCommissionProcessed) {
        return { success: false, error: 'Already processed' };
      }

      // Get affiliate
      let affiliateRef = db.doc(`ambassadors/${affiliateData.affiliateId}`);
      let affiliateDoc = await transaction.get(affiliateRef);

      if (!affiliateDoc.exists) {
        affiliateRef = db.doc(`affiliates/${affiliateData.affiliateId}`);
        affiliateDoc = await transaction.get(affiliateRef);
      }

      if (!affiliateDoc.exists) {
        return { success: false, error: 'Affiliate not found' };
      }

      const affiliate = affiliateDoc.data()!;

      // Calculate commission per item
      let totalCommission = 0;
      const commissionBreakdown = [];

      for (const item of order.items || []) {
        // Get rate for this item
        let rate = DEFAULT_COMMISSION_RATES.default;

        if (item.categoryId && DEFAULT_COMMISSION_RATES[item.categoryId]) {
          rate = DEFAULT_COMMISSION_RATES[item.categoryId];
        }

        // Check custom rates
        const customRateDoc = await db
          .doc(`affiliate_commissions/product_${item.productId}`)
          .get();

        if (customRateDoc.exists) {
          rate = customRateDoc.data()!.rate;
        }

        const itemTotal = item.price * item.quantity;
        const commission = Math.round(itemTotal * rate);

        totalCommission += commission;
        commissionBreakdown.push({
          productId: item.productId,
          productName: item.name,
          amount: itemTotal,
          rate,
          commission,
        });
      }

      // Update order with affiliate info
      transaction.update(orderRef, {
        affiliateId: affiliateData.affiliateId,
        affiliateCode: affiliateData.affiliateCode,
        affiliatePromoCode: affiliateData.promoCode || null,
        affiliateCampaign: affiliateData.campaign,
        affiliateSource: affiliateData.source,
        affiliateCommission: totalCommission,
        affiliateCommissionBreakdown: commissionBreakdown,
        affiliateCommissionProcessed: true,
        affiliateCommissionStatus: 'pending', // Will be 'approved' after validation
      });

      // Update affiliate stats (pending, not yet approved)
      transaction.update(affiliateRef, {
        pendingEarnings: FieldValue.increment(totalCommission),
        referralsCount: FieldValue.increment(1),
        totalReferralValue: FieldValue.increment(order.totalAmount || 0),
        lastReferralAt: FieldValue.serverTimestamp(),
      });

      // Create commission record
      const commissionRef = db.collection('affiliate_commissions_log').doc();
      transaction.set(commissionRef, {
        affiliateId: affiliateData.affiliateId,
        orderId,
        orderTotal: order.totalAmount,
        commission: totalCommission,
        breakdown: commissionBreakdown,
        status: 'pending',
        promoCode: affiliateData.promoCode || null,
        campaign: affiliateData.campaign,
        source: affiliateData.source,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Update promo code usage if applicable
      if (affiliateData.promoCode) {
        const promoQuery = await db
          .collection('affiliate_promo_codes')
          .where('code', '==', affiliateData.promoCode.toUpperCase())
          .limit(1)
          .get();

        if (!promoQuery.empty) {
          transaction.update(promoQuery.docs[0].ref, {
            usageCount: FieldValue.increment(1),
            lastUsedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      console.log(`✅ Affiliate commission processed: Order ${orderId}, Commission: ${totalCommission} HTG`);

      return {
        success: true,
        commission: totalCommission,
        breakdown: commissionBreakdown,
      };
    });
  } catch (error: any) {
    console.error('Error processing affiliate commission:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

/**
 * Approve affiliate commission (after order delivered / validation period)
 * Called by admin or automatically after X days
 */
export const approveAffiliateCommission = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const { orderId, commissionLogId } = request.data;

  // Can be called by admin or by scheduled function
  const userToken = request.auth?.token;
  const isAdmin = userToken?.role === 'admin';
  const isSystem = request.data._isSystem === true;

  if (!isAdmin && !isSystem) {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  try {
    return await db.runTransaction(async (transaction) => {
      // Get commission log
      const commissionRef = db.doc(`affiliate_commissions_log/${commissionLogId}`);
      const commissionDoc = await transaction.get(commissionRef);

      if (!commissionDoc.exists) {
        throw new HttpsError('not-found', 'Commission record not found');
      }

      const commissionData = commissionDoc.data()!;

      if (commissionData.status !== 'pending') {
        return { success: false, error: 'Already processed' };
      }

      // Move from pending to available
      let affiliateRef = db.doc(`ambassadors/${commissionData.affiliateId}`);
      let affiliateDoc = await transaction.get(affiliateRef);

      if (!affiliateDoc.exists) {
        affiliateRef = db.doc(`affiliates/${commissionData.affiliateId}`);
        affiliateDoc = await transaction.get(affiliateRef);
      }

      if (affiliateDoc.exists) {
        transaction.update(affiliateRef, {
          pendingEarnings: FieldValue.increment(-commissionData.commission),
          totalEarnings: FieldValue.increment(commissionData.commission),
          currentMonthEarnings: FieldValue.increment(commissionData.commission),
        });
      }

      // Update commission log
      transaction.update(commissionRef, {
        status: 'approved',
        approvedAt: FieldValue.serverTimestamp(),
        approvedBy: isAdmin ? userId : 'system',
      });

      // Update order
      if (orderId) {
        transaction.update(db.doc(`orders/${orderId}`), {
          affiliateCommissionStatus: 'approved',
        });
      }

      console.log(`✅ Commission approved: ${commissionLogId}, Amount: ${commissionData.commission} HTG`);

      return { success: true };
    });
  } catch (error: any) {
    console.error('Error approving commission:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

// ============================================================================
// AFFILIATE STATS
// ============================================================================

/**
 * Get affiliate dashboard stats
 */
export const getAffiliateStats = onCall(async (request) => {
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

    // Get recent commissions
    const recentCommissions = await db
      .collection('affiliate_commissions_log')
      .where('affiliateId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    // Get promo codes
    const promoCodes = await db
      .collection('affiliate_promo_codes')
      .where('affiliateId', '==', userId)
      .where('active', '==', true)
      .get();

    // Calculate this month's stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCommissions = await db
      .collection('affiliate_commissions_log')
      .where('affiliateId', '==', userId)
      .where('createdAt', '>=', startOfMonth)
      .get();

    let monthlyEarnings = 0;
    let monthlyReferrals = 0;
    for (const doc of monthlyCommissions.docs) {
      const data = doc.data();
      if (data.status === 'approved') {
        monthlyEarnings += data.commission;
      }
      monthlyReferrals++;
    }

    return {
      success: true,
      stats: {
        totalEarnings: affiliate.totalEarnings || 0,
        pendingEarnings: affiliate.pendingEarnings || 0,
        currentMonthEarnings: monthlyEarnings,
        referralsCount: affiliate.referralsCount || 0,
        clicksCount: affiliate.clicksCount || 0,
        conversionRate: affiliate.clicksCount
          ? ((affiliate.referralsCount || 0) / affiliate.clicksCount * 100).toFixed(2)
          : 0,
        level: affiliate.level || 'Bronze',
        code: affiliate.code,
      },
      recentCommissions: recentCommissions.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null,
      })),
      promoCodes: promoCodes.docs.map(doc => ({
        id: doc.id,
        code: doc.data().code,
        discountType: doc.data().discountType,
        discountValue: doc.data().discountValue,
        usageCount: doc.data().usageCount || 0,
      })),
    };
  } catch (error: any) {
    console.error('Error getting affiliate stats:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});
