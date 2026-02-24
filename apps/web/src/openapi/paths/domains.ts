/**
 * Domain Paths - /domains/*
 */

export const domainsPaths = {
    '/domains': {
        get: {
            tags: ['Domains'],
            summary: 'List domains',
            operationId: 'listDomains',
            security: [{ bearerAuth: [] }],
            parameters: [{ $ref: '#/components/parameters/SiteId' }],
            responses: {
                '200': {
                    description: 'List of domains',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', format: 'uuid' },
                                        domain: { type: 'string' },
                                        is_primary: { type: 'boolean' },
                                        status: { type: 'string' },
                                        ssl_status: { type: 'string' },
                                        created_at: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        },
        post: {
            tags: ['Domains'],
            summary: 'Add domain',
            operationId: 'addDomain',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['site_id', 'domain'],
                            properties: {
                                site_id: { type: 'string', format: 'uuid' },
                                domain: { type: 'string' },
                                is_primary: { type: 'boolean', default: false }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Domain added',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' }
                                }
                            }
                        }
                    }
                },
                '400': { $ref: '#/components/responses/BadRequest' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '409': { $ref: '#/components/responses/Conflict' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/domains/{id}': {
        delete: {
            tags: ['Domains'],
            summary: 'Delete domain',
            operationId: 'deleteDomain',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '404': { $ref: '#/components/responses/NotFound' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
} as const;
