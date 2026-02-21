import { Suspense } from 'react';
import { StatsGrid } from './StatsGrid';

interface StatsGridSectionProps {
  offerTotal: number;
  contactTotal: number;
  applicationTotal: number;
  isLoading: boolean;
}

export function StatsGridSection({
  offerTotal,
  contactTotal,
  applicationTotal,
  isLoading,
}: StatsGridSectionProps) {
  return (
    <Suspense fallback={null}>
      <StatsGrid
        offerTotal={offerTotal}
        contactTotal={contactTotal}
        applicationTotal={applicationTotal}
        isLoading={isLoading}
      />
    </Suspense>
  );
}
