/**
 * Content Paths - /pages/*, /legal-texts/*
 */

export const contentPaths = {
    '/pages': {
        get: {
            tags: ['Content'],
            summary: 'List pages',
            description: 'Returns list of pages for a site',
            operationId: 'listPages',
            security: [{ bearerAuth: [] }],
            parameters: [
                { $ref: '#/components/parameters/SiteId' }
            ],
            responses: {
                '200': {
                    description: 'List of pages',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', format: 'uuid' },
                                        title: { type: 'string' },
                                        slug: { type: 'string' },
                                        is_published: { type: 'boolean' },
                                        created_at: { type: 'string', format: 'date-time' },
                                        updated_at: { type: 'string', format: 'date-time' }
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
            tags: ['Content'],
            summary: 'Create page',
            operationId: 'createPage',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['site_id', 'title', 'slug'],
                            properties: {
                                site_id: { type: 'string', format: 'uuid' },
                                title: { type: 'string' },
                                slug: { type: 'string' },
                                content: { type: 'object' },
                                meta_title: { type: 'string' },
                                meta_description: { type: 'string' }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Page created',
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
    '/pages/{id}': {
        get: {
            tags: ['Content'],
            summary: 'Get page by ID',
            operationId: 'getPage',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
                }
            ],
            responses: {
                '200': {
                    description: 'Page details',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    title: { type: 'string' },
                                    slug: { type: 'string' },
                                    content: { type: 'object' },
                                    is_published: { type: 'boolean' },
                                    meta_title: { type: 'string' },
                                    meta_description: { type: 'string' }
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
            tags: ['Content'],
            summary: 'Update page',
            operationId: 'updatePage',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                slug: { type: 'string' },
                                content: { type: 'object' },
                                is_published: { type: 'boolean' },
                                meta_title: { type: 'string' },
                                meta_description: { type: 'string' }
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
            tags: ['Content'],
            summary: 'Delete page',
            operationId: 'deletePage',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
                }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '404': { $ref: '#/components/responses/NotFound' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/pages/{id}/revisions': {
        get: {
            tags: ['Content'],
            summary: 'Get page revisions',
            description: 'Returns revision history for a page',
            operationId: 'getPageRevisions',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
                }
            ],
            responses: {
                '200': {
                    description: 'List of revisions',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', format: 'uuid' },
                                        page_id: { type: 'string', format: 'uuid' },
                                        content: { type: 'object' },
                                        created_at: { type: 'string', format: 'date-time' },
                                        created_by: { type: 'string', format: 'uuid' }
                                    }
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
    '/legal-texts': {
        get: {
            tags: ['Content'],
            summary: 'List legal texts',
            operationId: 'listLegalTexts',
            security: [{ bearerAuth: [] }],
            parameters: [
                { $ref: '#/components/parameters/SiteId' }
            ],
            responses: {
                '200': {
                    description: 'List of legal texts',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', format: 'uuid' },
                                        type: { type: 'string', enum: ['privacy', 'terms', 'cookies'] },
                                        title: { type: 'string' },
                                        content: { type: 'string' },
                                        updated_at: { type: 'string', format: 'date-time' }
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
            tags: ['Content'],
            summary: 'Create legal text',
            operationId: 'createLegalText',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['site_id', 'type', 'title', 'content'],
                            properties: {
                                site_id: { type: 'string', format: 'uuid' },
                                type: { type: 'string', enum: ['privacy', 'terms', 'cookies'] },
                                title: { type: 'string' },
                                content: { type: 'string' }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Legal text created',
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
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/legal-texts/{id}': {
        put: {
            tags: ['Content'],
            summary: 'Update legal text',
            operationId: 'updateLegalText',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                content: { type: 'string' }
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
            tags: ['Content'],
            summary: 'Delete legal text',
            operationId: 'deleteLegalText',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
                }
            ],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '404': { $ref: '#/components/responses/NotFound' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
} as const;
