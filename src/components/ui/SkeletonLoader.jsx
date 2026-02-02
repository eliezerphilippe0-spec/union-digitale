import React from 'react';

/**
 * Modern Skeleton Loader Component
 * Inspired by Linear & Stripe
 */

const SkeletonLoader = ({
    variant = 'text',
    width = '100%',
    height,
    count = 1,
    className = '',
    circle = false,
    animation = 'pulse'
}) => {
    const baseStyles = `
    bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200
    bg-[length:200%_100%]
    rounded
    ${animation === 'pulse' ? 'animate-pulse' : 'animate-shimmer'}
    ${circle ? 'rounded-full' : ''}
  `;

    const variants = {
        text: {
            height: height || '1rem',
            className: 'rounded-md'
        },
        title: {
            height: height || '2rem',
            className: 'rounded-lg'
        },
        button: {
            height: height || '2.5rem',
            className: 'rounded-lg'
        },
        card: {
            height: height || '12rem',
            className: 'rounded-xl'
        },
        avatar: {
            height: height || '3rem',
            width: height || '3rem',
            className: 'rounded-full'
        },
        thumbnail: {
            height: height || '8rem',
            className: 'rounded-lg'
        }
    };

    const config = variants[variant] || variants.text;

    const skeletonStyle = {
        width: config.width || width,
        height: config.height
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={`${baseStyles} ${config.className}`}
                    style={skeletonStyle}
                    aria-hidden="true"
                />
            ))}
        </div>
    );
};

// Specialized skeleton components
export const SkeletonCard = ({ className = '' }) => (
    <div className={`bg-white rounded-xl border-2 border-neutral-200 p-6 ${className}`}>
        <div className="space-y-4">
            <SkeletonLoader variant="thumbnail" />
            <SkeletonLoader variant="title" width="80%" />
            <SkeletonLoader variant="text" count={2} />
            <div className="flex gap-2">
                <SkeletonLoader variant="button" width="6rem" />
                <SkeletonLoader variant="button" width="6rem" />
            </div>
        </div>
    </div>
);

export const SkeletonProductCard = ({ className = '' }) => (
    <div className={`bg-white rounded-xl border-2 border-neutral-200 overflow-hidden ${className}`}>
        <SkeletonLoader variant="card" height="14rem" className="rounded-none" />
        <div className="p-4 space-y-3">
            <SkeletonLoader variant="text" width="90%" />
            <SkeletonLoader variant="text" width="60%" />
            <div className="flex items-center gap-2">
                <SkeletonLoader variant="text" width="4rem" height="1.5rem" />
                <SkeletonLoader variant="text" width="3rem" height="1rem" />
            </div>
        </div>
    </div>
);

export const SkeletonList = ({ count = 5, className = '' }) => (
    <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
                <SkeletonLoader variant="avatar" />
                <div className="flex-1 space-y-2">
                    <SkeletonLoader variant="text" width="40%" />
                    <SkeletonLoader variant="text" width="60%" />
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
    <div className={`bg-white rounded-xl border-2 border-neutral-200 overflow-hidden ${className}`}>
        {/* Header */}
        <div className="border-b border-neutral-200 p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, index) => (
                    <SkeletonLoader key={index} variant="text" width="80%" />
                ))}
            </div>
        </div>
        {/* Rows */}
        <div className="divide-y divide-neutral-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="p-4">
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <SkeletonLoader key={colIndex} variant="text" width="70%" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const SkeletonDashboard = ({ className = '' }) => (
    <div className={`space-y-6 ${className}`}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl border-2 border-neutral-200 p-6">
                    <SkeletonLoader variant="text" width="50%" className="mb-4" />
                    <SkeletonLoader variant="title" width="70%" />
                </div>
            ))}
        </div>
        {/* Chart */}
        <div className="bg-white rounded-xl border-2 border-neutral-200 p-6">
            <SkeletonLoader variant="title" width="30%" className="mb-6" />
            <SkeletonLoader variant="card" height="16rem" />
        </div>
        {/* Table */}
        <SkeletonTable rows={5} columns={4} />
    </div>
);

export default SkeletonLoader;
