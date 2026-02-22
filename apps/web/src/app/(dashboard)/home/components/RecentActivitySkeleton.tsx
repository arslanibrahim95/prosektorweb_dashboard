import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentActivitySkeleton() {
  return (
    <Card className="glass border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">
          <Skeleton className="h-6 w-32" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-48" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border/50" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              </div>
              <Skeleton className="h-3 w-12 rounded ml-2 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Skeleton className="h-9 w-full rounded-lg" />
      </CardFooter>
    </Card>
  );
}
