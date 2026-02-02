import { useState, useEffect } from 'react';
import { getVendor, getVendorByUserId, getVendors, getVendorStats } from '../services/vendorService';

/**
 * Custom hook for vendor operations
 */
export const useVendor = (vendorId = null, userId = null) => {
    const [vendor, setVendor] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (vendorId) {
            loadVendor(vendorId);
        } else if (userId) {
            loadVendorByUserId(userId);
        }
    }, [vendorId, userId]);

    const loadVendor = async (id) => {
        try {
            setLoading(true);
            setError(null);
            const [vendorData, statsData] = await Promise.all([
                getVendor(id),
                getVendorStats(id)
            ]);
            setVendor(vendorData);
            setStats(statsData);
        } catch (err) {
            setError(err.message);
            console.error('Error loading vendor:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadVendorByUserId = async (uid) => {
        try {
            setLoading(true);
            setError(null);
            const vendorData = await getVendorByUserId(uid);
            if (vendorData) {
                setVendor(vendorData);
                const statsData = await getVendorStats(vendorData.id);
                setStats(statsData);
            }
        } catch (err) {
            setError(err.message);
            console.error('Error loading vendor by user ID:', err);
        } finally {
            setLoading(false);
        }
    };

    const refresh = () => {
        if (vendorId) {
            loadVendor(vendorId);
        } else if (userId) {
            loadVendorByUserId(userId);
        }
    };

    return {
        vendor,
        stats,
        loading,
        error,
        refresh
    };
};

/**
 * Custom hook for vendors list
 */
export const useVendors = (options = {}) => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadVendors();
    }, [JSON.stringify(options)]);

    const loadVendors = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getVendors(options);
            setVendors(data);
        } catch (err) {
            setError(err.message);
            console.error('Error loading vendors:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        vendors,
        loading,
        error,
        refresh: loadVendors
    };
};

export default useVendor;
