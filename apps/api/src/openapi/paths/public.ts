/**
 * Public Paths - /public/* (no authentication required)
 */

export const publicPaths = {
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
} as const;
