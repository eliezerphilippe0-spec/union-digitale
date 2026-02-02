import React, { Component } from 'react';
import errorLogger from '../utils/errorLogger';
import ErrorFallback from './ErrorFallback';

/**
 * Enhanced Error Boundary
 * Catches React errors and displays premium fallback UI
 */

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error with component stack
        errorLogger.log(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: this.props.name || 'Root',
        });

        // Update state with error details
        this.setState({
            error,
            errorInfo,
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    resetErrorBoundary = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });

        // Call custom reset handler if provided
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided, otherwise use default
            if (this.props.fallback) {
                return this.props.fallback({
                    error: this.state.error,
                    resetErrorBoundary: this.resetErrorBoundary,
                    componentStack: this.state.errorInfo?.componentStack,
                });
            }

            return (
                <ErrorFallback
                    error={this.state.error}
                    resetErrorBoundary={this.resetErrorBoundary}
                    componentStack={this.state.errorInfo?.componentStack}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
