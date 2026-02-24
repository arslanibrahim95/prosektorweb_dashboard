/**
 * HR Paths - /hr/*
 */

export const hrPaths = {
    '/hr/job-posts': {
        get: {
            tags: ['HR'],
            summary: 'List job posts',
            operationId: 'listJobPosts',
            security: [{ bearerAuth: [] }],
            parameters: [{ $ref: '#/components/parameters/SiteId' }],
            responses: {
                '200': {
                    description: 'List of job posts',
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
                                        description: { type: 'string' },
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
            tags: ['HR'],
            summary: 'Create job post',
            operationId: 'createJobPost',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['site_id', 'title', 'slug', 'description'],
                            properties: {
                                site_id: { type: 'string', format: 'uuid' },
                                title: { type: 'string' },
                                slug: { type: 'string' },
                                description: { type: 'string' },
                                requirements: { type: 'string' },
                                is_active: { type: 'boolean', default: true }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Job post created',
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
    '/hr/job-posts/{id}': {
        get: {
            tags: ['HR'],
            summary: 'Get job post by ID',
            operationId: 'getJobPost',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                '200': {
                    description: 'Job post details',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    title: { type: 'string' },
                                    slug: { type: 'string' },
                                    description: { type: 'string' },
                                    requirements: { type: 'string' },
                                    is_active: { type: 'boolean' }
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
            tags: ['HR'],
            summary: 'Update job post',
            operationId: 'updateJobPost',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                requirements: { type: 'string' },
                                is_active: { type: 'boolean' }
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
            tags: ['HR'],
            summary: 'Delete job post',
            operationId: 'deleteJobPost',
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
    '/hr/job-posts/check-slug': {
        get: {
            tags: ['HR'],
            summary: 'Check if job post slug is available',
            operationId: 'checkJobPostSlug',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'site_id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
                { name: 'slug', in: 'query', required: true, schema: { type: 'string' } }
            ],
            responses: {
                '200': {
                    description: 'Slug availability',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    available: { type: 'boolean' }
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
    '/hr/applications/{id}/cv-url': {
        get: {
            tags: ['HR'],
            summary: 'Get CV download URL',
            description: 'Returns a signed URL to download the applicant CV',
            operationId: 'getApplicationCVUrl',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                '200': {
                    description: 'CV download URL',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    url: { type: 'string', format: 'uri' }
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
