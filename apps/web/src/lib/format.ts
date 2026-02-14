/**
 * Date & Time Formatting Utilities
 *
 * Shared formatting helpers used across dashboard pages.
 */

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Format a date string as relative time (Turkish).
 * e.g. "2 gün önce", "3 saat önce", "Az önce"
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dk önce`;
    return 'Az önce';
}

/**
 * Format a date string as "d MMM yyyy, HH:mm" (Turkish locale).
 */
export function formatDate(dateString: string): string {
    return format(new Date(dateString), 'd MMM yyyy, HH:mm', { locale: tr });
}
