import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Download, CheckCircle, Clock } from 'lucide-react';
import { products } from '../data/products';
import { useLanguage } from '../contexts/LanguageContext';

const Orders = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();

    // Mock Orders Data
    const orders = [
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
    ];

    return (
        <div className="bg-gray-100 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                <h1 className="text-2xl font-medium mb-6">{t('your_orders')}</h1>

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

                                {order.items.map(item => (
                                    <div key={item.id} className="flex gap-6">
                                        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-2xl text-gray-400 rounded">
                                            {item.image}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-blue-600 hover:underline cursor-pointer mb-2">
                                                {item.title}
                                            </h3>
                                            <div className="text-sm text-gray-500 mb-4">
                                                {t('sold_by')}: {item.brand}
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
