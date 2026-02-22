import { useQuery } from '@tanstack/react-query';
import {
    listContactMessagesResponseSchema,
    listJobApplicationsResponseSchema,
    listOfferRequestsResponseSchema,
} from '@prosektor/contracts';
import { api } from '@/server/api';

export const unreadCountKeys = {
    total: (siteId: string) => ['inbox', 'unread-count', siteId] as const,
};

export function useUnreadCount(siteId: string | null) {
    return useQuery({
        queryKey: unreadCountKeys.total(siteId ?? ''),
        queryFn: async () => {
            if (!siteId) return 0;

            const params = {
                site_id: siteId,
                status: 'unread' as const,
                page: 1,
                limit: 1,
            };

            const [offers, contacts, applications] = await Promise.all([
                api.get('/inbox/offers', params, listOfferRequestsResponseSchema),
                api.get('/inbox/contact', params, listContactMessagesResponseSchema),
                api.get('/inbox/applications', params, listJobApplicationsResponseSchema),
            ]);

            return offers.total + contacts.total + applications.total;
        },
        enabled: !!siteId,
        staleTime: 30 * 1000,
        refetchInterval: 30 * 1000,
    });
}
