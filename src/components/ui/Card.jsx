import React, { useState } from 'react';

/**
 * Professional Card Component
 * For products, vendors, categories, stats, etc.
 */

const Card = ({
    children,
    variant = 'default',
    padding = 'base',
    hover = false,
    tilt = false,
    className = '',
    onClick,
    ...props
}) => {
    const [tiltStyle, setTiltStyle] = useState({});

    const handleMouseMove = (e) => {
        if (!tilt) return;

        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        setTiltStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
            transition: 'transform 0.1s ease-out'
        });
    };

    const handleMouseLeave = () => {
        if (!tilt) return;
        setTiltStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            transition: 'transform 0.3s ease-out'
        });
    };
    const baseStyles = `
    bg-white
    rounded-xl
    border border-neutral-200
    transition-all duration-300
  `;

    const variants = {
        default: 'shadow-sm',
        elevated: 'shadow-md',
        outlined: 'border-2 border-primary-200',
        glass: 'backdrop-blur-lg bg-white/80 border-white/20 shadow-xl'
    };

    const paddings = {
        none: 'p-0',
        sm: 'p-4',
        base: 'p-6',
        lg: 'p-8'
    };

    const hoverStyles = hover ? `
    hover:shadow-xl
    hover:scale-[1.02]
    hover:-translate-y-1
    cursor-pointer
  ` : '';

    const combinedClassName = `
    ${baseStyles}
    ${variants[variant]}
    ${paddings[padding]}
    ${hoverStyles}
    ${className}
  `.replace(/\s+/g, ' ').trim();

    return (
        <div
            className={combinedClassName}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={tilt ? tiltStyle : {}}
            {...props}
        >
            {children}
        </div>
    );
};

// Card subcomponents for better composition
Card.Header = ({ children, className = '' }) => (
    <div className={`mb-4 ${className}`}>
        {children}
    </div>
);

Card.Title = ({ children, className = '' }) => (
    <h3 className={`text-xl font-bold text-primary-900 ${className}`}>
        {children}
    </h3>
);

Card.Description = ({ children, className = '' }) => (
    <p className={`text-sm text-neutral-600 ${className}`}>
        {children}
    </p>
);

Card.Body = ({ children, className = '' }) => (
    <div className={`${className}`}>
        {children}
    </div>
);

Card.Footer = ({ children, className = '' }) => (
    <div className={`mt-4 pt-4 border-t border-neutral-200 ${className}`}>
        {children}
    </div>
);

export default Card;
