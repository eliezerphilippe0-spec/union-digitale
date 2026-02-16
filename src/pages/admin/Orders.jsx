import React from 'react';
import { Eye, Truck, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { useState, useEffect } from 'react';

const AdminOrders = () => {
    const { t } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    useEffect(() => {
        fetchOrders(true);
    }, []);

    const fetchOrders = async (reset = false) => {
        setLoading(true);
        try {
            let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
            if (!reset && cursor) {
                q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(PAGE_SIZE));
            }
            const snapshot = await getDocs(q);
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toLocaleDateString() : 'N/A'
            }));
            const nextCursor = snapshot.docs[snapshot.docs.length - 1] || null;
            setCursor(nextCursor);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
            setOrders(prev => reset ? ordersData : [...prev, ...ordersData]);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'shipped': return 'bg-blue-100 text-blue-700';
            case 'delivered': return 'bg-green-100 text-green-700';
            case 'processing': return 'bg-orange-100 text-orange-700';
            case 'paid': return 'bg-purple-100 text-purple-700';
            case 'pending_payment': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold">{t('latest_orders')}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{orders.length} commandes</span>
                    <button
                        onClick={() => fetchOrders(true)}
                        className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded"
                    >
                        {t('refresh')}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="p-4">{t('order_id_header')}</th>
                            <th className="p-4">{t('order_customer')}</th>
                            <th className="p-4">{t('order_date')}</th>
                            <th className="p-4">{t('total_header')}</th>
                            <th className="p-4">{t('order_payment')}</th>
                            <th className="p-4">{t('status_header')}</th>
                            <th className="p-4 text-right">{t('table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-400">Chargement...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-400">Aucune commande trouvée.</td></tr>
                        ) : orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-mono font-bold text-gray-700 text-xs">{order.id}</td>
                                <td className="p-4 font-medium text-gray-900">
                                    {order.shippingAddress?.name || 'Client'}
                                </td>
                                <td className="p-4 text-gray-500">{order.date}</td>
                                <td className="p-4 font-bold text-gray-900">{(order.totalAmount || order.total || 0).toLocaleString()} G</td>
                                <td className="p-4 text-gray-500 capitalize">{order.paymentMethod}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${getStatusColor(order.status)}`}>
                                        {order.status === 'delivered' && <CheckCircle className="w-3 h-3" />}
                                        {order.status === 'shipped' && <Truck className="w-3 h-3" />}
                                        {t(`status_${order.status}`) || order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end gap-1">
                                        <Eye className="w-3 h-3" /> {t('order_details')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {hasMore && !loading && (
                <div className="p-4 flex justify-center">
                    <button
                        onClick={() => fetchOrders(false)}
                        className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded"
                    >
                        {t('load_more')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
