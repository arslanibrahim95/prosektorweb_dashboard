import { Suspense } from 'react';
import { ChecklistCard } from './ChecklistCard';
import { ChecklistCardSkeleton } from './ChecklistCardSkeleton';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  href: string;
}

interface ChecklistCardSectionProps {
  checklist: ChecklistItem[];
  isAllComplete: boolean;
  completionPercent: number;
  completedCount: number;
}

export function ChecklistCardSection({
  checklist,
  isAllComplete,
  completionPercent,
  completedCount,
}: ChecklistCardSectionProps) {
  return (
    <Suspense fallback={<ChecklistCardSkeleton />}>
      <ChecklistCard
        checklist={checklist}
        isAllComplete={isAllComplete}
        completionPercent={completionPercent}
        completedCount={completedCount}
      />
    </Suspense>
  );
}
