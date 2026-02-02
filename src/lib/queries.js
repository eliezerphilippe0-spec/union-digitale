import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
    getDoc,
    doc
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Optimized Query Library for Union Digitale Marketplace
 * Features:
 * - Trending products in Haiti
 * - Redis caching for hot queries (>1k tx/day)
 * - Infinite scroll pagination
 * - Geo-based filtering
 */

// Simple in-memory cache (replace with Redis in production)
const cache = new Map();
const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds

/**
 * Get cached data or fetch from Firestore
 * @param {string} cacheKey - Cache key
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<any>}
 */
async function getCached(cacheKey, fetchFn) {
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`📦 Cache hit: ${cacheKey}`);
        return cached.data;
    }

    console.log(`🔄 Cache miss: ${cacheKey}`);
    const data = await fetchFn();

    cache.set(cacheKey, {
        data,
        timestamp: Date.now()
    });

    return data;
}

/**
 * Get trending products in Haiti
 * @param {number} limitCount - Number of products to fetch
 * @returns {Promise<Array>}
 */
export async function getTrendingProductsHaiti(limitCount = 20) {
    const cacheKey = `trending_haiti_${new Date().toDateString()}_${limitCount}`;

    return getCached(cacheKey, async () => {
        const q = query(
            collection(db, 'products'),
            where('country', '==', 'HT'),
            where('status', '==', 'active'),
            orderBy('salesCount', 'desc'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    });
}

/**
 * Get trending products in Canada
 * @param {number} limitCount - Number of products to fetch
 * @returns {Promise<Array>}
 */
export async function getTrendingProductsCanada(limitCount = 20) {
    const cacheKey = `trending_canada_${new Date().toDateString()}_${limitCount}`;

    return getCached(cacheKey, async () => {
        const q = query(
            collection(db, 'products'),
            where('country', '==', 'CA'),
            where('status', '==', 'active'),
            orderBy('salesCount', 'desc'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    });
}

/**
 * Get products by category with pagination
 * @param {string} category - Product category
 * @param {number} limitCount - Number of products per page
 * @param {Object} lastDocument - Last document from previous page
 * @returns {Promise<Object>} - { products, lastDoc, hasMore }
 */
export async function getProductsByCategory(category, limitCount = 50, lastDocument = null) {
    let q = query(
        collection(db, 'products'),
        where('category', '==', category),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );

    if (lastDocument) {
        q = query(q, startAfter(lastDocument));
    }

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return {
        products,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === limitCount
    };
}

/**
 * Get vendor products with pagination
 * @param {string} vendorId - Vendor ID
 * @param {number} limitCount - Number of products per page
 * @param {Object} lastDocument - Last document from previous page
 * @returns {Promise<Object>} - { products, lastDoc, hasMore }
 */
export async function getVendorProducts(vendorId, limitCount = 50, lastDocument = null) {
    let q = query(
        collection(db, 'products'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );

    if (lastDocument) {
        q = query(q, startAfter(lastDocument));
    }

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return {
        products,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === limitCount
    };
}

/**
 * Search products by name (simple text search)
 * For production, use Algolia or Elasticsearch
 * @param {string} searchTerm - Search term
 * @param {number} limitCount - Number of results
 * @returns {Promise<Array>}
 */
export async function searchProducts(searchTerm, limitCount = 20) {
    // Simple search by name prefix (limited functionality)
    // For better search, integrate Algolia
    const searchLower = searchTerm.toLowerCase();

    const q = query(
        collection(db, 'products'),
        where('status', '==', 'active'),
        orderBy('name'),
        limit(100) // Fetch more to filter client-side
    );

    const snapshot = await getDocs(q);
    const products = snapshot.docs
        .map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        .filter(product =>
            product.name.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower)
        )
        .slice(0, limitCount);

    return products;
}

/**
 * Get new arrivals (last 7 days)
 * @param {string} country - Country code (HT or CA)
 * @param {number} limitCount - Number of products
 * @returns {Promise<Array>}
 */
export async function getNewArrivals(country = 'HT', limitCount = 20) {
    const cacheKey = `new_arrivals_${country}_${new Date().toDateString()}`;

    return getCached(cacheKey, async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const q = query(
            collection(db, 'products'),
            where('country', '==', country),
            where('status', '==', 'active'),
            where('createdAt', '>=', sevenDaysAgo),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    });
}

/**
 * Get low stock products for vendor
 * @param {string} vendorId - Vendor ID
 * @param {number} threshold - Stock threshold (default: 10)
 * @returns {Promise<Array>}
 */
export async function getLowStockProducts(vendorId, threshold = 10) {
    const q = query(
        collection(db, 'products'),
        where('vendorId', '==', vendorId),
        where('stock', '<=', threshold),
        where('stock', '>', 0),
        orderBy('stock', 'asc'),
        limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Get out of stock products for vendor
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Array>}
 */
export async function getOutOfStockProducts(vendorId) {
    const q = query(
        collection(db, 'products'),
        where('vendorId', '==', vendorId),
        where('stock', '==', 0),
        orderBy('updatedAt', 'desc'),
        limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Get vendor statistics
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Object>}
 */
export async function getVendorStats(vendorId) {
    const cacheKey = `vendor_stats_${vendorId}_${Date.now()}`;

    // Get vendor balance
    const balanceDoc = await getDoc(doc(db, 'balances', vendorId));
    const balance = balanceDoc.exists() ? balanceDoc.data() : { available: 0, pending: 0, total: 0 };

    // Get total products
    const productsQuery = query(
        collection(db, 'products'),
        where('vendorId', '==', vendorId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const totalProducts = productsSnapshot.size;

    // Get active products
    const activeQuery = query(
        collection(db, 'products'),
        where('vendorId', '==', vendorId),
        where('status', '==', 'active')
    );
    const activeSnapshot = await getDocs(activeQuery);
    const activeProducts = activeSnapshot.size;

    // Get total sales (from transactions)
    const transactionsQuery = query(
        collection(db, 'transactions'),
        where('vendorId', '==', vendorId),
        where('type', '==', 'sale')
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const totalSales = transactionsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

    return {
        balance,
        totalProducts,
        activeProducts,
        totalSales,
        totalOrders: transactionsSnapshot.size
    };
}

/**
 * Clear cache (for testing or manual refresh)
 */
export function clearCache() {
    cache.clear();
    console.log('🗑️ Cache cleared');
}

export default {
    getTrendingProductsHaiti,
    getTrendingProductsCanada,
    getProductsByCategory,
    getVendorProducts,
    searchProducts,
    getNewArrivals,
    getLowStockProducts,
    getOutOfStockProducts,
    getVendorStats,
    clearCache
};
