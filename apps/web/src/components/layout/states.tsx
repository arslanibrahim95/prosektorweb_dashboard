import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ========================================
 * Empty State
 * ======================================== */
interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    action?:
        | {
            label: string;
            href: string;
            onClick?: never;
        }
        | {
            label: string;
            onClick: () => void;
            href?: never;
        };
    secondaryAction?:
        | {
            label: string;
            href: string;
            onClick?: never;
        }
        | {
            label: string;
            onClick: () => void;
            href?: never;
        };
    illustration?: ReactNode;
}

export function EmptyState({ icon, title, description, action, secondaryAction, illustration }: EmptyStateProps) {
    return (
        <div className="flex min-h-[300px] flex-col items-center justify-center text-center px-4 py-12 rounded-xl border-2 border-dashed border-border/50 bg-muted/30">
            {illustration ?? (
                <div className="h-[var(--topbar-height)] w-[var(--topbar-height)] rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    {icon}
                </div>
            )}
            <h3 className="font-semibold text-lg text-foreground">{title}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">{description}</p>
            <div className="flex items-center gap-3 mt-6">
                {action?.href ? (
                    <Button
                        asChild
                        className="gradient-primary border-0 text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                    >
                        <Link href={action.href}>{action.label}</Link>
                    </Button>
                ) : action?.onClick ? (
                    <Button
                        onClick={action.onClick}
                        className="gradient-primary border-0 text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                    >
                        {action.label}
                    </Button>
                ) : null}
                {secondaryAction?.href ? (
                    <Button variant="outline" asChild>
                        <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                    </Button>
                ) : secondaryAction?.onClick ? (
                    <Button variant="outline" onClick={secondaryAction.onClick}>
                        {secondaryAction.label}
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

/* ========================================
 * Loading State
 * ======================================== */
interface LoadingStateProps {
    message?: string;
    icon?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ message = 'Yükleniyor...', icon, size = 'md' }: LoadingStateProps) {
    const sizeClasses = {
        sm: 'min-h-[150px]',
        md: 'min-h-[300px]',
        lg: 'min-h-[400px]',
    };
    const spinnerSizes = {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
    };
    return (
        <div className={cn('flex flex-col items-center justify-center text-center', sizeClasses[size])}>
            <div className="relative">
                {icon ?? (
                    <div className={cn('rounded-full border-4 border-muted', spinnerSizes[size])}>
                        <Loader2 className={cn('text-primary animate-spin absolute -inset-[4px]', spinnerSizes[size])} />
                    </div>
                )}
            </div>
            <p className="text-muted-foreground mt-4 font-medium text-sm">{message}</p>
        </div>
    );
}

/* ========================================
 * Error State
 * ======================================== */
interface ErrorStateProps {
    title?: string;
    message?: string;
    retry?: () => void;
    icon?: ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function ErrorState({
    title = 'Bir hata oluştu',
    message = 'Lütfen daha sonra tekrar deneyin',
    retry,
    icon,
    action,
}: ErrorStateProps) {
    return (
        <div className="flex min-h-[300px] flex-col items-center justify-center text-center px-4 py-12 rounded-xl border-2 border-destructive/20 bg-destructive/5">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                {icon ?? <AlertTriangle className="h-6 w-6 text-destructive" />}
            </div>
            <h3 className="font-semibold text-lg text-foreground">{title}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">{message}</p>
            <div className="flex items-center gap-3 mt-6">
                {retry && (
                    <Button variant="outline" onClick={retry} className="border-destructive/20 text-destructive hover:bg-destructive/10">
                        Tekrar Dene
                    </Button>
                )}
                {action && (
                    <Button variant="outline" onClick={action.onClick}>
                        {action.label}
                    </Button>
                )}
            </div>
        </div>
    );
}

/* ========================================
 * Table Skeleton
 * ======================================== */
interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
    return (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            {/* Header */}
	            <div className="flex items-center gap-4 p-4 border-b border-border/50">
	                {Array.from({ length: columns }).map((_, i) => (
	                    <div
	                        key={`h-${i}`}
	                        className="h-4 bg-muted rounded-md shimmer-skeleton"
	                        // Deterministic widths to keep render pure.
	                        style={{ width: `${60 + ((i * 13) % 40)}px` }}
	                    />
	                ))}
	            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={`r-${rowIndex}`}
                    className="flex items-center gap-4 p-4 border-b border-border/50 last:border-0"
                    style={{ animationDelay: `${rowIndex * 80}ms` }}
                >
	                    {Array.from({ length: columns }).map((_, colIndex) => (
	                        <div
	                            key={`c-${colIndex}`}
	                            className="h-4 bg-muted rounded-md animate-pulse"
	                            style={{
	                                // Deterministic widths to keep render pure.
	                                width: `${40 + (((rowIndex + 1) * (colIndex + 1) * 17) % 80)}px`,
	                                animationDelay: `${colIndex * 100}ms`,
	                            }}
	                        />
	                    ))}
	                </div>
            ))}
        </div>
    );
}

// Export DataTable component
export { DataTable, type ColumnDef } from '@/components/ui/data-table'
