import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminEmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: ReactNode;
    };
    className?: string;
}

/**
 * AdminEmptyState - Empty state component for admin pages
 * 
 * Displays a centered message with optional icon and action button.
 */
export function AdminEmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: AdminEmptyStateProps) {
    return (
        <div
            className={cn(
                'flex min-h-[400px] flex-col items-center justify-center text-center px-4',
                className
            )}
        >
            {Icon && (
                <div className="mb-4 rounded-full bg-muted p-6">
                    <Icon className="h-12 w-12 text-muted-foreground" />
                </div>
            )}
            <h3 className="text-xl font-semibold text-foreground mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                    {description}
                </p>
            )}
            {action && (
                <Button onClick={action.onClick}>
                    {action.icon}
                    {action.label}
                </Button>
            )}
        </div>
    );
}
