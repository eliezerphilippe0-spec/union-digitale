import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './ui/Button';

/**
 * Premium Error Fallback UI
 * Displayed when an error boundary catches an error
 */

const ErrorFallback = ({ error, resetErrorBoundary, componentStack }) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Error Card */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-8 md:p-12 border border-neutral-200 dark:border-neutral-700">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-center text-neutral-900 dark:text-white mb-4">
                        Oups ! Une erreur est survenue
                    </h1>

                    {/* Description */}
                    <p className="text-center text-neutral-600 dark:text-neutral-300 mb-8 text-lg">
                        Nous sommes désolés pour ce désagrément. Notre équipe a été notifiée et travaille sur une solution.
                    </p>

                    {/* Error Details (Development only) */}
                    {isDevelopment && error && (
                        <div className="mb-8 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-700">
                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="text-red-600 dark:text-red-400">⚠️</span>
                                Détails de l'erreur (mode développement)
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-400 font-mono mb-2">
                                {error.message}
                            </p>
                            {error.stack && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                                        Voir la stack trace
                                    </summary>
                                    <pre className="mt-2 text-xs text-neutral-700 dark:text-neutral-300 overflow-auto max-h-64 p-2 bg-white dark:bg-neutral-950 rounded">
                                        {error.stack}
                                    </pre>
                                </details>
                            )}
                            {componentStack && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                                        Voir le component stack
                                    </summary>
                                    <pre className="mt-2 text-xs text-neutral-700 dark:text-neutral-300 overflow-auto max-h-64 p-2 bg-white dark:bg-neutral-950 rounded">
                                        {componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            variant="primary"
                            size="lg"
                            icon={RefreshCw}
                            onClick={resetErrorBoundary}
                            className="shadow-lg"
                        >
                            Réessayer
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            icon={Home}
                            onClick={() => window.location.href = '/'}
                            className="shadow-lg"
                        >
                            Retour à l'accueil
                        </Button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                            Si le problème persiste, contactez notre{' '}
                            <a
                                href="/customer-service"
                                className="text-gold-600 dark:text-gold-400 hover:underline font-medium"
                            >
                                service client
                            </a>
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Code d'erreur : {error?.code || 'UNKNOWN'} • {new Date().toLocaleTimeString('fr-FR')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ErrorFallback;
