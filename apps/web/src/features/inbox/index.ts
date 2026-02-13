/**
 * Inbox Feature Module
 * 
 * Shared utilities and types for inbox screens
 * (Offers, Contact, Applications)
 */

import { CSV_EXPORT, SEARCH_MIN_CHARS } from '@/lib/constants';
import { api } from '@/server/api';

export type InboxItemStatus = 'unread' | 'read' | 'archived';

export interface InboxFilters {
    search?: string;
    status?: InboxItemStatus | 'all';
    dateFrom?: string;
    dateTo?: string;
}

export function normalizeInboxSearch(query: string): string | undefined {
    const normalized = query.trim();
    if (normalized.length < SEARCH_MIN_CHARS) {
        return undefined;
    }
    return normalized;
}

export function calculateTotalPages(total: number, limit: number): number {
    if (!Number.isFinite(total) || total <= 0) {
        return 1;
    }
    if (!Number.isFinite(limit) || limit <= 0) {
        return 1;
    }
    return Math.max(1, Math.ceil(total / limit));
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
 * Mark item as read — uses API client for consistent auth handling
 */
export async function markAsRead(
    endpoint: 'offers' | 'contact' | 'applications',
    id: string,
): Promise<void> {
    await api.post(`/inbox/${endpoint}/${id}/read`);
}

/**
 * Export inbox data
 */
export async function exportInbox(
    endpoint: 'offers' | 'contact' | 'applications',
    filters: InboxFilters,
    options?: { accessToken?: string; siteId?: string }
): Promise<Blob> {
    if (!options?.siteId) {
        throw new Error('site_id is required for export');
    }
    const params = buildInboxParams(filters, { page: 1, limit: CSV_EXPORT.LIMIT });
    params.set('site_id', options.siteId);
    params.set('format', 'csv');

    const headers: Record<string, string> = {};
    if (options?.accessToken) {
        headers.Authorization = `Bearer ${options.accessToken}`;
    }

    const response = await fetch(`/api/inbox/${endpoint}/export?${params}`, {
        credentials: 'include',
        headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? '';
        const payload = contentType.includes('application/json')
            ? await response.json()
            : await response.text();

        const message =
            payload && typeof payload === 'object' && 'message' in payload
                ? String((payload as { message?: unknown }).message ?? 'Export failed')
                : 'Export failed';

        throw new Error(message);
    }
    return response.blob();
}
