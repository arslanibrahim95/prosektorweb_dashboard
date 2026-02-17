# Production Deployment Checklist

## Overview

This checklist ensures all security fixes are properly deployed to production with comprehensive validation and monitoring. Follow each step carefully and mark items as completed.

## Pre-Deployment Requirements

### 1. Environment Configuration

- [ ] Generate `CUSTOM_JWT_SECRET` using cryptographically secure method:
  ```bash
  openssl rand -base64 32
  ```
- [ ] Add `CUSTOM_JWT_SECRET` to production environment (minimum 32 characters)
- [ ] Verify `CUSTOM_JWT_SECRET` is different from `SITE_TOKEN_SECRET`
- [ ] Confirm `SUPABASE_JWT_SECRET` is properly configured
- [ ] Remove any `SUPABASE_SERVICE_ROLE_KEY` fallback configurations
- [ ] Validate all required environment variables are present:
  - `SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SITE_TOKEN_SECRET`
  - `CUSTOM_JWT_SECRET`
  - `DASHBOARD_READ_RL_LIMIT`
  - `DASHBOARD_SEARCH_RL_LIMIT`
  - `DASHBOARD_EXPORT_RL_LIMIT`
  - `TRUSTED_PROXY_COUNT`
  - `AV_SCAN_ENABLED`
  - `AV_SCAN_FAIL_CLOSED`
  - `CLAMAV_HOST`
  - `CLAMAV_PORT`

### 2. Security Validation

- [ ] Review [`SECURITY_FIXES_SUMMARY.md`](../../SECURITY_FIXES_SUMMARY.md) for complete vulnerability remediation details
- [ ] Verify JWT type detection logic correctly distinguishes between Supabase and custom tokens
- [ ] Confirm authentication middleware properly validates both token types
- [ ] Ensure rate limiting is configured:
  - Token exchange: 10 requests per 15 minutes per IP
  - Token exchange: 20 requests per hour per user
  - Dashboard read: 120 requests per minute per user
  - Dashboard search: 30 requests per minute per user
  - Dashboard export: 3 requests per 10 minutes per user
- [ ] Verify `TRUSTED_PROXY_COUNT` matches real reverse-proxy hop count in production
- [ ] Validate CORS settings restrict origins to approved domains only
- [ ] If CV upload is public in production, enable AV scanning (`AV_SCAN_ENABLED=true`)
- [ ] Decide AV policy: fail-open (`AV_SCAN_FAIL_CLOSED=false`) vs fail-closed (`AV_SCAN_FAIL_CLOSED=true`)
- [ ] Review and update `.gitleaksignore` for new secrets
- [ ] Run secret scanning: `docker run zricethezav/gitleaks:latest detect`

### 3. Testing Requirements

- [ ] Execute complete test suite: `pnpm test`
- [ ] Run security-specific tests: `pnpm --filter api test auth-security`
- [ ] Perform manual authentication flow testing:
  - [ ] Supabase authentication flow
  - [ ] Token exchange endpoint
  - [ ] Custom JWT authentication
  - [ ] Token refresh mechanism
- [ ] Verify token expiration and refresh mechanisms function correctly
- [ ] Test rate limiting behavior:
  - [ ] IP-based rate limiting
  - [ ] User-based rate limiting
  - [ ] Rate limit headers in responses
- [ ] Validate error handling:
  - [ ] Returns appropriate status codes
  - [ ] Does not expose sensitive information
  - [ ] Logs errors securely
- [ ] Run load testing on authentication endpoints
- [ ] Perform security scanning with semgrep:
  ```bash
  docker run --rm -v "$PWD:/src" -w /src returntocorp/semgrep:latest semgrep scan --config p/ci
  ```

### 4. Documentation Review

