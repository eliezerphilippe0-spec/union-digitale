import { Smartphone, ShoppingBag, Home, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const QuickCategories = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const categories = [
        { key: 'electronics', label: t('high_tech') || 'High-Tech',      emoji: '📱', color: '#6366f1' },
        { key: 'fashion',     label: t('fashion') || 'Mode',              emoji: '👕', color: '#ec4899' },
        { key: 'home',        label: t('home_kitchen') || 'Maison',       emoji: '🏠', color: '#10b981' },
        { key: 'beauty',      label: t('beauty') || 'Beauté',             emoji: '💄', color: '#f59e0b' },
        { key: 'energy',      label: t('energy_solar') || 'Énergie',      emoji: '⚡', color: '#f97316' },
        { key: 'auto',        label: t('auto') || 'Auto',                 emoji: '🚗', color: '#3b82f6' },
        { key: 'education',   label: t('education_culture') || 'Éducation', emoji: '📚', color: '#8b5cf6' },
        { key: 'realestate',  label: t('real_estate') || 'Immobilier',    emoji: '🏡', color: '#14b8a6' },
    ];

    return (
        <div
            className="flex items-center gap-3 sm:gap-5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
        >
            {categories.map((cat) => (
                <button
                    key={cat.key}
                    onClick={() => navigate(`/category/${cat.key}`)}
                    className="flex flex-col items-center gap-1.5 min-w-[60px] group cursor-pointer"
                    aria-label={`Voir la catégorie ${cat.label}`}
                >
                    <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl
                                   group-hover:scale-110 transition-all duration-300 shadow-lg"
                        style={{ backgroundColor: `${cat.color}22`, border: `1.5px solid ${cat.color}44` }}
                    >
                        {cat.emoji}
                    </div>
                    <span className="text-[11px] sm:text-xs font-medium text-white/80 group-hover:text-white transition-colors whitespace-nowrap">
                        {cat.label}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default QuickCategories;
