/**
 * ImageOptimizer Component
 * Inspired by: Next.js Image, Shopify, Amazon image optimization
 * 
 * Features:
 * - Lazy loading with Intersection Observer
 * - WebP with fallback
 * - Responsive images (srcset)
 * - LQIP (Low Quality Image Placeholder) blur effect
 * - Error handling with fallback
 * - Performance optimized
 */

import React, { useState, useEffect, useRef } from 'react';
import logger from '../../utils/logger';

const ImageOptimizer = ({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false, // Skip lazy loading for above-the-fold images
    objectFit = 'cover', // cover, contain, fill, none
    quality = 75, // 1-100
    placeholder = 'blur', // blur, empty
    fallbackSrc = '/images/placeholder.jpg',
    onLoad,
    onError,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority); // Priority images load immediately
    const [currentSrc, setCurrentSrc] = useState(priority ? src : null);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);
    const observerRef = useRef(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority || !imgRef.current) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        setCurrentSrc(src);
                        // Disconnect after loading
                        if (observerRef.current) {
                            observerRef.current.disconnect();
                        }
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before entering viewport
                threshold: 0.01,
            }
        );

        if (imgRef.current) {
            observerRef.current.observe(imgRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [src, priority]);

    // Handle image load
    const handleLoad = (e) => {
        setIsLoaded(true);
        if (onLoad) onLoad(e);

        logger.performance('Image loaded', performance.now(), {
            src: currentSrc,
            width,
            height,
        });
    };

    // Handle image error
    const handleError = (e) => {
        setHasError(true);
        setCurrentSrc(fallbackSrc);

        logger.warn('Image load failed', {
            src: currentSrc,
            fallback: fallbackSrc,
        });

        if (onError) onError(e);
    };

    // Generate srcset for responsive images
    const generateSrcSet = (baseSrc) => {
        if (!baseSrc || hasError) return '';

        // For Firebase Storage or CDN URLs, you can add size parameters
        // Example: image.jpg?w=400 1x, image.jpg?w=800 2x
        const sizes = [400, 800, 1200, 1600];

        // Check if URL supports query parameters
        const hasQuery = baseSrc.includes('?');
        const separator = hasQuery ? '&' : '?';

        return sizes
            .map((size, index) => {
                const scale = index + 1;
                return `${baseSrc}${separator}w=${size} ${scale}x`;
            })
            .join(', ');
    };

    // Convert to WebP if supported
    const getWebPSrc = (baseSrc) => {
        if (!baseSrc || hasError) return baseSrc;

        // Check if browser supports WebP
        const supportsWebP = document.createElement('canvas')
            .toDataURL('image/webp')
            .indexOf('data:image/webp') === 0;

        if (!supportsWebP) return baseSrc;

        // If using Firebase Storage or CDN, add format parameter
        const hasQuery = baseSrc.includes('?');
        const separator = hasQuery ? '&' : '?';

        return `${baseSrc}${separator}format=webp&q=${quality}`;
    };

    // Placeholder blur effect
    const placeholderStyle = {
        filter: isLoaded ? 'none' : 'blur(20px)',
        transform: isLoaded ? 'scale(1)' : 'scale(1.1)',
        transition: 'filter 0.3s ease-out, transform 0.3s ease-out',
    };

    // Container style
    const containerStyle = {
        position: 'relative',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        overflow: 'hidden',
        backgroundColor: placeholder === 'blur' ? '#f3f4f6' : 'transparent',
    };

    // Image style
    const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit,
        ...(placeholder === 'blur' ? placeholderStyle : {}),
    };

    return (
        <div style={containerStyle} className={`image-optimizer-container ${className}`}>
            {/* Placeholder for SEO and accessibility */}
            {!isInView && (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    aria-label={`Loading ${alt}`}
                >
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 40 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="animate-pulse"
                    >
                        <rect width="40" height="40" rx="4" fill="#e5e7eb" />
                        <path
                            d="M12 28L16 24L20 28L28 16"
                            stroke="#9ca3af"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <circle cx="25" cy="13" r="2" fill="#9ca3af" />
                    </svg>
                </div>
            )}

            {/* Actual image */}
            {isInView && currentSrc && (
                <picture>
                    {/* WebP source for modern browsers */}
                    <source
                        type="image/webp"
                        srcSet={generateSrcSet(getWebPSrc(currentSrc))}
                        sizes={`(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${width}px`}
                    />

                    {/* Fallback to original format */}
                    <img
                        ref={imgRef}
                        src={currentSrc}
                        srcSet={generateSrcSet(currentSrc)}
                        alt={alt}
                        width={width}
                        height={height}
                        loading={priority ? 'eager' : 'lazy'}
                        decoding="async"
                        style={imageStyle}
                        onLoad={handleLoad}
                        onError={handleError}
                        {...props}
                    />
                </picture>
            )}

            {/* Error state */}
            {hasError && currentSrc === fallbackSrc && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        fontSize: '14px',
                    }}
                >
                    Image non disponible
                </div>
            )}
        </div>
    );
};

export default ImageOptimizer;
