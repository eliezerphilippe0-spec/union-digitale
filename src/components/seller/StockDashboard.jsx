import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    onSnapshot,
    getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { authService } from '../lib/firebase/auth';
import { auth } from '../lib/firebase';

/**
 * Real-time Stock Dashboard for Multi-Vendor Marketplace
 * Features:
 * - Vendor-scoped queries (each vendor sees only their products)
 * - Real-time Firestore listeners for live inventory updates
 * - Cursor-based pagination for 1000+ vendors
 * - Optimized with composite indexes
 */

const StockDashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [vendorId, setVendorId] = useState(null);

    const ITEMS_PER_PAGE = 50;

    // Check user role and vendor ID
    useEffect(() => {
        const checkAuth = async () => {
            const user = auth.currentUser;
            if (!user) {
                setError('Vous devez être connecté pour accéder au tableau de bord.');
                setLoading(false);
                return;
            }

            const role = await authService.checkUserRole(user);
            setUserRole(role);

            if (role === 'seller') {
                setVendorId(user.uid);
            } else if (role === 'admin') {
                // Admin can see all products (no vendorId filter)
                setVendorId(null);
            } else {
                setError('Accès refusé. Seuls les vendeurs et administrateurs peuvent accéder à ce tableau de bord.');
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Real-time listener for vendor products
    useEffect(() => {
        if (!vendorId && userRole !== 'admin') return;

        setLoading(true);
        setError(null);

        try {
            // Build query based on role
            let q;

            if (userRole === 'admin') {
                // Admin sees all products
                q = query(
                    collection(db, 'products'),
                    orderBy('stock', 'asc'),
                    orderBy('createdAt', 'desc'),
                    limit(ITEMS_PER_PAGE)
                );
            } else {
                // Vendor sees only their products
                q = query(
                    collection(db, 'products'),
                    where('vendorId', '==', vendorId),
                    orderBy('stock', 'asc'),
                    orderBy('createdAt', 'desc'),
                    limit(ITEMS_PER_PAGE)
                );
            }

            // Real-time listener
            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const productsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    setProducts(productsData);
                    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                    setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
                    setLoading(false);
                },
                (err) => {
                    console.error('Firestore listener error:', err);
                    setError('Erreur lors du chargement des produits. Vérifiez votre connexion.');
                    setLoading(false);
                }
            );

            return () => unsubscribe();

        } catch (err) {
            console.error('Query setup error:', err);
            setError('Erreur lors de la configuration de la requête.');
            setLoading(false);
        }
    }, [vendorId, userRole]);

    // Load more products (pagination)
    const loadMore = async () => {
        if (!hasMore || !lastDoc) return;

        setLoading(true);

        try {
            let q;

            if (userRole === 'admin') {
                q = query(
                    collection(db, 'products'),
                    orderBy('stock', 'asc'),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDoc),
                    limit(ITEMS_PER_PAGE)
                );
            } else {
                q = query(
                    collection(db, 'products'),
                    where('vendorId', '==', vendorId),
                    orderBy('stock', 'asc'),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDoc),
                    limit(ITEMS_PER_PAGE)
                );
            }

            const snapshot = await getDocs(q);
            const newProducts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setProducts(prev => [...prev, ...newProducts]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
            setLoading(false);

        } catch (err) {
            console.error('Load more error:', err);
            setError('Erreur lors du chargement de plus de produits.');
            setLoading(false);
        }
    };

    // Get stock status color
    const getStockStatusColor = (stock) => {
        if (stock === 0) return 'bg-red-100 text-red-800';
        if (stock < 10) return 'bg-yellow-100 text-yellow-800';
        if (stock < 50) return 'bg-blue-100 text-blue-800';
        return 'bg-green-100 text-green-800';
    };

    // Get stock status text
    const getStockStatusText = (stock) => {
        if (stock === 0) return 'Rupture de stock';
        if (stock < 10) return 'Stock faible';
        if (stock < 50) return 'Stock moyen';
        return 'En stock';
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Erreur</h3>
                    <p className="text-gray-600 text-center">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                📦 Tableau de Bord des Stocks
                            </h1>
                            <p className="text-gray-600">
                                {userRole === 'admin'
                                    ? 'Vue administrateur - Tous les produits'
                                    : 'Gérez votre inventaire en temps réel'}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-600">{products.length}</div>
                            <div className="text-sm text-gray-600">Produits</div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-sm text-gray-600 mb-1">En stock</div>
                        <div className="text-2xl font-bold text-green-600">
                            {products.filter(p => p.stock >= 50).length}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-sm text-gray-600 mb-1">Stock moyen</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {products.filter(p => p.stock >= 10 && p.stock < 50).length}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-sm text-gray-600 mb-1">Stock faible</div>
                        <div className="text-2xl font-bold text-yellow-600">
                            {products.filter(p => p.stock > 0 && p.stock < 10).length}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-sm text-gray-600 mb-1">Rupture</div>
                        <div className="text-2xl font-bold text-red-600">
                            {products.filter(p => p.stock === 0).length}
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Produit
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Prix
                                    </th>
                                    {userRole === 'admin' && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vendeur
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading && products.length === 0 ? (
                                    <tr>
                                        <td colSpan={userRole === 'admin' ? 5 : 4} className="px-6 py-12 text-center">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                <span className="ml-3 text-gray-600">Chargement des produits...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={userRole === 'admin' ? 5 : 4} className="px-6 py-12 text-center text-gray-500">
                                            Aucun produit trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {product.images && product.images[0] && (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            className="h-10 w-10 rounded object-cover mr-3"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {product.category}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {product.stock || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStockStatusColor(product.stock || 0)}`}>
                                                    {getStockStatusText(product.stock || 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {product.price?.toLocaleString()} HTG
                                            </td>
                                            {userRole === 'admin' && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.vendorId?.substring(0, 8)}...
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Load More Button */}
                    {hasMore && products.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={loadMore}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Chargement...' : 'Charger plus de produits'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Real-time indicator */}
                <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    Mise à jour en temps réel
                </div>
            </div>
        </div>
    );
};

export default StockDashboard;
