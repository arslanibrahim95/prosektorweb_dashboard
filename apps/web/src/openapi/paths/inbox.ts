/**
 * Inbox Paths - /inbox/*
 */

export const inboxPaths = {
    '/inbox/hr-applications': {
        get: {
            tags: ['Inbox'],
            summary: 'List HR applications',
            description: 'Returns paginated list of job applications',
            operationId: 'listHRApplications',
            security: [{ bearerAuth: [] }],
            parameters: [
                { $ref: '#/components/parameters/SiteId' },
                { $ref: '#/components/parameters/Page' },
                { $ref: '#/components/parameters/Limit' },
                { $ref: '#/components/parameters/Search' },
                {
                    name: 'status',
                    in: 'query',
                    schema: { type: 'string', enum: ['read', 'unread'] }
                },
                {
                    name: 'date_from',
                    in: 'query',
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'date_to',
                    in: 'query',
                    schema: { type: 'string', format: 'date' }
                }
            ],
            responses: {
                '200': {
                    description: 'List of applications',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    items: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string', format: 'uuid' },
                                                full_name: { type: 'string' },
                                                email: { type: 'string', format: 'email' },
                                                phone: { type: 'string' },
                                                job_post_id: { type: 'string', format: 'uuid' },
                                                cv_url: { type: 'string', format: 'uri' },
                                                is_read: { type: 'boolean' },
                                                created_at: { type: 'string', format: 'date-time' }
                                            }
                                        }
                                    },
                                    total: { type: 'integer' }
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
    '/inbox/hr-applications/{id}/read': {
        post: {
            tags: ['Inbox'],
            summary: 'Mark HR application as read',
            description: 'Marks a specific job application as read',
            operationId: 'markHRApplicationRead',
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
    '/inbox/contact': {
        get: {
            tags: ['Inbox'],
            summary: 'List contact messages',
            description: 'Returns paginated list of contact form submissions',
            operationId: 'listContactMessages',
            security: [{ bearerAuth: [] }],
            parameters: [
                { $ref: '#/components/parameters/SiteId' },
                { $ref: '#/components/parameters/Page' },
                { $ref: '#/components/parameters/Limit' },
                { $ref: '#/components/parameters/Search' },
                {
                    name: 'status',
                    in: 'query',
                    schema: { type: 'string', enum: ['read', 'unread'] }
                }
            ],
            responses: {
                '200': {
                    description: 'List of contact messages',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/PaginatedResponse' }
                        }
                    }
                },
                '400': { $ref: '#/components/responses/BadRequest' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/inbox/contact/{id}/read': {
        post: {
            tags: ['Inbox'],
            summary: 'Mark contact message as read',
            operationId: 'markContactRead',
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
    '/inbox/contact/bulk-read': {
        post: {
            tags: ['Inbox'],
            summary: 'Mark multiple contact messages as read',
            operationId: 'bulkMarkContactRead',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['ids'],
                            properties: {
                                ids: {
                                    type: 'array',
                                    items: { type: 'string', format: 'uuid' }
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '400': { $ref: '#/components/responses/BadRequest' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/inbox/contact/export': {
        get: {
            tags: ['Inbox'],
            summary: 'Export contact messages to CSV',
            operationId: 'exportContactMessages',
            security: [{ bearerAuth: [] }],
            parameters: [
                { $ref: '#/components/parameters/SiteId' }
            ],
            responses: {
                '200': {
                    description: 'CSV file',
                    content: {
                        'text/csv': {
                            schema: { type: 'string', format: 'binary' }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/inbox/offers': {
        get: {
            tags: ['Inbox'],
            summary: 'List offer requests',
            description: 'Returns paginated list of offer requests',
            operationId: 'listOfferRequests',
            security: [{ bearerAuth: [] }],
            parameters: [
                { $ref: '#/components/parameters/SiteId' },
                { $ref: '#/components/parameters/Page' },
                { $ref: '#/components/parameters/Limit' },
                { $ref: '#/components/parameters/Search' }
            ],
            responses: {
                '200': {
                    description: 'List of offer requests',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/PaginatedResponse' }
                        }
                    }
                },
                '400': { $ref: '#/components/responses/BadRequest' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/inbox/offers/{id}/read': {
        post: {
            tags: ['Inbox'],
            summary: 'Mark offer request as read',
            operationId: 'markOfferRead',
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
    '/inbox/offers/bulk-read': {
        post: {
            tags: ['Inbox'],
            summary: 'Mark multiple offers as read',
            operationId: 'bulkMarkOffersRead',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['ids'],
                            properties: {
                                ids: {
                                    type: 'array',
                                    items: { type: 'string', format: 'uuid' }
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': { $ref: '#/components/responses/Success' },
                '400': { $ref: '#/components/responses/BadRequest' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
    '/inbox/offers/export': {
        get: {
            tags: ['Inbox'],
            summary: 'Export offers to CSV',
            operationId: 'exportOffers',
            security: [{ bearerAuth: [] }],
            parameters: [
                { $ref: '#/components/parameters/SiteId' }
            ],
            responses: {
                '200': {
                    description: 'CSV file',
                    content: {
                        'text/csv': {
                            schema: { type: 'string', format: 'binary' }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
} as const;
