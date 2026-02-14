import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import SEO from '../components/common/SEO';
import { Store, TrendingUp, Star, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const BestShops = () => {
    const { t } = useLanguage();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopShops = async () => {
            try {
                // In a real app, we would have a 'totalSales' field or a separate aggregation collection.
                // For now, fetch active stores and simulate sales metrics.
                const q = query(
                    collection(db, 'stores'),
                    where('status', '==', 'active')
                );

                const snapshot = await getDocs(q);
                const allShops = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Mock sales for demonstration (randomized but consistent per session if we seeded it, 
                    // here just random to show sorting). In production, replace with data.totalSales
                    const mockSales = Math.floor(Math.random() * 500) + 50;

                    return {
                        id: doc.id,
                        ...data,
                        mockSales
                    };
                });

                // Sort by "sales" descending
                const sortedShops = allShops.sort((a, b) => b.mockSales - a.mockSales).slice(0, 12);

                setShops(sortedShops);
            } catch (error) {
                console.error("Error fetching shops:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopShops();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <SEO title={t('best_shops_meta_title')} description={t('best_shops_meta_desc')} />

            {/* Hero Section */}
            <div className="bg-secondary text-white py-12 px-4 shadow-md">
                <div className="container mx-auto max-w-6xl">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <TrendingUp className="w-10 h-10" /> {t('best_shops_title')}
                    </h1>
                    <p className="text-lg opacity-90">{t('best_shops_subtitle')}</p>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl px-4 mt-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow h-64 animate-pulse"></div>
                        ))}
                    </div>
                ) : shops.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow">
                        <Store className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-500">{t('no_shops_found')}</h2>
                        <p className="text-gray-400">{t('check_back_later')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {shops.map((shop, index) => (
                            <div key={shop.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col relative group">
                                {/* Rank Badge */}
                                <div className={`absolute top-4 left-0 text-white px-3 py-1 rounded-r shadow-lg font-bold text-sm z-10 
                                    ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-700' : 'bg-secondary'}`}>
                                    #{index + 1}
                                </div>

                                {/* Cover Image / Banner Area */}
                                <div className="h-32 bg-gray-200 relative">
                                    {shop.bannerUrl ? (
                                        <img src={shop.bannerUrl} alt={shop.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                                            <Store className="text-gray-400 opacity-50 w-12 h-12" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 pt-12 relative flex-1 flex flex-col">
                                    {/* Logo - Absolute to overlap banner */}
                                    <div className="absolute -top-10 left-6">
                                        <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                                            {shop.logoUrl ? (
                                                <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-bold text-secondary">{shop.name?.charAt(0)}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2 text-right">
                                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                            <TrendingUp className="w-3 h-3" /> {t('top_seller_badge')}
                                        </span>
                                    </div>

                                    <div className="mt-2">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-secondary transition-colors line-clamp-1">{shop.name}</h3>
                                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                                            <MapPin className="w-4 h-4" /> {shop.city || t('haiti_label')}
                                        </p>
                                    </div>

                                    <div className="my-4 border-t border-gray-100 pt-4 grid grid-cols-2 divide-x divide-gray-100">
                                        <div className="text-center px-2">
                                            <div className="text-2xl font-bold text-gray-800">{shop.mockSales}</div>
                                            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{t('sales_week_label')}</div>
                                        </div>
                                        <div className="text-center px-2">
                                            <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                                                4.8 <Star className="w-4 h-4 fill-current" />
                                            </div>
                                            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{t('avg_rating_label')}</div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <Link
                                            to={`/shop/${shop.id}`}
                                            className="block w-full bg-gray-900 text-white text-center py-2.5 rounded font-bold hover:bg-secondary transition-colors"
                                        >
                                            {t('visit_shop_btn')}
                                        </Link>
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

export default BestShops;
