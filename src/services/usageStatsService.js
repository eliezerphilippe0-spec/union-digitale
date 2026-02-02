/**
 * Usage Stats Service
 * Track real usage statistics for AI features, products created, etc.
 * Persists to localStorage and syncs to Firestore when available
 */

import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

const STORAGE_KEY = 'union_usage_stats';

// Default stats structure
const getDefaultStats = () => ({
    // AI Usage
    aiDescriptionsGenerated: 0,
    aiMarketingCopyGenerated: 0,
    aiAuditsPerformed: 0,

    // Products
    productsCreated: 0,
    productsPublished: 0,
    productsDraft: 0,

    // Sales
    totalSales: 0,
    totalRevenue: 0,

    // Engagement
    totalViews: 0,
    totalClicks: 0,

    // Session
    lastActive: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});

export const usageStatsService = {
    /**
     * Get stats from localStorage
     */
    getLocalStats() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
            return getDefaultStats();
        } catch (error) {
            console.warn('Error reading local stats:', error);
            return getDefaultStats();
        }
    },

    /**
     * Save stats to localStorage
     */
    saveLocalStats(stats) {
        try {
            stats.updatedAt = new Date().toISOString();
            stats.lastActive = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
            return true;
        } catch (error) {
            console.warn('Error saving local stats:', error);
            return false;
        }
    },

    /**
     * Increment a specific stat
     */
    incrementStat(statName, amount = 1) {
        const stats = this.getLocalStats();
        if (typeof stats[statName] === 'number') {
            stats[statName] += amount;
            this.saveLocalStats(stats);
        }
        return stats;
    },

    /**
     * Track AI description generation
     */
    trackAIDescription() {
        return this.incrementStat('aiDescriptionsGenerated');
    },

    /**
     * Track AI marketing copy generation
     */
    trackAIMarketing() {
        return this.incrementStat('aiMarketingCopyGenerated');
    },

    /**
     * Track AI audit performed
     */
    trackAIAudit() {
        return this.incrementStat('aiAuditsPerformed');
    },

    /**
     * Track product creation
     */
    trackProductCreated(isDraft = false) {
        this.incrementStat('productsCreated');
        if (isDraft) {
            this.incrementStat('productsDraft');
        } else {
            this.incrementStat('productsPublished');
        }
        return this.getLocalStats();
    },

    /**
     * Track a sale
     */
    trackSale(amount) {
        this.incrementStat('totalSales');
        this.incrementStat('totalRevenue', amount);
        return this.getLocalStats();
    },

    /**
     * Track product view
     */
    trackView() {
        return this.incrementStat('totalViews');
    },

    /**
     * Track product click
     */
    trackClick() {
        return this.incrementStat('totalClicks');
    },

    /**
     * Get all stats with computed metrics
     */
    getAllStats() {
        const stats = this.getLocalStats();

        // Compute additional metrics
        const totalAIUsage = stats.aiDescriptionsGenerated +
                           stats.aiMarketingCopyGenerated +
                           stats.aiAuditsPerformed;

        const conversionRate = stats.totalViews > 0
            ? ((stats.totalSales / stats.totalViews) * 100).toFixed(2)
            : 0;

        const avgOrderValue = stats.totalSales > 0
            ? (stats.totalRevenue / stats.totalSales).toFixed(0)
            : 0;

        return {
            ...stats,
            totalAIUsage,
            conversionRate: parseFloat(conversionRate),
            avgOrderValue: parseFloat(avgOrderValue)
        };
    },

    /**
     * Sync local stats to Firestore for a user
     */
    async syncToFirestore(userId) {
        if (!userId) return false;

        try {
            const stats = this.getLocalStats();
            const userStatsRef = doc(db, 'user_stats', userId);

            await setDoc(userStatsRef, {
                ...stats,
                syncedAt: new Date().toISOString()
            }, { merge: true });

            return true;
        } catch (error) {
            console.warn('Error syncing stats to Firestore:', error);
            return false;
        }
    },

    /**
     * Load stats from Firestore and merge with local
     */
    async loadFromFirestore(userId) {
        if (!userId) return this.getLocalStats();

        try {
            const userStatsRef = doc(db, 'user_stats', userId);
            const docSnap = await getDoc(userStatsRef);

            if (docSnap.exists()) {
                const firestoreStats = docSnap.data();
                const localStats = this.getLocalStats();

                // Merge: take the higher value for each numeric stat
                const mergedStats = { ...getDefaultStats() };

                Object.keys(mergedStats).forEach(key => {
                    if (typeof mergedStats[key] === 'number') {
                        mergedStats[key] = Math.max(
                            localStats[key] || 0,
                            firestoreStats[key] || 0
                        );
                    }
                });

                mergedStats.createdAt = firestoreStats.createdAt || localStats.createdAt;
                mergedStats.updatedAt = new Date().toISOString();

                this.saveLocalStats(mergedStats);
                return mergedStats;
            }

            return this.getLocalStats();
        } catch (error) {
            console.warn('Error loading stats from Firestore:', error);
            return this.getLocalStats();
        }
    },

    /**
     * Clear all local stats
     */
    clearLocalStats() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (error) {
            console.warn('Error clearing local stats:', error);
            return false;
        }
    },

    /**
     * Clear all app cache (localStorage)
     */
    clearAllCache() {
        try {
            const keysToPreserve = ['theme', 'language']; // Preserve user preferences
            const preserved = {};

            keysToPreserve.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) preserved[key] = value;
            });

            localStorage.clear();

            // Restore preserved items
            Object.entries(preserved).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });

            return true;
        } catch (error) {
            console.warn('Error clearing cache:', error);
            return false;
        }
    },

    /**
     * Get cache size estimate
     */
    getCacheSize() {
        try {
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage.getItem(key).length * 2; // UTF-16 = 2 bytes per char
                }
            }
            return {
                bytes: totalSize,
                kb: (totalSize / 1024).toFixed(2),
                mb: (totalSize / (1024 * 1024)).toFixed(4)
            };
        } catch (error) {
            return { bytes: 0, kb: '0', mb: '0' };
        }
    }
};

export default usageStatsService;
