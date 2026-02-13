# Security Testing Guide

## Overview

This document provides comprehensive testing procedures for the authentication system security fixes. Follow these procedures for ongoing security validation and before each deployment.

## Test Categories

### 1. Automated Security Tests
### 2. Manual Security Tests
### 3. Load Testing
### 4. Penetration Testing
### 5. Continuous Security Monitoring

---

## 1. Automated Security Tests

### Running the Test Suite

```bash
# Run all tests
pnpm test

# Run only security tests
pnpm --filter api test auth-security

# Run with coverage
pnpm --filter api test:coverage auth-security

# Run in watch mode for development
pnpm --filter api test:watch auth-security
```

### Test Coverage Requirements

Minimum coverage requirements:
- **Statements:** 90%
- **Branches:** 85%
- **Functions:** 90%
- **Lines:** 90%

### Security Test Suite

The [`apps/api/tests/api/auth-security.test.ts`](../../apps/api/tests/api/auth-security.test.ts) file includes:

#### JWT Secret Separation Tests
```typescript
✓ should use separate secrets for JWT and site tokens
✓ should throw error if secrets are the same
✓ should use custom JWT secret for signing tokens
```

#### Token Type Detection Tests
```typescript
✓ should detect custom JWT by issuer claim
✓ should reject malformed tokens
✓ should reject tokens with manipulated headers
✓ should handle missing authorization header
✓ should handle invalid bearer scheme
```

#### JWT Validation Tests
```typescript
✓ should validate custom JWT signature
✓ should reject JWT with invalid signature
✓ should reject expired JWT
```

#### Token Expiration Tests
```typescript
✓ should set correct expiration for access tokens (15 minutes)
✓ should set correct expiration for refresh tokens (7 days)
✓ should set correct expiration for remember_me tokens (30 days)
```

#### Security Headers Tests
```typescript
✓ should include required JWT claims (sub, iss, aud, iat, exp, tenant_id, email, role, permissions)
```

### Running Specific Test Suites

```bash
# Test JWT secret separation
pnpm --filter api test -- --grep "JWT Secret Separation"

# Test token type detection
pnpm --filter api test -- --grep "Token Type Detection"

# Test JWT validation
pnpm --filter api test -- --grep "JWT Validation"

# Test token expiration
pnpm --filter api test -- --grep "Token Expiration"
```

---

## 2. Manual Security Tests

### Test 1: Token Exchange Flow

**Objective:** Verify token exchange endpoint works correctly with rate limiting.

