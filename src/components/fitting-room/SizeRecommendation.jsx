import React, { useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckCircle, RefreshCcw, Save } from 'lucide-react';

const SizeRecommendation = ({ recommendation, onRecalculate, onSaveProfile }) => {
    const { t } = useLanguage();

    // Trigger auto-save on mount if needed, or just let user click save

    return (
        <div className="text-center space-y-6 animate-fadeIn">
            <div>
                <h3 className="text-gray-500 font-medium uppercase tracking-wide text-sm">{t('fr_rec_title')}</h3>
                <div className="text-6xl font-black text-gray-900 mt-2 mb-1">
                    {recommendation.size}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                    <CheckCircle className="w-3 h-3" />
                    {t('fr_rec_score').replace('{score}', recommendation.score)}
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-600 italic">
                    "{t('fr_social_proof')}"
                </p>
            </div>

            <div className="text-xs text-gray-400 max-w-xs mx-auto">
                {t('fr_disclaimer')}
            </div>

            <div className="flex flex-col gap-3 pt-4">
                <button
                    onClick={onSaveProfile}
                    className="w-full bg-secondary text-white py-3 rounded-lg font-bold hover:bg-secondary-hover flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" /> {t('fr_save_profile')}
                </button>
                <button
                    onClick={onRecalculate}
                    className="w-full bg-white text-gray-600 border border-gray-200 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                    <RefreshCcw className="w-4 h-4" /> {t('fr_recalculate')}
                </button>
            </div>
        </div>
    );
};

export default SizeRecommendation;
