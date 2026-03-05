import React from 'react';
import '../styles/SkeletonCard.css';

/**
 * SkeletonCard Component
 * 
 * Product card skeleton loader with shimmer animation.
 * Used during loading states to provide better perceived performance
 * and visual continuity while product data is being fetched.
 * 
 * Matches the layout of a standard product card:
 * - Image placeholder at top
 * - Title and description text placeholders
 * - Price placeholder
 * - Action button placeholder
 */

interface SkeletonCardProps {
  count?: number;
  className?: string;
  variant?: 'product' | 'compact';
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  count = 1,
  className = '',
  variant = 'product',
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`skeleton-card skeleton-card--${variant} ${className}`}
          role="status"
          aria-label="Loading product"
          aria-busy="true"
        >
          {/* Image Placeholder */}
          <div className="skeleton-card__image skeleton" />

          {/* Content Area */}
          <div className="skeleton-card__content">
            {/* Category/Badge Placeholder */}
            <div className="skeleton-card__badge skeleton skeleton-text" />

            {/* Title Placeholder */}
            <div className="skeleton-card__title skeleton skeleton-text" />

            {/* Description Placeholder (only in full variant) */}
            {variant === 'product' && (
              <div className="skeleton-card__description">
                <div className="skeleton-card__description-line skeleton skeleton-text" />
                <div className="skeleton-card__description-line skeleton skeleton-text" />
              </div>
            )}

            {/* Rating Placeholder */}
            <div className="skeleton-card__rating skeleton skeleton-text" />

            {/* Price Section */}
            <div className="skeleton-card__price-section">
              <div className="skeleton-card__price skeleton skeleton-text" />
              <div className="skeleton-card__old-price skeleton skeleton-text" />
            </div>

            {/* Button Placeholder */}
            <div className="skeleton-card__button skeleton skeleton-text" />
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonCard;
