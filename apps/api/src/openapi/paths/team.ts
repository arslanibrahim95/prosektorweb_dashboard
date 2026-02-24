/**
 * Team Paths - /tenant-members/*
 */

export const teamPaths = {
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
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
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
} as const;
