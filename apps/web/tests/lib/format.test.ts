import { describe, it, expect } from 'vitest';
import {
    formatRelativeTime,
    formatDate,
} from '@/lib/format';

describe('format utilities', () => {
    describe('formatRelativeTime', () => {
        it('should return "Az önce" for very recent dates', () => {
            const now = new Date().toISOString();
            expect(formatRelativeTime(now)).toBe('Az önce');
        });

        it('should return minutes ago for dates within an hour', () => {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
            expect(formatRelativeTime(thirtyMinutesAgo)).toBe('30 dk önce');
        });

        it('should return hours ago for dates within a day', () => {
            const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
            expect(formatRelativeTime(fiveHoursAgo)).toBe('5 saat önce');
        });

        it('should return days ago for dates within a week', () => {
            const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
            expect(formatRelativeTime(twoDaysAgo)).toBe('2 gün önce');
        });

        it('should handle edge case of 1 minute', () => {
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
            expect(formatRelativeTime(oneMinuteAgo)).toBe('1 dk önce');
        });

        it('should handle edge case of 1 hour', () => {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            expect(formatRelativeTime(oneHourAgo)).toBe('1 saat önce');
        });

        it('should handle edge case of 1 day', () => {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            expect(formatRelativeTime(oneDayAgo)).toBe('1 gün önce');
        });
    });

    describe('formatDate', () => {
        it('should format date in Turkish locale', () => {
            const date = '2024-01-15T10:30:00.000Z';
            const result = formatDate(date);
            expect(result).toContain('2024');
            expect(result).toContain('Oca'); // January in Turkish
        });

        it('should include time in the format', () => {
            const result = formatDate('2024-06-20T14:45:00.000Z');
            // Time format should be HH:mm - check for any time pattern
            expect(result).toContain('20 Haz 2024');
            // Time will vary based on timezone, just check it's formatted
            expect(result).toMatch(/\d{1,2}:\d{2}/);
        });

        it('should handle different months', () => {
            expect(formatDate('2024-02-10T12:00:00.000Z')).toContain('Şub'); // February
            expect(formatDate('2024-03-10T12:00:00.000Z')).toContain('Mar'); // March
            expect(formatDate('2024-04-10T12:00:00.000Z')).toContain('Nis'); // April
            expect(formatDate('2024-05-10T12:00:00.000Z')).toContain('May'); // May
            expect(formatDate('2024-06-10T12:00:00.000Z')).toContain('Haz'); // June
            expect(formatDate('2024-07-10T12:00:00.000Z')).toContain('Tem'); // July
            expect(formatDate('2024-08-10T12:00:00.000Z')).toContain('Ağu'); // August
            expect(formatDate('2024-09-10T12:00:00.000Z')).toContain('Eyl'); // September
            expect(formatDate('2024-10-10T12:00:00.000Z')).toContain('Eki'); // October
            expect(formatDate('2024-11-10T12:00:00.000Z')).toContain('Kas'); // November
            expect(formatDate('2024-12-10T12:00:00.000Z')).toContain('Ara'); // December
        });
    });
});
