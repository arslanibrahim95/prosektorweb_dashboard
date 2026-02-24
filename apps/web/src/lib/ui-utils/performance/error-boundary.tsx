"use client";

import * as React from "react";
import { logger } from "@/lib/logger";

interface PerformanceErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface PerformanceErrorBoundaryState {
    hasError: boolean;
}

class PerformanceErrorBoundary extends React.Component<
    PerformanceErrorBoundaryProps,
    PerformanceErrorBoundaryState
> {
    constructor(props: PerformanceErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): PerformanceErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        logger.warn("Performance monitoring error", { error, errorInfo });
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return this.props.fallback || null;
        }
        return this.props.children;
    }
}

export { PerformanceErrorBoundary };
