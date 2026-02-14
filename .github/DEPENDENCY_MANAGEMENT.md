# Dependency Management Guide

This document explains how automated dependency management works in the ProsektorWeb Dashboard project and how to handle dependency updates.

## Table of Contents

- [Overview](#overview)
- [Renovate Bot Configuration](#renovate-bot-configuration)
- [Update Types and Schedules](#update-types-and-schedules)
- [PR Review Process](#pr-review-process)
- [Handling Major Version Updates](#handling-major-version-updates)
- [Security Vulnerability Response](#security-vulnerability-response)
- [Package Grouping Strategy](#package-grouping-strategy)
- [Troubleshooting](#troubleshooting)

## Overview

We use [Renovate Bot](https://docs.renovatebot.com/) to automatically manage dependency updates across our monorepo. Renovate creates pull requests for dependency updates, which are then reviewed by our CI pipeline and team members.

### Key Benefits

- **Automated Updates**: Dependencies are automatically checked and updated
- **Grouped Updates**: Related packages are updated together to avoid conflicts
- **Security First**: Security vulnerabilities are addressed immediately
- **CI Integration**: All updates must pass our comprehensive test suite
- **Auto-merge**: Patch updates that pass CI are automatically merged

## Renovate Bot Configuration

Our Renovate configuration is defined in [`renovate.json`](../renovate.json) at the project root.

### Configuration Highlights

```json
{
  "extends": [
    "config:recommended",
    "group:monorepos",
    "group:recommended",
    ":semanticCommits"
  ],
  "timezone": "Europe/Istanbul",
  "prConcurrentLimit": 5,
  "prHourlyLimit": 2
}
```

- **Semantic Commits**: All PRs use conventional commit format
- **Rate Limiting**: Maximum 5 concurrent PRs, 2 per hour
- **Timezone**: Scheduled for Istanbul timezone (UTC+3)

## Update Types and Schedules

### Patch Updates (e.g., 1.2.3 → 1.2.4)

- **Schedule**: Anytime
- **Auto-merge**: ✅ Yes (if CI passes)
- **Labels**: `dependencies`
- **Review Required**: No (automated)

Patch updates contain bug fixes and are considered safe. They are automatically merged after passing CI.

### Minor Updates (e.g., 1.2.0 → 1.3.0)

- **Schedule**: Before 9am on Monday
- **Auto-merge**: ❌ No
- **Labels**: `dependencies`
- **Review Required**: Yes

Minor updates may include new features. They require manual review but are generally safe.

### Major Updates (e.g., 1.0.0 → 2.0.0)

- **Schedule**: Before 9am on the first day of the month
- **Auto-merge**: ❌ No
- **Labels**: `dependencies`, `major-update`
- **Review Required**: Yes (thorough review)

Major updates may contain breaking changes and require careful review and testing.

## PR Review Process

### Automated Checks

Every dependency update PR triggers:

1. **Linting**: ESLint checks across all workspaces
2. **Type Checking**: TypeScript compilation
3. **Unit Tests**: API and contract tests
4. **Database Tests**: RLS policy tests
5. **AI Code Review**: CodeRabbit analyzes changes

### Manual Review Checklist

When reviewing a dependency update PR:

- [ ] Check the changelog/release notes for breaking changes
- [ ] Verify all CI checks pass
- [ ] Review AI code review comments
- [ ] Test locally if the update affects critical functionality
- [ ] Check for deprecation warnings in the build output
- [ ] Ensure no new security vulnerabilities are introduced

### Approval Process

1. **Patch Updates**: Auto-merged if CI passes
2. **Minor Updates**: Requires 1 approval from any team member
3. **Major Updates**: Requires 2 approvals, including a senior developer

## Handling Major Version Updates

Major version updates require special attention due to potential breaking changes.

### Step-by-Step Process

1. **Review Release Notes**
   - Read the official migration guide
   - Identify breaking changes
   - Note deprecated features

2. **Create a Feature Branch**
   ```bash
   git checkout -b deps/major-update-<package-name>
   git pull origin renovate/<package-name>-<version>
   ```

3. **Update Code**
   - Address breaking changes
   - Update deprecated API usage
   - Modify tests if needed

4. **Test Thoroughly**
   ```bash
   pnpm install
   pnpm lint
   pnpm test:api
   pnpm test:web
   pnpm test:e2e
   ```

5. **Update Documentation**
   - Update relevant documentation
   - Add migration notes if needed

6. **Request Review**
   - Tag senior developers
   - Provide context on changes made
   - Link to migration guides

### Common Major Update Scenarios

#### React/Next.js Updates

- Check for changes in App Router behavior
- Verify middleware compatibility
- Test SSR/SSG functionality
- Review image optimization changes

#### Supabase Updates

- Check for auth API changes
- Verify RLS policy compatibility
- Test real-time subscriptions
- Review storage API changes

#### Testing Framework Updates

- Update test syntax if needed
- Verify mock implementations
- Check for new assertion methods
- Update test configuration

## Security Vulnerability Response

Security vulnerabilities are treated with highest priority.

### Automated Response

```json
{
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"],
    "schedule": ["at any time"]
  }
}
```

- **Schedule**: Immediate (any time)
- **Labels**: `security`, `dependencies`
- **Priority**: Critical

### Response Timeline

| Severity | Response Time | Action Required |
|----------|--------------|-----------------|
| Critical | < 4 hours | Immediate patch and deploy |
| High | < 24 hours | Review and merge within 1 day |
| Moderate | < 1 week | Review in next sprint |
| Low | < 1 month | Include in regular updates |

### Security Update Process

1. **Notification**: Renovate creates PR with `security` label
2. **Assessment**: Review vulnerability details and impact
3. **Testing**: Run full test suite
4. **Deployment**: Deploy to staging first, then production
5. **Verification**: Confirm vulnerability is resolved
6. **Documentation**: Update security log

## Package Grouping Strategy

Related packages are grouped together to avoid dependency conflicts.

### Defined Groups

#### React Ecosystem
```json
{
  "matchPackagePatterns": ["^react", "^@types/react"],
  "groupName": "react"
}
```
Includes: `react`, `react-dom`, `@types/react`, `@types/react-dom`

#### Next.js
```json
{
  "matchPackagePatterns": ["^next", "^eslint-config-next"],
  "groupName": "nextjs"
}
```
Includes: `next`, `eslint-config-next`

#### Supabase
```json
{
  "matchPackagePatterns": ["^@supabase"],
  "groupName": "supabase"
}
```
Includes: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`

#### TanStack (React Query)
```json
{
  "matchPackagePatterns": ["^@tanstack"],
  "groupName": "tanstack"
}
```
Includes: `@tanstack/react-query`, `@tanstack/react-table`

#### Testing
```json
{
  "matchPackagePatterns": ["^vitest", "^@playwright", "^@testing"],
  "groupName": "testing"
}
```
Includes: `vitest`, `@playwright/test`, `@testing-library/react`

#### Radix UI
```json
{
  "matchPackagePatterns": ["^radix-ui", "^@radix-ui"],
  "groupName": "radix-ui"
}
```
Includes: All `@radix-ui/*` packages

#### Linting/Formatting
```json
{
  "matchPackagePatterns": ["^eslint", "^prettier", "^@typescript-eslint"],
  "groupName": "linting"
}
```
Includes: `eslint`, `prettier`, `@typescript-eslint/*`

### Why Grouping Matters

- **Compatibility**: Related packages often have peer dependency requirements
- **Testing**: Changes can be tested together
- **Review**: Easier to review related changes in one PR
- **Conflicts**: Reduces merge conflicts from multiple PRs

## Troubleshooting

### Common Issues

#### 1. Renovate PR Fails CI

**Symptoms**: PR created but CI checks fail

**Solutions**:
- Check if breaking changes were introduced
- Review error logs in GitHub Actions
- Test locally with the updated dependencies
- May need to update code to accommodate changes

#### 2. Merge Conflicts

**Symptoms**: Renovate PR has merge conflicts

**Solutions**:
```bash
# Rebase the Renovate branch
git checkout renovate/<branch-name>
git rebase main
git push --force-with-lease
```

Or close the PR and let Renovate recreate it.

#### 3. Auto-merge Not Working

**Symptoms**: Patch updates not auto-merging

**Possible Causes**:
- CI checks failing
- Branch protection rules require reviews
- Renovate configuration issue

**Solutions**:
- Verify CI passes
- Check branch protection settings
- Review Renovate logs

#### 4. Too Many PRs

**Symptoms**: Overwhelming number of dependency PRs

**Solutions**:
- Adjust `prConcurrentLimit` in `renovate.json`
- Temporarily pause Renovate
- Create more package groups
- Adjust schedules

### Getting Help

- **Renovate Docs**: https://docs.renovatebot.com/
- **GitHub Issues**: Check Renovate's GitHub issues
- **Team Chat**: Ask in #engineering channel
- **Logs**: Check Renovate logs in PR comments

## Best Practices

1. **Review Regularly**: Check dependency PRs at least weekly
2. **Test Locally**: For major updates, always test locally first
3. **Read Changelogs**: Don't skip reading release notes
4. **Update Documentation**: Keep docs in sync with dependency changes
5. **Monitor CI**: Watch for patterns in CI failures
6. **Security First**: Prioritize security updates
7. **Communicate**: Inform team of significant dependency changes

## Related Documentation

- [CI/CD Pipeline](.github/workflows/ci.yml)
- [AI Code Review](.github/workflows/ai-code-review.yml)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Security Policy](../SECURITY.md)

---

**Last Updated**: 2026-02-14  
**Maintained By**: Engineering Team
