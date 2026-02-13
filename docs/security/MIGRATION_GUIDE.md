# Security Fixes Migration Guide

## Overview

This guide helps you migrate from the previous authentication implementation to the new secure version with critical security fixes.

## Breaking Changes

### 1. New Required Environment Variable

**`CUSTOM_JWT_SECRET` is now required**

The system now requires a separate secret for custom JWT authentication. This is a **CRITICAL** security fix.

### 2. Service Role Key Fallback Removed

The dangerous fallback to service role key in non-production environments has been removed. You must now explicitly configure `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Migration Steps

### Step 1: Generate New Secret

Generate a new `CUSTOM_JWT_SECRET`:

```bash
openssl rand -base64 32
```

**IMPORTANT:** This secret MUST be different from your `SITE_TOKEN_SECRET`.

### Step 2: Update Environment Variables

#### Local Development (.env)

```bash
# Add to your .env file
CUSTOM_JWT_SECRET=<your-new-secret-here>

# Verify SITE_TOKEN_SECRET exists and is different
SITE_TOKEN_SECRET=<your-existing-secret>
```

#### Production Environment

Update your production environment variables:

**Docker Compose:**
```yaml
environment:
  CUSTOM_JWT_SECRET: ${CUSTOM_JWT_SECRET}
```

**Kubernetes:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
data:
  custom-jwt-secret: <base64-encoded-secret>
```

**AWS/Cloud:**
- AWS Secrets Manager: Add `CUSTOM_JWT_SECRET`
- Azure Key Vault: Add `CUSTOM_JWT_SECRET`
- Google Secret Manager: Add `CUSTOM_JWT_SECRET`

### Step 3: Update Docker Configuration

If using Docker Compose, ensure the new secret is passed:

```yaml
services:
  api:
    environment:
      CUSTOM_JWT_SECRET: ${CUSTOM_JWT_SECRET}
```

### Step 4: Verify Configuration

Run the configuration check:

```bash
# This will validate that secrets are properly configured
pnpm --filter api test auth-security
```

Expected output:
```
✓ should use separate secrets for JWT and site tokens
✓ should throw error if secrets are the same
```

### Step 5: Deploy

1. **Staging First:**
   ```bash
   # Deploy to staging
   docker-compose -f docker-compose.staging.yml up -d
   
   # Verify authentication works
   curl -H "Authorization: Bearer <token>" https://staging-api.example.com/api/me
   ```

2. **Production Deployment:**
   ```bash
   # Deploy to production
   docker-compose up -d
   
   # Monitor logs for errors
   docker-compose logs -f api
   ```

### Step 6: Verify Deployment

1. **Test Token Exchange:**
   ```bash
   curl -X POST https://api.example.com/api/auth/token \
     -H "Authorization: Bearer <supabase-token>" \
     -H "Content-Type: application/json" \
     -d '{"rememberMe": false}'
   ```

2. **Test Custom JWT:**
   ```bash
   curl https://api.example.com/api/me \
     -H "Authorization: Bearer <custom-jwt-token>"
   ```

3. **Check Rate Limiting:**
   ```bash
   # Should be rate limited after 10 requests
   for i in {1..15}; do
     curl -X POST https://api.example.com/api/auth/token \
       -H "Authorization: Bearer <token>"
   done
   ```

## Rollback Plan

If issues occur during migration:

### Immediate Rollback

1. **Revert to Previous Version:**
   ```bash
   git revert <commit-hash>
   docker-compose up -d
   ```

2. **Restore Previous Environment:**
   - Remove `CUSTOM_JWT_SECRET` from environment
   - Restore previous code version

### Gradual Rollback

If you need to maintain service:

1. **Keep Both Versions Running:**
   - Run old version on port 3001
   - Run new version on port 3002
   - Use load balancer to gradually shift traffic

2. **Monitor Metrics:**
   - Authentication success rate
   - Error rates
   - Response times

## Troubleshooting

### Error: "Missing required env: CUSTOM_JWT_SECRET"

**Cause:** The new environment variable is not set.

**Solution:**
```bash
# Generate and add the secret
openssl rand -base64 32 >> .env
echo "CUSTOM_JWT_SECRET=<paste-secret-here>" >> .env
```

### Error: "CUSTOM_JWT_SECRET must be different from SITE_TOKEN_SECRET"

