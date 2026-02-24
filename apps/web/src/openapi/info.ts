/**
 * OpenAPI Info, Servers, and Tags
 */

export const openApiInfo = {
    openapi: '3.0.3' as const,
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
} as const;
