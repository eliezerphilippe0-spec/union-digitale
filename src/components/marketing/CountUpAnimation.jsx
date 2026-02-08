import React, { useState, useEffect, useRef } from 'react';

/**
 * CountUpAnimation Component
 * Animates numbers from 0 to target value
 * Triggers when element enters viewport using Intersection Observer
 */
const CountUpAnimation = ({
    end,
    duration = 2000,
    suffix = '',
    prefix = '',
    decimals = 0,
    className = '',
    formatNumber = true
}) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        // Intersection Observer to trigger animation when in view
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setHasAnimated(true);
                        animateCount();
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(element);

        return () => {
            if (element) observer.unobserve(element);
        };
    }, [hasAnimated]);

    const animateCount = () => {
        const startTime = Date.now();
        const startValue = 0;
        const endValue = end;

        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

        const updateCount = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easedProgress = easeOutQuart(progress);
            const currentCount = startValue + (endValue - startValue) * easedProgress;

            setCount(currentCount);

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                setCount(endValue);
            }
        };

        requestAnimationFrame(updateCount);
    };

    const formatValue = (value) => {
        let formatted = value.toFixed(decimals);

        if (formatNumber) {
            // Format with thousands separator
            const parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            formatted = parts.join('.');
        }

        return `${prefix}${formatted}${suffix}`;
    };

    return (
        <span ref={elementRef} className={className}>
            {formatValue(count)}
        </span>
    );
};

export default CountUpAnimation;
