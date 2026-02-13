/**
 * Inbox React Query Hooks
 *
 * Standardized data fetching for inbox screens (Offers, Contact, Applications).
 * Replaces manual useEffect + useState patterns in page components.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    listOfferRequestsResponseSchema,
    listContactMessagesResponseSchema,
    listJobApplicationsResponseSchema,
} from '@prosektor/contracts';
import { api } from '@/server/api';
import type { QueryParams } from '@prosektorweb/shared';
import { markAsRead as markAsReadFn } from '@/features/inbox';
import { PAGINATION, SEARCH_MIN_CHARS } from '@/lib/constants';
import { unreadCountKeys } from '@/hooks/use-unread-count';

// === Query Keys ===
export const inboxKeys = {
    offers: (siteId: string, filters?: Record<string, unknown>) =>
        ['inbox', 'offers', siteId, filters] as const,
    contacts: (siteId: string, filters?: Record<string, unknown>) =>
        ['inbox', 'contacts', siteId, filters] as const,
    applications: (siteId: string, filters?: Record<string, unknown>) =>
        ['inbox', 'applications', siteId, filters] as const,
};

// === Offers ===
export function useOffers(siteId: string | null, filters?: { search?: string; page?: number }) {
    const search = filters?.search?.trim();
    const page = filters?.page ?? PAGINATION.DEFAULT_PAGE;
    return useQuery({
        queryKey: inboxKeys.offers(siteId ?? '', { ...filters, page }),
        queryFn: () =>
            api.get(
                '/inbox/offers',
                {
                    site_id: siteId,
                    page,
                    limit: PAGINATION.DEFAULT_LIMIT,
                    search: search && search.length >= SEARCH_MIN_CHARS ? search : undefined,
                } as QueryParams,
                listOfferRequestsResponseSchema,
            ),
        enabled: !!siteId,
    });
}

// === Contacts ===
export function useContacts(siteId: string | null, filters?: { search?: string; page?: number }) {
    const search = filters?.search?.trim();
    const page = filters?.page ?? PAGINATION.DEFAULT_PAGE;
    return useQuery({
        queryKey: inboxKeys.contacts(siteId ?? '', { ...filters, page }),
        queryFn: () =>
            api.get(
                '/inbox/contact',
                {
                    site_id: siteId,
                    page,
                    limit: PAGINATION.DEFAULT_LIMIT,
                    search: search && search.length >= SEARCH_MIN_CHARS ? search : undefined,
                } as QueryParams,
                listContactMessagesResponseSchema,
            ),
        enabled: !!siteId,
    });
}

// === Applications ===
export function useApplications(
    siteId: string | null,
    filters?: { search?: string; jobPostId?: string; page?: number },
) {
    const search = filters?.search?.trim();
    const page = filters?.page ?? PAGINATION.DEFAULT_PAGE;
    return useQuery({
        queryKey: inboxKeys.applications(siteId ?? '', { ...filters, page }),
        queryFn: () =>
            api.get(
                '/inbox/applications',
                {
                    site_id: siteId,
                    page,
                    limit: PAGINATION.DEFAULT_LIMIT,
                    search: search && search.length >= SEARCH_MIN_CHARS ? search : undefined,
                    job_post_id: filters?.jobPostId || undefined,
                } as QueryParams,
                listJobApplicationsResponseSchema,
            ),
        enabled: !!siteId,
    });
}

// === Mark as Read Mutation ===
export function useMarkAsRead(
    endpoint: 'offers' | 'contact' | 'applications',
    siteId: string | null,
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: { id: string }) =>
            markAsReadFn(endpoint, id),
        onSuccess: () => {
            if (siteId) {
                const keyMap = {
                    offers: inboxKeys.offers(siteId),
                    contact: inboxKeys.contacts(siteId),
                    applications: inboxKeys.applications(siteId),
                };
                void queryClient.invalidateQueries({ queryKey: keyMap[endpoint] });
                void queryClient.invalidateQueries({ queryKey: unreadCountKeys.total(siteId) });
            }
        },
    });
}
