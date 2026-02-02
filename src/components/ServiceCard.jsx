import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * ServiceCard Component - Premium 3D Tilt Card
 * Features:
 * - 3D tilt effect on hover
 * - Gradient backgrounds per category
 * - Animated icons
 * - Glass morphism overlay
 * - Badge support (Nouveau, Populaire, Premium)
 */
const ServiceCard = ({ service, category, size = 'default' }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const tiltX = ((y - centerY) / centerY) * -10; // Max 10deg
        const tiltY = ((x - centerX) / centerX) * 10;

        setTilt({ x: tiltX, y: tiltY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    const handleClick = () => {
        // Special handling for Union Plus - redirect to existing page
        if (service.id === 'union-plus') {
            navigate('/union-plus');
        } else {
            navigate(`/services/${service.id}`);
        }
    };

    const Icon = service.icon;

    // Size variants
    const sizeClasses = {
        small: 'p-4 min-h-[140px]',
        default: 'p-6 min-h-[180px]',
        large: 'p-8 min-h-[220px]'
    };

    const iconSizes = {
        small: 'w-8 h-8',
        default: 'w-10 h-10',
        large: 'w-12 h-12'
    };

    return (
        <div
            className={`
                luxury-card
                group relative
                ${sizeClasses[size]}
                rounded-2xl
                cursor-pointer
                overflow-hidden
                transition-all duration-500
                shadow-luxury-md
                hover:shadow-luxury-xl
                bg-gradient-to-br ${category.gradient}
            `}
            style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.1s ease-out'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={`${t(service.nameKey) || service.name} - ${t(service.descriptionKey) || service.description}`}
        >
            {/* Glass morphism overlay */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>

            {/* Gradient shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header with Icon and Badge */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`
                        ${iconSizes[size]}
                        p-2.5
                        rounded-xl
                        bg-white/10
                        backdrop-blur-sm
                        border border-white/20
                        group-hover:scale-110
                        group-hover:rotate-6
                        transition-all duration-500
                    `}>
                        <Icon className="w-full h-full text-white" strokeWidth={2} />
                    </div>

                    {service.badge && (
                        <span className={`
                            px-2.5 py-1
                            text-xs font-bold
                            rounded-full
                            ${service.badge === 'Nouveau' ? 'bg-green-500/20 text-green-100 border border-green-400/30' :
                                service.badge === 'Populaire' ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30' :
                                    service.badge === 'Premium' ? 'bg-gold-500/20 text-gold-100 border border-gold-400/30' :
                                        'bg-white/20 text-white border border-white/30'}
                            backdrop-blur-sm
                        `}>
                            {service.badge}
                        </span>
                    )}
                </div>

                {/* Service Info */}
                <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-2 leading-tight">
                        {service.name}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                        {service.description}
                    </p>
                </div>

                {/* Action Arrow */}
                <div className="mt-4 flex items-center text-white/90 group-hover:text-white transition-colors">
                    <span className="text-sm font-semibold mr-2">
                        Explorer
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>

            {/* Ripple effect on click */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 rounded-2xl group-active:animate-ping bg-white/20"></div>
            </div>
        </div>
    );
};

export default ServiceCard;
