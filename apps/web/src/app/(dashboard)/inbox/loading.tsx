import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/layout/states';

export default function InboxLoading() {
    return (
        <div className="dashboard-main-content">
            <div className="dashboard-page stagger-children">
                {/* Page title and filter bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-2 flex-wrap">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-20 rounded-full" />
                    ))}
                </div>

                {/* Table skeleton with 8 rows */}
                <TableSkeleton rows={8} columns={5} />

                {/* Pagination skeleton */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                    </div>
                </div>
            </div>
        </div>
    );
}