**Steps:**
1. Authenticate with Supabase:
   ```bash
   curl -X POST https://api.example.com/auth/v1/token \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

2. Exchange Supabase token for custom JWT:
   ```bash
   curl -X POST https://api.example.com/api/auth/token \
     -H "Authorization: Bearer <supabase-token>" \
     -H "Content-Type: application/json" \
     -d '{"rememberMe": false}'
   ```

3. Verify response contains:
   - `access_token`
   - `refresh_token`
   - `expires_at`
   - `token_type: "Bearer"`

4. Test rate limiting (should fail after 10 requests):
   ```bash
   for i in {1..15}; do
     echo "Request $i"
     curl -X POST https://api.example.com/api/auth/token \
       -H "Authorization: Bearer <token>" \
       -w "\nStatus: %{http_code}\n"
   done
   ```

**Expected Results:**
- First 10 requests: 200 OK
- Requests 11-15: 429 Too Many Requests
- Rate limit headers present in all responses

### Test 2: Custom JWT Authentication

**Objective:** Verify custom JWT authentication works correctly.

**Steps:**
1. Obtain custom JWT from token exchange
2. Use custom JWT to access protected endpoint:
   ```bash
   curl https://api.example.com/api/me \
     -H "Authorization: Bearer <custom-jwt-token>"
   ```

3. Verify response contains user information:
   - `id`
   - `email`
   - `name`
   - `tenant`
   - `role`
   - `permissions`

4. Test with expired token (wait for expiration or use old token):
   ```bash
   curl https://api.example.com/api/me \
     -H "Authorization: Bearer <expired-token>"
   ```

**Expected Results:**
- Valid token: 200 OK with user data
- Expired token: 401 Unauthorized with error message

### Test 3: Token Type Detection

**Objective:** Verify system correctly identifies token types.

**Steps:**
1. Test with Supabase token:
   ```bash
   curl https://api.example.com/api/me \
     -H "Authorization: Bearer <supabase-token>"
   ```

2. Test with custom JWT:
   ```bash
   curl https://api.example.com/api/me \
     -H "Authorization: Bearer <custom-jwt-token>"
   ```

3. Test with malformed token:
   ```bash
   curl https://api.example.com/api/me \
     -H "Authorization: Bearer invalid.token.here"
   ```

4. Test with manipulated header token:
   ```bash
   # Create fake token with manipulated header
   FAKE_HEADER=$(echo -n '{"alg":"HS256","aud":"prosektor:api"}' | base64)
   FAKE_PAYLOAD=$(echo -n '{"sub":"attacker"}' | base64)
   FAKE_TOKEN="$FAKE_HEADER.$FAKE_PAYLOAD.fakesignature"
   
   curl https://api.example.com/api/me \
     -H "Authorization: Bearer $FAKE_TOKEN"
   ```

**Expected Results:**
- Supabase token: Authenticated successfully
- Custom JWT: Authenticated successfully
- Malformed token: 401 Unauthorized
- Manipulated token: 401 Unauthorized (not detected as custom JWT)

### Test 4: Middleware Error Handling

**Objective:** Verify middleware handles errors gracefully without exposing sensitive information.

**Steps:**
1. Test with missing authorization header:
   ```bash
   curl https://api.example.com/home
   ```

2. Test with invalid authorization scheme:
   ```bash
   curl https://api.example.com/home \
     -H "Authorization: Basic sometoken"
   ```

3. Test with expired session:
   ```bash
   curl https://api.example.com/home \
     -H "Authorization: Bearer <expired-token>"
   ```

**Expected Results:**
- All cases: Redirect to login page
- No sensitive information in error messages
- Appropriate reason parameter in redirect URL

### Test 5: Rate Limiting

**Objective:** Verify rate limiting works correctly across different endpoints.

**Steps:**
1. Test token exchange rate limiting (covered in Test 1)

2. Test dashboard read rate limiting:
   ```bash
   for i in {1..130}; do
     echo "Request $i"
     curl https://api.example.com/api/inbox/contact \
       -H "Authorization: Bearer <token>" \
       -w "\nStatus: %{http_code}\n"
   done
   ```

3. Test dashboard export rate limiting:
   ```bash
   for i in {1..5}; do
     echo "Request $i"
     curl https://api.example.com/api/inbox/contact/export \
       -H "Authorization: Bearer <token>" \
       -w "\nStatus: %{http_code}\n"
   done
   ```

**Expected Results:**
- Dashboard read: 429 after 120 requests per minute
- Dashboard export: 429 after 3 requests per 10 minutes
- Rate limit headers present in responses

---

## 3. Load Testing

### Setup

Install load testing tools:
```bash
# Install k6
brew install k6  # macOS
# or
sudo apt-get install k6  # Linux
```

### Load Test Script

Create `load-test-auth.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% of requests must complete below 200ms
    http_req_failed: ['rate<0.01'],    // Error rate must be below 1%
  },
};

