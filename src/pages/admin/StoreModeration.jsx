import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, where, getDocs, limit, startAfter, onSnapshot } from 'firebase/firestore';
import { adminService } from '../../services/adminService';
import { AlertTriangle, Ban, CheckCircle, Search, FileText, Trash2, Eye, UserPlus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const StoreModeration = () => {
    const { t } = useLanguage();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [pendingCursor, setPendingCursor] = useState(null);
    const [pendingHasMore, setPendingHasMore] = useState(true);
    const PAGE_SIZE = 20;
    const [filter, setFilter] = useState('all'); // all, active, suspended, under_investigation
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStore, setSelectedStore] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null); // suspend, reactivate, delete, investigate
    const [reason, setReason] = useState('');

    // Fetch Stores
    useEffect(() => {
        fetchStores(true);
    }, []);

    useEffect(() => {
        setCursor(null);
        setStores([]);
        setHasMore(true);
        fetchStores(true);
    }, [filter, searchTerm]);

    // Fetch Audit Logs for selected store
    useEffect(() => {
        if (selectedStore) {
            const q = query(
                collection(db, 'audit_logs'),
                where('storeId', '==', selectedStore.id),
                orderBy('timestamp', 'desc')
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            return () => unsubscribe();
        } else {
            setAuditLogs([]);
        }
    }, [selectedStore]);

    // Fetch Pending Sellers
    const [pendingSellers, setPendingSellers] = useState([]);
    useEffect(() => {
        fetchPendingSellers(true);
    }, []);

    const fetchStores = async (reset = false) => {
        setLoading(true);
        try {
            let q = query(collection(db, 'stores'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
            if (!reset && cursor) {
                q = query(collection(db, 'stores'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(PAGE_SIZE));
            }
            const snapshot = await getDocs(q);
            const fetchedStores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const nextCursor = snapshot.docs[snapshot.docs.length - 1] || null;
            setCursor(nextCursor);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
            setStores(prev => reset ? fetchedStores : [...prev, ...fetchedStores]);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingSellers = async (reset = false) => {
        try {
            let q = query(
                collection(db, 'users'),
                where('role', '==', 'seller'),
                where('verificationStatus', '==', 'pending'),
                orderBy('created_at', 'desc'),
                limit(PAGE_SIZE)
            );
            if (!reset && pendingCursor) {
                q = query(
                    collection(db, 'users'),
                    where('role', '==', 'seller'),
                    where('verificationStatus', '==', 'pending'),
                    orderBy('created_at', 'desc'),
                    startAfter(pendingCursor),
                    limit(PAGE_SIZE)
                );
            }
            const snapshot = await getDocs(q);
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const nextCursor = snapshot.docs[snapshot.docs.length - 1] || null;
            setPendingCursor(nextCursor);
            setPendingHasMore(snapshot.docs.length === PAGE_SIZE);
            setPendingSellers(prev => reset ? docs : [...prev, ...docs]);
        } catch (error) {
            console.error('Error fetching pending sellers:', error);
        }
    };

    const handleAction = async () => {
        if (!reason && modalAction !== 'reactivate' && modalAction !== 'approve') {
            alert(t('reason_required_alert'));
            return;
        }
        setActionLoading(true);
        try {
            if (modalAction === 'suspend') {
                await adminService.suspendStore(selectedStore.id, reason);
            } else if (modalAction === 'reactivate') {
                await adminService.reactivateStore(selectedStore.id, reason || 'Reactivated by admin');
            } else if (modalAction === 'delete') {
                await adminService.deleteStore(selectedStore.id, reason);
            } else if (modalAction === 'investigate') {
                await adminService.investigateStore(selectedStore.id, reason);
            } else if (modalAction === 'approve') {
                // selectedStore here is actually a User object for this case
                await adminService.approveSeller(selectedStore.id);
                alert(t('seller_approved_alert').replace('{name}', selectedStore.displayName));
            }
            setModalOpen(false);
            setReason('');
            setModalAction(null);
        } catch (error) {
            alert(t('action_failed_alert').replace('{error}', error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const openModal = (store, action) => {
        setSelectedStore(store);
        setModalAction(action);
        setReason('');
        setModalOpen(true);
    };

    const filteredStores = stores.filter(store => {
        const matchesFilter = filter === 'all' || store.status === filter;
        const matchesSearch = store.name?.toLowerCase().includes(searchTerm.toLowerCase()) || store.id.includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">{t('status_active')}</span>;
            case 'suspended': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">{t('filter_suspended')}</span>;
            case 'under_investigation': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">{t('status_investigating')}</span>;
            case 'deleted': return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">{t('status_deleted')}</span>;
            default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">{t('status_unknown')}</span>;
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Ban className="text-red-600" /> {t('store_moderation_title')}
            </h1>

            {/* Controls */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2">
                    {['all', 'active', 'suspended', 'under_investigation'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded capitalize ${filter === f ? 'bg-secondary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            {f === 'active' ? t('status_active') : t(`filter_${f}`)}
                        </button>
                    ))}
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded capitalize flex items-center gap-2 ${filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'}`}
                    >
                        <UserPlus className="w-4 h-4" /> {t('filter_pending_sellers').replace('{count}', pendingSellers.length)}
                    </button>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('search_stores_placeholder')}
                        className="pl-10 pr-4 py-2 border rounded-full w-full focus:outline-none focus:ring-2 focus:ring-secondary"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Store List */}

                {/* Pending Sellers Table */}
                {filter === 'pending' ? (
                    <div className="flex-1 bg-white rounded-lg shadow overflow-hidden animate-fadeIn">
                        <table className="w-full text-left">
                            <thead className="bg-orange-50 border-b border-orange-100">
                                <tr>
                                    <th className="p-4 font-semibold text-orange-900">{t('header_candidate')}</th>
                                    <th className="p-4 font-semibold text-orange-900">{t('header_proposed_shop')}</th>
                                    <th className="p-4 font-semibold text-orange-900">{t('header_docs')}</th>
                                    <th className="p-4 font-semibold text-orange-900">{t('payout_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {pendingSellers.length === 0 ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">{t('no_pending_requests')}</td></tr>
                                ) : (
                                    pendingSellers.map(seller => (
                                        <tr key={seller.id} className="hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="font-bold">{seller.displayName}</div>
                                                <div className="text-xs text-gray-500">{seller.email || seller.phoneNumber}</div>
                                                <div className="text-xs text-gray-400">Inscrit: {seller.created_at?.toDate().toLocaleDateString()}</div>
                                            </td>
                                            <td className="p-4">
                                                {seller.shopName ? (
                                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{seller.shopName}</span>
                                                ) : (
                                                    <span className="text-red-500 font-bold flex items-center gap-1">
                                                        <AlertTriangle className="w-4 h-4" /> {t('missing_label')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {seller.documents ? (
                                                    <div className="flex gap-2">
                                                        {Object.entries(seller.documents).map(([key, url]) => (
                                                            <a href={url} target="_blank" rel="noopener noreferrer" key={key} className="text-blue-600 hover:underline text-xs block">
                                                                {t('view_doc').replace('{key}', key)}
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-gray-400 text-xs">Aucun</span>}
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => openModal(seller, 'approve')}
                                                    disabled={!seller.shopName}
                                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" /> {t('approve_btn')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {pendingHasMore && (
                            <div className="p-4 flex justify-center">
                                <button
                                    onClick={() => fetchPendingSellers(false)}
                                    className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                    {t('load_more')}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600">{t('header_store_name')}</th>
                                    <th className="p-4 font-semibold text-gray-600">{t('header_owner')}</th>
                                    <th className="p-4 font-semibold text-gray-600">{t('payout_status')}</th>
                                    <th className="p-4 font-semibold text-gray-600">{t('payout_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-8 text-center">{t('loading')}</td></tr>
                                ) : filteredStores.length === 0 ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">{t('no_stores_found')}</td></tr>
                                ) : (
                                    filteredStores.map(store => (
                                        <tr key={store.id} className={`hover:bg-gray-50 ${selectedStore?.id === store.id ? 'bg-blue-50' : ''}`}>
                                            <td className="p-4 font-medium">{store.name || 'Unnamed Store'} <br /><span className="text-xs text-gray-400">{store.id}</span></td>
                                            <td className="p-4 text-sm">{store.ownerEmail || 'N/A'}</td>
                                            <td className="p-4">{getStatusBadge(store.status)}</td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={() => setSelectedStore(store)} className="p-2 text-gray-600 hover:bg-gray-200 rounded" title="View Details">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                {store.status !== 'suspended' && (
                                                    <button onClick={() => openModal(store, 'suspend')} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Suspend">
                                                        <Ban className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {store.status === 'suspended' && (
                                                    <button onClick={() => openModal(store, 'reactivate')} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Reactivate">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button onClick={() => openModal(store, 'investigate')} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded" title="Investigate">
                                                    <AlertTriangle className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => openModal(store, 'delete')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {hasMore && !loading && (
                            <div className="p-4 flex justify-center">
                                <button
                                    onClick={() => fetchStores(false)}
                                    className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                    {t('load_more')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Sidebar Details & Audit Log */}
                {selectedStore && (
                    <div className="w-full lg:w-96 bg-white rounded-lg shadow-sm p-6 h-fit border border-gray-200 animate-slide-in">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold">{selectedStore.name}</h2>
                            <button onClick={() => setSelectedStore(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="text-sm">
                                <span className="font-semibold text-gray-600 block">Store ID:</span>
                                {selectedStore.id}
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold text-gray-600 block">{t('payout_status')}:</span>
                                {getStatusBadge(selectedStore.status)}
                            </div>
                            {selectedStore.suspensionReason && (
                                <div className="text-sm bg-red-50 p-3 rounded border border-red-100 text-red-800">
                                    <span className="font-bold block">{t('suspension_reason_label')}:</span>
                                    {selectedStore.suspensionReason}
                                </div>
                            )}
                        </div>

                        <h3 className="font-bold text-gray-900 border-b pb-2 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> {t('audit_log_title')}
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {auditLogs.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">{t('no_actions_recorded')}</p>
                            ) : (
                                auditLogs.map(log => (
                                    <div key={log.id} className="text-sm border-l-2 border-gray-300 pl-3 py-1">
                                        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                                            <span>{log.timestamp?.toDate().toLocaleString() || 'Just now'}</span>
                                            <span className="font-mono">{log.action}</span>
                                        </div>
                                        <p className="text-gray-800">{log.reason}</p>
                                        <p className="text-xs text-gray-400 mt-1">{t('by_admin_label').replace('{admin}', log.adminId)}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {
                modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                            <h3 className="text-lg font-bold mb-2 capitalize">{t('modal_action_title').replace('{action}', modalAction)}</h3>
                            <p className="text-gray-600 mb-4 text-sm">
                                {t('modal_confirm_text').replace('{action}', modalAction).replace('{store}', selectedStore?.name || selectedStore?.displayName)}
                                {modalAction !== 'reactivate' && modalAction !== 'approve' && ` ${t('modal_log_warning')}`}
                            </p>

                            {(modalAction !== 'reactivate' && modalAction !== 'approve') && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('reason_required_label')}</label>
                                    <textarea
                                        className="w-full border rounded p-2 focus:ring-2 focus:ring-secondary focus:outline-none"
                                        rows="3"
                                        placeholder={t('reason_placeholder')}
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                    disabled={actionLoading}
                                >
                                    {t('cancel_btn')}
                                </button>
                                <button
                                    onClick={handleAction}
                                    disabled={actionLoading}
                                    className={`px-4 py-2 text-white rounded font-bold ${modalAction === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                                        modalAction === 'suspend' ? 'bg-orange-600 hover:bg-orange-700' :
                                            modalAction === 'reactivate' ? 'bg-green-600 hover:bg-green-700' :
                                                'bg-secondary hover:bg-secondary-hover'
                                        }`}
                                >
                                    {actionLoading ? t('processing_btn') : t('confirm_action_btn').replace('{action}', modalAction)}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default StoreModeration;
