/**
 * OpenAPI 3.0 Specification for ProsektorWeb Dashboard API
 * 
 * This file contains the complete API documentation for all endpoints.
 * Auto-generated documentation is served via Scalar at /api/docs/ui
 */

export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'ProsektorWeb Dashboard API',
        description: `
# ProsektorWeb Dashboard API

Complete API documentation for the ProsektorWeb Dashboard management system.

## Authentication

The API supports two authentication methods:

1. **Bearer Token (JWT)**: Standard Supabase JWT tokens
2. **Custom JWT**: Long-lived custom tokens obtained via \`/api/auth/token\`

Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`

## Rate Limiting

All authenticated endpoints are rate-limited. Rate limit information is returned in response headers:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Remaining requests
- \`X-RateLimit-Reset\`: Unix timestamp when the limit resets

## Error Handling

All errors follow a consistent format:

\`\`\`json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field_name": ["Error message for this field"]
  }
}
\`\`\`

Common error codes:
- \`UNAUTHORIZED\` (401): Missing or invalid authentication
- \`FORBIDDEN\` (403): Insufficient permissions
- \`VALIDATION_ERROR\` (400): Invalid request data
- \`NOT_FOUND\` (404): Resource not found
- \`RATE_LIMITED\` (429): Too many requests
- \`INTERNAL_ERROR\` (500): Server error

## Pagination

List endpoints support pagination with these query parameters:
- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 50, max: 100)

Paginated responses include:
\`\`\`json
{
  "items": [...],
  "total": 100
}
\`\`\`
    `,
        version: '1.0.0',
        contact: {
            name: 'ProsektorWeb Team',
            email: 'support@prosektorweb.com'
        },
        license: {
            name: 'Proprietary',
        }
    },
    servers: [
        {
            url: '/api',
            description: 'API Server'
        }
    ],
    tags: [
        { name: 'Authentication', description: 'Authentication and token management' },
        { name: 'User', description: 'Current user information' },
        { name: 'Dashboard', description: 'Dashboard summary and statistics' },
        { name: 'Analytics', description: 'Analytics and reporting data' },
        { name: 'Inbox', description: 'Inbox management for applications, contacts, and offers' },
        { name: 'Content', description: 'Content management (pages, legal texts)' },
        { name: 'Sites', description: 'Site management and configuration' },
        { name: 'Domains', description: 'Domain management' },
        { name: 'Modules', description: 'Module configuration' },
        { name: 'HR', description: 'HR and job posting management' },
        { name: 'Team', description: 'Team member management' },
        { name: 'Public', description: 'Public endpoints (no authentication required)' },
        { name: 'Admin', description: 'Admin-only endpoints' },
        { name: 'Publishing', description: 'Site publishing' },
    ],
    paths: {
        '/auth/token': {
            post: {
                tags: ['Authentication'],
                summary: 'Exchange Supabase token for custom JWT',
                description: 'Exchanges a Supabase access token for a custom JWT with optional remember-me functionality',
                operationId: 'exchangeToken',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    rememberMe: {
                                        type: 'boolean',
                                        default: false,
                                        description: 'If true, token will be valid for 30 days instead of 24 hours'
                                    }
                                }
                            },
                            examples: {
                                default: {
                                    value: { rememberMe: false }
                                },
                                rememberMe: {
                                    value: { rememberMe: true }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Token exchange successful',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        access_token: { type: 'string', description: 'Custom JWT access token' },
                                        refresh_token: { type: 'string', description: 'Refresh token (if rememberMe is true)' },
                                        expires_at: { type: 'string', format: 'date-time', description: 'Token expiration time' },
                                        token_type: { type: 'string', example: 'Bearer' }
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
        '/me': {
            get: {
                tags: ['User'],
                summary: 'Get current user information',
                description: 'Returns information about the currently authenticated user',
                operationId: 'getCurrentUser',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'User information',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        user: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string', format: 'uuid' },
                                                email: { type: 'string', format: 'email' },
                                                name: { type: 'string' },
                                                avatar_url: { type: 'string', format: 'uri' },
                                            },
                                        },
                                        tenant: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string', format: 'uuid' },
                                                name: { type: 'string' },
                                                slug: { type: 'string' },
                                                plan: { type: 'string', enum: ['demo', 'starter', 'pro'] },
                                            },
                                        },
                                        active_tenant_id: { type: 'string', format: 'uuid' },
                                        available_tenants: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string', format: 'uuid' },
                                                    name: { type: 'string' },
                                                    slug: { type: 'string' },
                                                    plan: { type: 'string', enum: ['demo', 'starter', 'pro'] },
                                                    status: { type: 'string', enum: ['active', 'suspended', 'deleted'] },
                                                },
                                            },
                                        },
                                        role: { type: 'string', enum: ['super_admin', 'owner', 'admin', 'editor', 'viewer'] },
                                        permissions: {
                                            type: 'array',
                                            items: { type: 'string' },
                                        },
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
        '/sites/{id}/seo': {
            get: {
                tags: ['Sites'],
                summary: 'Get site SEO settings',
                operationId: 'getSiteSEO',
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
        '/domains': {
            get: {
                tags: ['Domains'],
                summary: 'List domains',
                operationId: 'listDomains',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { $ref: '#/components/parameters/SiteId' }
                ],
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
        '/modules': {
            get: {
                tags: ['Modules'],
                summary: 'List modules',
                operationId: 'listModules',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { $ref: '#/components/parameters/SiteId' }
                ],
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
        '/tenant-members': {
            get: {
                tags: ['Team'],
                summary: 'List team members',
                operationId: 'listTeamMembers',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'List of team members',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string', format: 'uuid' },
                                            user_id: { type: 'string', format: 'uuid' },
                                            role: { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer'] },
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
            }
        },
        '/tenant-members/invite': {
            post: {
                tags: ['Team'],
                summary: 'Invite team member',
                operationId: 'inviteTeamMember',
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
                        description: 'Invitation sent',
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
        '/tenant-members/{id}': {
            patch: {
                tags: ['Team'],
                summary: 'Update team member role',
                operationId: 'updateTeamMember',
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
                                required: ['role'],
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
                tags: ['Team'],
                summary: 'Remove team member',
                operationId: 'removeTeamMember',
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
                    '403': { $ref: '#/components/responses/Forbidden' },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '500': { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/hr/job-posts': {
            get: {
                tags: ['HR'],
                summary: 'List job posts',
                operationId: 'listJobPosts',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { $ref: '#/components/parameters/SiteId' }
                ],
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
        '/hr/job-posts/check-slug': {
            get: {
                tags: ['HR'],
                summary: 'Check if job post slug is available',
                operationId: 'checkJobPostSlug',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'site_id',
                        in: 'query',
                        required: true,
                        schema: { type: 'string', format: 'uuid' }
                    },
                    {
                        name: 'slug',
                        in: 'query',
                        required: true,
                        schema: { type: 'string' }
                    }
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
        '/publish': {
            post: {
                tags: ['Publishing'],
                summary: 'Publish site',
                description: 'Triggers site publishing process',
                operationId: 'publishSite',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['site_id'],
                                properties: {
                                    site_id: { type: 'string', format: 'uuid' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Publishing initiated',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'publishing' },
                                        message: { type: 'string' }
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
        '/public/contact/submit': {
            post: {
                tags: ['Public'],
                summary: 'Submit contact form',
                description: 'Public endpoint for contact form submissions (no authentication required)',
                operationId: 'submitContactForm',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['site_id', 'full_name', 'email', 'message'],
                                properties: {
                                    site_id: { type: 'string', format: 'uuid' },
                                    full_name: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    phone: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Contact form submitted successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '429': { $ref: '#/components/responses/RateLimited' },
                    '500': { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/public/offer/submit': {
            post: {
                tags: ['Public'],
                summary: 'Submit offer request',
                description: 'Public endpoint for offer request submissions (no authentication required)',
                operationId: 'submitOfferRequest',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['site_id', 'full_name', 'email', 'company'],
                                properties: {
                                    site_id: { type: 'string', format: 'uuid' },
                                    full_name: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    phone: { type: 'string' },
                                    company: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Offer request submitted successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '429': { $ref: '#/components/responses/RateLimited' },
                    '500': { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/public/hr/apply': {
            post: {
                tags: ['Public'],
                summary: 'Submit job application',
                description: 'Public endpoint for job applications with CV upload (no authentication required)',
                operationId: 'submitJobApplication',
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['site_id', 'job_post_id', 'full_name', 'email', 'cv'],
                                properties: {
                                    site_id: { type: 'string', format: 'uuid' },
                                    job_post_id: { type: 'string', format: 'uuid' },
                                    full_name: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    phone: { type: 'string' },
                                    cv: {
                                        type: 'string',
                                        format: 'binary',
                                        description: 'CV file (PDF only, max 5MB)'
                                    },
                                    cover_letter: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Application submitted successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '413': {
                        description: 'File too large',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' }
                            }
                        }
                    },
                    '429': { $ref: '#/components/responses/RateLimited' },
                    '500': { $ref: '#/components/responses/InternalError' }
                }
            }
        },
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
                    {
                        name: 'role',
                        in: 'query',
                        schema: { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer'] }
                    },
                    {
                        name: 'status',
                        in: 'query',
                        schema: { type: 'string', enum: ['active', 'invited'] }
                    },
                    {
                        name: 'sort',
                        in: 'query',
                        schema: { type: 'string', enum: ['created_at', 'role'], default: 'created_at' }
                    },
                    {
                        name: 'order',
                        in: 'query',
                        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
                    }
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
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT token obtained from Supabase or /api/auth/token endpoint'
            }
        },
        parameters: {
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
        },
        schemas: {
            ErrorResponse: {
                type: 'object',
                required: ['code', 'message'],
                properties: {
                    code: {
                        type: 'string',
                        description: 'Error code',
                        example: 'VALIDATION_ERROR'
                    },
                    message: {
                        type: 'string',
                        description: 'Human-readable error message',
                        example: 'Validation failed'
                    },
                    details: {
                        type: 'object',
                        additionalProperties: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        description: 'Field-specific error details',
                        example: {
                            email: ['Invalid email format'],
                            password: ['Password must be at least 8 characters']
                        }
                    }
                }
            },
            PaginatedResponse: {
                type: 'object',
                required: ['items', 'total'],
                properties: {
                    items: {
                        type: 'array',
                        items: { type: 'object' },
                        description: 'Array of items'
                    },
                    total: {
                        type: 'integer',
                        description: 'Total number of items',
                        example: 100
                    }
                }
            },
            SuccessResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: true
                    },
                    message: {
                        type: 'string',
                        example: 'Operation completed successfully'
                    }
                }
            }
        },
        responses: {
            Success: {
                description: 'Operation successful',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/SuccessResponse' }
                    }
                }
            },
            BadRequest: {
                description: 'Bad request - validation error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: {
                            code: 'VALIDATION_ERROR',
                            message: 'Validation failed',
                            details: {
                                email: ['Invalid email format']
                            }
                        }
                    }
                }
            },
            Unauthorized: {
                description: 'Unauthorized - missing or invalid authentication',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: {
                            code: 'UNAUTHORIZED',
                            message: 'Authentication required'
                        }
                    }
                }
            },
            Forbidden: {
                description: 'Forbidden - insufficient permissions',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: {
                            code: 'FORBIDDEN',
                            message: 'You do not have permission to access this resource'
                        }
                    }
                }
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: {
                            code: 'NOT_FOUND',
                            message: 'Resource not found'
                        }
                    }
                }
            },
            Conflict: {
                description: 'Conflict - resource already exists',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: {
                            code: 'CONFLICT',
                            message: 'Resource already exists'
                        }
                    }
                }
            },
            RateLimited: {
                description: 'Too many requests',
                headers: {
                    'X-RateLimit-Limit': {
                        schema: { type: 'integer' },
                        description: 'Request limit per window'
                    },
                    'X-RateLimit-Remaining': {
                        schema: { type: 'integer' },
                        description: 'Remaining requests in current window'
                    },
                    'X-RateLimit-Reset': {
                        schema: { type: 'integer' },
                        description: 'Unix timestamp when the rate limit resets'
                    }
                },
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: {
                            code: 'RATE_LIMITED',
                            message: 'Too many requests. Please try again later.'
                        }
                    }
                }
            },
            InternalError: {
                description: 'Internal server error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: {
                            code: 'INTERNAL_ERROR',
                            message: 'An internal error occurred'
                        }
                    }
                }
            }
        }
    }
} as const;