**Cause:** You're using the same secret for both purposes.

**Solution:**
```bash
# Generate a new, different secret
openssl rand -base64 32
# Update CUSTOM_JWT_SECRET with the new value
```

### Error: "Missing required env: NEXT_PUBLIC_SUPABASE_ANON_KEY"

**Cause:** The service role key fallback was removed.

**Solution:**
```bash
# Add the anon key explicitly
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>" >> .env
```

### Authentication Failures After Migration

**Possible Causes:**
1. Old tokens still in use
2. Rate limiting triggered
3. Configuration mismatch

**Solutions:**

1. **Clear Old Tokens:**
   ```typescript
   // Force re-authentication for all users
   // In your database:
   UPDATE auth.sessions SET expires_at = NOW();
   ```

2. **Check Rate Limits:**
   ```sql
   -- View rate limit entries
   SELECT * FROM rate_limits 
   WHERE key LIKE 'rl:token-exchange%' 
   ORDER BY created_at DESC;
   
   -- Clear rate limits if needed (use with caution)
   DELETE FROM rate_limits WHERE key LIKE 'rl:token-exchange%';
   ```

3. **Verify Configuration:**
   ```bash
   # Check environment variables
   docker-compose exec api env | grep -E "(CUSTOM_JWT|SITE_TOKEN)"
   ```

### High Rate Limit Violations

**Cause:** Users or systems making too many token exchange requests.

**Solutions:**

1. **Identify Source:**
   ```bash
   # Check logs
   docker-compose logs api | grep "SECURITY.*Token exchange failed"
   ```

2. **Adjust Limits (if legitimate traffic):**
   ```env
   # In .env
   RATE_LIMIT_TOKEN_EXCHANGE_IP=20  # Increase from 10
   RATE_LIMIT_TOKEN_EXCHANGE_USER=40  # Increase from 20
   ```

3. **Block Malicious IPs:**
   ```nginx
   # In nginx config
   deny 192.168.1.100;
   ```

## Testing Checklist

Before considering migration complete:

- [ ] All environment variables set correctly
- [ ] Secrets are different (CUSTOM_JWT_SECRET ≠ SITE_TOKEN_SECRET)
- [ ] Security tests pass
- [ ] Token exchange works
- [ ] Custom JWT authentication works
- [ ] Rate limiting functions correctly
- [ ] Middleware error handling works
- [ ] Monitoring and alerting configured
- [ ] Audit logs are being generated
- [ ] Documentation updated

## Post-Migration Tasks

### 1. Monitor for 24 Hours

Watch for:
- Authentication errors
- Rate limit violations
- Unusual patterns
- Performance issues

### 2. Update Documentation

- Update deployment docs
- Update API documentation
- Update team runbooks

### 3. Security Audit

- Review audit logs
- Check for suspicious activity
- Verify rate limiting effectiveness

### 4. Performance Baseline

Establish new baselines for:
- Authentication latency
- Token exchange rate
- Error rates
- Resource usage

## Support

If you encounter issues during migration:

1. **Check Logs:**
   ```bash
   docker-compose logs -f api
   ```

2. **Run Diagnostics:**
   ```bash
   pnpm --filter api test auth-security
   ```

3. **Review Documentation:**
   - [Authentication Security Guide](./AUTHENTICATION.md)
   - [API Documentation](../api/api-contracts.md)

4. **Contact Support:**
   - Create an issue in the repository
   - Include logs and error messages
   - Describe steps to reproduce

## Timeline Recommendation

| Phase | Duration | Activities |
|-------|----------|------------|
| Preparation | 1 day | Generate secrets, update configs |
| Staging Deploy | 1 day | Deploy and test in staging |
| Monitoring | 2 days | Monitor staging for issues |
| Production Deploy | 1 day | Deploy to production |
| Post-Deploy Monitoring | 3 days | Monitor production closely |
| **Total** | **8 days** | Complete migration |

## Success Criteria

Migration is successful when:

1. ✅ All authentication flows work correctly
2. ✅ No increase in error rates
3. ✅ Rate limiting functions as expected
4. ✅ Security tests pass
5. ✅ Monitoring shows normal patterns
6. ✅ No security incidents reported
7. ✅ Performance metrics within acceptable range
8. ✅ Team trained on new system
