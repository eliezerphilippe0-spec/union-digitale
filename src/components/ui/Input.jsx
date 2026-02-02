import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Professional Input Component
 * Supports text, email, password, number, textarea
 */

const Input = forwardRef(({
    label,
    type = 'text',
    error,
    helperText,
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const baseInputStyles = `
    w-full
    px-4 py-2.5
    bg-white
    border-2 border-neutral-300
    rounded-lg
    text-neutral-900
    placeholder:text-neutral-400
    transition-all duration-200
    focus:outline-none
    focus:border-primary-600
    focus:ring-4 focus:ring-primary-100
    disabled:bg-neutral-100
    disabled:cursor-not-allowed
    ${error ? 'border-red-500 focus:border-red-600 focus:ring-red-100' : ''}
    ${Icon && iconPosition === 'left' ? 'pl-11' : ''}
    ${Icon && iconPosition === 'right' ? 'pr-11' : ''}
  `;

    const containerStyles = `
    ${fullWidth ? 'w-full' : ''}
    ${containerClassName}
  `;

    return (
        <div className={containerStyles}>
            {label && (
                <label className="block mb-2 text-sm font-medium text-neutral-700">
                    {label}
                </label>
            )}

            <div className="relative">
                {Icon && iconPosition === 'left' && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        <Icon className="w-5 h-5" />
                    </div>
                )}

                <input
                    ref={ref}
                    type={type}
                    className={`${baseInputStyles} ${className}`}
                    {...props}
                />

                {Icon && iconPosition === 'right' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {helperText && !error && (
                <p className="mt-1.5 text-sm text-neutral-500">
                    {helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

// Textarea variant
export const Textarea = forwardRef(({
    label,
    error,
    helperText,
    rows = 4,
    fullWidth = false,
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const baseStyles = `
    w-full
    px-4 py-2.5
    bg-white
    border-2 border-neutral-300
    rounded-lg
    text-neutral-900
    placeholder:text-neutral-400
    transition-all duration-200
    focus:outline-none
    focus:border-primary-600
    focus:ring-4 focus:ring-primary-100
    disabled:bg-neutral-100
    disabled:cursor-not-allowed
    resize-y
    ${error ? 'border-red-500 focus:border-red-600 focus:ring-red-100' : ''}
  `;

    return (
        <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
            {label && (
                <label className="block mb-2 text-sm font-medium text-neutral-700">
                    {label}
                </label>
            )}

            <textarea
                ref={ref}
                rows={rows}
                className={`${baseStyles} ${className}`}
                {...props}
            />

            {error && (
                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {helperText && !error && (
                <p className="mt-1.5 text-sm text-neutral-500">
                    {helperText}
                </p>
            )}
        </div>
    );
});

Textarea.displayName = 'Textarea';

// Select variant
export const Select = forwardRef(({
    label,
    error,
    helperText,
    options = [],
    placeholder = 'Sélectionner...',
    fullWidth = false,
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const baseStyles = `
    w-full
    px-4 py-2.5
    bg-white
    border-2 border-neutral-300
    rounded-lg
    text-neutral-900
    transition-all duration-200
    focus:outline-none
    focus:border-primary-600
    focus:ring-4 focus:ring-primary-100
    disabled:bg-neutral-100
    disabled:cursor-not-allowed
    cursor-pointer
    ${error ? 'border-red-500 focus:border-red-600 focus:ring-red-100' : ''}
  `;

    return (
        <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
            {label && (
                <label className="block mb-2 text-sm font-medium text-neutral-700">
                    {label}
                </label>
            )}

            <select
                ref={ref}
                className={`${baseStyles} ${className}`}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {error && (
                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {helperText && !error && (
                <p className="mt-1.5 text-sm text-neutral-500">
                    {helperText}
                </p>
            )}
        </div>
    );
});

Select.displayName = 'Select';

export default Input;
