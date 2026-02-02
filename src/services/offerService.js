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
 * Offer Service - Unified service for all offer types
 * Handles products, digital goods, services, rentals, and accommodations
 */

export const OFFER_TYPES = {
    PHYSICAL: 'physical',
    DIGITAL: 'digital',
    SERVICE: 'service',
    RENTAL: 'rental',
    ACCOMMODATION: 'accommodation'
};

export const OFFER_STATUS = {
    ACTIVE: 'active',
    DRAFT: 'draft',
    SOLD: 'sold',
    UNAVAILABLE: 'unavailable',
    ARCHIVED: 'archived'
};

/**
 * Create a new offer
 * @param {Object} offerData - Offer data
 * @returns {Promise<string>} - Offer ID
 */
export const createOffer = async (offerData) => {
    try {
        const {
            vendorId,
            type,
            title,
            description,
            price,
            images = [],
            category,
            // Type-specific fields
            digitalAccess = null,
            serviceDetails = null,
            rentalDetails = null,
            accommodationDetails = null,
            availability = null
        } = offerData;

        if (!vendorId || !type || !title || !price) {
            throw new Error('Vendor ID, type, title, and price are required');
        }

        if (!Object.values(OFFER_TYPES).includes(type)) {
            throw new Error('Invalid offer type');
        }

        const offer = {
            vendorId,
            type,
            title,
            description,
            price: parseFloat(price),
            images,
            category,
            status: OFFER_STATUS.ACTIVE,
            rating: 0,
            reviewCount: 0,
            viewCount: 0,
            salesCount: 0,
            featured: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Add type-specific fields
        if (type === OFFER_TYPES.DIGITAL && digitalAccess) {
            offer.digitalAccess = digitalAccess;
        }
        if (type === OFFER_TYPES.SERVICE && serviceDetails) {
            offer.serviceDetails = serviceDetails;
        }
        if (type === OFFER_TYPES.RENTAL && rentalDetails) {
            offer.rentalDetails = rentalDetails;
        }
        if (type === OFFER_TYPES.ACCOMMODATION && accommodationDetails) {
            offer.accommodationDetails = accommodationDetails;
        }
        if (availability) {
            offer.availability = availability;
        }

        const docRef = await addDoc(collection(db, 'offers'), offer);
        console.log('Offer created:', docRef.id);
        return docRef.id;

    } catch (error) {
        console.error('Error creating offer:', error);
        throw error;
    }
};

/**
 * Get offer by ID
 * @param {string} offerId - Offer ID
 * @returns {Promise<Object>} - Offer data
 */
export const getOffer = async (offerId) => {
    try {
        const docRef = doc(db, 'offers', offerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            throw new Error('Offer not found');
        }
    } catch (error) {
        console.error('Error getting offer:', error);
        throw error;
    }
};

/**
 * Update offer
 * @param {string} offerId - Offer ID
 * @param {Object} updates - Fields to update
 */
export const updateOffer = async (offerId, updates) => {
    try {
        const docRef = doc(db, 'offers', offerId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        console.log('Offer updated:', offerId);
    } catch (error) {
        console.error('Error updating offer:', error);
        throw error;
    }
};

/**
 * Delete offer
 * @param {string} offerId - Offer ID
 */
export const deleteOffer = async (offerId) => {
    try {
        const docRef = doc(db, 'offers', offerId);
        await deleteDoc(docRef);
        console.log('Offer deleted:', offerId);
    } catch (error) {
        console.error('Error deleting offer:', error);
        throw error;
    }
};

/**
 * Get offers with filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of offers
 */
export const getOffers = async (options = {}) => {
    try {
        const {
            type = null,
            vendorId = null,
            category = null,
            status = OFFER_STATUS.ACTIVE,
            limitCount = 50,
            orderByField = 'createdAt',
            orderDirection = 'desc'
        } = options;

        let q = query(collection(db, 'offers'));

        // Add filters
        if (type) {
            q = query(q, where('type', '==', type));
        }
        if (vendorId) {
            q = query(q, where('vendorId', '==', vendorId));
        }
        if (category) {
            q = query(q, where('category', '==', category));
        }
        if (status) {
            q = query(q, where('status', '==', status));
        }

        // Add ordering
        q = query(q, orderBy(orderByField, orderDirection));
        q = query(q, limit(limitCount));

        const querySnapshot = await getDocs(q);
        const offers = [];

        querySnapshot.forEach((doc) => {
            offers.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return offers;

    } catch (error) {
        console.error('Error getting offers:', error);
        throw error;
    }
};

/**
 * Get vendor offers
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Object>} - Offers grouped by type
 */
export const getVendorOffers = async (vendorId) => {
    try {
        const offers = await getOffers({ vendorId, limitCount: 100 });

        const grouped = {
            physical: [],
            digital: [],
            service: [],
            rental: [],
            accommodation: []
        };

        offers.forEach(offer => {
            if (grouped[offer.type]) {
                grouped[offer.type].push(offer);
            }
        });

        return grouped;

    } catch (error) {
        console.error('Error getting vendor offers:', error);
        throw error;
    }
};

/**
 * Increment offer view count
 * @param {string} offerId - Offer ID
 */
export const incrementViewCount = async (offerId) => {
    try {
        const offer = await getOffer(offerId);
        await updateOffer(offerId, {
            viewCount: (offer.viewCount || 0) + 1
        });
    } catch (error) {
        console.error('Error incrementing view count:', error);
    }
};

/**
 * Update offer rating
 * @param {string} offerId - Offer ID
 * @param {number} newRating - New rating to add
 */
export const updateOfferRating = async (offerId, newRating) => {
    try {
        const offer = await getOffer(offerId);
        const currentRating = offer.rating || 0;
        const currentCount = offer.reviewCount || 0;

        const totalRating = (currentRating * currentCount) + newRating;
        const newCount = currentCount + 1;
        const updatedRating = totalRating / newCount;

        await updateOffer(offerId, {
            rating: updatedRating,
            reviewCount: newCount
        });

        console.log('Offer rating updated:', offerId);
    } catch (error) {
        console.error('Error updating offer rating:', error);
        throw error;
    }
};

/**
 * Check offer availability
 * @param {string} offerId - Offer ID
 * @param {Object} dateRange - Start and end dates
 * @returns {Promise<boolean>} - Is available
 */
export const checkAvailability = async (offerId, dateRange = null) => {
    try {
        const offer = await getOffer(offerId);

        if (offer.status !== OFFER_STATUS.ACTIVE) {
            return false;
        }

        // For time-based offers (services, rentals, accommodations)
        if (dateRange && offer.availability) {
            // Check if dates are available
            // This would integrate with booking system
            const { startDate, endDate } = dateRange;

            // Query bookings for this offer in the date range
            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('offerId', '==', offerId),
                where('status', 'in', ['confirmed', 'pending'])
            );

            const bookingsSnapshot = await getDocs(bookingsQuery);

            // Check for conflicts
            for (const doc of bookingsSnapshot.docs) {
                const booking = doc.data();
                const bookingStart = booking.startDate.toDate();
                const bookingEnd = booking.endDate.toDate();

                // Check if dates overlap
                if (
                    (startDate >= bookingStart && startDate < bookingEnd) ||
                    (endDate > bookingStart && endDate <= bookingEnd) ||
                    (startDate <= bookingStart && endDate >= bookingEnd)
                ) {
                    return false; // Conflict found
                }
            }
        }

        return true;

    } catch (error) {
        console.error('Error checking availability:', error);
        return false;
    }
};

/**
 * Search offers
 * @param {string} searchTerm - Search term
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} - Matching offers
 */
export const searchOffers = async (searchTerm, filters = {}) => {
    try {
        // Get all offers with filters
        const offers = await getOffers({ ...filters, limitCount: 200 });

        // Filter by search term (client-side for now)
        const searchLower = searchTerm.toLowerCase();
        const results = offers.filter(offer =>
            offer.title.toLowerCase().includes(searchLower) ||
            offer.description.toLowerCase().includes(searchLower) ||
            offer.category.toLowerCase().includes(searchLower)
        );

        return results;

    } catch (error) {
        console.error('Error searching offers:', error);
        throw error;
    }
};

export default {
    createOffer,
    getOffer,
    updateOffer,
    deleteOffer,
    getOffers,
    getVendorOffers,
    incrementViewCount,
    updateOfferRating,
    checkAvailability,
    searchOffers,
    OFFER_TYPES,
    OFFER_STATUS
};
