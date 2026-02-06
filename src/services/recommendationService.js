/**
 * AI Recommendation Service
 * Inspired by: Amazon, Netflix, Spotify recommendations
 */

// Recommendation algorithms
const ALGORITHMS = {
    COLLABORATIVE: 'collaborative', // Based on similar users
    CONTENT_BASED: 'content', // Based on product attributes
    HYBRID: 'hybrid', // Mix of both
    TRENDING: 'trending', // Based on popularity
    PERSONALIZED: 'personalized', // Based on user history
};

// User behavior events
const EVENT_TYPES = {
    VIEW: 'view',
    ADD_TO_CART: 'add_to_cart',
    PURCHASE: 'purchase',
    WISHLIST: 'wishlist',
    SEARCH: 'search',
    CLICK: 'click',
    REVIEW: 'review',
};

// Event weights for scoring
const EVENT_WEIGHTS = {
    [EVENT_TYPES.PURCHASE]: 10,
    [EVENT_TYPES.ADD_TO_CART]: 5,
    [EVENT_TYPES.WISHLIST]: 4,
    [EVENT_TYPES.REVIEW]: 3,
    [EVENT_TYPES.VIEW]: 1,
    [EVENT_TYPES.CLICK]: 0.5,
    [EVENT_TYPES.SEARCH]: 2,
};

class RecommendationService {
    constructor() {
        this.userEvents = [];
        this.userPreferences = {};
        this.recentlyViewed = [];
        this.maxRecentItems = 20;
    }

    // Track user event
    trackEvent(eventType, data) {
        const event = {
            type: eventType,
            timestamp: Date.now(),
            ...data,
        };
        
        this.userEvents.push(event);
        
        // Update preferences based on event
        this._updatePreferences(event);
        
        // Track recently viewed
        if (eventType === EVENT_TYPES.VIEW && data.productId) {
            this._addToRecentlyViewed(data.productId);
        }

        // Store in localStorage for persistence
        this._persistEvents();
        
        return event;
    }

    // Update user preferences based on events
    _updatePreferences(event) {
        const weight = EVENT_WEIGHTS[event.type] || 1;
        
        if (event.category) {
            this.userPreferences.categories = this.userPreferences.categories || {};
            this.userPreferences.categories[event.category] = 
                (this.userPreferences.categories[event.category] || 0) + weight;
        }
        
        if (event.brand) {
            this.userPreferences.brands = this.userPreferences.brands || {};
            this.userPreferences.brands[event.brand] = 
                (this.userPreferences.brands[event.brand] || 0) + weight;
        }
        
        if (event.priceRange) {
            this.userPreferences.priceRanges = this.userPreferences.priceRanges || {};
            this.userPreferences.priceRanges[event.priceRange] = 
                (this.userPreferences.priceRanges[event.priceRange] || 0) + weight;
        }
        
        if (event.tags) {
            this.userPreferences.tags = this.userPreferences.tags || {};
            event.tags.forEach(tag => {
                this.userPreferences.tags[tag] = 
                    (this.userPreferences.tags[tag] || 0) + weight;
            });
        }
    }

    // Add to recently viewed
    _addToRecentlyViewed(productId) {
        this.recentlyViewed = this.recentlyViewed.filter(id => id !== productId);
        this.recentlyViewed.unshift(productId);
        this.recentlyViewed = this.recentlyViewed.slice(0, this.maxRecentItems);
    }

    // Persist events to localStorage
    _persistEvents() {
        try {
            localStorage.setItem('ud_recommendation_events', JSON.stringify({
                events: this.userEvents.slice(-100), // Keep last 100 events
                preferences: this.userPreferences,
                recentlyViewed: this.recentlyViewed,
            }));
        } catch (e) {
            console.warn('Failed to persist recommendation events:', e);
        }
    }

    // Load events from localStorage
    loadPersistedData() {
        try {
            const data = JSON.parse(localStorage.getItem('ud_recommendation_events') || '{}');
            this.userEvents = data.events || [];
            this.userPreferences = data.preferences || {};
            this.recentlyViewed = data.recentlyViewed || [];
        } catch (e) {
            console.warn('Failed to load recommendation events:', e);
        }
    }

