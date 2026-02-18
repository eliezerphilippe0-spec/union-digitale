import React, { useMemo } from 'react';

const SIZE_CLASSES = {
    sm: 'text-[11px] sm:text-xs',
    md: 'text-xs sm:text-sm',
};

const VARIANT_MAX_ITEMS = {
    light: 2,
    medium: 3,
    full: Infinity,
};

const TrustRow = ({ items = [], size = 'sm', pill = false, className = '', variant = 'full' }) => {
    const filteredItems = useMemo(() => items.filter(Boolean), [items]);
    const maxItems = VARIANT_MAX_ITEMS[variant] ?? VARIANT_MAX_ITEMS.full;
    const visibleItems = useMemo(() => filteredItems.slice(0, maxItems), [filteredItems, maxItems]);

    if (visibleItems.length === 0) return null;

    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

    return (
        <div className={`flex flex-wrap items-center gap-2 ${sizeClass} ${className}`}>
            {visibleItems.map((item, index) => {
                const Icon = item.icon;
                const toneClass = item.tone === 'positive'
                    ? 'text-emerald-700'
                    : item.tone === 'accent'
                        ? 'text-primary-700'
                        : 'text-neutral-600';

                return (
                    <div
                        key={`${item.label}-${index}`}
                        className={`inline-flex items-center gap-1.5 ${pill ? 'px-2 py-1 rounded-full bg-neutral-50 border border-neutral-200' : ''} ${toneClass}`}
                    >
                        {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
                        <span className="font-medium">{item.label}</span>
                        {item.value && <span className="font-semibold">{item.value}</span>}
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(TrustRow);
