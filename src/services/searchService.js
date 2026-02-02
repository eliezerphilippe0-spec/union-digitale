import { collection, query, where, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Search Service
 * Abstracted search interface ready for Algolia integration
 * Current: Firestore queries (limited)
 * Future: Algolia for full-text search
 */

class SearchService {
    constructor() {
        this.provider = 'firestore'; // 'firestore' or 'algolia'
    }

    /**
     * Search products
     * @param {string} searchTerm - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} - Search results
     */
    async searchProducts(searchTerm, filters = {}) {
        if (this.provider === 'algolia') {
            return this.searchWithAlgolia(searchTerm, filters);
        }
        return this.searchWithFirestore(searchTerm, filters);
    }

    /**
     * Firestore search (basic, case-sensitive)
     * @private
     */
    async searchWithFirestore(searchTerm, filters) {
        try {
            const { category, minPrice, maxPrice, sortBy = 'createdAt' } = filters;

            // Build query
            let q = query(collection(db, 'products'));

            // Category filter
            if (category) {
                q = query(q, where('category', '==', category));
            }

            // Price range filter
            if (minPrice !== undefined) {
                q = query(q, where('price', '>=', minPrice));
            }
            if (maxPrice !== undefined) {
                q = query(q, where('price', '<=', maxPrice));
            }

            // Sort
            q = query(q, orderBy(sortBy, 'desc'), limit(50));

            const snapshot = await getDocs(q);
            let results = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side text search (Firestore limitation)
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                results = results.filter(product => {
                    const name = (product.name || '').toLowerCase();
                    const description = (product.description || '').toLowerCase();
                    const tags = (product.tags || []).map(t => t.toLowerCase());

                    return (
                        name.includes(term) ||
                        description.includes(term) ||
                        tags.some(tag => tag.includes(term))
                    );
                });
            }

            return results;

        } catch (error) {
            console.error('Firestore search error:', error);
            return [];
        }
    }

    /**
     * Algolia search (future implementation)
     * @private
     */
    async searchWithAlgolia(searchTerm, filters) {
        // TODO: Implement when Algolia is configured
        // const { hits } = await algoliaIndex.search(searchTerm, {
        //     filters: this.buildAlgoliaFilters(filters),
        //     hitsPerPage: 50
        // });
        // return hits;

        console.warn('Algolia not configured, falling back to Firestore');
        return this.searchWithFirestore(searchTerm, filters);
    }

    /**
     * Get search suggestions (autocomplete)
     * @param {string} prefix - Search prefix
     * @returns {Promise<Array>} - Suggestions
     */
    async getSuggestions(prefix) {
        if (!prefix || prefix.length < 2) return [];

        try {
            // Firestore: Get products starting with prefix
            const q = query(
                collection(db, 'products'),
                where('name', '>=', prefix),
                where('name', '<=', prefix + '\uf8ff'),
                limit(10)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                category: doc.data().category
            }));

        } catch (error) {
            console.error('Suggestions error:', error);
            return [];
        }
    }

    /**
     * Faceted search (get filter options)
     * OPTIMIZED: Uses pre-calculated aggregate document (1 read instead of 10,000)
     * @returns {Promise<Object>} - Available filters
     */
    async getFacets() {
        try {
            // Read single aggregate document instead of all products
            const facetsDoc = await getDoc(doc(db, 'search_facets', 'products'));

            if (facetsDoc.exists()) {
                const data = facetsDoc.data();
                return {
                    categories: data.categories || [],
                    brands: data.brands || [],
                    priceRanges: data.priceRanges || [],
                    totalProducts: data.totalProducts || 0,
                    minPrice: data.minPrice || 0,
                    maxPrice: data.maxPrice || 0
                };
            }

            // Fallback to empty if aggregate doesn't exist
            return { categories: [], brands: [], priceRanges: [], totalProducts: 0 };

        } catch (error) {
            console.error('Facets error:', error);
            return { categories: [], brands: [], priceRanges: [], totalProducts: 0 };
        }
    }

    /**
     * Calculate price ranges for faceted search
     * @private
     */
    calculatePriceRanges(products) {
        const prices = products.map(p => p.price).filter(Boolean);
        if (prices.length === 0) return [];

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const step = (max - min) / 5;

        return [
            { label: `${min} - ${min + step}`, min, max: min + step },
            { label: `${min + step} - ${min + 2 * step}`, min: min + step, max: min + 2 * step },
            { label: `${min + 2 * step} - ${min + 3 * step}`, min: min + 2 * step, max: min + 3 * step },
            { label: `${min + 3 * step} - ${min + 4 * step}`, min: min + 3 * step, max: min + 4 * step },
            { label: `${min + 4 * step}+`, min: min + 4 * step, max: Infinity }
        ];
    }

    /**
     * Switch to Algolia provider
     * @param {Object} algoliaClient - Algolia client instance
     * @param {string} indexName - Index name
     */
    enableAlgolia(algoliaClient, indexName) {
        this.algoliaClient = algoliaClient;
        this.algoliaIndex = algoliaClient.initIndex(indexName);
        this.provider = 'algolia';
    }
}

export const searchService = new SearchService();
export default searchService;
