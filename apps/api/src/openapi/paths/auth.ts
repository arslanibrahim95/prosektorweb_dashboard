/**
 * Authentication Paths - /auth/*
 */

export const authPaths = {
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
} as const;
