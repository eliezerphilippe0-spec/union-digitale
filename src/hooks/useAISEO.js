import { useState, useEffect, useRef } from 'react';
import { seoService } from '../services/seoService';

/**
 * useAISEO Hook
 * Automatically generates AI-powered SEO metadata for any listing.
 * Uses a cache to avoid redundant API calls.
 *
 * @param {Object|null} listing - The listing object (product, service, car, etc.)
 * @param {string} type - The listing type: 'product' | 'service' | 'car' | 'real-estate' | 'digital'
 * @returns {{ seoMeta: {title, description, keywords}|null, loading: boolean }}
 */

const cache = {};

const useAISEO = (listing, type = 'product') => {
    const [seoMeta, setSeoMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const abortRef = useRef(false);

    useEffect(() => {
        if (!listing) return;

        // Create a deterministic cache key from the listing content
        const cacheKey = `${type}_${listing.id || listing.name || listing.title}`;

        if (cache[cacheKey]) {
            setSeoMeta(cache[cacheKey]);
            return;
        }

        abortRef.current = false;
        setLoading(true);

        seoService.generateSEOMetadata({ ...listing, type })
            .then(meta => {
                if (!abortRef.current) {
                    cache[cacheKey] = meta;
                    setSeoMeta(meta);
                }
            })
            .catch(err => {
                console.error('useAISEO error:', err);
            })
            .finally(() => {
                if (!abortRef.current) setLoading(false);
            });

        return () => {
            abortRef.current = true;
        };
    }, [listing?.id, listing?.name, listing?.title, type]);

    return { seoMeta, loading };
};

export default useAISEO;
