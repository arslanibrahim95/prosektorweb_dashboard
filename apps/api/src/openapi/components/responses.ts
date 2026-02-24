/**
 * OpenAPI Standard Responses
 */

export const standardResponses = {
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
} as const;
