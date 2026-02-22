/**
 * Dashboard React Query Hooks
 *
 * Aggregated data hooks for the home/dashboard page.
 */

import { useQuery } from '@tanstack/react-query';
import {
    dashboardSummaryResponseSchema,
} from '@prosektor/contracts';
import { api } from '@/server/api';

// === Query Keys ===
export const dashboardKeys = {
    stats: (siteId: string) => ['dashboard', 'stats', siteId] as const,
};

// === Dashboard Stats ===
export function useDashboardStats(siteId: string | null) {
    return useQuery({
        queryKey: dashboardKeys.stats(siteId ?? ''),
        queryFn: () =>
            api.get(
                '/dashboard/summary',
                { site_id: siteId ?? undefined },
                dashboardSummaryResponseSchema,
            ),
        enabled: !!siteId,
        staleTime: 60 * 1000, // 1 minute for dashboard aggregates
    });
}
