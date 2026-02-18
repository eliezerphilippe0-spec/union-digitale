import React, { useEffect, useMemo, useRef } from 'react';
import { buildCartUpsellPayload, getCheckoutSessionId, logCheckoutEvent } from '../utils/analytics';

const SUGGESTED_ITEMS = [
    { id: 'upsell-usb-cable', title: 'Câble USB‑C premium', price: 650, categoryId: 'accessories', vendorId: 'default' },
    { id: 'upsell-case', title: 'Étui de protection', price: 950, categoryId: 'accessories', vendorId: 'default' }
];

const CartUpsell = ({ cartItems = [], cartTotal = 0, addToCart }) => {
    const itemsInCart = useMemo(() => new Set(cartItems.map((item) => item.id)), [cartItems]);
    const suggestions = useMemo(() => {
        const sameCategory = Array.from(new Set(cartItems
            .filter((item) => item.categoryId)
            .map((item) => item.categoryId)));
        const sameVendor = Array.from(new Set(cartItems
            .filter((item) => item.vendorId)
            .map((item) => item.vendorId)));

        const candidates = SUGGESTED_ITEMS.filter((item) => !itemsInCart.has(item.id));
        let source = 'fallback';
        let list = candidates;

        if (sameCategory.length > 0) {
            list = candidates.filter((item) => sameCategory.includes(item.categoryId));
            if (list.length >= 2) source = 'same_category';
        }
        if (source === 'fallback' && sameVendor.length > 0) {
            list = candidates.filter((item) => sameVendor.includes(item.vendorId));
            if (list.length >= 2) source = 'same_vendor';
        }
        if (list.length < 2) {
            list = candidates;
            source = 'fallback';
        }
        return { list: list.slice(0, 2), source };
    }, [cartItems, itemsInCart]);
    const hasTrackedVisible = useRef(false);
    const upsellRef = useRef(null);

    useEffect(() => {
        if (!upsellRef.current || suggestions.list.length === 0 || hasTrackedVisible.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasTrackedVisible.current) {
                        suggestions.list.forEach((item) => {
                            logCheckoutEvent('cart_upsell_visible', buildCartUpsellPayload({
                                productId: item.id,
                                cartValue: cartTotal,
                                source: suggestions.source
                            }), {
                                key: `cart_upsell_visible:${item.id}:${getCheckoutSessionId()}`,
                                rateLimitMs: 60 * 1000
                            });
                        });
                        hasTrackedVisible.current = true;
                        observer.disconnect();
                    }
                });
            },
            { threshold: [0.5] }
        );
        observer.observe(upsellRef.current);
        return () => observer.disconnect();
    }, [cartTotal, suggestions]);

    if (suggestions.list.length === 0) return null;

    const handleAdd = (item) => {
        logCheckoutEvent('cart_upsell_click', buildCartUpsellPayload({
                                productId: item.id,
                                cartValue: cartTotal,
                                source: suggestions.source
                            }), {
            key: `cart_upsell_click:${item.id}:${getCheckoutSessionId()}`,
            rateLimitMs: 5 * 1000
        });
        addToCart({ ...item, quantity: 1 });
        logCheckoutEvent('cart_upsell_added', buildCartUpsellPayload({
                                productId: item.id,
                                cartValue: cartTotal,
                                source: suggestions.source
                            }), {
            key: `cart_upsell_added:${item.id}:${getCheckoutSessionId()}`,
            rateLimitMs: 5 * 1000
        });
    };

    return (
        <div ref={upsellRef} className="mt-6 border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Complétez votre commande</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.list.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.price.toLocaleString()} G</div>
                        </div>
                        <button
                            onClick={() => handleAdd(item)}
                            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg"
                        >
                            Ajouter
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CartUpsell;
