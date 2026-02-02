import React from 'react';

/**
 * Professional Badge Component
 * For status indicators, labels, tags
 */

const Badge = ({
    children,
    variant = 'default',
    size = 'base',
    pill = false,
    icon: Icon,
    className = '',
    ...props
}) => {
    const baseStyles = `
    inline-flex items-center gap-1.5
    font-medium
    transition-all duration-200
    ${pill ? 'rounded-full' : 'rounded-md'}
  `;

    const variants = {
        default: 'bg-neutral-100 text-neutral-700 border border-neutral-300',
        primary: 'bg-primary-100 text-primary-800 border border-primary-300',
        success: 'bg-green-100 text-green-800 border border-green-300',
        warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        error: 'bg-red-100 text-red-800 border border-red-300',
        info: 'bg-blue-100 text-blue-800 border border-blue-300',
        gold: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-900 border border-yellow-400',
        premium: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 border border-purple-400'
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        base: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base'
    };

    const combinedClassName = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

    return (
        <span className={combinedClassName} {...props}>
            {Icon && <Icon className="w-3 h-3" />}
            {children}
        </span>
    );
};

export default Badge;
