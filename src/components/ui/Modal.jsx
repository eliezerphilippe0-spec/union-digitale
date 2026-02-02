import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createFocusTrap, isEscapeKey, generateId } from '../../utils/accessibility';

/**
 * Professional Modal Component
 * Accessible, animated, with backdrop
 */

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEsc = true,
    footer,
    className = '',
    ariaLabel,
    ariaDescribedBy,
}) => {
    const modalRef = useRef(null);
    const titleId = useRef(generateId('modal-title')).current;
    const descId = useRef(generateId('modal-desc')).current;

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (isEscapeKey(e)) {
                e.preventDefault();
                onClose();
            }
        };

        if (isOpen && closeOnEsc) {
            window.addEventListener('keydown', handleEsc);
        }

        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, closeOnEsc, onClose]);

    // Prevent body scroll and setup focus trap when modal is open
    useEffect(() => {
        if (isOpen) {
            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Setup focus trap
            const cleanupFocusTrap = modalRef.current ? createFocusTrap(modalRef.current) : null;

            return () => {
                document.body.style.overflow = 'unset';
                cleanupFocusTrap?.();
            };
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        base: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-7xl'
    };

    return (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
                onClick={closeOnBackdrop ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className={`
          relative
          w-full ${sizes[size]}
          bg-white
          rounded-2xl
          shadow-2xl
          animate-slideUp
          ${className}
        `}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                        {title && (
                            <h2
                                id="modal-title"
                                className="text-xl font-bold text-primary-900"
                            >
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="
                  p-2
                  text-neutral-400
                  hover:text-neutral-600
                  hover:bg-neutral-100
                  rounded-lg
                  transition-colors
                "
                                aria-label="Fermer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
