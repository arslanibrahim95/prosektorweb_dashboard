/**
 * Inbox React Query Hooks
 *
 * Standardized data fetching for inbox screens (Offers, Contact, Applications).
 * Replaces manual useEffect + useState patterns in page components.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    bulkMarkReadResponseSchema,
    listOfferRequestsResponseSchema,
    listContactMessagesResponseSchema,
    listJobApplicationsResponseSchema,
    listAppointmentRequestsResponseSchema,
} from '@prosektor/contracts';
import { api } from '@/server/api';
import type { QueryParams } from '@prosektorweb/shared';
import { markAsRead as markAsReadFn } from '@/features/inbox';
import { PAGINATION, SEARCH_MIN_CHARS } from '@/lib/constants';
import { unreadCountKeys } from '@/hooks/use-unread-count';

// === Query Keys ===
export const inboxKeys = {
    offersBase: (siteId: string) => ['inbox', 'offers', siteId] as const,
    offersList: (siteId: string, filters?: Record<string, unknown>) =>
        ['inbox', 'offers', siteId, 'list', filters] as const,
    contactsBase: (siteId: string) => ['inbox', 'contacts', siteId] as const,
    contactsList: (siteId: string, filters?: Record<string, unknown>) =>
        ['inbox', 'contacts', siteId, 'list', filters] as const,
    applicationsBase: (siteId: string) => ['inbox', 'applications', siteId] as const,
    applicationsList: (siteId: string, filters?: Record<string, unknown>) =>
        ['inbox', 'applications', siteId, 'list', filters] as const,
    appointmentsBase: (siteId: string) => ['inbox', 'appointments', siteId] as const,
    appointmentsList: (siteId: string, filters?: Record<string, unknown>) =>
        ['inbox', 'appointments', siteId, 'list', filters] as const,
};

type InboxStatus = 'read' | 'unread';

// === Offers ===
export function useOffers(siteId: string | null, filters?: { search?: string; page?: number; status?: InboxStatus }) {
    const search = filters?.search?.trim();
    const page = filters?.page ?? PAGINATION.DEFAULT_PAGE;
    const status = filters?.status;
    return useQuery({
        queryKey: inboxKeys.offersList(siteId ?? '', { ...filters, page }),
        queryFn: () =>
            api.get(
                '/inbox/offers',
                {
                    site_id: siteId,
                    page,
                    limit: PAGINATION.DEFAULT_LIMIT,
                    search: search && search.length >= SEARCH_MIN_CHARS ? search : undefined,
                    status,
                } as QueryParams,
                listOfferRequestsResponseSchema,
            ),
        enabled: !!siteId,
    });
}

// === Contacts ===
export function useContacts(siteId: string | null, filters?: { search?: string; page?: number; status?: InboxStatus }) {
    const search = filters?.search?.trim();
    const page = filters?.page ?? PAGINATION.DEFAULT_PAGE;
    const status = filters?.status;
    return useQuery({
        queryKey: inboxKeys.contactsList(siteId ?? '', { ...filters, page }),
        queryFn: () =>
            api.get(
                '/inbox/contact',
                {
                    site_id: siteId,
                    page,
                    limit: PAGINATION.DEFAULT_LIMIT,
                    search: search && search.length >= SEARCH_MIN_CHARS ? search : undefined,
                    status,
                } as QueryParams,
                listContactMessagesResponseSchema,
            ),
        enabled: !!siteId,
    });
}

// === Applications ===
export function useApplications(
    siteId: string | null,
    filters?: { search?: string; jobPostId?: string; page?: number; status?: InboxStatus },
) {
    const search = filters?.search?.trim();
    const page = filters?.page ?? PAGINATION.DEFAULT_PAGE;
    const status = filters?.status;
    return useQuery({
        queryKey: inboxKeys.applicationsList(siteId ?? '', { ...filters, page }),
        queryFn: () =>
            api.get(
                '/inbox/hr-applications',
                {
                    site_id: siteId,
                    page,
                    limit: PAGINATION.DEFAULT_LIMIT,
                    search: search && search.length >= SEARCH_MIN_CHARS ? search : undefined,
                    job_post_id: filters?.jobPostId || undefined,
                    status,
                } as QueryParams,
                listJobApplicationsResponseSchema,
            ),
        enabled: !!siteId,
    });
}

// === Appointments ===
export function useAppointments(siteId: string | null, filters?: { search?: string; page?: number; status?: InboxStatus }) {
    const search = filters?.search?.trim();
    const page = filters?.page ?? PAGINATION.DEFAULT_PAGE;
    const status = filters?.status;
    return useQuery({
        queryKey: inboxKeys.appointmentsList(siteId ?? '', { ...filters, page }),
        queryFn: () =>
            api.get(
                '/inbox/appointments',
                {
                    site_id: siteId,
                    page,
                    limit: PAGINATION.DEFAULT_LIMIT,
                    search: search && search.length >= SEARCH_MIN_CHARS ? search : undefined,
                    status,
                } as QueryParams,
                listAppointmentRequestsResponseSchema,
            ),
        enabled: !!siteId,
    });
}

// === Mark as Read Mutation ===
export function useMarkAsRead(
    endpoint: 'offers' | 'contact' | 'applications' | 'appointments',
    siteId: string | null,
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: { id: string }) =>
            markAsReadFn(endpoint, id),
        onSuccess: () => {
            if (siteId) {
                const keyMap = {
                    offers: inboxKeys.offersBase(siteId),
                    contact: inboxKeys.contactsBase(siteId),
                    applications: inboxKeys.applicationsBase(siteId),
                    appointments: inboxKeys.appointmentsBase(siteId),
                };
                void queryClient.invalidateQueries({ queryKey: keyMap[endpoint] });
                void queryClient.invalidateQueries({ queryKey: unreadCountKeys.total(siteId) });
            }
        },
    });
}

export function useBulkMarkAsRead(
    endpoint: 'offers' | 'contact' | 'applications' | 'appointments',
    siteId: string | null,
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ ids }: { ids: string[] }) =>
            api.post(
                `/inbox/${endpoint}/bulk-read`,
                { ids },
                bulkMarkReadResponseSchema,
            ),
        onSuccess: () => {
            if (siteId) {
                const keyMap = {
                    offers: inboxKeys.offersBase(siteId),
                    contact: inboxKeys.contactsBase(siteId),
                    applications: inboxKeys.applicationsBase(siteId),
                    appointments: inboxKeys.appointmentsBase(siteId),
                };
                void queryClient.invalidateQueries({ queryKey: keyMap[endpoint] });
                void queryClient.invalidateQueries({ queryKey: unreadCountKeys.total(siteId) });
            }
        },
    });
}
