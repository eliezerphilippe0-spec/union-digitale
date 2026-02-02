/**
 * Accessibility Utilities
 * Helper functions for ARIA labels, keyboard navigation, and focus management
 */

// Generate unique IDs for ARIA relationships
let idCounter = 0;
export const generateId = (prefix = 'a11y') => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
};

// Announce message to screen readers
export const announceToScreenReader = (message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
};

// Focus management
export const focusElement = (element, options = {}) => {
    if (!element) return;

    const { preventScroll = false, delay = 0 } = options;

    setTimeout(() => {
        element.focus({ preventScroll });
    }, delay);
};

// Get all focusable elements within a container
export const getFocusableElements = (container) => {
    if (!container) return [];

    const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
};

// Focus trap for modals
export const createFocusTrap = (container) => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
};

// Keyboard event helpers
export const isEnterKey = (event) => event.key === 'Enter';
export const isSpaceKey = (event) => event.key === ' ' || event.key === 'Spacebar';
export const isEscapeKey = (event) => event.key === 'Escape' || event.key === 'Esc';
export const isArrowKey = (event) => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);

// Make div behave like button (for custom components)
export const makeButtonAccessible = (onClick) => ({
    role: 'button',
    tabIndex: 0,
    onKeyDown: (e) => {
        if (isEnterKey(e) || isSpaceKey(e)) {
            e.preventDefault();
            onClick(e);
        }
    },
    onClick,
});

// ARIA label helpers
export const getAriaLabel = (label, context = '') => {
    return context ? `${label} - ${context}` : label;
};

// Check if element is visible
export const isElementVisible = (element) => {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0';
};

// Restore focus after action
export const withFocusRestore = (callback) => {
    const activeElement = document.activeElement;

    return async (...args) => {
        const result = await callback(...args);

        if (activeElement && isElementVisible(activeElement)) {
            activeElement.focus();
        }

        return result;
    };
};

// Debounce for screen reader announcements
let announcementTimeout;
export const debouncedAnnounce = (message, delay = 300) => {
    clearTimeout(announcementTimeout);
    announcementTimeout = setTimeout(() => {
        announceToScreenReader(message);
    }, delay);
};

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check if high contrast mode is enabled
export const prefersHighContrast = () => {
    return window.matchMedia('(prefers-contrast: high)').matches;
};

// Validate ARIA attributes
export const validateAriaAttributes = (element) => {
    const warnings = [];

    // Check for aria-label or aria-labelledby
    if (element.hasAttribute('role') && !element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
        warnings.push(`Element with role="${element.getAttribute('role')}" should have aria-label or aria-labelledby`);
    }

    // Check for aria-describedby reference
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy && !document.getElementById(describedBy)) {
        warnings.push(`aria-describedby references non-existent ID: ${describedBy}`);
    }

    return warnings;
};

export default {
    generateId,
    announceToScreenReader,
    focusElement,
    getFocusableElements,
    createFocusTrap,
    isEnterKey,
    isSpaceKey,
    isEscapeKey,
    isArrowKey,
    makeButtonAccessible,
    getAriaLabel,
    isElementVisible,
    withFocusRestore,
    debouncedAnnounce,
    prefersReducedMotion,
    prefersHighContrast,
    validateAriaAttributes,
};
