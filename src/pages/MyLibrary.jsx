import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, functions } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Download, BookOpen, Music, Video, Loader, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import logger from '../utils/logger';

const MyLibrary = () => {
    const { currentUser } = useAuth();
    const { t, language } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadError, setDownloadError] = useState(null);

    useEffect(() => {
        const fetchLibrary = async () => {
            if (!currentUser) return;

            try {
                // 1. Get all paid orders for the user
                const q = query(
                    collection(db, 'orders'),
                    where('userId', '==', currentUser.uid),
                    where('status', '==', 'paid') // Only paid orders
                );

                const querySnapshot = await getDocs(q);
                const digitalItems = [];

                // 2. Extract digital items from orders
                querySnapshot.forEach((doc) => {
                    const order = doc.data();
                    order.items.forEach((item) => {
                        if (item.type === 'digital') {
                            digitalItems.push({
                                ...item,
                                orderId: doc.id,
                                purchaseDate: order.createdAt
                            });
                        }
                    });
                });

                // Client-side sort
                digitalItems.sort((a, b) => b.purchaseDate?.seconds - a.purchaseDate?.seconds);

                setItems(digitalItems);
            } catch (error) {
                console.error("Error fetching library:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLibrary();
    }, [currentUser]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader className="animate-spin w-8 h-8 text-secondary" />
        </div>
    );

    if (!currentUser) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4">{t('login_library')}</h1>
            <Link to="/login" className="bg-secondary text-white px-6 py-2 rounded">{t('login')}</Link>
        </div>
    );

    const handleDownload = async (item) => {
        // Reset error state
        setDownloadError(null);
        setDownloadingId(item.productId || item.id);

        try {
            // Check if file info is available
            if (!item.fileId && !item.filePath && !item.productId) {
                // Try to use productId to get download link
                if (!item.productId && !item.id) {
                    setDownloadError({ id: item.productId, message: t('download_soon') || 'Fichier non disponible' });
                    setDownloadingId(null);
                    return;
                }
            }

            // Call Cloud Function to generate signed download URL
            const generateDownloadLinks = httpsCallable(functions, 'generateDownloadLinks');
            const result = await generateDownloadLinks({
                fileId: item.fileId || item.productId || item.id,
                productId: item.productId || item.id,
                orderId: item.orderId
            });

            if (result.data?.url) {
                // Open download URL in new tab
                window.open(result.data.url, '_blank');
                logger.success(`Download started for ${item.title}`);
            } else {
                throw new Error('No download URL returned');
            }
        } catch (error) {
            console.error("Download error:", error);

            // Handle specific error codes
            let errorMessage = t('download_error_alert') || 'Erreur de téléchargement';

            if (error.code === 'functions/permission-denied') {
                errorMessage = 'Vous n\'avez pas accès à ce fichier';
            } else if (error.code === 'functions/not-found') {
                errorMessage = 'Fichier non trouvé. Contactez le support.';
            } else if (error.code === 'functions/unauthenticated') {
                errorMessage = 'Veuillez vous reconnecter';
            }

            setDownloadError({ id: item.productId || item.id, message: errorMessage });
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <BookOpen className="text-blue-600 w-8 h-8" />
                        {t('my_digital_library')}
                    </h1>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/digital/analytics"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-sm"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                        </Link>
                        <div className="text-sm text-gray-500">
                            {items.length} {items.length === 1 ? 'élément' : 'éléments'}
                        </div>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100">
                        <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Download className="w-10 h-10 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('empty_library')}</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">{t('no_digital_products')}</p>
                        <Link to="/catalog" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            {t('discover_catalog')}
                        </Link>

                        {/* DEBUG SECTION */}
                        <div className="mt-12 p-4 bg-gray-100 rounded text-left text-xs font-mono opacity-50 hover:opacity-100 transition-opacity">
                            <p className="font-bold mb-2">DEBUG INFO (User: {currentUser?.email}) :</p>
                            {loading ? t('loading') : (
                                <ul className="space-y-1">
                                    <DebugOrders currentUser={currentUser} />
                                </ul>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {items.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                                <div className="h-56 bg-gray-100 relative overflow-hidden">
                                    {item.image ? (
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <BookOpen className="w-16 h-16" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                                        {item.type === 'digital' ? t('type_digital') : t('product')}
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        {t('purchased_on')} {item.purchaseDate?.toDate().toLocaleDateString(language === 'ht' ? 'fr-HT' : language)}
                                    </p>

                                    <div className="mt-auto space-y-2">
                                        {/* Error message */}
                                        {downloadError?.id === (item.productId || item.id) && (
                                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                <span>{downloadError.message}</span>
                                            </div>
                                        )}

                                        {/* Download button */}
                                        <button
                                            onClick={() => handleDownload(item)}
                                            disabled={downloadingId === (item.productId || item.id)}
                                            className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors border ${downloadingId === (item.productId || item.id)
                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait'
                                                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                                }`}
                                        >
                                            {downloadingId === (item.productId || item.id) ? (
                                                <>
                                                    <Loader className="w-5 h-5 animate-spin" />
                                                    {t('generating_link') || 'Génération du lien...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-5 h-5" />
                                                    {t('download') || 'Télécharger'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper component for debugging
const DebugOrders = ({ currentUser }) => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const checkOrders = async () => {
            if (!currentUser) return;
            const q = query(
                collection(db, 'orders'),
                where('userId', '==', currentUser.uid),
                limit(10)
            );
            const snap = await getDocs(q);
            const debugData = snap.docs.map(d => ({
                id: d.id,
                status: d.data().status,
                items: d.data().items.map(i => `${i.title} (Type: ${i.type || 'UNDEFINED'})`)
            }));
            setLogs(debugData);
        };
        checkOrders();
    }, [currentUser]);

    return (
        <>
            {logs.map(l => (
                <li key={l.id} className="border-b border-gray-300 pb-1 mb-1">
                    <strong>Order {l.id}</strong> [{l.status}]<br />
                    Items: {l.items.join(', ')}
                </li>
            ))}
        </>
    );
};

export default MyLibrary;