    // Calculate product score based on user preferences
    _calculateProductScore(product) {
        let score = 0;
        
        // Category match
        if (product.category && this.userPreferences.categories?.[product.category]) {
            score += this.userPreferences.categories[product.category] * 2;
        }
        
        // Brand match
        if (product.brand && this.userPreferences.brands?.[product.brand]) {
            score += this.userPreferences.brands[product.brand] * 1.5;
        }
        
        // Tags match
        if (product.tags && this.userPreferences.tags) {
            product.tags.forEach(tag => {
                if (this.userPreferences.tags[tag]) {
                    score += this.userPreferences.tags[tag];
                }
            });
        }
        
        // Price range preference
        const priceRange = this._getPriceRange(product.price);
        if (this.userPreferences.priceRanges?.[priceRange]) {
            score += this.userPreferences.priceRanges[priceRange] * 0.5;
        }
        
        // Boost popular and well-rated products
        score += (product.rating || 0) * 2;
        score += Math.log10((product.sales || 1) + 1) * 3;
        
        // Penalize if recently viewed (to add variety)
        if (this.recentlyViewed.includes(product.id)) {
            score *= 0.5;
        }
        
        return score;
    }

    // Get price range bucket
    _getPriceRange(price) {
        if (price < 1000) return 'budget';
        if (price < 5000) return 'mid';
        if (price < 20000) return 'premium';
        return 'luxury';
    }

    // Get personalized recommendations
    getRecommendations(products, options = {}) {
        const {
            limit = 10,
            excludeIds = [],
            algorithm = ALGORITHMS.HYBRID,
            category = null,
        } = options;

        let filteredProducts = products.filter(p => !excludeIds.includes(p.id));
        
        if (category) {
            filteredProducts = filteredProducts.filter(p => p.category === category);
        }

        // Score and sort products
        const scoredProducts = filteredProducts.map(product => ({
            ...product,
            _score: this._calculateProductScore(product),
        }));

        scoredProducts.sort((a, b) => b._score - a._score);

        return scoredProducts.slice(0, limit);
    }

    // Get "You might also like" recommendations based on a product
    getSimilarProducts(product, allProducts, limit = 4) {
        return allProducts
            .filter(p => p.id !== product.id)
            .map(p => {
                let similarity = 0;
                
                // Same category
                if (p.category === product.category) similarity += 5;
                
                // Same brand
                if (p.brand === product.brand) similarity += 3;
                
                // Similar price range
                const priceDiff = Math.abs(p.price - product.price) / product.price;
                if (priceDiff < 0.2) similarity += 2;
                else if (priceDiff < 0.5) similarity += 1;
                
                // Shared tags
                if (product.tags && p.tags) {
                    const sharedTags = product.tags.filter(t => p.tags.includes(t));
                    similarity += sharedTags.length * 1.5;
                }
                
                return { ...p, _similarity: similarity };
            })
            .sort((a, b) => b._similarity - a._similarity)
            .slice(0, limit);
    }

    // Get "Frequently bought together" recommendations
    getFrequentlyBoughtTogether(product, allProducts, purchaseHistory = []) {
        // In production, this would analyze actual purchase patterns
        // For now, return products from same category with good ratings
        return allProducts
            .filter(p => 
                p.id !== product.id && 
                p.category === product.category &&
                p.rating >= 4
            )
            .slice(0, 3);
    }

    // Get "Based on your browsing" recommendations
    getBasedOnBrowsing(allProducts, limit = 6) {
        if (this.recentlyViewed.length === 0) {
            return this._getTrendingProducts(allProducts, limit);
        }

        const viewedProducts = this.recentlyViewed
            .map(id => allProducts.find(p => p.id === id))
            .filter(Boolean);

        const categories = [...new Set(viewedProducts.map(p => p.category))];
        
        return allProducts
            .filter(p => 
                categories.includes(p.category) && 
                !this.recentlyViewed.includes(p.id)
            )
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, limit);
    }

    // Get trending products
    _getTrendingProducts(allProducts, limit = 6) {
        return [...allProducts]
            .sort((a, b) => (b.sales || 0) - (a.sales || 0))
            .slice(0, limit);
    }

    // Get recently viewed products
    getRecentlyViewed(allProducts) {
        return this.recentlyViewed
            .map(id => allProducts.find(p => p.id === id))
            .filter(Boolean);
    }

    // Clear user data
    clearUserData() {
        this.userEvents = [];
        this.userPreferences = {};
        this.recentlyViewed = [];
        localStorage.removeItem('ud_recommendation_events');
    }
}

// Singleton instance
const recommendationService = new RecommendationService();

// Initialize on load
if (typeof window !== 'undefined') {
    recommendationService.loadPersistedData();
}

export default recommendationService;
export { ALGORITHMS, EVENT_TYPES };
