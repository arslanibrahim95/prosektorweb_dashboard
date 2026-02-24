/**
 * Admin Paths - /admin/*
 */

export const adminPaths = {
    '/admin/users': {
        get: {
            tags: ['Admin'],
            summary: 'List all users (Admin only)',
            description: 'Returns paginated list of all users in the system',
            operationId: 'adminListUsers',
            security: [{ bearerAuth: [] }],
            parameters: [
                { $ref: '#/components/parameters/Page' },
                { $ref: '#/components/parameters/Limit' },
                { $ref: '#/components/parameters/Search' },
                { name: 'role', in: 'query', schema: { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer'] } },
                { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'invited'] } },
                { name: 'sort', in: 'query', schema: { type: 'string', enum: ['created_at', 'role'], default: 'created_at' } },
                { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } }
            ],
            responses: {
                '200': {
                    description: 'List of users',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/PaginatedResponse' }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '403': { $ref: '#/components/responses/Forbidden' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        },
        post: {
            tags: ['Admin'],
            summary: 'Create/invite user (Admin only)',
            operationId: 'adminCreateUser',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email', 'role'],
                            properties: {
                                email: { type: 'string', format: 'email' },
                                role: { type: 'string', enum: ['admin', 'editor', 'viewer'] }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'User created/invited',
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
                '403': { $ref: '#/components/responses/Forbidden' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/admin/users/{id}': {
        get: {
            tags: ['Admin'],
            summary: 'Get user by ID (Admin only)',
            operationId: 'adminGetUser',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                '200': {
                    description: 'User details',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    email: { type: 'string', format: 'email' },
                                    role: { type: 'string' },
                                    created_at: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '403': { $ref: '#/components/responses/Forbidden' },
                '404': { $ref: '#/components/responses/NotFound' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        },
        patch: {
            tags: ['Admin'],
            summary: 'Update user (Admin only)',
            operationId: 'adminUpdateUser',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                role: { type: 'string', enum: ['admin', 'editor', 'viewer'] }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '400': { $ref: '#/components/responses/BadRequest' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '403': { $ref: '#/components/responses/Forbidden' },
                '404': { $ref: '#/components/responses/NotFound' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        },
        delete: {
            tags: ['Admin'],
            summary: 'Delete user (Admin only)',
            operationId: 'adminDeleteUser',
            security: [{ bearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '403': { $ref: '#/components/responses/Forbidden' },
                '404': { $ref: '#/components/responses/NotFound' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/admin/analytics': {
        get: {
            tags: ['Admin'],
            summary: 'Get system-wide analytics (Admin only)',
            operationId: 'adminGetAnalytics',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'date_from', in: 'query', schema: { type: 'string', format: 'date' } },
                { name: 'date_to', in: 'query', schema: { type: 'string', format: 'date' } }
            ],
            responses: {
                '200': {
                    description: 'System analytics',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    total_sites: { type: 'integer' },
                                    total_users: { type: 'integer' },
                                    total_pages: { type: 'integer' },
                                    active_tenants: { type: 'integer' }
                                }
                            }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '403': { $ref: '#/components/responses/Forbidden' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/admin/dashboard': {
        get: {
            tags: ['Admin'],
            summary: 'Get admin dashboard data (Admin only)',
            operationId: 'adminGetDashboard',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Admin dashboard data',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    stats: { type: 'object' },
                                    recent_activity: { type: 'array', items: { type: 'object' } }
                                }
                            }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '403': { $ref: '#/components/responses/Forbidden' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    }
} as const;
