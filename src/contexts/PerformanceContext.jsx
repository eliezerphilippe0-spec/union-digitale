import React, { createContext, useContext, useEffect, useState } from 'react';
import logger from '../utils/logger';

const PerformanceContext = createContext();

export function PerformanceProvider({ children }) {
    const [metrics, setMetrics] = useState({
        fcp: null,  // First Contentful Paint
        lcp: null,  // Largest Contentful Paint
        fid: null,  // First Input Delay
        cls: null,  // Cumulative Layout Shift
        ttfb: null  // Time to First Byte
    });

    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return;

        // Measure Core Web Vitals
        measureWebVitals();

        // Report to analytics (optional)
        reportMetrics();
    }, []);

    function measureWebVitals() {
        // Use Performance Observer API
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                setMetrics(prev => ({ ...prev, lcp: lastEntry.renderTime || lastEntry.loadTime }));
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Cumulative Layout Shift
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        setMetrics(prev => ({ ...prev, cls: clsValue }));
                    }
                }
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }

        // First Contentful Paint & TTFB
        if ('performance' in window && 'getEntriesByType' in performance) {
            const paintEntries = performance.getEntriesByType('paint');
            const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
                setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
            }

            const navigationEntries = performance.getEntriesByType('navigation');
            if (navigationEntries.length > 0) {
                const navEntry = navigationEntries[0];
                setMetrics(prev => ({ ...prev, ttfb: navEntry.responseStart }));
            }
        }
    }

    function reportMetrics() {
        // Send to analytics (Google Analytics, Firebase, etc.)
        // Example: gtag('event', 'web_vitals', { ...metrics });

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            logger.performance('Performance Metrics', 0, metrics);
        }
    }

    function getPerformanceScore() {
        const { fcp, lcp, fid, cls } = metrics;

        if (!fcp || !lcp || !fid || !cls) return null;

        // Scoring based on Google's thresholds
        let score = 100;

        // FCP: Good < 1.8s, Needs Improvement < 3s, Poor >= 3s
        if (fcp > 3000) score -= 25;
        else if (fcp > 1800) score -= 10;

        // LCP: Good < 2.5s, Needs Improvement < 4s, Poor >= 4s
        if (lcp > 4000) score -= 30;
        else if (lcp > 2500) score -= 15;

        // FID: Good < 100ms, Needs Improvement < 300ms, Poor >= 300ms
        if (fid > 300) score -= 20;
        else if (fid > 100) score -= 10;

        // CLS: Good < 0.1, Needs Improvement < 0.25, Poor >= 0.25
        if (cls > 0.25) score -= 25;
        else if (cls > 0.1) score -= 10;

        return Math.max(0, score);
    }

    return (
        <PerformanceContext.Provider value={{ metrics, getPerformanceScore }}>
            {children}
        </PerformanceContext.Provider>
    );
}

export function usePerformance() {
    const context = useContext(PerformanceContext);
    if (!context) {
        throw new Error('usePerformance must be used within PerformanceProvider');
    }
    return context;
}

// Hook to measure component render time
export function useRenderTime(componentName) {
    useEffect(() => {
        const startTime = performance.now();

        return () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;

            if (process.env.NODE_ENV === 'development' && renderTime > 16) {
                console.warn(`⚠️ ${componentName} render took ${renderTime.toFixed(2)}ms (> 16ms)`);
            }
        };
    });
}

export default PerformanceContext;
