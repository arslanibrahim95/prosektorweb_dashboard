import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

/**
 * AdminPageHeader - Reusable page header for admin pages
 * 
 * Provides consistent layout for page titles, descriptions, and action buttons.
 */
export function AdminPageHeader({
    title,
    description,
    actions,
    className,
}: AdminPageHeaderProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between',
                className
            )}
        >
            <div className="border-l-2 border-primary/60 pl-3">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-foreground">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
