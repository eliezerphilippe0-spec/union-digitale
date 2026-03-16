import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { getVendor, updateVendorShop } from './vendorService';
import { getOffers } from './offerService';

/**
 * Salon Service - Specialized service for "Coiffeurs & Salons" vertical
 */

export const GENDER_FOCUS = {
    H: 'H',
    F: 'F',
    MIX: 'MIX'
};

export const SERVICE_MODE = {
    IN_SHOP: 'IN_SHOP',
    HOME: 'HOME',
    BOTH: 'BOTH'
};

/**
 * Get salon by slug
 * @param {string} slug - Salon slug
 * @returns {Promise<Object|null>} - Salon data
 */
export const getSalonBySlug = async (slug) => {
    try {
        const q = query(
            collection(db, 'vendors'),
            where('category', '==', 'SALON'),
            where('slug', '==', slug),
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
        console.error('Error getting salon by slug:', error);
        throw error;
    }
};

/**
 * Get salons with filters
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} - Array of salons
 */
export const getSalons = async (filters = {}) => {
    try {
        const {
            city = null,
            genderFocus = null,
            serviceMode = null,
            verified = null,
            limitCount = 50
        } = filters;

        let q = query(
            collection(db, 'vendors'),
            where('category', '==', 'SALON')
        );

        if (city) q = query(q, where('address.city', '==', city));
        if (genderFocus) q = query(q, where('genderFocus', '==', genderFocus));
        if (serviceMode) q = query(q, where('serviceMode', '==', serviceMode));
        if (verified !== null) q = query(q, where('verified', '==', verified));

        q = query(q, orderBy('rating', 'desc'), limit(limitCount));

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching salons:', error);
        throw error;
    }
};

/**
 * Get salon services (offers)
 * @param {string} salonId - Salon ID
 * @returns {Promise<Array>} - Array of services
 */
export const getSalonServices = async (salonId) => {
    return getOffers({ vendorId: salonId, type: 'service' });
};

/**
 * Update salon availability rules
 * @param {string} salonId - Salon ID
 * @param {Object} availabilityRules - Weekly rules and overrides
 */
export const updateSalonAvailability = async (salonId, availabilityRules) => {
    try {
        const docRef = doc(db, 'salonAvailability', salonId);
        await setDoc(docRef, {
            ...availabilityRules,
            updatedAt: serverTimestamp()
        }, { merge: true });

        console.log('Salon availability updated:', salonId);
    } catch (error) {
        console.error('Error updating salon availability:', error);
        throw error;
    }
};

/**
 * Get salon availability rules
 * @param {string} salonId - Salon ID
 * @returns {Promise<Object|null>} - Availability rules
 */
export const getSalonAvailability = async (salonId) => {
    try {
        const docRef = doc(db, 'salonAvailability', salonId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error('Error getting salon availability:', error);
        throw error;
    }
};

export default {
    getSalonBySlug,
    getSalons,
    getSalonServices,
    updateSalonAvailability,
    getSalonAvailability,
    GENDER_FOCUS,
    SERVICE_MODE
};
