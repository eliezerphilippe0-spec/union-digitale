import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Toast Notification System
 * Inspired by: Stripe, Vercel, Shadcn/ui
 */

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

const Toast = ({ id, type, message, action, onClose, duration }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-orange-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-orange-50 border-orange-200',
        info: 'bg-blue-50 border-blue-200',
    };

    React.useEffect(() => {
        if (duration && duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, id, onClose]);

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${bgColors[type]} animate-slideInRight`}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900">{message}</p>

                {action && (
                    <button
                        onClick={action.onClick}
                        className="mt-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        {action.label}
                    </button>
                )}
            </div>

            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Close notification"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((toast) => {
        const id = Date.now() + Math.random();
        const newToast = {
            id,
            type: toast.type || 'info',
            message: toast.message,
            action: toast.action,
            duration: toast.duration !== undefined ? toast.duration : 5000, // 5s default
        };

        setToasts((prev) => [...prev, newToast]);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const toast = {
        success: (message, options = {}) =>
            addToast({ type: 'success', message, ...options }),
        error: (message, options = {}) =>
            addToast({ type: 'error', message, ...options }),
        warning: (message, options = {}) =>
            addToast({ type: 'warning', message, ...options }),
        info: (message, options = {}) =>
            addToast({ type: 'info', message, ...options }),
        custom: (options) => addToast(options),
        dismiss: removeToast,
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Toast Container */}
            <div
                className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none"
                aria-live="polite"
                aria-atomic="true"
            >
                {toasts.map((t) => (
                    <div key={t.id} className="pointer-events-auto">
                        <Toast {...t} onClose={removeToast} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// Animation keyframes (add to global CSS)
const toastStyles = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.animate-slideInRight {
    animation: slideInRight 0.3s ease-out;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = toastStyles;
    document.head.appendChild(styleSheet);
}

export default ToastProvider;
