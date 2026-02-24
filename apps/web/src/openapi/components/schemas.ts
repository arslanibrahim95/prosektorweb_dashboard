/**
 * OpenAPI Shared Schemas
 */

export const sharedSchemas = {
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
} as const;
