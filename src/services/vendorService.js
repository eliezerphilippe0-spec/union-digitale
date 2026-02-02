import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Vendor Service - Manages vendor shops and profiles
 * Supports multi-vendor marketplace functionality
 */

export const VERIFICATION_LEVELS = {
    BASIC: 'basic',
    VERIFIED: 'verified',
    PREMIUM: 'premium'
};

/**
 * Create a new vendor shop
 * @param {Object} vendorData - Vendor shop data
 * @returns {Promise<string>} - Vendor ID
 */
export const createVendorShop = async (vendorData) => {
    try {
        const {
            userId,
            shopName,
            shopLogo = null,
            shopBanner = null,
            description = '',
            category = 'general',
            phone = '',
            email = '',
            address = {}
        } = vendorData;

        if (!userId || !shopName) {
            throw new Error('User ID and shop name are required');
        }

        const vendor = {
            userId,
            shopName,
            shopLogo,
            shopBanner,
            description,
            category,
            phone,
            email,
            address,
            verified: false,
            verificationLevel: VERIFICATION_LEVELS.BASIC,
            rating: 0,
            reviewCount: 0,
            totalSales: 0,
            totalRevenue: 0,
            commission: 10, // Default 10% commission
            status: 'active',
            joinedDate: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'vendors'), vendor);
        console.log('Vendor shop created:', docRef.id);
        return docRef.id;

    } catch (error) {
        console.error('Error creating vendor shop:', error);
        throw error;
    }
};

/**
 * Get vendor by ID
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Object>} - Vendor data
 */
export const getVendor = async (vendorId) => {
    try {
        const docRef = doc(db, 'vendors', vendorId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            throw new Error('Vendor not found');
        }
    } catch (error) {
        console.error('Error getting vendor:', error);
        throw error;
    }
};

/**
 * Get vendor by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Vendor data or null
 */
export const getVendorByUserId = async (userId) => {
    try {
        const q = query(
            collection(db, 'vendors'),
            where('userId', '==', userId),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        }

        return null;
    } catch (error) {
        console.error('Error getting vendor by user ID:', error);
        throw error;
    }
};

/**
 * Update vendor shop
 * @param {string} vendorId - Vendor ID
 * @param {Object} updates - Fields to update
 */
export const updateVendorShop = async (vendorId, updates) => {
    try {
        const docRef = doc(db, 'vendors', vendorId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        console.log('Vendor shop updated:', vendorId);
    } catch (error) {
        console.error('Error updating vendor shop:', error);
        throw error;
    }
};

/**
 * Get all vendors with filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of vendors
 */
export const getVendors = async (options = {}) => {
    try {
        const {
            category = null,
            verified = null,
            limitCount = 50,
            orderByField = 'rating',
            orderDirection = 'desc'
        } = options;

        let q = query(collection(db, 'vendors'));

        // Add filters
        if (category) {
            q = query(q, where('category', '==', category));
        }
        if (verified !== null) {
            q = query(q, where('verified', '==', verified));
        }

        // Add ordering
        q = query(q, orderBy(orderByField, orderDirection));
        q = query(q, limit(limitCount));

        const querySnapshot = await getDocs(q);
        const vendors = [];

        querySnapshot.forEach((doc) => {
            vendors.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return vendors;

    } catch (error) {
        console.error('Error getting vendors:', error);
        throw error;
    }
};

/**
 * Update vendor rating
 * @param {string} vendorId - Vendor ID
 * @param {number} newRating - New rating to add
 */
export const updateVendorRating = async (vendorId, newRating) => {
    try {
        const vendor = await getVendor(vendorId);
        const currentRating = vendor.rating || 0;
        const currentCount = vendor.reviewCount || 0;

        const totalRating = (currentRating * currentCount) + newRating;
        const newCount = currentCount + 1;
        const updatedRating = totalRating / newCount;

        await updateVendorShop(vendorId, {
            rating: updatedRating,
            reviewCount: newCount
        });

        console.log('Vendor rating updated:', vendorId);
    } catch (error) {
        console.error('Error updating vendor rating:', error);
        throw error;
    }
};

/**
 * Increment vendor sales
 * @param {string} vendorId - Vendor ID
 * @param {number} amount - Sale amount
 */
export const incrementVendorSales = async (vendorId, amount) => {
    try {
        const vendor = await getVendor(vendorId);

        await updateVendorShop(vendorId, {
            totalSales: (vendor.totalSales || 0) + 1,
            totalRevenue: (vendor.totalRevenue || 0) + amount
        });

        console.log('Vendor sales incremented:', vendorId);
    } catch (error) {
        console.error('Error incrementing vendor sales:', error);
        throw error;
    }
};

/**
 * Request vendor verification
 * @param {string} vendorId - Vendor ID
 * @param {Object} verificationData - Verification documents/data
 */
export const requestVerification = async (vendorId, verificationData) => {
    try {
        const verification = {
            vendorId,
            ...verificationData,
            status: 'pending',
            requestedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'verificationRequests'), verification);

        await updateVendorShop(vendorId, {
            verificationStatus: 'pending'
        });

        console.log('Verification requested:', vendorId);
    } catch (error) {
        console.error('Error requesting verification:', error);
        throw error;
    }
};

/**
 * Get vendor statistics
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Object>} - Vendor stats
 */
export const getVendorStats = async (vendorId) => {
    try {
        const vendor = await getVendor(vendorId);

        // Get offer count by type
        const offersQuery = query(
            collection(db, 'offers'),
            where('vendorId', '==', vendorId)
        );
        const offersSnapshot = await getDocs(offersQuery);

        const offersByType = {
            physical: 0,
            digital: 0,
            service: 0,
            rental: 0,
            accommodation: 0
        };

        offersSnapshot.forEach((doc) => {
            const type = doc.data().type;
            if (offersByType.hasOwnProperty(type)) {
                offersByType[type]++;
            }
        });

        return {
            totalOffers: offersSnapshot.size,
            offersByType,
            totalSales: vendor.totalSales || 0,
            totalRevenue: vendor.totalRevenue || 0,
            rating: vendor.rating || 0,
            reviewCount: vendor.reviewCount || 0,
            verificationLevel: vendor.verificationLevel
        };

    } catch (error) {
        console.error('Error getting vendor stats:', error);
        throw error;
    }
};

export default {
    createVendorShop,
    getVendor,
    getVendorByUserId,
    updateVendorShop,
    getVendors,
    updateVendorRating,
    incrementVendorSales,
    requestVerification,
    getVendorStats,
    VERIFICATION_LEVELS
};
