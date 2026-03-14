import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * ServiceCard Component - Clean Flat Design
 * Features:
 * - Flat solid backgrounds
 * - Simple hover lift effect
 * - Clear typography
 */
const ServiceCard = ({ service, category, size = 'default' }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleClick = () => {
        if (service.id === 'union-plus') {
            navigate('/union-plus');
        } else {
            navigate(`/services/${service.id}`);
        }
    };

    const Icon = service.icon;

    // Size variants
    const sizeClasses = {
        small: 'p-4 min-h-[120px]',
        default: 'p-5 sm:p-6 min-h-[160px]',
        large: 'p-8 min-h-[200px]'
    };

    const iconSizes = {
        small: 'w-8 h-8',
        default: 'w-10 h-10 sm:w-12 sm:h-12',
        large: 'w-14 h-14'
    };

    // Map gradient classes to solid flat colors for a cleaner look
    const getSolidBgClass = (gradientString) => {
        if (!gradientString) return 'bg-primary-600';
        if (gradientString.includes('blue')) return 'bg-blue-600';
        if (gradientString.includes('emerald') || gradientString.includes('green')) return 'bg-emerald-600';
        if (gradientString.includes('purple')) return 'bg-purple-600';
        if (gradientString.includes('orange') || gradientString.includes('amber')) return 'bg-orange-500';
        if (gradientString.includes('rose') || gradientString.includes('red')) return 'bg-rose-600';
        if (gradientString.includes('slate') || gradientString.includes('gray')) return 'bg-slate-700';
        return 'bg-primary-600'; // Fallback
    };

    const bgClass = getSolidBgClass(category?.gradient);

    return (
        <div
            className={`
                group relative
                ${sizeClasses[size]}
                rounded-xl
                cursor-pointer
                overflow-hidden
                transition-transform duration-200
                hover:-translate-y-1
                border border-transparent hover:border-white/20
                ${bgClass}
            `}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={`${t(service.nameKey) || service.name} - ${t(service.descriptionKey) || service.description}`}
        >
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header with Icon and Badge */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`
                        ${iconSizes[size]}
                        p-2.5
                        rounded-lg
                        bg-white/10
                        group-hover:bg-white/20
                        transition-colors duration-200
                    `}>
                        <Icon className="w-full h-full text-white" strokeWidth={2} />
                    </div>

                    {service.badge && (
                        <span className={`
                            px-2 py-0.5
                            text-[10px] font-bold uppercase tracking-wide
                            rounded
                            ${service.badge === 'Nouveau' ? 'bg-green-500 text-white' :
                                service.badge === 'Populaire' ? 'bg-blue-500 text-white' :
                                    service.badge === 'Premium' ? 'bg-gold-500 text-white' :
                                        'bg-white/20 text-white'}
                        `}>
                            {service.badge}
                        </span>
                    )}
                </div>

                {/* Service Info */}
                <div className="flex-1 mt-2">
                    <h3 className="text-white font-bold text-base sm:text-lg mb-1 leading-tight">
                        {service.name}
                    </h3>
                    <p className="text-white/80 text-xs sm:text-sm leading-relaxed line-clamp-2">
                        {service.description}
                    </p>
                </div>

                {/* Action Arrow */}
                <div className="mt-4 flex items-center text-white/80 group-hover:text-white transition-colors text-xs font-semibold">
                    <span className="mr-1">
                        Explorer
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
};

export default ServiceCard;
