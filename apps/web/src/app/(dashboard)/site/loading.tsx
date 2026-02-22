import { Skeleton } from '@/components/ui/skeleton';

export default function SiteLoading() {
    return (
        <div className="dashboard-main-content page-enter">
            <div className="dashboard-page">
                {/* Page header skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-4 w-60" />
                </div>

                {/* Status card skeleton */}
                <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </div>

                {/* Content cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                            <Skeleton className="h-5 w-32" />
                            <div className="space-y-3">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                            <div className="flex justify-end">
                                <Skeleton className="h-9 w-28" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
