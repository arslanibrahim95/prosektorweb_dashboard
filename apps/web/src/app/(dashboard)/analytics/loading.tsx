import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsLoading() {
    return (
        <div className="dashboard-main-content">
            <div className="dashboard-page stagger-children">
                {/* Page header with period selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-48" />
                </div>

                {/* Stat cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-border/50 bg-card p-6 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                            <Skeleton className="h-9 w-24" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Large chart area */}
                <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-9 w-32" />
                    </div>
                    <Skeleton className="h-80 w-full rounded-lg" />
                </div>

                {/* Timeline chart */}
                <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>

                {/* Additional metrics grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-border/50 bg-card p-6 space-y-4"
                        >
                            <Skeleton className="h-6 w-36" />
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
