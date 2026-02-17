# ProsektorWeb Dashboard API Documentation

## Overview

The ProsektorWeb Dashboard API is a Next.js 16 App Router API that provides comprehensive endpoints for managing sites, content, analytics, HR, and more. This document explains how to access, use, and maintain the API documentation.

## Accessing the API Documentation

### Interactive Documentation (Scalar UI)

Visit the interactive API documentation at:

```
http://localhost:3001/api/docs/ui
```

Or in production:

```
https://your-domain.com/api/docs/ui
```

The interactive documentation provides:
- **Searchable endpoint list** - Find endpoints quickly
- **Try it out** - Test endpoints directly from the browser
- **Request/response examples** - See realistic data examples
- **Authentication testing** - Test with your actual tokens
- **Schema validation** - Understand request/response structures

### OpenAPI Specification (JSON)

The raw OpenAPI 3.0 specification is available at:

```
http://localhost:3001/api/docs
```

This JSON file can be:
- Imported into Postman, Insomnia, or other API clients
- Used to generate client SDKs
- Integrated into CI/CD pipelines for API testing
- Used with code generation tools

## Authentication

The API supports two authentication methods:

### 1. Bearer Token (Supabase JWT)

Standard Supabase JWT tokens obtained through authentication:

```bash
curl -H "Authorization: Bearer <supabase-jwt-token>" \
  http://localhost:3001/api/me
```

### 2. Custom JWT

Long-lived custom tokens obtained via the token exchange endpoint:

**Step 1: Exchange Supabase token for custom JWT**

```bash
curl -X POST http://localhost:3001/api/auth/token \
  -H "Authorization: Bearer <supabase-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"rememberMe": true}'
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "refresh_token_here",
  "expires_at": "2026-03-16T09:00:00.000Z",
  "token_type": "Bearer"
}
```

**Step 2: Use custom JWT for subsequent requests**

```bash
curl -H "Authorization: Bearer <custom-jwt-token>" \
  http://localhost:3001/api/dashboard/summary?site_id=<uuid>
```

### Token Lifetimes

- **Supabase JWT**: 1 hour (default)
- **Custom JWT (rememberMe: false)**: 24 hours
- **Custom JWT (rememberMe: true)**: 30 days

## Rate Limiting

All authenticated endpoints are rate-limited to prevent abuse. Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1710576000
```

**Common Rate Limits:**
- Authentication endpoints: 10 requests per 15 minutes (per IP)
- Dashboard/Analytics: 100 requests per hour (per user)
- Admin endpoints: 50 requests per hour (per user)
- Public endpoints: 5 requests per minute (per IP)

When rate limited, you'll receive a `429 Too Many Requests` response:

```json
{
  "code": "RATE_LIMITED",
  "message": "Too many requests. Please try again later."
}
```

## Common Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

### Error Response

All errors follow a consistent format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field_name": ["Error message for this field"]
  }
}
```

### Paginated Response

List endpoints return paginated data:

```json
{
  "items": [...],
  "total": 100
}
```

**Pagination Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

## Error Codes

### Authentication & Authorization (1xxx)

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `TOKEN_EXPIRED` | 401 | Token has expired |
| `INVALID_TOKEN` | 401 | Token is malformed or invalid |

### Validation Errors (2xxx)

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_REQUEST_BODY` | 400 | Request body is invalid |
| `INVALID_UUID` | 400 | UUID format is invalid |
| `INVALID_FILE_TYPE` | 400 | File type not allowed |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |

### Not Found Errors (3xxx)

| Code | Status | Description |
|------|--------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `SITE_NOT_FOUND` | 404 | Site not found |
| `PAGE_NOT_FOUND` | 404 | Page not found |

### Business Logic Errors (4xxx)

| Code | Status | Description |
|------|--------|-------------|
| `CONFLICT` | 409 | Resource already exists |
| `SLUG_EXISTS` | 409 | Slug is already in use |
| `RESOURCE_LOCKED` | 423 | Resource is locked |

### Server Errors (5xxx)

| Code | Status | Description |
|------|--------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service unavailable |

## API Endpoint Categories

### Authentication
- `POST /api/auth/token` - Exchange Supabase token for custom JWT

### User
- `GET /api/me` - Get current user information

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary statistics

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/timeline` - Get time-series analytics data

