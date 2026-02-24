'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon;
  iconClassName?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatCard({
  title,
  value,
  description,
  trend,
  trendLabel,
  icon: Icon,
  iconClassName,
  variant = 'default',
}: StatCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card 
      className="glass hover-lift cursor-pointer group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2" 
      role="article" 
      aria-label={`${title}: ${value}`}
      tabIndex={0}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardDescription className="text-sm font-medium">{title}</CardDescription>
            <CardTitle className="text-2xl font-bold mt-1">{value}</CardTitle>
          </div>
          <div className={cn('p-2 rounded-xl transition-transform group-hover:scale-110', variantStyles[variant])}>
            <Icon className={cn('h-5 w-5', iconClassName)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                isPositive && 'text-success',
                isNegative && 'text-destructive',
                !isPositive && !isNegative && 'text-muted-foreground'
              )}
            >
              {isPositive && <TrendingUp className="h-4 w-4" />}
              {isNegative && <TrendingDown className="h-4 w-4" />}
              <span>{isPositive ? '+' : ''}{trend}%</span>
            </div>
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
