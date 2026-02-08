import React from 'react';
import { Star } from 'lucide-react';

const ReviewStats = ({ stats, onFilterByRating }) => {
    if (!stats || stats.totalReviews === 0) {
        return (
            <div className="bg-neutral-50 rounded-lg p-6 text-center">
                <p className="text-neutral-600">Aucun avis pour ce produit</p>
                <p className="text-sm text-neutral-500 mt-1">Soyez le premier à laisser un avis !</p>
            </div>
        );
    }

    const { averageRating, totalReviews, ratingDistribution, verifiedPurchaseCount } = stats;

    // Calculate percentages
    const getPercentage = (count) => {
        return totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    };

    return (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Average Rating */}
                <div className="text-center md:border-r border-neutral-200">
                    <div className="text-5xl font-bold text-primary-900 mb-2">
                        {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-6 h-6 ${star <= Math.round(averageRating)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-neutral-300'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-neutral-600 text-sm">
                        {totalReviews.toLocaleString()} avis
                    </p>
                    {verifiedPurchaseCount > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                            {verifiedPurchaseCount} achats vérifiés
                        </p>
                    )}
                </div>

                {/* Right: Rating Distribution */}
                <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = ratingDistribution[rating] || 0;
                        const percentage = getPercentage(count);

                        return (
                            <button
                                key={rating}
                                onClick={() => onFilterByRating && onFilterByRating(rating)}
                                className="w-full flex items-center gap-2 hover:bg-neutral-50 rounded px-2 py-1 transition-colors group"
                            >
                                <span className="text-sm font-medium text-neutral-700 w-8">
                                    {rating}★
                                </span>
                                <div className="flex-1 bg-neutral-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-amber-400 h-full transition-all duration-300 group-hover:bg-amber-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-sm text-neutral-600 w-12 text-right">
                                    {percentage}%
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ReviewStats;
