import React, { useState, useEffect, useRef } from 'react';

/**
 * Optimized Image Component with Lazy Loading & WebP Support
 * Automatically converts images to WebP for better compression
 */
export default function OptimizedImage({
    src,
    alt,
    className = '',
    width,
    height,
    loading = 'lazy',
    priority = false,
    objectFit = 'cover',
    placeholder = 'blur',
    onLoad
}) {
    const [imageSrc, setImageSrc] = useState(placeholder === 'blur' ? '/placeholder.jpg' : src);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority || loading === 'eager') {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px' // Start loading 50px before entering viewport
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, [priority, loading]);

    // Load image when in view
    useEffect(() => {
        if (!isInView) return;

        const img = new Image();

        // Try WebP first, fallback to original
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');

        img.onload = () => {
            setImageSrc(webpSrc);
            setIsLoaded(true);
            onLoad?.();
        };

        img.onerror = () => {
            // Fallback to original format
            setImageSrc(src);
            setIsLoaded(true);
            onLoad?.();
        };

        img.src = webpSrc;
    }, [isInView, src, onLoad]);

    return (
        <div
            ref={imgRef}
            className={`optimized-image-wrapper ${className}`}
            style={{
                position: 'relative',
                width: width || '100%',
                height: height || 'auto',
                overflow: 'hidden'
            }}
        >
            <img
                src={imageSrc}
                alt={alt}
                loading={loading}
                decoding="async"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit,
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out'
                }}
            />

            {!isLoaded && placeholder === 'blur' && (
                <div
                    className="image-placeholder"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite'
                    }}
                />
            )}
        </div>
    );
}

// Responsive Image with srcset
export function ResponsiveImage({
    src,
    alt,
    sizes = '100vw',
    className = '',
    ...props
}) {
    // Generate srcset for different sizes
    const generateSrcSet = (baseSrc) => {
        const sizes = [320, 640, 768, 1024, 1280, 1920];
        return sizes.map(size => {
            const resizedSrc = baseSrc.replace(/\.(jpg|jpeg|png)$/i, `-${size}w.$1`);
            return `${resizedSrc} ${size}w`;
        }).join(', ');
    };

    return (
        <OptimizedImage
            src={src}
            srcSet={generateSrcSet(src)}
            sizes={sizes}
            alt={alt}
            className={className}
            {...props}
        />
    );
}

// Background Image with lazy loading
export function BackgroundImage({
    src,
    children,
    className = '',
    style = {},
    priority = false
}) {
    const [bgImage, setBgImage] = useState(null);
    const [isInView, setIsInView] = useState(priority);
    const divRef = useRef(null);

    useEffect(() => {
        if (priority) {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '100px' }
        );

        if (divRef.current) {
            observer.observe(divRef.current);
        }

        return () => {
            if (divRef.current) {
                observer.unobserve(divRef.current);
            }
        };
    }, [priority]);

    useEffect(() => {
        if (!isInView) return;

        const img = new Image();
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');

        img.onload = () => setBgImage(webpSrc);
        img.onerror = () => setBgImage(src);
        img.src = webpSrc;
    }, [isInView, src]);

    return (
        <div
            ref={divRef}
            className={className}
            style={{
                ...style,
                backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                transition: 'background-image 0.3s ease-in-out'
            }}
        >
            {children}
        </div>
    );
}
