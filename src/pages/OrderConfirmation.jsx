import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import Celebration from '../components/marketing/Celebration';

import { useLanguage } from '../contexts/LanguageContext';

const OrderConfirmation = () => {
    const { orderId } = useParams();
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 relative">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <Celebration />

                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                    {t('order_confirmed_title')}
                </h2>
                <p className="text-gray-500 mb-6">
                    {t('payment_confirmed')}
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{t('order_number')}</div>
                    <div className="font-mono text-lg font-bold text-gray-900">{orderId}</div>
                </div>

                <div className="space-y-3">
                    <Link
                        to="/orders"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-secondary hover:bg-secondary-hover shadow-sm transition-colors"
                    >
                        <Package className="w-5 h-5" />
                        {t('view_orders')}
                    </Link>

                    <Link
                        to="/"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        {t('continue_shopping')} <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
