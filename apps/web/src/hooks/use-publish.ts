/**
 * Publish React Query Hooks
 *
 * Mutation for publishing sites to staging/production.
 */

import { useMutation } from '@tanstack/react-query';
import { publishSiteRequestSchema, publishSiteResponseSchema } from '@prosektor/contracts';
import { api } from '@/server/api';

export function usePublishSite() {
    return useMutation({
        mutationFn: (data: { site_id: string; environment: 'staging' | 'production' }) => {
            const body = publishSiteRequestSchema.parse(data);
            return api.post('/publish', body, publishSiteResponseSchema);
        },
    });
}
