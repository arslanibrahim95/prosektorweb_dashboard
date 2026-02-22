import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
    return (
        <div className="dashboard-main-content">
            <div className="dashboard-page stagger-children">
                {/* Greeting skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                </div>

                {/* Stat cards grid - 4 columns on desktop, 2x2 on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-border/50 bg-card p-6 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                            <Skeleton className="h-9 w-20" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    ))}
                </div>

                {/* Quick actions skeleton */}
                <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="flex flex-wrap gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-40" />
                        ))}
                    </div>
                </div>

                {/* Activity feed skeleton */}
                <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
