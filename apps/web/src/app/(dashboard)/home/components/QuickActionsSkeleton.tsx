import { Skeleton } from '@/components/ui/skeleton';

export function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 rounded-xl border border-border/50 bg-card p-3"
        >
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}
