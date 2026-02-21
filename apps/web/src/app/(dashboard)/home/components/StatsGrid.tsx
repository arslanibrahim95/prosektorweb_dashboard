import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardAction } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { TrendingUp, FileText, Briefcase, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stat {
    label: string;
    value: string;
    icon: React.ElementType;
    gradient: string;
    iconGradient: string;
    href: string;
    borderColor: string;
}

interface StatsGridProps {
    offerTotal: number;
    contactTotal: number;
    applicationTotal: number;
    isLoading: boolean;
}

export function StatsGrid({ offerTotal, contactTotal, applicationTotal, isLoading }: StatsGridProps) {
    const stats: Stat[] = [
        {
            label: 'Teklif Talepleri',
            value: String(offerTotal),
            icon: TrendingUp,
            gradient: 'gradient-primary',
            iconGradient: 'gradient-primary',
            href: '/inbox/offers',
            borderColor: 'border-l-primary',
        },
        {
            label: 'İletişim Mesajları',
            value: String(contactTotal),
            icon: FileText,
            gradient: 'gradient-success',
            iconGradient: 'gradient-success',
            href: '/inbox/contact',
            borderColor: 'border-l-success',
        },
        {
            label: 'İş Başvuruları',
            value: String(applicationTotal),
            icon: Briefcase,
            gradient: 'gradient-accent',
            iconGradient: 'gradient-accent',
            href: '/inbox/applications',
            borderColor: 'border-l-warning',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isLoading ? (
                Array.from({ length: stats.length }).map((_, index) => (
                    <Card
                        key={`stat-skeleton-${index}`}
                        className="glass relative overflow-hidden border-border/50 shadow-sm"
                    >
                        <CardHeader className="relative z-10 pb-0">
                            <CardDescription>
                                <Skeleton className="h-4 w-28" />
                            </CardDescription>
                            <CardTitle className="text-3xl tracking-tight">
                                <Skeleton className="h-8 w-16" />
                            </CardTitle>
                            <CardAction>
                                <Skeleton className="h-12 w-12 rounded-xl" />
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="relative z-10 pt-0">
                            <Skeleton className="h-4 w-20" />
                        </CardFooter>
                    </Card>
                ))
            ) : (
                stats.map((stat) => (
                    <Card
                        key={stat.label}
                        className={cn(
                            "glass relative overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] group border-l-4",
                            stat.borderColor
                        )}
                    >
                        <div
                            className={cn(
                                'pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10',
                                stat.gradient,
                            )}
                        />
                        <CardHeader className="relative z-10 pb-0">
                            <CardDescription>{stat.label}</CardDescription>
                            <CardTitle className="text-3xl tracking-tight">
                                <AnimatedNumber value={Number(stat.value)} />
                            </CardTitle>
                            <CardAction>
                                <div
                                    className={cn(
                                        'h-12 w-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110',
                                        stat.iconGradient,
                                    )}
                                >
                                    <stat.icon className="h-5 w-5 text-success-foreground" />
                                </div>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="relative z-10 pt-0">
                            <Link href={stat.href} className="inline-flex items-center gap-1 text-sm font-medium text-success hover:underline">
                                <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                                Görüntüle
                            </Link>
                        </CardFooter>
                    </Card>
                ))
            )}
        </div>
    );
}
