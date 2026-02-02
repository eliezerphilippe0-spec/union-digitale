import React from 'react';
import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ComingSoon = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="bg-yellow-100 p-4 rounded-full mb-6">
                <Construction className="w-12 h-12 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('page_under_construction')}</h1>
            <p className="text-gray-600 max-w-md mb-8">
                {t('feature_in_development')}
            </p>
            <Link
                to="/"
                className="bg-secondary hover:bg-secondary-hover text-white font-medium py-3 px-6 rounded-md transition-colors"
            >
                {t('back_to_home')}
            </Link>
        </div>
    );
};

export default ComingSoon;