### Inbox
- `GET /api/inbox/hr-applications` - List job applications
- `GET /api/inbox/contact` - List contact messages
- `GET /api/inbox/offers` - List offer requests
- `POST /api/inbox/{type}/{id}/read` - Mark item as read
- `POST /api/inbox/{type}/bulk-read` - Mark multiple items as read
- `GET /api/inbox/{type}/export` - Export to CSV

### Content Management
- `GET /api/pages` - List pages
- `POST /api/pages` - Create page
- `GET /api/pages/{id}` - Get page details
- `PUT /api/pages/{id}` - Update page
- `DELETE /api/pages/{id}` - Delete page
- `GET /api/pages/{id}/revisions` - Get page revision history
- `GET /api/legal-texts` - List legal texts
- `POST /api/legal-texts` - Create legal text
- `PUT /api/legal-texts/{id}` - Update legal text

### Sites
- `GET /api/sites` - List sites
- `POST /api/sites` - Create site
- `GET /api/sites/{id}` - Get site details
- `PATCH /api/sites/{id}` - Update site
- `DELETE /api/sites/{id}` - Delete site
- `GET /api/sites/{id}/seo` - Get SEO settings
- `PUT /api/sites/{id}/seo` - Update SEO settings
- `POST /api/sites/{id}/site-token` - Generate site token

### Domains
- `GET /api/domains` - List domains
- `POST /api/domains` - Add domain
- `DELETE /api/domains/{id}` - Delete domain

### Modules
- `GET /api/modules` - List modules
- `PATCH /api/modules/{id}` - Update module configuration

### HR (Human Resources)
- `GET /api/hr/job-posts` - List job posts
- `POST /api/hr/job-posts` - Create job post
- `GET /api/hr/job-posts/{id}` - Get job post details
- `PATCH /api/hr/job-posts/{id}` - Update job post
- `DELETE /api/hr/job-posts/{id}` - Delete job post
- `GET /api/hr/job-posts/check-slug` - Check slug availability
- `GET /api/hr/applications/{id}/cv-url` - Get CV download URL

### Team Management
- `GET /api/tenant-members` - List team members
- `POST /api/tenant-members/invite` - Invite team member
- `PATCH /api/tenant-members/{id}` - Update member role
- `DELETE /api/tenant-members/{id}` - Remove team member

### Publishing
- `POST /api/publish` - Publish site

### Public Endpoints (No Authentication)
- `POST /api/public/contact/submit` - Submit contact form
- `POST /api/public/offer/submit` - Submit offer request
- `POST /api/public/hr/apply` - Submit job application (with CV upload)

### Admin Endpoints (Admin Only)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create/invite user
- `GET /api/admin/users/{id}` - Get user details
- `PATCH /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/analytics` - Get system-wide analytics
- `GET /api/admin/dashboard` - Get admin dashboard data

## Updating the OpenAPI Specification

When adding or modifying API endpoints, update the OpenAPI specification to keep documentation in sync.

### Step 1: Edit the Spec File

Open [`apps/api/src/openapi/spec.ts`](../src/openapi/spec.ts) and update the relevant sections:

```typescript
export const openApiSpec = {
  // ... existing spec
  paths: {
    // Add or modify endpoint
    '/your-new-endpoint': {
      get: {
        tags: ['YourCategory'],
        summary: 'Brief description',
        description: 'Detailed description',
        operationId: 'uniqueOperationId',
        security: [{ bearerAuth: [] }],
        parameters: [
          // Query/path parameters
        ],
        requestBody: {
          // Request body schema
        },
        responses: {
          '200': {
            description: 'Success response',
            content: {
              'application/json': {
                schema: {
                  // Response schema
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' }
        }
      }
    }
  }
};
```

