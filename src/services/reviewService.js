/**
 * REVIEW SERVICE
 * Complete service for managing product reviews and ratings
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    increment,
    arrayUnion,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { db, storage, auth } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { moderateContent } from './moderationService';

/**
 * Check if user can review a product
 */
export const canUserReview = async (userId, productId) => {
    if (!userId) return { canReview: false, reason: 'not_logged_in' };

    // Check if user has already reviewed this product
    const existingReviewQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', userId),
        where('productId', '==', productId)
    );

    const existingReviews = await getDocs(existingReviewQuery);
    if (!existingReviews.empty) {
        return { canReview: false, reason: 'already_reviewed' };
    }

    // Check if user has purchased this product
    const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        where('status', '==', 'delivered')
    );

    const orders = await getDocs(ordersQuery);
    let hasPurchased = false;

    orders.forEach(orderDoc => {
        const order = orderDoc.data();
        if (order.items?.some(item => item.productId === productId)) {
            hasPurchased = true;
        }
    });

    return {
        canReview: true,
        verified: hasPurchased,
        reason: hasPurchased ? 'verified_purchase' : 'can_review'
    };
};

/**
 * Submit a new review
 */
export const submitReview = async (productId, reviewData) => {
    if (!auth.currentUser) {
        throw new Error('User must be logged in to submit a review');
    }

    const userId = auth.currentUser.uid;

    // Check if user can review
    const { canReview, verified, reason } = await canUserReview(userId, productId);
    if (!canReview) {
        throw new Error(`Cannot review: ${reason}`);
    }

    // Validate review data
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
    }

    if (!reviewData.title || reviewData.title.length < 10 || reviewData.title.length > 100) {
        throw new Error('Title must be between 10 and 100 characters');
    }

    if (!reviewData.content || reviewData.content.length < 20 || reviewData.content.length > 5000) {
        throw new Error('Content must be between 20 and 5000 characters');
    }

    // Moderate content
    const moderation = moderateContent(reviewData.title + ' ' + reviewData.content);

    // Upload images if provided
    let imageUrls = [];
    if (reviewData.images && reviewData.images.length > 0) {
        if (reviewData.images.length > 5) {
            throw new Error('Maximum 5 images allowed');
        }
        imageUrls = await uploadReviewImages(userId, productId, reviewData.images);
    }

    // Get user info
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    // Create review document
    const review = {
        productId,
        userId,
        userName: userData?.displayName || userData?.firstName || 'Anonymous',
        userAvatar: userData?.photoURL || null,
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        images: imageUrls,
        verified: verified,
        helpful: 0,
        notHelpful: 0,
        votedBy: [],
        status: moderation.autoApprove ? 'approved' : 'pending',
        moderationFlags: moderation.flags,
        sellerResponse: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    // Add to Firestore
    const reviewRef = await addDoc(collection(db, 'reviews'), review);

    // Update product stats
    await updateProductStats(productId);

    return { id: reviewRef.id, ...review };
};

/**
 * Upload review images to Firebase Storage
 */
const uploadReviewImages = async (userId, productId, images) => {
    const uploadPromises = images.map(async (image, index) => {
        const timestamp = Date.now();
        const storageRef = ref(
            storage,
            `reviews/${productId}/${userId}/${timestamp}_${index}.jpg`
        );

        // Convert base64 to blob if needed
        let blob = image;
        if (typeof image === 'string' && image.startsWith('data:')) {
            const response = await fetch(image);
            blob = await response.blob();
        }

        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    });

    return await Promise.all(uploadPromises);
};

/**
 * Get reviews for a product
 */
