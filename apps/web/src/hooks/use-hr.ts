/**
 * HR React Query Hooks
 *
 * Standardized data fetching for HR screens (Job Posts, Applications CV).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    listJobPostsResponseSchema,
} from '@prosektor/contracts';
import { api } from '@/server/api';
import type { QueryParams } from '@prosektorweb/shared';

// === Query Keys ===
export const hrKeys = {
    jobPosts: (siteId: string) => ['hr', 'jobPosts', siteId] as const,
    jobPost: (id: string) => ['hr', 'jobPost', id] as const,
};

// === Job Posts List ===
export function useJobPosts(siteId: string | null) {
    return useQuery({
        queryKey: hrKeys.jobPosts(siteId ?? ''),
        queryFn: () =>
            api.get(
                '/hr/job-posts',
                { site_id: siteId, include_deleted: false } as QueryParams,
                listJobPostsResponseSchema,
            ),
        enabled: !!siteId,
    });
}

// === Create Job Post ===
export function useCreateJobPost(siteId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            title: string;
            slug: string;
            location?: string;
            employment_type?: string;
            description?: string;
            requirements?: string;
            is_active: boolean;
            site_id: string;
        }) => api.post('/hr/job-posts', data),
        onSuccess: () => {
            if (siteId) {
                void queryClient.invalidateQueries({ queryKey: hrKeys.jobPosts(siteId) });
            }
        },
    });
}

// === Update Job Post ===
export function useUpdateJobPost(siteId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            ...data
        }: {
            id: string;
            title?: string;
            slug?: string;
            location?: string;
            employment_type?: string;
            description?: string;
            requirements?: string;
            is_active?: boolean;
        }) => api.patch(`/hr/job-posts/${id}`, data),
        onSuccess: () => {
            if (siteId) {
                void queryClient.invalidateQueries({ queryKey: hrKeys.jobPosts(siteId) });
            }
        },
    });
}

// === Delete Job Post ===
export function useDeleteJobPost(siteId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/hr/job-posts/${id}`),
        onSuccess: () => {
            if (siteId) {
                void queryClient.invalidateQueries({ queryKey: hrKeys.jobPosts(siteId) });
            }
        },
    });
}
