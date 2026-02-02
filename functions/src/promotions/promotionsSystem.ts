/**
 * Advanced Promotions & Coupons System
 * Supports multiple discount types, conditions, and tracking
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface Coupon {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  vendorId?: string;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  startDate: admin.firestore.Timestamp;
  endDate: admin.firestore.Timestamp;
  active: boolean;
}

/**
 * Create a new coupon (vendor or admin)
 */
export const createCoupon = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const {
      code,
      type,
      value,
      minPurchase,
      maxDiscount,
      applicableProducts,
      applicableCategories,
      usageLimit,
      perUserLimit,
      startDate,
      endDate
    } = data;

    // Validate required fields
    if (!code || !type || value === undefined) {
      throw new HttpsError('invalid-argument', 'Code, type, and value are required');
    }

    // Get user info
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const user = userDoc.data();

    // Check permissions
    const isVendor = user?.role === 'vendor';
    const isAdmin = user?.role === 'admin';

    if (!isVendor && !isAdmin) {
      throw new HttpsError('permission-denied', 'Only vendors and admins can create coupons');
    }

    // Check if code already exists
    const existingCoupon = await db
      .collection('coupons')
      .where('code', '==', code.toUpperCase())
      .get();

    if (!existingCoupon.empty) {
      throw new HttpsError('already-exists', 'Coupon code already exists');
    }

    // Create coupon
    const couponData = {
      code: code.toUpperCase(),
      type,
      value,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || null,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      vendorId: isVendor ? auth.uid : null,
      usageLimit: usageLimit || null,
      usageCount: 0,
      perUserLimit: perUserLimit || 1,
      startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
      endDate: admin.firestore.Timestamp.fromDate(new Date(endDate)),
      active: true,
      createdBy: auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const couponRef = await db.collection('coupons').add(couponData);

    console.log(`🎫 Coupon created: ${code}`);

    return { couponId: couponRef.id, code: couponData.code };
  }
);

/**
 * Validate and apply coupon to cart
 */
export const applyCoupon = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { code, cartItems, subtotal } = data;

    if (!code || !cartItems || subtotal === undefined) {
      throw new HttpsError('invalid-argument', 'Code, cart items, and subtotal required');
    }

    // Find coupon
    const couponSnapshot = await db
      .collection('coupons')
      .where('code', '==', code.toUpperCase())
      .where('active', '==', true)
      .limit(1)
      .get();

    if (couponSnapshot.empty) {
      throw new HttpsError('not-found', 'Coupon invalide ou expiré');
    }

    const couponDoc = couponSnapshot.docs[0];
    const coupon = couponDoc.data() as Coupon;
    const now = admin.firestore.Timestamp.now();

    // Validate dates
    if (now < coupon.startDate) {
      throw new HttpsError('failed-precondition', 'Ce coupon n\'est pas encore actif');
    }
    if (now > coupon.endDate) {
      throw new HttpsError('failed-precondition', 'Ce coupon a expiré');
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new HttpsError('resource-exhausted', 'Ce coupon a atteint sa limite d\'utilisation');
    }

    // Check per-user limit
    const userUsage = await db
      .collection('coupon_usage')
      .where('couponId', '==', couponDoc.id)
      .where('userId', '==', auth.uid)
      .get();

    if (coupon.perUserLimit && userUsage.size >= coupon.perUserLimit) {
      throw new HttpsError('resource-exhausted', 'Vous avez déjà utilisé ce coupon');
    }

    // Check minimum purchase
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      throw new HttpsError(
        'failed-precondition',
        `Minimum d'achat requis: ${coupon.minPurchase} HTG`
      );
    }

    // Calculate discount
    let discount = 0;
    let applicableAmount = subtotal;

    // Filter applicable items
    if (coupon.applicableProducts?.length || coupon.applicableCategories?.length) {
      applicableAmount = cartItems
        .filter((item: any) => {
          if (coupon.applicableProducts?.includes(item.productId)) return true;
          if (coupon.applicableCategories?.includes(item.category)) return true;
          return false;
        })
        .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    }

    // Vendor-specific coupon
    if (coupon.vendorId) {
      applicableAmount = cartItems
        .filter((item: any) => item.vendorId === coupon.vendorId)
        .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    }

    // Apply discount based on type
    switch (coupon.type) {
      case 'percentage':
        discount = (applicableAmount * coupon.value) / 100;
        break;
      case 'fixed':
        discount = Math.min(coupon.value, applicableAmount);
        break;
      case 'free_shipping':
        // Handle in checkout
        discount = 0;
        break;
      case 'buy_x_get_y':
        // Complex logic - simplified here
        discount = applicableAmount * 0.5; // 50% off on applicable items
        break;
    }

    // Apply max discount cap
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    return {
      valid: true,
      couponId: couponDoc.id,
      code: coupon.code,
      type: coupon.type,
      discount: Math.round(discount),
      freeShipping: coupon.type === 'free_shipping',
      message: `Coupon appliqué: -${Math.round(discount)} HTG`
    };
  }
);

/**
 * Record coupon usage after successful order
 */
export const recordCouponUsage = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { couponId, orderId, discount } = data;

    if (!couponId || !orderId) {
      throw new HttpsError('invalid-argument', 'Coupon ID and order ID required');
    }

    // Record usage
    await db.collection('coupon_usage').add({
      couponId,
      orderId,
      userId: auth.uid,
      discount,
      usedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Increment usage count
    await db.collection('coupons').doc(couponId).update({
      usageCount: admin.firestore.FieldValue.increment(1)
    });

    console.log(`🎫 Coupon ${couponId} used for order ${orderId}`);

    return { success: true };
  }
);

/**
 * Get available coupons for user
 */
export const getAvailableCoupons = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const now = admin.firestore.Timestamp.now();

    // Get active coupons
    const couponsSnapshot = await db
      .collection('coupons')
      .where('active', '==', true)
      .where('startDate', '<=', now)
      .where('endDate', '>=', now)
      .limit(50)
      .get();

    const coupons = [];

    for (const doc of couponsSnapshot.docs) {
      const coupon = doc.data();

      // Check if user hasn't exceeded personal limit
      const userUsage = await db
        .collection('coupon_usage')
        .where('couponId', '==', doc.id)
        .where('userId', '==', auth.uid)
        .get();

      if (!coupon.perUserLimit || userUsage.size < coupon.perUserLimit) {
        coupons.push({
          id: doc.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          minPurchase: coupon.minPurchase,
          maxDiscount: coupon.maxDiscount,
          endDate: coupon.endDate
        });
      }
    }

    return { coupons };
  }
);

/**
 * Cleanup expired coupons (runs daily)
 */
export const cleanupExpiredCoupons = onSchedule(
  {
    schedule: '0 2 * * *', // 2 AM daily
    region: 'us-central1',
    timeZone: 'America/Port-au-Prince'
  },
  async () => {
    const now = admin.firestore.Timestamp.now();

    const expiredCoupons = await db
      .collection('coupons')
      .where('active', '==', true)
      .where('endDate', '<', now)
      .get();

    const batch = db.batch();
    expiredCoupons.docs.forEach(doc => {
      batch.update(doc.ref, { active: false });
    });

    await batch.commit();

    console.log(`🧹 Deactivated ${expiredCoupons.size} expired coupons`);
  }
);
