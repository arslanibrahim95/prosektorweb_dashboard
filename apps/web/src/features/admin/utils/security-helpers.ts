import type { IpBlockDuration } from '../types/security';

// ── Duration Helpers ──────────────────────────────────────────────────────────

const DURATION_TO_MS: Record<Exclude<IpBlockDuration, 'permanent'>, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

export function parseDuration(duration: IpBlockDuration): number {
    if (duration === 'permanent') return 0;
    return DURATION_TO_MS[duration];
}

export function getBlockedUntil(duration: IpBlockDuration): string | null {
    if (duration === 'permanent') return null;
    return new Date(Date.now() + parseDuration(duration)).toISOString();
}

// ── Date Formatters ───────────────────────────────────────────────────────────

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelativeTime(dateString: string): string {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / MINUTE_MS);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;

    const diffHours = Math.floor(diffMs / HOUR_MS);
    if (diffHours < 24) return `${diffHours} saat önce`;

    const diffDays = Math.floor(diffMs / DAY_MS);
    return `${diffDays} gün önce`;
}
