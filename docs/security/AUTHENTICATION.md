# Authentication Security Guide

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

## Overview

This document describes the security measures implemented in the authentication system, including critical fixes applied to address vulnerabilities in the dual authentication (Supabase + Custom JWT) implementation.

## Critical Security Fixes Applied

### 1. Separate JWT Secrets (CRITICAL)

**Problem:** The original implementation used `SITE_TOKEN_SECRET` for both public form validation and custom JWT authentication. This created a severe security vulnerability where a compromised site token could be used to forge authentication JWTs.

**Solution:** Implemented dedicated `CUSTOM_JWT_SECRET` environment variable:

```typescript
// apps/api/src/server/env.ts
export interface ServerEnv {
  siteTokenSecret: string;      // For public form validation
  customJwtSecret: string;       // For authentication JWTs (NEW)
  // ...
}
```

**Validation:** The system now validates that these secrets are different:

```typescript
if (siteTokenSecret === customJwtSecret) {
  throw new Error(
    "SECURITY ERROR: CUSTOM_JWT_SECRET must be different from SITE_TOKEN_SECRET"
  );
}
```

**Setup:**
```bash
# Generate separate secrets
openssl rand -base64 32  # For SITE_TOKEN_SECRET
openssl rand -base64 32  # For CUSTOM_JWT_SECRET

# Add to .env
SITE_TOKEN_SECRET=<first-secret>
CUSTOM_JWT_SECRET=<second-secret>
```

### 2. JWT Type Detection (CRITICAL)

**Problem:** The original implementation decoded JWT headers without validation to determine token type. An attacker could craft a malicious JWT with manipulated headers to bypass authentication.

**Solution:** Improved token type detection using payload inspection:

```typescript
// Check issuer (iss) claim in payload, not just header
const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

if (payload.iss === CUSTOM_JWT_ISSUER && payload.aud === CUSTOM_JWT_AUDIENCE) {
  return { token, type: 'custom' };
}

if (payload.iss && payload.iss.includes('supabase.co')) {
  return { token, type: 'supabase' };
}
```

**Security Benefits:**
- Prevents header manipulation attacks
- Validates issuer claim before type determination
- Proper error handling for malformed tokens
- Logging for security monitoring

### 3. Service Role Key Fallback Removed (WARNING)

**Problem:** The code allowed falling back to the service role key as the anon key in non-production environments, potentially masking RLS issues.

**Solution:** Removed the fallback logic:

```typescript
// BEFORE (DANGEROUS):
const supabaseAnonKey =
  pickEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  (process.env.NODE_ENV !== "production" ? supabaseServiceRoleKey : undefined);

// AFTER (SECURE):
const supabaseAnonKey =
  pickEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  pickEnv("SUPABASE_ANON_KEY");
if (!supabaseAnonKey) {
  throw new Error("Missing required env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
```

### 4. Rate Limiting on Token Exchange (WARNING)

**Problem:** The token exchange endpoint lacked rate limiting, allowing potential abuse.

**Solution:** Implemented dual-layer rate limiting:

```typescript
// Layer 1: IP-based rate limiting (before authentication)
await enforceRateLimit(
  admin,
  `rl:token-exchange:ip:${ipHash}`,
  10,  // 10 requests per 15 minutes per IP
  900
);

// Layer 2: User-based rate limiting (after authentication)
await enforceRateLimit(
  admin,
  rateLimitAuthKey('token-exchange', userId, userId),
  20,  // 20 requests per hour per user
  3600
);
```

**Benefits:**
- Prevents brute force attacks
- Limits token generation per user
- Protects against distributed attacks

### 5. Middleware Error Handling (WARNING)

**Problem:** The middleware had insufficient error handling, potentially exposing system details or causing authentication failures.

**Solution:** Comprehensive error handling:

```typescript
async function getSupabaseClient(req: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Missing Supabase environment variables');
    return null;  // Return null instead of throwing
  }

  try {
    return createServerClient(/* ... */);
  } catch (error) {
    console.error('[Middleware] Failed to create Supabase client:', error);
    return null;
  }
}
```

**Security Benefits:**
- No information leakage to clients
- Graceful degradation
- Proper logging for monitoring
- 30-second buffer for session expiration to prevent race conditions

## Authentication Flow

### 1. Supabase Authentication

