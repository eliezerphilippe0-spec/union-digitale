/**
 * Cache Service
 * In-memory + localStorage caching with TTL
 * Inspired by: Redis, Apollo Client cache
 */

class CacheService {
    constructor() {
        this.memoryCache = new Map();
        this.maxMemorySize = 50; // Max items in memory
    }

    /**
     * Set cache item
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    set(key, value, ttl = 5 * 60 * 1000) {
        const item = {
            value,
            expiry: Date.now() + ttl,
            timestamp: Date.now()
        };

        // Memory cache
        this.memoryCache.set(key, item);

        // Enforce memory limit (LRU-like)
        if (this.memoryCache.size > this.maxMemorySize) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }

        // localStorage cache (with error handling)
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify(item));
        } catch (e) {
            // localStorage full or disabled
            console.warn('localStorage cache failed:', e);
        }
    }

    /**
     * Get cache item
     * @param {string} key - Cache key
     * @returns {any|null} - Cached value or null if expired/not found
     */
    get(key) {
        // Try memory cache first
        let item = this.memoryCache.get(key);

        // Fallback to localStorage
        if (!item) {
            try {
                const stored = localStorage.getItem(`cache_${key}`);
                if (stored) {
                    item = JSON.parse(stored);
                    // Restore to memory cache
                    this.memoryCache.set(key, item);
                }
            } catch (e) {
                console.warn('localStorage read failed:', e);
            }
        }

        if (!item) return null;

        // Check expiry
        if (Date.now() > item.expiry) {
            this.remove(key);
            return null;
        }

        return item.value;
    }

    /**
     * Remove cache item
     * @param {string} key - Cache key
     */
    remove(key) {
        this.memoryCache.delete(key);
        try {
            localStorage.removeItem(`cache_${key}`);
        } catch (e) {
            console.warn('localStorage remove failed:', e);
        }
    }

    /**
     * Clear all cache
     */
    clear() {
        this.memoryCache.clear();
        try {
            // Clear only cache items
            Object.keys(localStorage)
                .filter(key => key.startsWith('cache_'))
                .forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.warn('localStorage clear failed:', e);
        }
    }

    /**
     * Get cache stats
     */
    getStats() {
        return {
            memorySize: this.memoryCache.size,
            memoryKeys: Array.from(this.memoryCache.keys()),
        };
    }

    /**
     * Invalidate cache by pattern
     * @param {RegExp} pattern - Pattern to match keys
     */
    invalidatePattern(pattern) {
        // Memory cache
        for (const key of this.memoryCache.keys()) {
            if (pattern.test(key)) {
                this.memoryCache.delete(key);
            }
        }

        // localStorage
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith('cache_') && pattern.test(key.replace('cache_', '')))
                .forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.warn('localStorage invalidate failed:', e);
        }
    }
}

export const cacheService = new CacheService();
export default cacheService;
