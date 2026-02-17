/**
 * Admin Platform (Super Admin) Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    platformAnalyticsResponseSchema,
    platformListTenantsResponseSchema,
    platformSettingsResponseSchema,
    platformTenantSummarySchema,
} from '@prosektor/contracts';
import { api } from '@/server/api';
import { adminKeys } from './keys';

export function usePlatformTenants(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
}) {
    return useQuery({
        queryKey: adminKeys.platformTenants(params),
        queryFn: () => api.get('/admin/platform/tenants', params, platformListTenantsResponseSchema),
        staleTime: 30 * 1000,
    });
}

export function useCreatePlatformTenant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            name: string;
            slug: string;
            plan: 'demo' | 'starter' | 'pro';
            owner_email: string;
            settings?: Record<string, unknown>;
        }) => api.post('/admin/platform/tenants', data, platformTenantSummarySchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformTenants() });
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformAnalytics() });
        },
    });
}

export function useUpdatePlatformTenant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: Record<string, unknown>;
        }) => api.patch(`/admin/platform/tenants/${id}`, data, platformTenantSummarySchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformTenants() });
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformAnalytics() });
        },
    });
}

export function usePlatformTenantDangerAction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            action,
            confirmation_text,
            reason,
        }: {
            id: string;
            action: 'suspend' | 'reactivate' | 'soft_delete';
            confirmation_text: string;
            reason: string;
        }) =>
            api.post(`/admin/platform/tenants/${id}/danger`, {
                action,
                confirmation_text,
                reason,
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformTenants() });
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformAnalytics() });
        },
    });
}

export function usePlatformAnalytics() {
    return useQuery({
        queryKey: adminKeys.platformAnalytics(),
        queryFn: () => api.get('/admin/platform/analytics', undefined, platformAnalyticsResponseSchema),
        staleTime: 60 * 1000,
    });
}

export function usePlatformSettings() {
    return useQuery({
        queryKey: adminKeys.platformSettings(),
        queryFn: () => api.get('/admin/platform/settings', undefined, platformSettingsResponseSchema),
        staleTime: 60 * 1000,
    });
}

export function useUpdatePlatformSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { items: Array<{ key: string; value: Record<string, unknown> }> }) =>
            api.patch('/admin/platform/settings', data, platformSettingsResponseSchema),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.platformSettings() });
        },
    });
}