- [ ] Read [`docs/security/AUTHENTICATION.md`](./AUTHENTICATION.md) for authentication architecture details
- [ ] Follow [`docs/security/MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) step-by-step for existing deployments
- [ ] Review [`docs/security/TESTING.md`](./TESTING.md) for ongoing security testing procedures
- [ ] Understand incident response procedures in security documentation
- [ ] Verify API documentation is updated with new authentication requirements
- [ ] Update team runbooks with new procedures

## Deployment Process

### 1. Staging Deployment

- [ ] Deploy updated codebase to staging environment
- [ ] Generate production-grade secrets using cryptographically secure methods
- [ ] Configure environment variables in staging
- [ ] Execute full test suite in staging environment:
  ```bash
  pnpm test
  pnpm --filter api test auth-security
  ```
- [ ] Perform load testing:
  - [ ] Authentication endpoints
  - [ ] Token exchange endpoint
  - [ ] Rate limiting behavior
- [ ] Run security scanning:
  - [ ] Secret scanning (gitleaks)
  - [ ] SAST scanning (semgrep)
  - [ ] Dependency audit (`pnpm audit`)
- [ ] Monitor logs for authentication errors or anomalies
- [ ] Verify metrics:
  - [ ] Authentication success rate >99%
  - [ ] Token exchange latency <100ms p95
  - [ ] Rate limit violations <1%
  - [ ] Error rates <0.1%

### 2. Production Deployment

- [ ] Schedule deployment during low-traffic period
- [ ] Create database backup before deployment:
  ```bash
  # Backup Supabase database
  pg_dump -h <host> -U <user> -d <database> > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Notify team of deployment window
- [ ] Deploy application with zero-downtime strategy:
  ```bash
  docker-compose up -d --no-deps --build api
  docker-compose up -d --no-deps --build web
  ```
- [ ] Verify environment variables are correctly configured:
  ```bash
  docker-compose exec api env | grep -E "(CUSTOM_JWT|SITE_TOKEN)"
  ```
- [ ] Monitor authentication success rates immediately after deployment
- [ ] Check error logs for unexpected authentication failures:
  ```bash
  docker-compose logs -f api | grep -E "(ERROR|WARN|SECURITY)"
  ```
- [ ] Verify health checks pass:
  ```bash
  curl https://api.example.com/health
  ```
- [ ] Test authentication flows:
  - [ ] Supabase login
  - [ ] Token exchange
  - [ ] Custom JWT authentication
  - [ ] Token refresh

### 3. Post-Deployment Monitoring (24-48 hours)

- [ ] Monitor authentication success/failure rates
  - Target: >99% success rate
  - Alert if <95%
- [ ] Track JWT validation performance metrics
  - Target: <50ms p95
  - Alert if >100ms p95
- [ ] Review security logs for suspicious activity:
  ```bash
  docker-compose logs api | grep SECURITY
  ```
- [ ] Verify rate limiting is functioning correctly:
  ```bash
  docker-compose logs api | grep "RATE_LIMITED"
  ```
- [ ] Monitor API response times for performance degradation
  - Target: <200ms p95
  - Alert if >500ms p95
- [ ] Check for any unexpected error patterns
- [ ] Review audit logs for token exchange activity
- [ ] Monitor resource usage (CPU, memory, network)
- [ ] Check database connection pool health
- [ ] Verify no memory leaks in authentication code

## Rollback Plan

### Preparation

- [ ] Maintain previous deployment version for immediate rollback capability
- [ ] Document rollback procedure including environment variable restoration
- [ ] Test rollback process in staging environment before production deployment
- [ ] Establish clear rollback decision criteria:
  - Authentication success rate <95%
  - Error rate >1%
  - Critical security vulnerability discovered
  - Performance degradation >50%
- [ ] Define rollback authorization process (who can authorize)

### Rollback Procedure

If rollback is needed:

1. **Immediate Actions:**
   ```bash
   # Rollback to previous version
   git revert <commit-hash>
   docker-compose up -d
   ```

2. **Restore Environment:**
   - Remove `CUSTOM_JWT_SECRET` from environment
   - Restore previous configuration
   - Verify service health

3. **Verify Service:**
   - Test authentication flows
   - Check error rates
   - Monitor logs
   - Verify metrics return to normal

4. **Post-Rollback:**
   - Document reason for rollback
   - Analyze root cause
   - Plan remediation
   - Schedule new deployment

## Success Criteria

### Functional Requirements

- [ ] Zero critical security vulnerabilities remaining
- [ ] All authentication tests passing (100% success rate)
- [ ] Authentication response times within acceptable thresholds (<200ms p95)
- [ ] No increase in authentication failure rates post-deployment
- [ ] Rate limiting effectively preventing abuse
- [ ] Token exchange functioning correctly
- [ ] Custom JWT validation working as expected
- [ ] Middleware error handling preventing information leakage

### Performance Requirements

- [ ] Authentication latency <200ms p95
- [ ] Token exchange latency <100ms p95
- [ ] Rate limit check latency <10ms p95
- [ ] No memory leaks detected
- [ ] CPU usage within normal range
- [ ] Database connection pool healthy

### Security Requirements

- [ ] JWT secrets properly separated
- [ ] Token type detection preventing manipulation
- [ ] Rate limiting preventing abuse
- [ ] Error handling not exposing sensitive information
- [ ] Audit logging capturing security events
- [ ] No secrets in logs or error messages

### Documentation Requirements

- [ ] Comprehensive security documentation accessible to team
- [ ] Migration guide available and tested
- [ ] Testing procedures documented
- [ ] Incident response procedures documented
- [ ] API documentation updated

## Support and Maintenance

### Immediate Post-Deployment (0-48 hours)

- [ ] Establish on-call rotation for post-deployment monitoring period
- [ ] Set up real-time alerting for:
  - Authentication failure rate >5%
  - Rate limit violations >10 per minute
  - Error rate >1%
  - Response time >500ms p95
- [ ] Monitor Slack/communication channels for user reports
- [ ] Review logs every 4 hours
- [ ] Conduct team sync every 12 hours

### Short-Term (1-2 weeks)

- [ ] Document escalation procedures for security incidents
- [ ] Schedule security review meeting 48 hours post-deployment
- [ ] Analyze authentication patterns and metrics
- [ ] Identify any optimization opportunities
- [ ] Update documentation based on deployment experience

### Long-Term

- [ ] Plan regular security audits (quarterly recommended)
- [ ] Maintain security patch update schedule
- [ ] Schedule secret rotation (every 90 days)
- [ ] Review and update rate limiting thresholds based on usage patterns
- [ ] Conduct post-mortem if any issues occurred

## Incident Response

### If Security Incident Occurs

1. **Immediate Actions:**
   - [ ] Rotate `CUSTOM_JWT_SECRET` immediately
   - [ ] Invalidate all active sessions
   - [ ] Block suspicious IP addresses
   - [ ] Enable enhanced logging

2. **Investigation:**
   - [ ] Analyze authentication logs
   - [ ] Check for unauthorized access
   - [ ] Review rate limit violations
   - [ ] Identify attack patterns
   - [ ] Document timeline of events

3. **Recovery:**
   - [ ] Deploy new secrets
   - [ ] Force re-authentication for all users
   - [ ] Update security measures
   - [ ] Communicate with affected users
   - [ ] Document incident and lessons learned

4. **Post-Incident:**
   - [ ] Conduct root cause analysis
   - [ ] Update security procedures
   - [ ] Implement additional safeguards
   - [ ] Train team on new procedures
   - [ ] Schedule follow-up security audit

## Sign-Off

### Pre-Deployment Sign-Off

- [ ] Security Team Lead: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Engineering Manager: _________________ Date: _______

### Post-Deployment Sign-Off

- [ ] Deployment Successful: _________________ Date: _______
- [ ] Monitoring Verified: _________________ Date: _______
- [ ] Security Review Complete: _________________ Date: _______

## Notes

Use this section to document any issues, observations, or deviations from the checklist:

```
Date: _______
Issue: _______
Resolution: _______
```

---

**Last Updated:** 2026-02-13
**Version:** 1.0
**Owner:** Security Team
