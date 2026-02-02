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
    Timestamp
} from 'firebase/firestore';

/**
 * Booking Service - Manages reservations for services, rentals, and accommodations
 */

export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected'
};

export const BOOKING_TYPES = {
    SERVICE: 'service',
    RENTAL: 'rental',
    ACCOMMODATION: 'accommodation'
};

/**
 * Create a new booking
 * @param {Object} bookingData - Booking data
 * @returns {Promise<string>} - Booking ID
 */
export const createBooking = async (bookingData) => {
    try {
        const {
            offerId,
            vendorId,
            buyerId,
            type,
            startDate,
            endDate,
            guests = 1,
            totalPrice,
            paymentMethod = 'moncash',
            notes = ''
        } = bookingData;

        if (!offerId || !vendorId || !buyerId || !type || !startDate || !totalPrice) {
            throw new Error('Missing required booking fields');
        }

        // Convert dates to Firestore Timestamps
        const start = startDate instanceof Date ? Timestamp.fromDate(startDate) : startDate;
        const end = endDate instanceof Date ? Timestamp.fromDate(endDate) : endDate;

        const booking = {
            offerId,
            vendorId,
            buyerId,
            type,
            startDate: start,
            endDate: end || start,
            guests,
            totalPrice: parseFloat(totalPrice),
            paymentMethod,
            paymentStatus: 'pending',
            status: BOOKING_STATUS.PENDING,
            notes,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'bookings'), booking);
        console.log('Booking created:', docRef.id);
        return docRef.id;

    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
};

/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} - Booking data
 */
export const getBooking = async (bookingId) => {
    try {
        const docRef = doc(db, 'bookings', bookingId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            throw new Error('Booking not found');
        }
    } catch (error) {
        console.error('Error getting booking:', error);
        throw error;
    }
};

/**
 * Update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional data to update
 */
export const updateBookingStatus = async (bookingId, status, additionalData = {}) => {
    try {
        const docRef = doc(db, 'bookings', bookingId);
        await updateDoc(docRef, {
            status,
            ...additionalData,
            updatedAt: serverTimestamp()
        });

        console.log('Booking status updated:', bookingId, status);
    } catch (error) {
        console.error('Error updating booking status:', error);
        throw error;
    }
};

/**
 * Get user bookings
 * @param {string} userId - User ID
 * @param {string} role - 'buyer' or 'vendor'
 * @returns {Promise<Array>} - Array of bookings
 */
export const getUserBookings = async (userId, role = 'buyer') => {
    try {
        const field = role === 'buyer' ? 'buyerId' : 'vendorId';

        const q = query(
            collection(db, 'bookings'),
            where(field, '==', userId),
            orderBy('createdAt', 'desc'),
            limit(100)
        );

        const querySnapshot = await getDocs(q);
        const bookings = [];

        querySnapshot.forEach((doc) => {
            bookings.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return bookings;

    } catch (error) {
        console.error('Error getting user bookings:', error);
        throw error;
    }
};

/**
 * Get offer bookings
 * @param {string} offerId - Offer ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of bookings
 */
export const getOfferBookings = async (offerId, options = {}) => {
    try {
        const {
            status = null,
            startDate = null,
            endDate = null
        } = options;

        let q = query(
            collection(db, 'bookings'),
            where('offerId', '==', offerId),
            orderBy('startDate', 'asc')
        );

        if (status) {
            q = query(q, where('status', '==', status));
        }

        const querySnapshot = await getDocs(q);
        const bookings = [];

        querySnapshot.forEach((doc) => {
            const booking = {
                id: doc.id,
                ...doc.data()
            };

            // Filter by date range if provided
            if (startDate || endDate) {
                const bookingStart = booking.startDate.toDate();
                const bookingEnd = booking.endDate.toDate();

                if (startDate && bookingStart < startDate) return;
                if (endDate && bookingEnd > endDate) return;
            }

            bookings.push(booking);
        });

        return bookings;

    } catch (error) {
        console.error('Error getting offer bookings:', error);
        throw error;
    }
};

/**
 * Check if dates are available for booking
 * @param {string} offerId - Offer ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<boolean>} - Is available
 */
export const checkDateAvailability = async (offerId, startDate, endDate) => {
    try {
        const bookings = await getOfferBookings(offerId, {
            status: BOOKING_STATUS.CONFIRMED
        });

        for (const booking of bookings) {
            const bookingStart = booking.startDate.toDate();
            const bookingEnd = booking.endDate.toDate();

            // Check for overlap
            if (
                (startDate >= bookingStart && startDate < bookingEnd) ||
                (endDate > bookingStart && endDate <= bookingEnd) ||
                (startDate <= bookingStart && endDate >= bookingEnd)
            ) {
                return false; // Conflict found
            }
        }

        return true; // Available

    } catch (error) {
        console.error('Error checking date availability:', error);
        return false;
    }
};

/**
 * Confirm booking
 * @param {string} bookingId - Booking ID
 */
export const confirmBooking = async (bookingId) => {
    try {
        await updateBookingStatus(bookingId, BOOKING_STATUS.CONFIRMED, {
            confirmedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error confirming booking:', error);
        throw error;
    }
};

/**
 * Cancel booking
 * @param {string} bookingId - Booking ID
 * @param {string} reason - Cancellation reason
 */
export const cancelBooking = async (bookingId, reason = '') => {
    try {
        await updateBookingStatus(bookingId, BOOKING_STATUS.CANCELLED, {
            cancelledAt: serverTimestamp(),
            cancellationReason: reason
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        throw error;
    }
};

/**
 * Complete booking
 * @param {string} bookingId - Booking ID
 */
export const completeBooking = async (bookingId) => {
    try {
        await updateBookingStatus(bookingId, BOOKING_STATUS.COMPLETED, {
            completedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error completing booking:', error);
        throw error;
    }
};

/**
 * Get upcoming bookings
 * @param {string} userId - User ID
 * @param {string} role - 'buyer' or 'vendor'
 * @returns {Promise<Array>} - Array of upcoming bookings
 */
export const getUpcomingBookings = async (userId, role = 'buyer') => {
    try {
        const allBookings = await getUserBookings(userId, role);
        const now = new Date();

        const upcoming = allBookings.filter(booking => {
            const startDate = booking.startDate.toDate();
            return startDate > now && booking.status === BOOKING_STATUS.CONFIRMED;
        });

        return upcoming.sort((a, b) =>
            a.startDate.toDate() - b.startDate.toDate()
        );

    } catch (error) {
        console.error('Error getting upcoming bookings:', error);
        throw error;
    }
};

/**
 * Calculate booking duration
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} unit - 'hours', 'days', 'nights'
 * @returns {number} - Duration
 */
export const calculateDuration = (startDate, endDate, unit = 'days') => {
    const diff = endDate - startDate;

    switch (unit) {
        case 'hours':
            return Math.ceil(diff / (1000 * 60 * 60));
        case 'days':
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        case 'nights':
            return Math.floor(diff / (1000 * 60 * 60 * 24));
        default:
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
};

export default {
    createBooking,
    getBooking,
    updateBookingStatus,
    getUserBookings,
    getOfferBookings,
    checkDateAvailability,
    confirmBooking,
    cancelBooking,
    completeBooking,
    getUpcomingBookings,
    calculateDuration,
    BOOKING_STATUS,
    BOOKING_TYPES
};
