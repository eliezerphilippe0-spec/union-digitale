/**
 * Reviews & Ratings System
 * Allows buyers to rate products and vendors
 * Calculates aggregate ratings and prevents abuse
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Submit a product review
 * Only buyers who purchased the product can review
 */
export const submitProductReview = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to review');
    }

    const { productId, rating, title, comment, images } = data;

    // Validate inputs
    if (!productId || !rating) {
      throw new HttpsError('invalid-argument', 'Product ID and rating are required');
    }

    if (rating < 1 || rating > 5) {
      throw new HttpsError('invalid-argument', 'Rating must be between 1 and 5');
    }

    // Check if user is a buyer
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'buyer') {
      throw new HttpsError('permission-denied', 'Only buyers can submit reviews');
    }

    // Verify user purchased this product
    const ordersSnapshot = await db
      .collection('orders')
      .where('userId', '==', auth.uid)
      .where('status', '==', 'completed')
      .get();

    let hasPurchased = false;
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      if (order.items?.some((item: any) => item.productId === productId)) {
        hasPurchased = true;
        break;
      }
    }

    if (!hasPurchased) {
      throw new HttpsError('permission-denied', 'You must purchase this product before reviewing');
    }

    // Check if already reviewed
    const existingReview = await db
      .collection('reviews')
      .where('userId', '==', auth.uid)
      .where('productId', '==', productId)
      .get();

    if (!existingReview.empty) {
      throw new HttpsError('already-exists', 'You have already reviewed this product');
    }

    // Get product and vendor info
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      throw new HttpsError('not-found', 'Product not found');
    }

    const product = productDoc.data();

    // Create review
    const reviewData = {
      userId: auth.uid,
      userName: userData.displayName || 'Anonymous',
      userPhoto: userData.photoURL || null,
      productId,
      productName: product?.name || '',
      vendorId: product?.vendorId || '',
      rating,
      title: title || '',
      comment: comment || '',
      images: images || [],
      helpful: 0,
      reported: false,
      verified: true, // Verified purchase
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const reviewRef = await db.collection('reviews').add(reviewData);

    console.log(`✅ Review created: ${reviewRef.id} for product ${productId}`);

    return {
      success: true,
      reviewId: reviewRef.id
    };
  }
);

/**
 * Update product rating when review is added/updated/deleted
 */
export const updateProductRating = onDocumentWritten(
  {
    document: 'reviews/{reviewId}',
    region: 'us-central1'
  },
  async (event) => {
    const reviewData = event.data?.after.exists ? event.data.after.data() : null;
    const productId = reviewData?.productId || event.data?.before.data()?.productId;

    if (!productId) return;

    console.log(`📊 Updating rating for product ${productId}`);

    // Get all reviews for this product
    const reviewsSnapshot = await db
      .collection('reviews')
      .where('productId', '==', productId)
      .where('reported', '==', false)
      .get();

    if (reviewsSnapshot.empty) {
      // No reviews, reset rating
      await db.collection('products').doc(productId).update({
        rating: 0,
        reviewCount: 0,
        ratingBreakdown: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    // Calculate aggregate rating
    let totalRating = 0;
    const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviewsSnapshot.docs.forEach(doc => {
      const review = doc.data();
      totalRating += review.rating;
      ratingBreakdown[review.rating] = (ratingBreakdown[review.rating] || 0) + 1;
    });

    const averageRating = totalRating / reviewsSnapshot.size;
    const reviewCount = reviewsSnapshot.size;

    // Update product
    await db.collection('products').doc(productId).update({
      rating: parseFloat(averageRating.toFixed(2)),
      reviewCount,
      ratingBreakdown,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Product ${productId} rating updated: ${averageRating.toFixed(2)} (${reviewCount} reviews)`);
  }
);

/**
 * Update vendor rating when reviews change
 */
export const updateVendorRating = onDocumentWritten(
  {
    document: 'reviews/{reviewId}',
    region: 'us-central1'
  },
  async (event) => {
    const reviewData = event.data?.after.exists ? event.data.after.data() : null;
    const vendorId = reviewData?.vendorId || event.data?.before.data()?.vendorId;

    if (!vendorId) return;

    console.log(`📊 Updating rating for vendor ${vendorId}`);

    // Get all reviews for this vendor's products
    const reviewsSnapshot = await db
      .collection('reviews')
      .where('vendorId', '==', vendorId)
      .where('reported', '==', false)
      .get();

    if (reviewsSnapshot.empty) {
      // No reviews, reset rating
      await db.collection('users').doc(vendorId).update({
        vendorRating: 0,
        vendorReviewCount: 0
      });
      return;
    }

    // Calculate average
    let totalRating = 0;
    reviewsSnapshot.docs.forEach(doc => {
      totalRating += doc.data().rating;
    });

    const averageRating = totalRating / reviewsSnapshot.size;

    // Update vendor profile
    await db.collection('users').doc(vendorId).update({
      vendorRating: parseFloat(averageRating.toFixed(2)),
      vendorReviewCount: reviewsSnapshot.size
    });

    console.log(`✅ Vendor ${vendorId} rating updated: ${averageRating.toFixed(2)}`);
  }
);

/**
 * Get reviews for a product
 */
export const getProductReviews = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { productId, limit = 20, sortBy = 'recent' } = request.data;

    if (!productId) {
      throw new HttpsError('invalid-argument', 'Product ID is required');
    }

    let query = db
      .collection('reviews')
      .where('productId', '==', productId)
      .where('reported', '==', false);

    // Sort options
    if (sortBy === 'recent') {
      query = query.orderBy('createdAt', 'desc');
    } else if (sortBy === 'highest') {
      query = query.orderBy('rating', 'desc');
    } else if (sortBy === 'lowest') {
      query = query.orderBy('rating', 'asc');
    } else if (sortBy === 'helpful') {
      query = query.orderBy('helpful', 'desc');
    }

    query = query.limit(limit);

    const reviewsSnapshot = await query.get();

    const reviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { reviews };
  }
);

/**
 * Mark review as helpful
 */
export const markReviewHelpful = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { reviewId } = data;

    if (!reviewId) {
      throw new HttpsError('invalid-argument', 'Review ID is required');
    }

    // Check if already marked helpful
    const helpfulDoc = await db
      .collection('review_helpful')
      .doc(`${reviewId}_${auth.uid}`)
      .get();

    if (helpfulDoc.exists) {
      throw new HttpsError('already-exists', 'You already marked this review as helpful');
    }

    // Add to helpful collection
    await db.collection('review_helpful').doc(`${reviewId}_${auth.uid}`).set({
      reviewId,
      userId: auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Increment helpful counter
    await db.collection('reviews').doc(reviewId).update({
      helpful: admin.firestore.FieldValue.increment(1)
    });

    return { success: true };
  }
);

/**
 * Report a review
 */
export const reportReview = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { reviewId, reason } = data;

    if (!reviewId || !reason) {
      throw new HttpsError('invalid-argument', 'Review ID and reason are required');
    }

    // Create report
    await db.collection('review_reports').add({
      reviewId,
      reportedBy: auth.uid,
      reason,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`⚠️  Review ${reviewId} reported by ${auth.uid}`);

    return { success: true };
  }
);
