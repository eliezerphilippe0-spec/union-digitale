import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Download, CheckCircle, Clock } from 'lucide-react';
import { products } from '../data/products';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/common/SEO';
import { useAuth } from '../contexts/AuthContext';
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Orders = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([
        {
            id: 'CMD-84932',
            date: new Date('2025-12-01'),
            total: 45000,
            status: t('shipped'),
            items: [products[0]]
        },
        {
            id: 'CMD-12094',
            date: new Date('2025-11-28'),
            total: 3000,
            status: 'Disponible',
            items: [products[2]]
        }
    ]);
    const [indexError, setIndexError] = useState(false);
    const [lastIndexLogAt, setLastIndexLogAt] = useState(0);

    const loadOrders = async () => {
        const enabled = import.meta.env.VITE_SUBORDERS_BUYER_VIEW_ENABLED === 'true';
        if (!enabled || !currentUser?.uid) return;

        try {
            setIndexError(false);
            const q = query(
                collection(db, 'orders'),
                where('buyerId', '==', currentUser.uid),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const snap = await getDocs(q);
            const items = snap.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: data.orderNumber || doc.id,
                    date: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    total: data.totalAmount || data.total || 0,
                    status: data.status || t('pending'),
                    items: data.items || [],
                    suborders: [],
                    subSummary: data.subSummary || null,
                };
            });
            if (items.length > 0) setOrders(items);
        } catch (e) {
            const message = String(e?.message || '');
            if (message.includes('requires an index')) {
                setIndexError(true);
                if (Date.now() - lastIndexLogAt > 60000) {
                    setLastIndexLogAt(Date.now());
                    try {
                        await addDoc(collection(db, 'system_events'), {
                            eventName: 'firestore_index_missing',
                            page: 'buyer_orders',
                            collection: 'orders',
                            reason: 'index_missing',
                            createdAt: serverTimestamp(),
                        });
                    } catch (err) {
                        // silent
                    }
                }
            }
            // fallback to mock
        }
    };

    useEffect(() => {
        loadOrders();
    }, [currentUser, t]);

    return (
        <div className="bg-gray-100 min-h-screen py-8">
            <SEO title="Mes commandes" description="Suivez et gérez vos commandes Union Digitale." />
            <div className="container mx-auto px-4 max-w-5xl">
                <h1 className="text-2xl font-medium mb-6">{t('your_orders')}</h1>

                {indexError && (
                    <div className="mb-4 px-4 py-3 bg-blue-50 text-blue-700 text-sm flex items-center justify-between rounded">
                        <span>Index en cours de construction. Réessayez dans quelques minutes.</span>
                        <button
                            onClick={() => loadOrders()}
                            className="px-3 py-1 text-xs font-medium bg-blue-100 hover:bg-blue-200 rounded"
                        >
                            {t('retry') || 'Réessayer'}
                        </button>
                    </div>
                )}

                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Order Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between text-sm text-gray-600 gap-4">
                                <div className="flex gap-8">
                                    <div>
                                        <div className="uppercase text-xs font-bold mb-1">{t('order_placed_on')}</div>
                                        <div>{order.date.toLocaleDateString(language === 'ht' ? 'fr-HT' : language, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                    </div>
                                    <div>
                                        <div className="uppercase text-xs font-bold mb-1">{t('total')}</div>
                                        <div>{order.total.toLocaleString()} G</div>
                                    </div>
                                    <div>
                                        <div className="uppercase text-xs font-bold mb-1">{t('order_number')}</div>
                                        <div>{order.id}</div>
                                    </div>
                                    {order.subSummary?.vendorCount != null && (
                                        <div>
                                            <div className="uppercase text-xs font-bold mb-1">Vendeurs</div>
                                            <div>
                                                {order.subSummary.vendorCount} {order.subSummary.vendorCount > 1 ? 'vendeurs' : 'vendeur'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <a href="#" className="text-blue-600 hover:underline">{t('view_invoice')}</a>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-6">
                                <div className="font-bold text-lg mb-4 flex items-center gap-2">
                                    {order.status === 'Expédié' ? (
                                        <span className="text-green-700 flex items-center gap-2">
                                            <TruckIcon /> {t('in_transit')}
                                        </span>
                                    ) : (
                                        <span className="text-green-700 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" /> {t('digital_content_available')}
                                        </span>
                                    )}
                                </div>

                                {order.items.map((item, idx) => (
                                    <div key={item.id || idx} className="flex gap-6">
                                        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-2xl text-gray-400 rounded">
                                            {item.image || '📦'}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-blue-600 hover:underline cursor-pointer mb-2">
                                                {item.title || item.productId || t('product')}
                                            </h3>
                                            <div className="text-sm text-gray-500 mb-4">
                                                {t('sold_by')}: {item.brand || item.vendorId || '—'}
                                            </div>

                                            <div className="flex gap-4">
                                                {item.type === 'digital' ? (
                                                    <button className="bg-secondary hover:bg-secondary-hover text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 shadow-sm">
                                                        <Download className="w-4 h-4" /> {t('download')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => navigate(`/tracking/${order.id}`)}
                                                        className="bg-secondary hover:bg-secondary-hover text-white px-4 py-2 rounded-md text-sm font-bold shadow-sm flex items-center gap-2"
                                                    >
                                                        <Package className="w-4 h-4" />
                                                        {t('track_package')}
                                                    </button>
                                                )}
                                                <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm shadow-sm">
                                                    {t('buy_again')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {order.suborders && order.suborders.length > 0 && (
                                    <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                                        <div className="font-semibold mb-2">Sous‑commandes</div>
                                        <div className="space-y-1">
                                            {order.suborders.map((s, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <span>{s.vendorId || 'Vendeur'}</span>
                                                    <span>{(s.subtotalAmount || 0).toLocaleString()} G</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TruckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
);

export default Orders;
