import { logEvent } from "firebase/analytics";
import { analytics } from "../lib/firebase";

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
