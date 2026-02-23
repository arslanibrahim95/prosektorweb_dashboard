# 📚 ProsektorWeb Dashboard Documentation

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Welcome to the central documentation repository for the ProsektorWeb Dashboard. This `docs/` folder contains the architectural decisions, design system guidelines, workflow definitions, and operational runbooks for the project. 

The project strictly follows a Vibe Coding methodology using autonomous, specialized agents.

## 🧭 Directory Structure and Maps

### 1. 🏗 Architecture & Core Design
- **[Global Architecture](architecture.md)**: Main architecture of the Dashboard (Supabase, Next.js, Vibe Coding).
- **[Admin Panel Architecture](admin-panel-architecture.md)**: Deep dive into the Super Admin management tier.
- **[Design System 2026](DESIGN_SYSTEM_2026.md)**: Core UI/UX and styling methodology using Tailwind + shadcn/ui.
- **[Site Engine Integration](site-engine-integration.md)**: How the Dashboard connects to the remote generative Site Engine.

### 2. 🤖 Agent Operations (`/agent-ops`)
The project enforces strict boundaries between generative AI roles (Frontend, Backend, UX, UI, CSS, QA, etc.).
- **[Agent Overview & Architecture](agent-ops/agents-index.md)**: Global agent collaboration rules and technical specification.
- **[Roles & Checklists](agent-ops/roles-and-checklists.md)**: Detailed input/output boundaries and Definition of Done (DoD) for generative agents.
- **[Agent Runbook](agent-ops/runbook.md)**: Standard operating procedures for running the agent chains.
- **[Quality Gates](agent-ops/quality-gates.md)**: Mandatory verification gates before merging code.

### 3. 📂 Domain-Specific Documentation
- **[API & Contracts](api/)**: Backend endpoints, tRPC guidelines, and Zod validator references.
- **[Database (DB)](db/)**: Postgres schema designs, Row Level Security (RLS) policies, and migrations.
- **[UX (User Experience)](ux/)**: Information Architecture (IA), onboarding flows, and screen specifications.
- **[UI (User Interface)](ui/)**: Component inventory, layouts, and accessibility requirements.
- **[Security](security/)**: Security reviews, Role-Based Access Control (RBAC), and authentication sync logic.
- **[Testing/QA](testing/)**: E2E testing strategies, Playwright test plans, and verification reports.

### 4. 🗂 Feature Deep-Dives
- **[UX Analysis Report](ux-analysis-report.md)**
- **[Onboarding UX Improvement](ONBOARDING_UX_IMPROVEMENT.md)**
- **[Comprehensive TS Codebase Review](../TYPESCRIPT_CODEBASE_REVIEW_REPORT.md)** (Root level file overviewing security/perf logic).

---

> **Note to AI Agents**: Before starting any task in "Plan Mode", consult the relevant sections here to ensure strict adherence to existing architectural boundaries and DoD checklist templates.

---

## 🌐 Language Policy (Dil Politikası)

Bu projede dokümantasyon dili içerik türüne göre belirlenmiştir:

| Kategori | Dil | Açıklama |
|----------|-----|----------|
| **Agent Operations** | 🇹🇷 Türkçe | Operasyonel prosedürler ve rollout planları |
| **UX/UI** | 🇹🇷 Türkçe | Kullanıcı deneyimi ve ekran spesifikasyonları |
| **Review/Findings** | 🇹🇷 Türkçe | Kod inceleme raporları ve bulgular |
| **Testing** | 🇹🇷 Türkçe | Test stratejileri ve CI süreçleri |
| **API Contracts** | 🇬🇧 English | Teknik API spesifikasyonları |
| **Security** | 🇬🇧 English | Güvenlik standartları ve protokoller |
| **Database** | 🇬🇧 English | Şema tanımları ve RLS politikaları |
| **Design System** | 🇬🇧 English | Token ve component referansları |

**Gerekçe:** Teknik içerik uluslararası standartlara uygun İngilizce, operasyonel ve kullanıcı odaklı içerik Türkçe tutulmuştur.
