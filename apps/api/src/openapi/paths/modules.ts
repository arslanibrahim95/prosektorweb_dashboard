/**
 * Module Paths - /modules/*
 */

export const modulesPaths = {
    '/modules': {
        get: {
            tags: ['Modules'],
            summary: 'List modules',
            operationId: 'listModules',
            security: [{ bearerAuth: [] }],
            parameters: [{ $ref: '#/components/parameters/SiteId' }],
            responses: {
                '200': {
                    description: 'List of modules',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', format: 'uuid' },
                                        name: { type: 'string' },
                                        type: { type: 'string' },
                                        is_enabled: { type: 'boolean' },
                                        config: { type: 'object' }
                                    }
                                }
                            }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/modules/{id}': {
        patch: {
            tags: ['Modules'],
            summary: 'Update module',
            operationId: 'updateModule',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                is_enabled: { type: 'boolean' },
                                config: { type: 'object' }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '400': { $ref: '#/components/responses/BadRequest' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '404': { $ref: '#/components/responses/NotFound' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
} as const;
