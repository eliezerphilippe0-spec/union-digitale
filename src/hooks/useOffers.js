import { useState, useEffect } from 'react';
import {
    getOffer,
    getOffers,
    getVendorOffers,
    checkAvailability,
    searchOffers
} from '../services/offerService';

/**
 * Custom hook for single offer
 */
export const useOffer = (offerId) => {
    const [offer, setOffer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (offerId) {
            loadOffer(offerId);
        }
    }, [offerId]);

    const loadOffer = async (id) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getOffer(id);
            setOffer(data);
        } catch (err) {
            setError(err.message);
            console.error('Error loading offer:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkOfferAvailability = async (dateRange = null) => {
        if (!offerId) return false;
        try {
            return await checkAvailability(offerId, dateRange);
        } catch (err) {
            console.error('Error checking availability:', err);
            return false;
        }
    };

    return {
        offer,
        loading,
        error,
        refresh: () => loadOffer(offerId),
        checkAvailability: checkOfferAvailability
    };
};

/**
 * Custom hook for offers list
 */
export const useOffers = (options = {}) => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadOffers();
    }, [JSON.stringify(options)]);

    const loadOffers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getOffers(options);
            setOffers(data);
        } catch (err) {
            setError(err.message);
            console.error('Error loading offers:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        offers,
        loading,
        error,
        refresh: loadOffers
    };
};

/**
 * Custom hook for vendor offers
 */
export const useVendorOffers = (vendorId) => {
    const [offers, setOffers] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (vendorId) {
            loadVendorOffers(vendorId);
        }
    }, [vendorId]);

    const loadVendorOffers = async (id) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getVendorOffers(id);
            setOffers(data);
        } catch (err) {
            setError(err.message);
            console.error('Error loading vendor offers:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        offers,
        loading,
        error,
        refresh: () => loadVendorOffers(vendorId)
    };
};

/**
 * Custom hook for offer search
 */
export const useOfferSearch = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const search = async (searchTerm, filters = {}) => {
        if (!searchTerm || searchTerm.trim().length < 2) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await searchOffers(searchTerm, filters);
            setResults(data);
        } catch (err) {
            setError(err.message);
            console.error('Error searching offers:', err);
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        setResults([]);
        setError(null);
    };

    return {
        results,
        loading,
        error,
        search,
        clear
    };
};

export default useOffer;
