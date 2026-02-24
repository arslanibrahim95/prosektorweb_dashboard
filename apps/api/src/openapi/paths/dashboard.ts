/**
 * Dashboard Paths - /dashboard/*
 */

export const dashboardPaths = {
    '/dashboard/summary': {
        get: {
            tags: ['Dashboard'],
            summary: 'Get dashboard summary',
            description: 'Returns summary statistics and recent activity for the dashboard',
            operationId: 'getDashboardSummary',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'site_id',
                    in: 'query',
                    required: true,
                    schema: { type: 'string', format: 'uuid' },
                    description: 'Site ID to get summary for'
                }
            ],
            responses: {
                '200': {
                    description: 'Dashboard summary',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    totals: {
                                        type: 'object',
                                        properties: {
                                            offers: { type: 'integer' },
                                            contacts: { type: 'integer' },
                                            applications: { type: 'integer' }
                                        }
                                    },
                                    active_job_posts_count: { type: 'integer' },
                                    primary_domain_status: {
                                        type: 'object',
                                        nullable: true,
                                        properties: {
                                            status: { type: 'string' },
                                            ssl_status: { type: 'string' }
                                        }
                                    },
                                    recent_activity: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string', format: 'uuid' },
                                                type: { type: 'string', enum: ['offer', 'contact', 'application'] },
                                                name: { type: 'string' },
                                                detail: { type: 'string' },
                                                created_at: { type: 'string', format: 'date-time' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                '400': { $ref: '#/components/responses/BadRequest' },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '429': { $ref: '#/components/responses/RateLimited' },
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
} as const;
