import { useState, useCallback } from 'react';
import errorLogger, { ErrorCategory, getUserFriendlyMessage } from '../utils/errorLogger';
import { useToast } from '../components/ui/Toast';

/**
 * Hook for handling async errors with user feedback
 */

export const useErrorHandler = () => {
    const { showToast } = useToast();
    const [error, setError] = useState(null);
    const [isError, setIsError] = useState(false);

    const handleError = useCallback((err, category = ErrorCategory.UNKNOWN, showToUser = true) => {
        // Log error
        errorLogger.log(err, { category });

        // Update state
        setError(err);
        setIsError(true);

        // Show user-friendly message
        if (showToUser) {
            const message = getUserFriendlyMessage(err, category);
            showToast(message, 'error');
        }

        return err;
    }, [showToast]);

    const clearError = useCallback(() => {
        setError(null);
        setIsError(false);
    }, []);

    // Wrapper for async operations
    const executeAsync = useCallback(async (
        operation,
        category = ErrorCategory.UNKNOWN,
        showToUser = true
    ) => {
        clearError();

        try {
            const result = await operation();
            return { data: result, error: null };
        } catch (err) {
            const error = handleError(err, category, showToUser);
            return { data: null, error };
        }
    }, [handleError, clearError]);

    return {
        error,
        isError,
        handleError,
        clearError,
        executeAsync,
    };
};

export default useErrorHandler;