### Step 2: Add Reusable Components (Optional)

If you have common schemas, add them to the `components` section:

```typescript
components: {
  schemas: {
    YourNewSchema: {
      type: 'object',
      required: ['field1', 'field2'],
      properties: {
        field1: { type: 'string' },
        field2: { type: 'integer' }
      }
    }
  }
}
```

### Step 3: Test the Documentation

1. Start the development server:
   ```bash
   cd apps/api
   pnpm dev
   ```

2. Visit http://localhost:3001/api/docs/ui

3. Verify your changes appear correctly

4. Test the endpoint using the "Try it out" feature

### Best Practices

1. **Use descriptive operation IDs**: Make them unique and descriptive (e.g., `createJobPost`, not `post1`)

2. **Include examples**: Add realistic example values in schemas

3. **Document all parameters**: Include descriptions for all query, path, and body parameters

4. **Reference common responses**: Use `$ref` for standard error responses

5. **Keep descriptions clear**: Write concise but informative descriptions

6. **Tag appropriately**: Use consistent tags to group related endpoints

7. **Specify security**: Always include security requirements for protected endpoints

## File Upload Endpoints

### CV Upload (`/api/public/hr/apply`)

**Validation Rules:**
- **File type**: PDF, DOC, DOCX (`.pdf`, `.doc`, `.docx`)
- **Max size**: 5 MB
- **Content validation**: MIME + magic-bytes verification with structure checks
- **Malware scanning**:
  - Built-in signature check (defense-in-depth)
  - Optional ClamAV scan when `AV_SCAN_ENABLED=true`

**Example:**

```bash
curl -X POST http://localhost:3001/api/public/hr/apply \
  -F "site_token=<token>" \
  -F "job_post_id=<uuid>" \
  -F "full_name=John Doe" \
  -F "email=john@example.com" \
  -F "phone=+1234567890" \
  -F "kvkk_consent=true" \
  -F "cv_file=@/path/to/resume.pdf"
```

See [`CV_UPLOAD_VALIDATION.md`](./security/CV_UPLOAD_VALIDATION.md) for detailed security information.

## Testing with cURL

### Get Dashboard Summary

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/dashboard/summary?site_id=<uuid>"
```

### Create a Page

```bash
curl -X POST http://localhost:3001/api/pages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "<uuid>",
    "title": "About Us",
    "slug": "about",
    "content": {},
    "meta_title": "About Us - Company Name",
    "meta_description": "Learn more about our company"
  }'
```

### List Job Applications

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/inbox/hr-applications?site_id=<uuid>&page=1&limit=20"
```

### Export Contact Messages to CSV

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/inbox/contact/export?site_id=<uuid>" \
  -o contacts.csv
```

## Testing with Postman

1. **Import OpenAPI Spec**:
   - Open Postman
   - Click "Import" → "Link"
   - Enter: `http://localhost:3001/api/docs`
   - Click "Import"

2. **Set up Authentication**:
   - Go to Collection settings
   - Select "Authorization" tab
   - Type: "Bearer Token"
   - Token: `<your-jwt-token>`

3. **Test Endpoints**:
   - All endpoints will be organized by tags
   - Click any endpoint to see details
   - Click "Send" to test

## Environment Variables

Key environment variables for the API:

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# JWT
JWT_SECRET=your-secret-key

# Rate Limiting
DASHBOARD_READ_RATE_LIMIT=100
DASHBOARD_READ_RATE_WINDOW_SEC=3600

# File Upload
MAX_CV_SIZE_MB=5
ALLOWED_CV_TYPES=application/pdf
```

See [`.env.example`](../.env.example) for a complete list.

## Support

For questions or issues:
- Check the interactive documentation at `/api/docs/ui`
- Review error codes in this document
- Check the OpenAPI spec at `/api/docs`
- Contact the development team

## Version History

- **v1.0.0** (2026-02-14): Initial OpenAPI documentation release
  - Complete endpoint coverage
  - Interactive Scalar UI
  - Comprehensive error documentation
  - Authentication guide
