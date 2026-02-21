import { Suspense } from 'react';
import { RecentActivity } from './RecentActivity';
import { RecentActivitySkeleton } from './RecentActivitySkeleton';
import type { ActivityItem } from './RecentActivity';

interface RecentActivitySectionProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export function RecentActivitySection({ activities, isLoading }: RecentActivitySectionProps) {
  return (
    <Suspense fallback={<RecentActivitySkeleton />}>
      <RecentActivity activities={activities} isLoading={isLoading} />
    </Suspense>
  );
}
