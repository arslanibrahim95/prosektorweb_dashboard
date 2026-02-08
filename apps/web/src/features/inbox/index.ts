/**
 * Inbox Feature Module
 * 
 * Shared utilities and types for inbox screens
 * (Offers, Contact, Applications)
 */

export type InboxItemStatus = 'unread' | 'read' | 'archived';

export interface InboxFilters {
    search?: string;
    status?: InboxItemStatus | 'all';
    dateFrom?: string;
    dateTo?: string;
}

export interface InboxPagination {
    page: number;
    limit: number;
    total: number;
}

/**
 * Build query params for inbox API calls
 */
export function buildInboxParams(
    filters: InboxFilters,
    pagination: { page: number; limit: number }
): URLSearchParams {
    const params = new URLSearchParams();

    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());

    if (filters.search) {
        params.set('search', filters.search);
    }
    if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status);
    }
    if (filters.dateFrom) {
        params.set('date_from', filters.dateFrom);
    }
    if (filters.dateTo) {
        params.set('date_to', filters.dateTo);
    }

    return params;
}

/**
 * Mark item as read
 */
export async function markAsRead(
    endpoint: 'offers' | 'contact' | 'applications',
    id: string
): Promise<void> {
    await fetch(`/api/inbox/${endpoint}/${id}/read`, {
        method: 'POST',
    });
}

/**
 * Export inbox data
 */
export async function exportInbox(
    endpoint: 'offers' | 'contact' | 'applications',
    filters: InboxFilters
): Promise<Blob> {
    const params = buildInboxParams(filters, { page: 1, limit: 10000 });
    params.set('format', 'csv');

    const response = await fetch(`/api/inbox/${endpoint}/export?${params}`);
    return response.blob();
}
