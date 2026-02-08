'use client';

import { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

/**
 * EmptyState - No data placeholder per agents.md UI pattern
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex min-h-[300px] flex-col items-center justify-center text-center px-4 py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            {icon && (
                <div className="mb-4 text-gray-400">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
            </h3>
            <p className="text-sm text-gray-600 max-w-sm mb-6">
                {description}
            </p>
            {action && (
                <Button onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}

/**
 * LoadingState - Skeleton loading placeholder
 */
export function LoadingState({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[60%]" />
                        <Skeleton className="h-4 w-[40%]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * ErrorState - Error display with retry
 */
export function ErrorState({
    message = 'Bir hata oluştu',
    onRetry
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <div className="flex min-h-[200px] flex-col items-center justify-center text-center px-4">
            <div className="rounded-full bg-red-100 p-4 mb-4">
                <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </div>
            <p className="text-gray-600 mb-4">{message}</p>
            {onRetry && (
                <Button variant="outline" onClick={onRetry}>
                    Tekrar Dene
                </Button>
            )}
        </div>
    );
}

/**
 * TableSkeleton - Loading state for DataTable
 */
export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex gap-4 pb-4 border-b">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 py-4 border-b">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}
