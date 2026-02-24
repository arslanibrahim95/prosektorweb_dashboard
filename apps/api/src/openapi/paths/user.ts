/**
 * User Paths - /me
 */

export const userPaths = {
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
} as const;
