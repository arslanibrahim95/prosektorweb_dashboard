/**
 * Sites Paths - /sites/*
 */

export const sitesPaths = {
    '/sites': {
        get: {
            tags: ['Sites'],
            summary: 'List sites',
            operationId: 'listSites',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'List of sites',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', format: 'uuid' },
                                        name: { type: 'string' },
                                        slug: { type: 'string' },
                                        is_active: { type: 'boolean' },
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
            tags: ['Sites'],
            summary: 'Create site',
            operationId: 'createSite',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['name', 'slug'],
                            properties: {
                                name: { type: 'string' },
                                slug: { type: 'string' }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Site created',
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
    '/sites/{id}': {
        get: {
            tags: ['Sites'],
            summary: 'Get site by ID',
            operationId: 'getSite',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                '200': {
                    description: 'Site details',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    name: { type: 'string' },
                                    slug: { type: 'string' },
                                    is_active: { type: 'boolean' },
                                    settings: { type: 'object' }
                                }
                            }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '404': { $ref: '#/components/responses/NotFound' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        },
        patch: {
            tags: ['Sites'],
            summary: 'Update site',
            operationId: 'updateSite',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                is_active: { type: 'boolean' },
                                settings: { type: 'object' }
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
        },
        delete: {
            tags: ['Sites'],
            summary: 'Delete site',
            operationId: 'deleteSite',
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
    '/sites/{id}/seo': {
        get: {
            tags: ['Sites'],
            summary: 'Get site SEO settings',
            operationId: 'getSiteSEO',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                '200': {
                    description: 'SEO settings',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    meta_title: { type: 'string' },
                                    meta_description: { type: 'string' },
                                    og_image: { type: 'string', format: 'uri' },
                                    robots: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '404': { $ref: '#/components/responses/NotFound' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        },
        put: {
            tags: ['Sites'],
            summary: 'Update site SEO settings',
            operationId: 'updateSiteSEO',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                meta_title: { type: 'string' },
                                meta_description: { type: 'string' },
                                og_image: { type: 'string', format: 'uri' },
                                robots: { type: 'string' }
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
    '/sites/{id}/site-token': {
        post: {
            tags: ['Sites'],
            summary: 'Generate site token',
            description: 'Generates a new authentication token for site-specific operations',
            operationId: 'generateSiteToken',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                '200': {
                    description: 'Site token generated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    token: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '404': { $ref: '#/components/responses/NotFound' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
} as const;
