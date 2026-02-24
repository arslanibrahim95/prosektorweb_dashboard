'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { useTranslations } from '@/hooks/use-translation';

export interface ErrorBoundaryProps {
    /** Child components */
    children: React.ReactNode;
    /** Custom fallback UI */
    fallback?: (error: Error, reset: () => void) => React.ReactNode;
    /** Error handler callback */
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            logger.error('Error boundary caught an error', { error, errorInfo });
        }

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
    }

    reset = () => {
        this.setState({ hasError: false, error: null });
    };

    render(): React.ReactNode {
        if (this.state.hasError && this.state.error) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.reset);
            }

            // Default error UI
            return <DefaultErrorFallback error={this.state.error} onReset={this.reset} />;
        }

        return this.props.children;
    }
}

/**
 * Default error fallback UI - separate component to use hooks
 */
function DefaultErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
    const t = useTranslations('error');

    return (
        <div className="p-6 max-w-2xl mx-auto animate-in fade-in duration-300">
            <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-foreground">
                                {t('title')}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {t('description')}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mb-4 p-3 rounded-md bg-muted/50 border border-border">
                            <p className="text-xs font-mono text-destructive break-all">
                                {error.message}
                            </p>
                        </div>
                    )}
                    <Button
                        onClick={onReset}
                        variant="outline"
                        className="border-destructive/20 text-destructive hover:bg-destructive/10"
                    >
                        {t('tryAgain')}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
}
