import React from 'react';
import { Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const PlaceholderPage = ({ translationKey }) => {
    const { t } = useLanguage();
    const title = t(translationKey);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12">
            <div className="bg-blue-50 p-6 rounded-full mb-6 animate-pulse">
                <Construction className="w-16 h-16 text-secondary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
            <p className="text-xl text-gray-600 max-w-lg mb-8">
                La section <span className="font-bold text-secondary">{title}</span> {t('under_construction')}
                <br />
                {t('come_back_soon')}
            </p>
            <div className="flex gap-4">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> {t('back_to_home')}
                </Link>
                <Link
                    to="/catalog"
                    className="bg-secondary hover:bg-secondary-hover text-white font-medium px-6 py-3 rounded-md transition-colors shadow-sm"
                >
                    {t('view_catalog')}
                </Link>
            </div>
        </div>
    );
};

export default PlaceholderPage;
