import { Smartphone, ShoppingBag, Home, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const QuickCategories = () => {
    const { t } = useLanguage();

    const categories = [
        {
            key: 'high_tech',
            label: t('high_tech') || 'High-Tech',
            icon: Smartphone,
            gradient: 'from-violet-500 to-indigo-500',
            href: '/category/high_tech'
        },
        {
            key: 'fashion',
            label: t('fashion') || 'Mode',
            icon: ShoppingBag,
            gradient: 'from-pink-500 to-rose-500',
            href: '/category/fashion'
        },
        {
            key: 'home_kitchen',
            label: t('home_kitchen') || 'Maison',
            icon: Home,
            gradient: 'from-emerald-500 to-teal-500',
            href: '/category/home_kitchen'
        },
        {
            key: 'beauty',
            label: t('beauty') || 'Beauté',
            icon: Sparkles,
            gradient: 'from-amber-500 to-orange-500',
            href: '/category/beauty'
        }
    ];

    return (
        <div className="flex items-center justify-center gap-3 sm:gap-4">
            {categories.map((cat) => (
                <a
                    key={cat.key}
                    href={cat.href}
                    className="
                        group relative
                        flex flex-col items-center gap-2
                        p-3 sm:p-4
                        rounded-xl
                        glass-premium
                        hover:bg-white/10 hover:border-white/20
                        transition-all duration-300
                        hover:scale-105
                        cursor-pointer
                        shadow-luxury-sm
                        hover:shadow-luxury-md
                    "
                    aria-label={`Voir la catégorie ${cat.label}`}
                >
                    <div className={`
                        w-10 h-10 sm:w-12 sm:h-12
                        rounded-lg
                        bg-gradient-to-br ${cat.gradient}
                        flex items-center justify-center
                        group-hover:scale-110
                        transition-transform duration-300
                        shadow-lg
                    `}>
                        <cat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                        {cat.label}
                    </span>
                </a>
            ))}
        </div>
    );
};

export default QuickCategories;
