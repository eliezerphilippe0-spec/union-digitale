import React from 'react';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

import FreeShippingProgress from '../components/marketing/FreeShippingProgress';

const Cart = () => {
    const { cartItems, removeFromCart, cartTotal } = useCart();
    const { t } = useLanguage();

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-lg w-full border border-gray-100">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-12 h-12 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('cart_empty')}</h2>
                    <p className="text-gray-500 mb-8">{t('cart_empty_desc')}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <Link to="/best-sellers" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔥</div>
                            <div className="font-bold text-gray-900 text-sm">{t('best_sellers')}</div>
                        </Link>
                        <Link to="/flash-sales" className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">⚡</div>
                            <div className="font-bold text-gray-900 text-sm">{t('flash_sales')}</div>
                        </Link>
                    </div>

                    <Link to="/" className="block w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm">
                        {t('continue_shopping')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen py-8">
            <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Cart Items (Left) */}
                <div className="lg:col-span-9 bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100">
                    <h1 className="text-2xl font-medium mb-4 border-b pb-2">{t('your_cart')}</h1>

                    {/* Cart Upsell */}
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-3">
                        <div>
                            <div className="text-sm font-semibold text-amber-800">Protection 2 ans</div>
                            <div className="text-xs text-amber-700">Ajoutez une garantie étendue pour 500 G</div>
                        </div>
                        <button className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg">Ajouter</button>
                    </div>

                    <FreeShippingProgress currentAmount={cartTotal} />

                    <div className="space-y-6">
                        {cartItems.map((item) => (
                            <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-6 last:border-0">
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-3xl md:text-4xl overflow-hidden rounded-xl">
                                    {item.image ? (
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{t('img_placeholder')}</span>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium text-lg text-blue-600 hover:underline cursor-pointer line-clamp-2">
                                                {item.title}
                                            </h3>
                                            <div className="text-sm text-green-700 mt-1">{t('in_stock')}</div>
                                            {item.unionPlus && item.type === 'physical' && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="bg-[#FFC400] text-primary px-1 rounded-sm text-xs italic font-bold">Union Plus</span>
                                                    <span className="text-xs text-gray-500">{t('free_shipping')}</span>
                                                </div>
                                            )}
                                            {item.type === 'digital' && (
                                                <div className="text-xs text-gray-500 mt-1">{t('instant_download')}</div>
                                            )}
                                            <div className="flex items-center gap-4 mt-4 text-sm">
                                                <div className="flex items-center gap-2 bg-gray-50 border rounded px-2 py-1 shadow-sm">
                                                    {t('qty')} <span className="font-bold">{item.quantity}</span>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-blue-600 hover:underline border-l pl-4 border-gray-300 flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-4 h-4" /> {t('remove')}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-right font-bold text-xl">
                                            {(item.price * item.quantity).toLocaleString()} G
                                            {item.quantity > 1 && (
                                                <div className="text-xs text-gray-500 font-normal">
                                                    {item.price.toLocaleString()} {t('per_unit')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-right mt-4 text-lg">
                        {t('subtotal_items')} ({cartItems.length} {t('items_count')}) : <span className="font-bold">{cartTotal.toLocaleString()} G</span>
                    </div>
                </div>

                {/* Checkout Sidebar (Right) */}
                <div className="lg:col-span-3">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-4">
                        <div className="text-lg mb-4">
                            {t('subtotal_items')} ({cartItems.length} {t('items_count')}) : <span className="font-bold">{cartTotal.toLocaleString()} G</span>
                        </div>
                        <div className="flex items-center gap-2 mb-4 text-sm">
                            <input type="checkbox" className="w-4 h-4 text-secondary rounded focus:ring-secondary" />
                            <span>{t('contains_gift')}</span>
                        </div>
                        <Link to="/checkout" className="block w-full bg-secondary hover:bg-secondary-hover text-white text-center font-medium py-2 rounded-full shadow-sm transition-colors">
                            {t('proceed_to_checkout')}
                        </Link>
                    </div>
                </div>

            </div>

            {/* Mobile sticky checkout bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{t('subtotal_items')} ({cartItems.length})</span>
                    <span className="text-lg font-bold text-gray-900">{cartTotal.toLocaleString()} G</span>
                </div>
                <Link to="/checkout" className="block w-full bg-secondary hover:bg-secondary-hover text-white text-center font-medium py-2 rounded-lg shadow-sm transition-colors">
                    {t('proceed_to_checkout')}
                </Link>
            </div>
        </div>
    );
};

export default Cart;
