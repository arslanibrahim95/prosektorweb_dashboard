/**
 * Analytics React Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import {
    analyticsOverviewResponseSchema,
    analyticsTimelineResponseSchema,
    type AnalyticsPeriod,
} from '@prosektor/contracts';
import { api } from '@/server/api';

export const analyticsKeys = {
    overview: (siteId: string, period: AnalyticsPeriod) =>
        ['analytics', 'overview', siteId, period] as const,
    timeline: (siteId: string, period: AnalyticsPeriod) =>
        ['analytics', 'timeline', siteId, period] as const,
};

export function useAnalyticsOverview(siteId: string | null, period: AnalyticsPeriod) {
    return useQuery({
        queryKey: analyticsKeys.overview(siteId ?? '', period),
        queryFn: () =>
            api.get(
                '/analytics/overview',
                { site_id: siteId, period },
                analyticsOverviewResponseSchema,
            ),
        enabled: !!siteId,
    });
}

export function useAnalyticsTimeline(siteId: string | null, period: AnalyticsPeriod) {
    return useQuery({
        queryKey: analyticsKeys.timeline(siteId ?? '', period),
        queryFn: () =>
            api.get(
                '/analytics/timeline',
                { site_id: siteId, period },
                analyticsTimelineResponseSchema,
            ),
        enabled: !!siteId,
    });
}
