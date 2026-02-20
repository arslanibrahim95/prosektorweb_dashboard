# ProsektorWeb Dashboard

Multi-tenant dashboard monorepo.

- `apps/web`: Next.js dashboard (UI, UX, onboarding, inbox, builder panel)
- `apps/api`: Next.js API app (auth, admin, rate-limit, backend routes)
- `packages/*`: shared contracts, DB migrations, design tokens, test helpers

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Common Commands

```bash
# quality
pnpm lint
pnpm test:api
pnpm test:web

# strict check
pnpm hygiene:git
```

## Deployment

- Preview + production workflow configuration:
  - `docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md`
- Supabase DB validation checklist:
  - `docs/db/supabase-validation-checklist.md`
  - `docs/db/supabase-validation-runbook.sql`
  - `docs/db/supabase-backend-validation-walkthrough.md`

## UX/UI Agent Team Kurgusu

Bu repo icin onerilen hiyerarsi:

| Rol | Model | Sorumluluk |
|---|---|---|
| CTO | `opus` | Mimari karar, risk analizi, final code review |
| PO | `sonnet` | Backlog, task kirilimi, acceptance kontrolu |
| Coder (xN) | `haiku` | Paralel implementasyon, fix, test/lint |

### Sprint Akisi

1. CTO sprint hedefini netlestirir (scope + risk).
2. PO isleri tasklara boler (`pending`).
3. Coder agentlar paralel uygular (`in_progress`).
4. PO acceptance kriterlerine gore dogrular.
5. CTO kritik degisiklikleri review eder.
6. `completed` olanlar merge edilir.

### UX/UI Odakli Gorev Dagitimi (Template)

- `dev-agent-ux`: responsive, empty-state, loading/skeleton, a11y.
- `dev-agent-ui`: component consistency, design token kullanimi, visual hierarchy.
- `dev-agent-flow`: onboarding, settings, dashboard page flows.

### Task Sablonu

```md
Task:
Scope:
Files:
Acceptance Criteria:
- [ ] Type-safe
- [ ] Empty/loading/error states
- [ ] a11y kontrolu
- [ ] lint/test gecti

Validation:
- pnpm --filter web exec tsc --noEmit
- pnpm --filter web lint
- pnpm --filter web test
```

## Raporlama Standardi

Rapor ciktilari icin ana referans:

- `AGENTS.md`
- `docs/agents.md`

Minimum rapor basliklari:

1. Status + P0/P1/P2 sayimi
2. Executive Summary
3. Scope (in/out)
4. Findings
5. Faz bazli plan
6. Acceptance checklist
7. Decision log
