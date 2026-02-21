import { Suspense } from 'react';
import { SiteHealthCard } from './SiteHealthCard';
import { SiteHealthCardSkeleton } from './SiteHealthCardSkeleton';

interface SiteHealthCardSectionProps {
  currentSiteStatus?: string;
  primaryDomainStatus?: { ssl_status: string } | null;
  activeJobPostsCount: number;
  isLoading: boolean;
  onRefetch?: () => void;
  dataUpdatedAt?: number;
}

export function SiteHealthCardSection({
  currentSiteStatus,
  primaryDomainStatus,
  activeJobPostsCount,
  isLoading,
  onRefetch,
  dataUpdatedAt,
}: SiteHealthCardSectionProps) {
  return (
    <Suspense fallback={<SiteHealthCardSkeleton />}>
      <SiteHealthCard
        currentSiteStatus={currentSiteStatus}
        primaryDomainStatus={primaryDomainStatus}
        activeJobPostsCount={activeJobPostsCount}
        isLoading={isLoading}
        onRefetch={onRefetch}
        dataUpdatedAt={dataUpdatedAt}
      />
    </Suspense>
  );
}
