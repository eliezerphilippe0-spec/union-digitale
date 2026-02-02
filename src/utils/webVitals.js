/**
 * Simplified Web Vitals Monitoring (without external dependency)
 * Tracks basic performance metrics
 */

// Performance observer for tracking metrics
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = [];
    }

    // Track Largest Contentful Paint (LCP)
    trackLCP() {
        if (!('PerformanceObserver' in window)) return;

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];

                this.metrics.LCP = {
                    value: lastEntry.renderTime || lastEntry.loadTime,
                    rating: this.getRating(lastEntry.renderTime || lastEntry.loadTime, 2500),
                    timestamp: Date.now(),
                };

                this.logMetric('LCP', this.metrics.LCP);
            });

            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(observer);
        } catch (error) {
            console.warn('LCP tracking not supported');
        }
    }

    // Track First Input Delay (FID)
    trackFID() {
        if (!('PerformanceObserver' in window)) return;

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    this.metrics.FID = {
                        value: entry.processingStart - entry.startTime,
                        rating: this.getRating(entry.processingStart - entry.startTime, 100),
                        timestamp: Date.now(),
                    };

                    this.logMetric('FID', this.metrics.FID);
                });
            });

            observer.observe({ entryTypes: ['first-input'] });
            this.observers.push(observer);
        } catch (error) {
            console.warn('FID tracking not supported');
        }
    }

    // Track Cumulative Layout Shift (CLS)
    trackCLS() {
        if (!('PerformanceObserver' in window)) return;

        try {
            let clsValue = 0;
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });

                this.metrics.CLS = {
                    value: clsValue,
                    rating: this.getRating(clsValue, 0.1),
                    timestamp: Date.now(),
                };

                this.logMetric('CLS', this.metrics.CLS);
            });

            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(observer);
        } catch (error) {
            console.warn('CLS tracking not supported');
        }
    }

    // Track Time to First Byte (TTFB)
    trackTTFB() {
        if (!window.performance || !window.performance.timing) return;

        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
            const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;

            this.metrics.TTFB = {
                value: ttfb,
                rating: this.getRating(ttfb, 600),
                timestamp: Date.now(),
            };

            this.logMetric('TTFB', this.metrics.TTFB);
        }
    }

    // Get rating based on threshold
    getRating(value, threshold) {
        if (value <= threshold) return 'good';
        if (value <= threshold * 1.5) return 'needs-improvement';
        return 'poor';
    }

    // Log metric
    logMetric(name, metric) {
        if (process.env.NODE_ENV === 'development') {
            const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
            console.log(`${emoji} [Web Vitals] ${name}:`, {
                value: Math.round(metric.value),
                rating: metric.rating,
            });
        }

        // Send to analytics
        if (window.gtag) {
            window.gtag('event', name, {
                event_category: 'Web Vitals',
                value: Math.round(metric.value),
                metric_rating: metric.rating,
            });
        }
    }

    // Initialize all tracking
    init() {
        this.trackLCP();
        this.trackFID();
        this.trackCLS();
        this.trackTTFB();
    }

    // Get all metrics
    getMetrics() {
        return this.metrics;
    }

    // Cleanup observers
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Initialize monitoring
export const initWebVitals = () => {
    if (typeof window !== 'undefined') {
        performanceMonitor.init();
    }
};

// Get current metrics
export const getWebVitals = () => {
    return performanceMonitor.getMetrics();
};

// Custom performance tracking
export const trackCustomMetric = (name, value, unit = 'ms') => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Custom Metric] ${name}: ${value}${unit}`);
    }

    if (window.gtag) {
        window.gtag('event', 'custom_metric', {
            event_category: 'Performance',
            event_label: name,
            value: Math.round(value),
        });
    }
};

export default initWebVitals;