export const getProductReviews = async (productId, filters = {}) => {
    let reviewsQuery = query(
        collection(db, 'reviews'),
        where('productId', '==', productId),
        where('status', '==', 'approved')
    );

    // Apply filters
    if (filters.rating) {
        reviewsQuery = query(reviewsQuery, where('rating', '==', filters.rating));
    }

    if (filters.verified) {
        reviewsQuery = query(reviewsQuery, where('verified', '==', true));
    }

    if (filters.withImages) {
        reviewsQuery = query(reviewsQuery, where('images', '!=', []));
    }

    // Apply sorting
    switch (filters.sortBy) {
        case 'recent':
            reviewsQuery = query(reviewsQuery, orderBy('createdAt', 'desc'));
            break;
        case 'helpful':
            reviewsQuery = query(reviewsQuery, orderBy('helpful', 'desc'));
            break;
        case 'rating_high':
            reviewsQuery = query(reviewsQuery, orderBy('rating', 'desc'));
            break;
        case 'rating_low':
            reviewsQuery = query(reviewsQuery, orderBy('rating', 'asc'));
            break;
        default:
            reviewsQuery = query(reviewsQuery, orderBy('createdAt', 'desc'));
    }

    // Apply limit
    if (filters.limit) {
        reviewsQuery = query(reviewsQuery, limit(filters.limit));
    }

    const snapshot = await getDocs(reviewsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Vote on a review (helpful or not helpful)
 */
export const voteHelpful = async (reviewId, isHelpful) => {
    if (!auth.currentUser) {
        throw new Error('User must be logged in to vote');
    }

    const userId = auth.currentUser.uid;
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
        throw new Error('Review not found');
    }

    const review = reviewDoc.data();

    // Check if user has already voted
    if (review.votedBy?.includes(userId)) {
        throw new Error('You have already voted on this review');
    }

    // Update vote count
    await updateDoc(reviewRef, {
        [isHelpful ? 'helpful' : 'notHelpful']: increment(1),
        votedBy: arrayUnion(userId),
        updatedAt: serverTimestamp()
    });

    return { success: true };
};

/**
 * Get review statistics for a product
 */
export const getReviewStats = async (productId) => {
    const statsDoc = await getDoc(doc(db, 'productStats', productId));

    if (statsDoc.exists()) {
        return statsDoc.data();
    }

    // If stats don't exist, calculate them
    return await updateProductStats(productId);
};

/**
 * Update product review statistics
 */
export const updateProductStats = async (productId) => {
    const reviewsQuery = query(
        collection(db, 'reviews'),
        where('productId', '==', productId),
        where('status', '==', 'approved')
    );

    const snapshot = await getDocs(reviewsQuery);
    const reviews = snapshot.docs.map(doc => doc.data());

    if (reviews.length === 0) {
        const emptyStats = {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            verifiedPurchaseCount: 0,
            lastUpdated: serverTimestamp()
        };
        await setDoc(doc(db, 'productStats', productId), emptyStats);
        return emptyStats;
    }

    // Calculate statistics
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / totalReviews;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
        ratingDistribution[review.rating]++;
    });

    const verifiedPurchaseCount = reviews.filter(r => r.verified).length;

    const stats = {
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingDistribution,
        verifiedPurchaseCount,
        lastUpdated: serverTimestamp()
    };

    await setDoc(doc(db, 'productStats', productId), stats);
    return stats;
};

/**
 * Report a review
 */
export const reportReview = async (reviewId, reason) => {
    if (!auth.currentUser) {
        throw new Error('User must be logged in to report');
    }

    const userId = auth.currentUser.uid;
    const reviewRef = doc(db, 'reviews', reviewId);

    await updateDoc(reviewRef, {
        moderationFlags: arrayUnion(`reported_by_${userId}_${reason}`),
        updatedAt: serverTimestamp()
    });

    return { success: true };
};

/**
 * Add seller response to a review
 */
export const addSellerResponse = async (reviewId, responseContent) => {
    if (!auth.currentUser) {
        throw new Error('User must be logged in');
    }

    const userId = auth.currentUser.uid;
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
        throw new Error('Review not found');
    }

    const review = reviewDoc.data();

    // Get product to verify seller
    const productDoc = await getDoc(doc(db, 'products', review.productId));
    if (!productDoc.exists() || productDoc.data().sellerId !== userId) {
        throw new Error('Only the seller can respond to reviews');
    }

    await updateDoc(reviewRef, {
        sellerResponse: {
            content: responseContent,
            respondedAt: serverTimestamp(),
            respondedBy: userId
        },
        updatedAt: serverTimestamp()
    });

    return { success: true };
};

export default {
    canUserReview,
    submitReview,
    getProductReviews,
    voteHelpful,
    getReviewStats,
    updateProductStats,
    reportReview,
    addSellerResponse
};
