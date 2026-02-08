import React from 'react';

// Base Skeleton component with shimmer animation
const Skeleton = ({ className = '', variant = 'rect', ...props }) => {
    const baseClasses = 'animate-pulse bg-gray-200 dark:bg-neutral-700';
    
    const variants = {
        rect: 'rounded-lg',
        circle: 'rounded-full',
        text: 'rounded h-4',
    };

    return (
        <div 
            className={`${baseClasses} ${variants[variant]} ${className}`} 
            {...props}
        />
    );
};

// Product Card Skeleton
export const ProductCardSkeleton = () => (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
        {/* Image placeholder */}
        <Skeleton className="h-48 w-full rounded-none" />
        
        {/* Content */}
        <div className="p-4 space-y-3">
            {/* Title */}
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
            
            {/* Rating */}
            <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} variant="circle" className="w-4 h-4" />
                ))}
            </div>
            
            {/* Price */}
            <Skeleton variant="text" className="w-1/3 h-6" />
        </div>
    </div>
);

// Product Grid Skeleton
export const ProductGridSkeleton = ({ count = 8 }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(count)].map((_, i) => (
            <ProductCardSkeleton key={i} />
        ))}
    </div>
);

// Hero Skeleton
export const HeroSkeleton = () => (
    <div className="min-h-[60vh] bg-gray-900 flex items-center">
        <div className="container mx-auto px-4">
            <div className="max-w-2xl space-y-6">
                <Skeleton className="w-48 h-8 bg-gray-700" />
                <Skeleton className="w-full h-16 bg-gray-700" />
                <Skeleton className="w-3/4 h-16 bg-gray-700" />
                <Skeleton className="w-2/3 h-6 bg-gray-700" />
                <div className="flex gap-4 pt-4">
                    <Skeleton className="w-40 h-12 bg-gray-700" />
                    <Skeleton className="w-40 h-12 bg-gray-700" />
                </div>
            </div>
        </div>
    </div>
);

// Category Card Skeleton
export const CategoryCardSkeleton = () => (
    <div className="rounded-xl overflow-hidden">
        <Skeleton className="h-44 w-full" />
    </div>
);

// Checkout Summary Skeleton
export const CheckoutSkeleton = () => (
    <div className="bg-white rounded-xl p-6 space-y-4">
        <Skeleton variant="text" className="w-1/2 h-6" />
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
                <Skeleton className="w-16 h-16" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="w-3/4" />
                    <Skeleton variant="text" className="w-1/4" />
                </div>
            </div>
        ))}
        <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between">
                <Skeleton variant="text" className="w-20" />
                <Skeleton variant="text" className="w-16" />
            </div>
            <div className="flex justify-between">
                <Skeleton variant="text" className="w-16" />
                <Skeleton variant="text" className="w-20" />
            </div>
        </div>
        <Skeleton className="w-full h-12 mt-4" />
    </div>
);

// Dashboard Stats Skeleton - P3 FIX
export const DashboardSkeleton = () => (
    <div className="space-y-6">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
        </div>
        
        {/* Chart */}
        <Skeleton className="h-80 rounded-xl" />
    </div>
);

// Product Details Skeleton - P3 FIX
export const ProductDetailsSkeleton = () => (
    <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Image */}
            <div className="lg:col-span-5 flex gap-4">
                <div className="flex flex-col gap-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="w-12 h-12" />
                    ))}
                </div>
                <Skeleton className="flex-1 h-[400px] rounded-lg" />
            </div>
            
            {/* Info */}
            <div className="lg:col-span-4 space-y-4">
                <Skeleton variant="text" className="w-3/4 h-8" />
                <Skeleton variant="text" className="w-1/2 h-4" />
                <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} variant="circle" className="w-5 h-5" />
                    ))}
                </div>
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton variant="text" className="w-full h-4" />
                <Skeleton variant="text" className="w-full h-4" />
                <Skeleton variant="text" className="w-2/3 h-4" />
            </div>
            
            {/* Buy Box */}
            <div className="lg:col-span-3">
                <Skeleton className="h-80 rounded-xl" />
            </div>
        </div>
    </div>
);

// Review Card Skeleton
export const ReviewSkeleton = () => (
    <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center gap-3 mb-2">
            <Skeleton variant="circle" className="w-10 h-10" />
            <div className="space-y-1">
                <Skeleton variant="text" className="w-24" />
                <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} variant="circle" className="w-3 h-3" />
                    ))}
                </div>
            </div>
        </div>
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-2/3" />
    </div>
);

// Reviews List Skeleton
export const ReviewsListSkeleton = ({ count = 3 }) => (
    <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
            <ReviewSkeleton key={i} />
        ))}
    </div>
);

export default Skeleton;
