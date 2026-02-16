import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, updateDoc, doc, limit, startAfter } from 'firebase/firestore';
import { useLanguage } from '../../contexts/LanguageContext';
import { User, Shield, Ban, CheckCircle, Search, Mail } from 'lucide-react';

const AdminUsers = () => {
    const { t } = useLanguage();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, admin, seller, buyer
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    useEffect(() => {
        fetchUsers(true);
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        setCursor(null);
        setUsers([]);
        setHasMore(true);
        fetchUsers(true);
    }, [filter, debouncedSearch]);

    const fetchUsers = async (reset = false) => {
        setLoading(true);
        try {
            let q = query(collection(db, 'users'), orderBy('created_at', 'desc'), limit(PAGE_SIZE));
            if (!reset && cursor) {
                q = query(collection(db, 'users'), orderBy('created_at', 'desc'), startAfter(cursor), limit(PAGE_SIZE));
            }
            const snapshot = await getDocs(q);
            const fetchedUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            const nextCursor = snapshot.docs[snapshot.docs.length - 1] || null;
            setCursor(nextCursor);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
            setUsers(prev => reset ? fetchedUsers : [...prev, ...fetchedUsers]);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if (!window.confirm(t('role_update_confirm').replace('{newRole}', newRole))) return;
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            alert(t('role_updated_success'));
        } catch (error) {
            console.error("Error updating role:", error);
            alert(t('status_update_error'));
        }
    };

    const toggleBlockUser = async (user) => {
        const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
        if (!window.confirm(newStatus === 'blocked' ? t('block_user_confirm') : t('unblock_user_confirm'))) return;
        try {
            await updateDoc(doc(db, 'users', user.id), { status: newStatus });
            setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const filteredUsers = useMemo(() => users.filter(user => {
        const matchesSearch = (user.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            user.displayName?.toLowerCase().includes(debouncedSearch.toLowerCase()));
        const matchesFilter = filter === 'all' || user.role === filter;
        return matchesSearch && matchesFilter;
    }), [users, filter, debouncedSearch]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <User className="text-secondary" /> {t('user_management_title')}
            </h1>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2">
                    {['all', 'admin', 'seller', 'buyer'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded capitalize text-sm font-medium transition-colors ${filter === f ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {f === 'buyer' ? t('filter_buyer') : f === 'seller' ? t('filter_seller') : f === 'admin' ? t('filter_admin') : t('filter_all')}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder={t('search_placeholder_users')}
                        className="pl-9 pr-4 py-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="p-4">{t('header_user')}</th>
                                <th className="p-4">{t('header_role')}</th>
                                <th className="p-4">{t('header_status')}</th>
                                <th className="p-4">{t('header_date_joined')}</th>
                                <th className="p-4 text-right">{t('header_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">{t('loading')}</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">{t('no_users_found')}</td></tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{user.displayName || 'Sans Nom'}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                value={user.role || 'buyer'}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className={`border rounded px-2 py-1 text-xs font-bold ${user.role === 'admin' ? 'text-purple-700 bg-purple-50 border-purple-200' :
                                                    user.role === 'seller' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                                                        'text-gray-700 bg-gray-50'
                                                    }`}
                                            >
                                                <option value="buyer">{t('role_buyer')}</option>
                                                <option value="seller">{t('role_seller')}</option>
                                                <option value="admin">{t('role_admin')}</option>
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            {user.status === 'blocked' ? (
                                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                    <Ban className="w-3 h-3" /> {t('status_blocked')}
                                                </span>
                                            ) : (
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                    <CheckCircle className="w-3 h-3" /> {t('status_active')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-500 text-xs">
                                            {user.created_at?.toDate ? user.created_at.toDate().toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => toggleBlockUser(user)}
                                                className={`p-2 rounded transition-colors ${user.status === 'blocked' ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                                                title={user.status === 'blocked' ? t('unblock_action') : t('block_action')}
                                            >
                                                {user.status === 'blocked' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {hasMore && !loading && (
                <div className="flex justify-center">
                    <button
                        onClick={() => fetchUsers(false)}
                        className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded"
                    >
                        {t('load_more')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
