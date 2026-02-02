import React from 'react';
import { Truck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const FreeShippingProgress = ({ currentAmount, threshold = 75000 }) => {
    const { t } = useLanguage();
    const progress = Math.min((currentAmount / threshold) * 100, 100);
    const remaining = threshold - currentAmount;

    return (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-blue-900">
                <Truck className="w-4 h-4" />
                {remaining > 0 ? (
                    <span>{t('free_shipping_remaining_prefix')} <span className="font-bold text-red-600">{remaining.toLocaleString()} G</span> {t('free_shipping_remaining_suffix')}</span>
                ) : (
                    <span className="text-green-700 font-bold">{t('free_shipping_unlocked')}</span>
                )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-secondary'}`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

export default FreeShippingProgress;
