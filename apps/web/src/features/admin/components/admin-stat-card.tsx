import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';

interface AdminStatCardProps {
    title: string;
    value: number | string;
    change?: number;
    changeType?: 'increase' | 'decrease' | 'neutral';
    icon?: ReactNode;
    description?: string;
    className?: string;
    valuePrefix?: string;
    valueSuffix?: string;
    animateValue?: boolean;
}

/**
 * AdminStatCard - Stat card for dashboard widgets
 * 
 * Displays a metric with optional change indicator and icon.
 */
export function AdminStatCard({
    title,
    value,
    change,
    changeType = 'neutral',
    icon,
    description,
    className,
    valuePrefix = '',
    valueSuffix = '',
    animateValue = true,
}: AdminStatCardProps) {
    const isNumericValue = typeof value === 'number';

    const changeColor = {
        increase: 'text-green-600 dark:text-green-400',
        decrease: 'text-red-600 dark:text-red-400',
        neutral: 'text-muted-foreground',
    }[changeType];

    const ChangeIcon = {
        increase: TrendingUp,
        decrease: TrendingDown,
        neutral: Minus,
    }[changeType];

    return (
        <Card className={cn('glass', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon && (
                    <div className="text-muted-foreground">
                        {icon}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    <div className="text-2xl font-bold text-foreground">
                        {valuePrefix}
                        {isNumericValue && animateValue ? (
                            <AnimatedNumber value={value} />
                        ) : (
                            value
                        )}
                        {valueSuffix}
                    </div>
                    {(change !== undefined || description) && (
                        <div className="flex items-center gap-2 text-xs">
                            {change !== undefined && (
                                <span className={cn('flex items-center gap-1 font-medium', changeColor)}>
                                    <ChangeIcon className="h-3 w-3" />
                                    {Math.abs(change)}%
                                </span>
                            )}
                            {description && (
                                <span className="text-muted-foreground">
                                    {description}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
