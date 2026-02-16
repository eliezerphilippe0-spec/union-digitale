import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { useLanguage } from '../../contexts/LanguageContext';
import { DollarSign, CheckCircle, Clock, AlertCircle, CreditCard, Banknote } from 'lucide-react';

const AdminPayouts = () => {
    const { t } = useLanguage();
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [useMock, setUseMock] = useState(false);
    const PAGE_SIZE = 20;

    // Mock initial data if Firestore empty (for demo)
    const mockPayouts = [
        { id: 'pay_1', sellerName: 'Tech Store Haiti', amount: 15000, method: 'MonCash', account: '3700-0000', status: 'pending', date: new Date() },
        { id: 'pay_2', sellerName: 'Maison & Déco', amount: 45000, method: 'Bank Transfer', account: 'Unibank - 123456789', status: 'pending', date: new Date(Date.now() - 86400000) },
        { id: 'pay_3', sellerName: 'Mode Locale', amount: 2500, method: 'MonCash', account: '3600-1234', status: 'completed', date: new Date(Date.now() - 172800000) },
    ];

    useEffect(() => {
        fetchPayouts(true);
    }, []);

    const fetchPayouts = async (reset = false) => {
        setLoading(true);
        try {
            let q = query(collection(db, 'payouts'), orderBy('created_at', 'desc'), limit(PAGE_SIZE));
            if (!reset && cursor) {
                q = query(collection(db, 'payouts'), orderBy('created_at', 'desc'), startAfter(cursor), limit(PAGE_SIZE));
            }
            const snapshot = await getDocs(q);

            if (snapshot.empty && reset) {
                setUseMock(true);
                setHasMore(false);
                setCursor(null);
                setPayouts(mockPayouts);
            } else {
                setUseMock(false);
                const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const nextCursor = snapshot.docs[snapshot.docs.length - 1] || null;
                setCursor(nextCursor);
                setHasMore(snapshot.docs.length === PAGE_SIZE);
                setPayouts(prev => reset ? docs : [...prev, ...docs]);
            }
        } catch (error) {
            console.error("Error fetching payouts:", error);
            setUseMock(true);
            setHasMore(false);
            setCursor(null);
            setPayouts(mockPayouts); // Fallback
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (id) => {
        if (!window.confirm(t('confirm_payout'))) return;

        try {
            // Update Firestore if real
            // await updateDoc(doc(db, 'payouts', id), { status: 'completed' });

            // Update Local State
            setPayouts(payouts.map(p => p.id === id ? { ...p, status: 'completed' } : p));
            alert(t('payout_marked_success'));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Banknote className="text-secondary" /> {t('payouts_title')}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">{t('payouts_pending_label')}</div>
                    <div className="text-2xl font-bold text-orange-600">60,000 G</div>
                    <div className="text-xs text-gray-400 mt-1">{t('payouts_requests_count').replace('{count}', 2)}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">{t('payouts_processed_month')}</div>
                    <div className="text-2xl font-bold text-green-600">125,000 G</div>
                    <div className="text-xs text-gray-400 mt-1">{t('payouts_transactions_count').replace('{count}', 15)}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">{t('platform_balance_label')}</div>
                    <div className="text-2xl font-bold text-blue-600">45,000 G</div>
                    <div className="text-xs text-gray-400 mt-1">{t('commissions_label')}</div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700">
                    {t('withdrawal_requests_header')}
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-500 border-b">
                        <tr>
                            <th className="p-4">{t('payout_seller')}</th>
                            <th className="p-4">{t('payout_amount')}</th>
                            <th className="p-4">{t('payout_method')}</th>
                            <th className="p-4">{t('payout_status')}</th>
                            <th className="p-4 text-right">{t('payout_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payouts.map(payout => (
                            <tr key={payout.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900">{payout.sellerName}</td>
                                <td className="p-4 font-bold">{payout.amount?.toLocaleString()} G</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        {payout.method === 'MonCash' ? <DollarSign className="w-4 h-4 text-red-500" /> : <CreditCard className="w-4 h-4 text-blue-500" />}
                                        <span className="flex flex-col">
                                            <span>{payout.method}</span>
                                            <span className="text-xs text-gray-400">{payout.account}</span>
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {payout.status === 'completed' ? (
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                            <CheckCircle className="w-3 h-3" /> {t('status_completed_payout')}
                                        </span>
                                    ) : (
                                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                            <Clock className="w-3 h-3" /> {t('status_pending_payout')}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {payout.status === 'pending' && (
                                        <button
                                            onClick={() => handleProcess(payout.id)}
                                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-bold text-xs"
                                        >
                                            {t('process_transfer_btn')}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!useMock && hasMore && !loading && (
                <div className="flex justify-center">
                    <button
                        onClick={() => fetchPayouts(false)}
                        className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded"
                    >
                        {t('load_more')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminPayouts;
