/**
 * Analytics Paths - /analytics/*
 */

export const analyticsPaths = {
    '/analytics/overview': {
        get: {
            tags: ['Analytics'],
            summary: 'Get analytics overview',
            description: 'Returns overview analytics data for a site',
            operationId: 'getAnalyticsOverview',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'site_id',
                    in: 'query',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
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
                    description: 'Analytics overview data',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    total_views: { type: 'integer' },
                                    total_visitors: { type: 'integer' },
                                    bounce_rate: { type: 'number' },
                                    avg_session_duration: { type: 'number' }
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
    '/analytics/timeline': {
        get: {
            tags: ['Analytics'],
            summary: 'Get analytics timeline',
            description: 'Returns time-series analytics data',
            operationId: 'getAnalyticsTimeline',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'site_id',
                    in: 'query',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
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
                },
                {
                    name: 'granularity',
                    in: 'query',
                    schema: { type: 'string', enum: ['hour', 'day', 'week', 'month'] }
                }
            ],
            responses: {
                '200': {
                    description: 'Timeline data',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                timestamp: { type: 'string', format: 'date-time' },
                                                views: { type: 'integer' },
                                                visitors: { type: 'integer' }
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
                '500': { $ref: '#/components/responses/InternalError' }
            }
        }
    },
} as const;
