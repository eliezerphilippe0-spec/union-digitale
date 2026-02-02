import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Professional Button Component
 * Variants: primary, secondary, ghost, danger
 * Sizes: sm, base, lg, xl
 */

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'base',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    if (onClick) onClick(e);
  };
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-orange-600 to-orange-500
      text-white
      shadow-lg shadow-orange-500/30
      hover:shadow-xl hover:shadow-orange-500/40
      hover:scale-[1.02]
      active:scale-[0.98]
      focus:ring-orange-500
    `,
    secondary: `
      bg-white
      text-primary-900
      border-2 border-primary-900
      hover:bg-primary-50
      active:bg-primary-100
      focus:ring-primary-500
    `,
    ghost: `
      bg-transparent
      text-primary-700
      hover:bg-primary-50
      active:bg-primary-100
      focus:ring-primary-500
    `,
    danger: `
      bg-red-600
      text-white
      shadow-lg shadow-red-500/30
      hover:bg-red-700
      hover:shadow-xl hover:shadow-red-500/40
      active:bg-red-800
      focus:ring-red-500
    `,
    gold: `
      bg-gradient-to-r from-yellow-600 to-yellow-500
      text-primary-900
      shadow-lg shadow-yellow-500/30
      hover:shadow-xl hover:shadow-yellow-500/40
      hover:scale-[1.02]
      active:scale-[0.98]
      focus:ring-yellow-500
      font-semibold
    `
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    base: 'h-10 px-5 text-base',
    lg: 'h-12 px-6 text-lg',
    xl: 'h-14 px-8 text-xl'
  };

  const combinedClassName = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <button
      ref={ref}
      type={type}
      className={`${combinedClassName} relative overflow-hidden`}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            pointerEvents: 'none'
          }}
        />
      ))}
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Chargement...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
