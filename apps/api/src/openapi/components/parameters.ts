/**
 * OpenAPI Shared Parameters
 */

export const sharedParameters = {
    SiteId: {
        name: 'site_id',
        in: 'query',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Site ID'
    },
    Page: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Page number for pagination'
    },
    Limit: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        description: 'Number of items per page'
    },
    Search: {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
        description: 'Search query'
    }
} as const;
