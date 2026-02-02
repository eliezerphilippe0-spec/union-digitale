import { useState, useEffect } from 'react';
import {
    getUserBookings,
    getOfferBookings,
    getUpcomingBookings,
    checkDateAvailability
} from '../services/bookingService';

/**
 * Custom hook for user bookings
 */
export const useBookings = (userId, role = 'buyer') => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userId) {
            loadBookings(userId, role);
        }
    }, [userId, role]);

    const loadBookings = async (uid, userRole) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getUserBookings(uid, userRole);
            setBookings(data);
        } catch (err) {
            setError(err.message);
            console.error('Error loading bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        bookings,
        loading,
        error,
        refresh: () => loadBookings(userId, role)
    };
};

/**
 * Custom hook for upcoming bookings
 */
export const useUpcomingBookings = (userId, role = 'buyer') => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userId) {
            loadUpcoming(userId, role);
        }
    }, [userId, role]);

    const loadUpcoming = async (uid, userRole) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getUpcomingBookings(uid, userRole);
            setBookings(data);
        } catch (err) {
            setError(err.message);
            console.error('Error loading upcoming bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        bookings,
        loading,
        error,
        refresh: () => loadUpcoming(userId, role)
    };
};

/**
 * Custom hook for offer availability
 */
export const useAvailability = (offerId) => {
    const [checking, setChecking] = useState(false);

    const checkAvailability = async (startDate, endDate) => {
        if (!offerId || !startDate) return false;

        try {
            setChecking(true);
            const available = await checkDateAvailability(offerId, startDate, endDate);
            return available;
        } catch (err) {
            console.error('Error checking availability:', err);
            return false;
        } finally {
            setChecking(false);
        }
    };

    return {
        checkAvailability,
        checking
    };
};

export default useBookings;
