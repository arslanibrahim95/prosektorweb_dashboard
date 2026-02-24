/**
 * Publishing Paths - /publish
 */

export const publishingPaths = {
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
} as const;
