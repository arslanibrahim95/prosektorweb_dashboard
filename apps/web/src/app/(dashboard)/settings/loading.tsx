import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
    return (
        <div className="dashboard-main-content page-enter">
            <div className="dashboard-page">
                {/* Page header skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-56" />
                </div>

                {/* Settings tabs skeleton */}
                <div className="flex gap-2 border-b border-border/50 pb-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-24 rounded-lg" />
                    ))}
                </div>

                {/* Settings content skeleton */}
                <div className="rounded-xl border border-border/50 bg-card p-6 space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    ))}
                    <div className="flex justify-end pt-2">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
        </div>
    );
}
