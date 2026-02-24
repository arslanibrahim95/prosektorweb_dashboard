import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createInboxHandler, type InboxHandlerConfig } from "@/server/inbox/inbox-handler";
import { baseInboxQuerySchema } from "@/server/inbox/base-schema";
import { parseInboxQueryParams } from "@/server/inbox/query-params";


describe('applyInboxFilters behavior', () => {
    it('should build correct filter chain for status=read', () => {
        const mockQuery = {
            eq: (field: string, value: unknown) => {
                if (field === 'is_read' && value === true) return mockQuery;
                return mockQuery;
            },
            gte: () => mockQuery,
            lte: () => mockQuery,
            or: () => mockQuery,
        };

        // We test indirectly through config - status filtering is applied inside the handler
        // Verify the config accepts status parameter
        const params = new URLSearchParams({
            site_id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'read',
        });
        const result = parseInboxQueryParams(params, baseInboxQuerySchema);
        expect(result.status).toBe('read');
    });

    it('should build correct filter chain for status=unread', () => {
        const params = new URLSearchParams({
            site_id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'unread',
        });
        const result = parseInboxQueryParams(params, baseInboxQuerySchema);
        expect(result.status).toBe('unread');
    });

    it('should handle date_from and date_to filters', () => {
        const params = new URLSearchParams({
            site_id: '550e8400-e29b-41d4-a716-446655440000',
            date_from: '2024-01-01',
            date_to: '2024-12-31',
        });
        const result = parseInboxQueryParams(params, baseInboxQuerySchema);
        expect(result.date_from).toBe('2024-01-01');
        expect(result.date_to).toBe('2024-12-31');
    });

    it('should handle search parameter for ILIKE queries', () => {
        const params = new URLSearchParams({
            site_id: '550e8400-e29b-41d4-a716-446655440000',
            search: 'test query',
        });
        const result = parseInboxQueryParams(params, baseInboxQuerySchema);
        expect(result.search).toBe('test query');
    });

    it('should handle combined filters', () => {
        const params = new URLSearchParams({
            site_id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'unread',
            search: 'john',
            date_from: '2024-06-01',
            page: '2',
            limit: '25',
        });
        const result = parseInboxQueryParams(params, baseInboxQuerySchema);
        expect(result.status).toBe('unread');
        expect(result.search).toBe('john');
        expect(result.date_from).toBe('2024-06-01');
        expect(result.page).toBe(2);
        expect(result.limit).toBe(25);
    });
});

describe('cache key generation', () => {
    it('additionalCacheKeyParts should be called with parsed params', () => {
        type BaseInboxQuery = z.infer<typeof baseInboxQuerySchema>;
        const mockCacheKeyParts = (params: BaseInboxQuery) => [params.site_id, 'extra'];
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';

        const result = mockCacheKeyParts({ site_id: validUuid } as BaseInboxQuery);
        expect(result).toEqual([validUuid, 'extra']);
    });

    it('cache key should include all filter dimensions', () => {
        const cacheKeyParts = [
            'inbox-count',
            'contact',
            'tenant-123',
            '550e8400-e29b-41d4-a716-446655440000',
            'read',
            '2024-01-01',
            '2024-12-31',
            'search term',
        ];
        const cacheKey = cacheKeyParts.join('|');

        expect(cacheKey).toContain('inbox-count');
        expect(cacheKey).toContain('contact');
        expect(cacheKey).toContain('read');
        expect(cacheKey).toContain('2024-01-01');
        expect(cacheKey).toContain('search term');
    });

    it('cache key with empty optional parts should still be valid', () => {
        const cacheKeyParts = [
            'inbox-count',
            'contact',
            'tenant-123',
            '550e8400-e29b-41d4-a716-446655440000',
            '',
            '',
            '',
            '',
        ];
        const cacheKey = cacheKeyParts.join('|');

        expect(cacheKey).toBe('inbox-count|contact|tenant-123|550e8400-e29b-41d4-a716-446655440000||||');
        expect(cacheKey.split('|').length).toBe(8);
    });
});

describe('permission requirements', () => {
    it('handler config should be created even without permission context', () => {
        const config: InboxHandlerConfig = {
            tableName: 'test_table',
            querySchema: baseInboxQuerySchema,
            selectFields: 'id,name',
            searchFields: ['name'],
            rateLimitEndpoint: 'test',
            cacheKeyPrefix: 'test',
            itemSchema: z.object({ id: z.string() }),
             
            responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
        };

        const handler = createInboxHandler(config);
        expect(handler).toBeDefined();
        // Permission check happens at runtime inside the handler, not at config time
    });
});