export default function () {
  // Test token exchange
  const tokenExchangeRes = http.post(
    'https://api.example.com/api/auth/token',
    JSON.stringify({ rememberMe: false }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.SUPABASE_TOKEN}`,
      },
    }
  );

  check(tokenExchangeRes, {
    'token exchange status is 200': (r) => r.status === 200,
    'token exchange has access_token': (r) => r.json('access_token') !== undefined,
  });

  if (tokenExchangeRes.status === 200) {
    const customToken = tokenExchangeRes.json('access_token');

    // Test authenticated endpoint
    const meRes = http.get('https://api.example.com/api/me', {
      headers: {
        'Authorization': `Bearer ${customToken}`,
      },
    });

    check(meRes, {
      'me endpoint status is 200': (r) => r.status === 200,
      'me endpoint has user data': (r) => r.json('id') !== undefined,
    });
  }

  sleep(1);
}
```

### Running Load Tests

```bash
# Set environment variable
export SUPABASE_TOKEN="your-supabase-token"

# Run load test
k6 run load-test-auth.js

# Run with custom VUs and duration
k6 run --vus 50 --duration 5m load-test-auth.js
```

### Load Test Metrics

Monitor these metrics during load testing:
- **Response Time:** p95 < 200ms
- **Error Rate:** < 1%
- **Throughput:** > 100 requests/second
- **Rate Limit Violations:** < 5%

---

## 4. Penetration Testing

### Security Scanning Tools

#### 1. OWASP ZAP

```bash
# Run ZAP in daemon mode
docker run -u zap -p 8080:8080 -i owasp/zap2docker-stable zap.sh -daemon \
  -host 0.0.0.0 -port 8080 -config api.disablekey=true

# Run active scan
docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable zap-baseline.py \
  -t https://api.example.com -r zap-report.html
```

#### 2. Burp Suite

1. Configure Burp Suite proxy
2. Route application traffic through proxy
3. Run active scanner on authentication endpoints
4. Review findings and validate

#### 3. Nuclei

```bash
# Install nuclei
go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest

# Run nuclei scan
nuclei -u https://api.example.com -t cves/ -t vulnerabilities/
```

### Manual Penetration Tests

#### Test 1: JWT Manipulation

**Objective:** Verify JWT cannot be manipulated.

**Steps:**
1. Obtain valid JWT
2. Decode JWT and modify payload:
   ```bash
   # Decode JWT
   echo "<jwt-payload>" | base64 -d
   
   # Modify role to "super_admin"
   # Re-encode and create new token
   ```
3. Attempt to use modified token

**Expected Result:** 401 Unauthorized (signature validation fails)

#### Test 2: Token Replay Attack

**Objective:** Verify expired tokens cannot be reused.

**Steps:**
1. Obtain valid JWT
2. Wait for token to expire (or use old token)
3. Attempt to use expired token

**Expected Result:** 401 Unauthorized with "session expired" message

#### Test 3: Rate Limit Bypass

**Objective:** Verify rate limiting cannot be bypassed.

**Steps:**
1. Attempt to bypass rate limiting by:
   - Changing IP address
   - Using different user agents
   - Modifying headers
2. Monitor rate limit enforcement

**Expected Result:** Rate limiting enforced regardless of bypass attempts

#### Test 4: Information Disclosure

**Objective:** Verify error messages don't expose sensitive information.

**Steps:**
1. Send malformed requests
2. Send requests with invalid tokens
3. Trigger various error conditions
4. Review error messages

**Expected Result:** Generic error messages, no stack traces or sensitive data

---

## 5. Continuous Security Monitoring

### Automated Monitoring

#### 1. GitHub Actions Security Workflow

The [`.github/workflows/security.yml`](../../.github/workflows/security.yml) runs:
- Dependency audit
- Secret scanning (gitleaks)
- SAST scanning (semgrep)

**Schedule:** Weekly + on every push/PR

#### 2. Dependency Scanning

```bash
# Run dependency audit
pnpm audit --audit-level=moderate

# Check for outdated packages
pnpm outdated

# Update dependencies
pnpm update
```

#### 3. Secret Scanning

```bash
# Run gitleaks
docker run --rm -v "$PWD:/repo" -w /repo zricethezav/gitleaks:latest detect \
  --no-banner --redact

# Scan for secrets in history
docker run --rm -v "$PWD:/repo" -w /repo zricethezav/gitleaks:latest detect \
  --no-banner --redact --log-opts="--all"
```

### Runtime Monitoring

#### 1. Authentication Metrics

Monitor these metrics in production:
- Authentication success rate (target: >99%)
- Authentication failure rate (alert if >1%)
- Token exchange rate (baseline and alert on anomalies)
- Rate limit violations (alert if >10 per minute)
- JWT validation errors (alert on spikes)

#### 2. Security Logs

Monitor security-related log entries:
```bash
# Monitor authentication failures
docker-compose logs -f api | grep "SECURITY.*failed"

# Monitor rate limit violations
docker-compose logs -f api | grep "RATE_LIMITED"

# Monitor token exchange activity
docker-compose logs -f api | grep "AUDIT.*Token exchange"
```

#### 3. Alerting Rules

Set up alerts for:
- Authentication failure rate >5% for 5 minutes
- Rate limit violations >10 per minute
- JWT validation errors >10 per minute
- Response time p95 >500ms
- Error rate >1%

### Security Audit Schedule

| Frequency | Activity |
|-----------|----------|
| Daily | Review security logs |
| Weekly | Run automated security scans |
| Monthly | Review and update dependencies |
| Quarterly | Conduct penetration testing |
| Quarterly | Rotate secrets |
| Annually | Full security audit |

---

## Test Reporting

### Test Report Template

```markdown
# Security Test Report

**Date:** YYYY-MM-DD
**Tester:** Name
**Environment:** Staging/Production

## Test Summary

- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X

## Test Results

### Automated Tests
- [ ] All security tests passing
- [ ] Coverage requirements met
- [ ] No regressions detected

### Manual Tests
- [ ] Token exchange flow working
- [ ] Custom JWT authentication working
- [ ] Token type detection working
- [ ] Middleware error handling working
- [ ] Rate limiting working

### Load Tests
- [ ] Response time within thresholds
- [ ] Error rate within thresholds
- [ ] Rate limiting effective under load

### Penetration Tests
- [ ] No JWT manipulation possible
- [ ] No token replay attacks possible
- [ ] No rate limit bypass possible
- [ ] No information disclosure

## Issues Found

| Severity | Issue | Status |
|----------|-------|--------|
| High | Description | Open/Fixed |

## Recommendations

1. Recommendation 1
2. Recommendation 2

## Sign-Off

- Tester: _________________ Date: _______
- Reviewer: _________________ Date: _______
```

---

## Troubleshooting

### Common Test Failures

#### Test: "should use separate secrets for JWT and site tokens"

**Failure:** Secrets are the same
**Solution:** Generate new `CUSTOM_JWT_SECRET` different from `SITE_TOKEN_SECRET`

#### Test: "should detect custom JWT by issuer claim"

**Failure:** Token type detection not working
**Solution:** Verify `extractTokenFromRequest()` implementation in `dual-auth.ts`

#### Test: "should validate custom JWT signature"

**Failure:** Signature validation failing
**Solution:** Verify `CUSTOM_JWT_SECRET` is correctly configured

### Test Environment Issues

#### Issue: Tests failing in CI but passing locally

**Possible Causes:**
- Environment variables not set in CI
- Different Node.js versions
- Timing issues

**Solutions:**
- Verify CI environment variables
- Use same Node.js version
- Add delays for timing-sensitive tests

#### Issue: Rate limiting tests failing

**Possible Causes:**
- Rate limit state not cleared between tests
- Concurrent test execution

**Solutions:**
- Clear rate limit state before tests
- Run rate limit tests sequentially

---

## Resources

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [k6 Documentation](https://k6.io/docs/)
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [Nuclei Documentation](https://nuclei.projectdiscovery.io/)
