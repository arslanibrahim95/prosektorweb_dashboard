import { Skeleton } from '@/components/ui/skeleton';

export default function ModulesLoading() {
    return (
        <div className="dashboard-main-content page-enter">
            <div className="dashboard-page dashboard-page-narrow">
                {/* Page header skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>

                {/* Module card skeleton */}
                <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-52" />
                        </div>
                        <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                </div>

                {/* Settings card skeleton */}
                <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                    <Skeleton className="h-5 w-36" />
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>

                {/* Save button skeleton */}
                <div className="flex justify-end gap-2">
                    <Skeleton className="h-10 w-44" />
                </div>
            </div>
        </div>
    );
}