```
Client → Supabase Auth → JWT Token → API
                                    ↓
                              Validate Session
                                    ↓
                              Check Tenant Membership
                                    ↓
                              Load Permissions
                                    ↓
                              Return Auth Context
```

### 2. Custom JWT Authentication

```
Client → Token Exchange → Custom JWT → API
         (Supabase)                    ↓
                                 Verify Signature
                                       ↓
                                 Validate Claims
                                       ↓
                                 Check Expiration
                                       ↓
                                 Return Auth Context
```

### 3. Token Exchange Process

```
1. Client authenticates with Supabase
2. Client calls /api/auth/token with Supabase token
3. API validates Supabase token
4. API checks rate limits (IP + User)
5. API generates custom JWT with:
   - User ID, email, name
   - Tenant ID
   - Role and permissions
   - Expiration (15min access, 7d refresh, 30d remember)
6. API returns custom JWT tokens
7. Client uses custom JWT for subsequent requests
```

## Token Types and Expiration

| Token Type | Expiration | Use Case |
|------------|-----------|----------|
| Access Token | 15 minutes | API requests |
| Refresh Token | 7 days | Token renewal |
| Remember Me Token | 30 days | Long-term sessions |

## Security Best Practices

### Secret Management

1. **Generate Strong Secrets:**
   ```bash
   openssl rand -base64 32
   ```

2. **Never Commit Secrets:**
   - Use `.env` files (gitignored)
   - Use environment variables in production
   - Use secret management services (AWS Secrets Manager, etc.)

3. **Rotate Secrets Regularly:**
   - Rotate `CUSTOM_JWT_SECRET` every 90 days
   - Rotate `SITE_TOKEN_SECRET` every 90 days
   - Coordinate rotation to avoid service disruption

### Rate Limiting Configuration

```env
# Token exchange rate limits
RATE_LIMIT_TOKEN_EXCHANGE_IP=10      # Per IP per 15 minutes
RATE_LIMIT_TOKEN_EXCHANGE_USER=20    # Per user per hour

# Dashboard rate limits
DASHBOARD_READ_RL_LIMIT=120          # Per user per minute
DASHBOARD_SEARCH_RL_LIMIT=30         # Per user per minute
DASHBOARD_EXPORT_RL_LIMIT=3          # Per user per 10 minutes
```

### Monitoring and Alerting

1. **Authentication Events to Monitor:**
   - Failed login attempts (>5 per minute)
   - Token exchange failures
   - Rate limit violations
   - Invalid token attempts
   - Session expiration patterns

2. **Logging:**
   ```typescript
   // Production logging
   console.info('[AUDIT] Token exchange', {
     userId,
     email,
     rememberMe,
     ip,
     timestamp,
   });

   console.warn('[SECURITY] Token exchange failed', {
     error: error.message,
     ip,
     timestamp,
   });
   ```

3. **Alerts:**
   - Set up alerts for:
     - High rate of authentication failures
     - Unusual token exchange patterns
     - Rate limit violations
     - System errors in authentication

## Testing

### Running Security Tests

```bash
# Run all authentication security tests
pnpm --filter api test auth-security

# Run with coverage
pnpm --filter api test:coverage auth-security
```

### Test Coverage

The security test suite covers:
- JWT secret separation validation
- Token type detection
- Token signature validation
- Token expiration
- Security headers and claims
- Error handling

## Deployment Checklist

Before deploying to production:

- [ ] Generate unique `CUSTOM_JWT_SECRET` (different from `SITE_TOKEN_SECRET`)
- [ ] Verify all environment variables are set
- [ ] Run security tests: `pnpm --filter api test auth-security`
- [ ] Run secret scanning: `docker run zricethezav/gitleaks:latest detect`
- [ ] Verify rate limiting configuration
- [ ] Set up monitoring and alerting
- [ ] Review audit logs
- [ ] Test token exchange endpoint
- [ ] Verify middleware error handling
- [ ] Check Docker secrets configuration

## Incident Response

If a security incident occurs:

1. **Immediate Actions:**
   - Rotate `CUSTOM_JWT_SECRET` immediately
   - Invalidate all active sessions
   - Review audit logs for suspicious activity
   - Block suspicious IP addresses

2. **Investigation:**
   - Analyze authentication logs
   - Check for unauthorized access
   - Review rate limit violations
   - Identify attack patterns

3. **Recovery:**
   - Deploy new secrets
   - Force re-authentication for all users
   - Update security measures
   - Document incident and lessons learned

## References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
