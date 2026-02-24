/**
 * OpenAPI Security Schemes
 */

export const securitySchemes = {
    bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from Supabase or /api/auth/token endpoint'
    }
} as const;
