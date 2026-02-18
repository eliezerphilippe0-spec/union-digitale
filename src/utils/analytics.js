import { logEvent } from "firebase/analytics";
import { analytics } from "../lib/firebase";

const RATE_LIMIT_MS = 5000;
const rateLimitStore = new Map();

export const shouldTrackEvent = (key, rateLimitMs = RATE_LIMIT_MS) => {
    if (!key) return true;
    const now = Date.now();
    const last = rateLimitStore.get(key) || 0;
    if (now - last < rateLimitMs) return false;
    rateLimitStore.set(key, now);
    return true;
};

export const resetEventRateLimit = (key) => {
    if (!key) {
        rateLimitStore.clear();
        return;
    }
    rateLimitStore.delete(key);
};

export const getCheckoutSessionId = () => {
    if (typeof window === 'undefined') return 'server';
    const key = 'checkout_session_id';
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(key, sessionId);
    }
    return sessionId;
};

export const buildCheckoutPayload = ({ cartValue = 0, paymentMethod = 'unknown', step = 'unknown', successSource, variant } = {}) => ({
    cartValue,
    paymentMethod,
    sessionId: getCheckoutSessionId(),
    step,
    ...(successSource ? { successSource } : {}),
    ...(variant ? { variant } : {})
});

export const buildCartUpsellPayload = ({ productId, cartValue = 0, source } = {}) => ({
    productId,
    cartValue,
    sessionId: getCheckoutSessionId(),
    ...(source ? { source } : {})
});

export const logCheckoutEvent = (eventName, payload = {}, options = {}) => {
    if (!analytics) return;
    const key = options.key || eventName;
    const rateLimitMs = options.rateLimitMs || RATE_LIMIT_MS;
    if (!shouldTrackEvent(key, rateLimitMs)) return;
    logEvent(analytics, eventName, payload);
};

const buildProductEventPayload = ({ productId, price }) => ({
    productId,
    price,
    sessionId: getCheckoutSessionId()
});

export const logProductCtaVisible = ({ productId, price } = {}) => {
    if (!analytics || !productId) return;
    const payload = buildProductEventPayload({ productId, price });
    if (!shouldTrackEvent(`product_cta_visible_${productId}`, 60000)) return;
    logEvent(analytics, 'product_cta_visible', payload);
};

export const logProductAddToCartClick = ({ productId, price } = {}) => {
    if (!analytics || !productId) return;
    const payload = buildProductEventPayload({ productId, price });
    logEvent(analytics, 'product_add_to_cart_click', payload);
};

export const logProductStockLowVisible = ({ productId, price } = {}) => {
    if (!analytics || !productId) return;
    const payload = buildProductEventPayload({ productId, price });
    if (!shouldTrackEvent(`product_stock_low_visible_${productId}`, 60000)) return;
    logEvent(analytics, 'product_stock_low_visible', payload);
};

export const calculateCheckoutKpis = ({
    cartViews = 0,
    checkoutStarts = 0,
    checkoutCompletions = 0,
    paymentSuccesses = 0
} = {}) => {
    const safeRate = (num, den) => (den > 0 ? Number(((num / den) * 100).toFixed(2)) : 0);

    return {
        cart_to_checkout_rate: safeRate(checkoutStarts, cartViews),
        checkout_completion_rate: safeRate(checkoutCompletions, checkoutStarts),
        payment_success_rate: safeRate(paymentSuccesses, checkoutCompletions),
        cart_abandon_rate: safeRate(cartViews - checkoutStarts, cartViews)
    };
};

/**
 * Logs a page view event.
 * @param {string} pageName - The name or path of the page properly formatted.
 */
export const logPageView = (pageName) => {
    if (analytics) {
        logEvent(analytics, 'page_view', { page_title: pageName, page_path: window.location.pathname });
        // console.log(`[Analytics] Page View: ${pageName}`);
    }
};

/**
 * Logs a view item event.
 * @param {object} item - The item being viewed (id, name, category, price, etc.).
 */
export const logViewItem = (item) => {
    if (analytics) {
        logEvent(analytics, 'view_item', {
            currency: 'HTG',
            value: item.price,
            items: [{
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                price: item.price
            }]
        });
    }
};

/**
 * Logs an add to cart event.
 * @param {object} item - The item added to cart.
 */
export const logAddToCart = (item) => {
    if (analytics) {
        logEvent(analytics, 'add_to_cart', {
            currency: 'HTG',
            value: item.price,
            items: [{
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                price: item.price,
                quantity: 1
            }]
        });
    }
};

/**
 * Logs a purchase event.
 * @param {object} transaction - Transaction details (transaction_id, value, tax, shipping, items).
 */
export const logPurchase = (transaction) => {
    if (analytics) {
        logEvent(analytics, 'purchase', {
            transaction_id: transaction.id,
            value: transaction.total,
            currency: 'HTG',
            tax: transaction.tax || 0,
            shipping: transaction.shipping || 0,
            items: transaction.items.map(item => ({
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                quantity: item.quantity
            }))
        });
    }
};
