import { Suspense } from 'react';
import { QuickActions } from './QuickActions';
import { QuickActionsSkeleton } from './QuickActionsSkeleton';

export function QuickActionsSection() {
  return (
    <Suspense fallback={<QuickActionsSkeleton />}>
      <QuickActions />
    </Suspense>
  );
}
