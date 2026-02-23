# 🎨 Component Inventory Report

> **Agent:** UI Agent | **Date:** 2026-02-23

---

## Current Component Census

| Category | Count | Location |
|----------|-------|----------|
| UI Primitives (shadcn) | 39 | `components/ui/` |
| Layout | 9 | `components/layout/` |
| Admin Feature | 19 | `features/admin/components/` |
| Builder | 15 | `features/builder/components/` |
| Settings Feature | 4 | `features/settings/components/` |
| AB Testing | 3 | `features/ab-testing/components/` |
| Onboarding | 6 | `components/onboarding/` |
| Inbox | 5 | `components/inbox/` |
| **Total** | **~100** | |

---

## UI Primitives Inventory (`components/ui/`)

### ✅ Core shadcn/ui (Well-Maintained)

| Component | Size | forwardRef | Notes |
|-----------|------|------------|-------|
| [button.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/button.tsx) | 4.6K | ❌ | Uses `cva`, exports `buttonVariants` |
| [input.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/input.tsx) | 3.2K | ❌ | Password toggle, clearable variant |
| [card.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/card.tsx) | 4.2K | ❌ | Standard card with header/content/footer |
| [dialog.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/dialog.tsx) | 4.4K | ❌ | Radix-based |
| [tabs.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/tabs.tsx) | 3K | ❌ | Radix-based |
| [select.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/select.tsx) | 6.4K | ❌ | Radix-based |
| [badge.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/badge.tsx) | 4.2K | ❌ | Has `badge-success/warning/danger/info` utilities |
| [table.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/table.tsx) | 2.4K | ❌ | Basic Radix-free table |
| [form.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/form.tsx) | 3.8K | ❌ | react-hook-form integration |
| [tooltip.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/tooltip.tsx) | 1.7K | ✅ | Radix-based |
| [checkbox.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/checkbox.tsx) | 1.5K | ✅ | Radix-based |
| [switch.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/switch.tsx) | 1.4K | ❌ | Radix-based |
| [slider.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/slider.tsx) | 1.2K | ✅ | Radix-based |
| [label.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/label.tsx) | 0.6K | ❌ | |
| [separator.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/separator.tsx) | 0.7K | ❌ | |
| [textarea.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/textarea.tsx) | 0.8K | ❌ | |
| [avatar.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/avatar.tsx) | 1.5K | ✅ | Radix-based |
| [scroll-area.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/scroll-area.tsx) | 1.6K | ❌ | Radix-based |
| [sheet.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/sheet.tsx) | 4.2K | ❌ | Radix-based |
| [dropdown-menu.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/dropdown-menu.tsx) | 8.4K | ❌ | Radix-based |
| [sonner.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/sonner.tsx) | 1K | ❌ | Toast wrapper |

### 🔧 Custom UI Components

| Component | Size | Purpose |
|-----------|------|---------|
| [action-button.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/action-button.tsx) | 2.3K | Button with loading → success states |
| [animated-number.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/animated-number.tsx) | 1.4K | Number animation |
| [celebration.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/celebration.tsx) | 3K | Confetti/celebration effects |
| [confirm-dialog.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/confirm-dialog.tsx) | 2.4K | Destructive action confirm |
| [data-table.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/data-table.tsx) | 13.9K | Full-featured data table |
| [date-range-picker.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/date-range-picker.tsx) | 3.3K | Date range picker |
| [empty-state.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/empty-state.tsx) | 1.5K | Generic empty state |
| [error-boundary.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/error-boundary.tsx) | 4.4K | Error boundary + fallback UI |
| [skeleton.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/skeleton.tsx) | 2.9K | Loading skeleton |

### ⚠️ Large / Specialized Components (Review Needed)

| Component | Size | Concern |
|-----------|------|---------|
| [ai-accessibility.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/ai-accessibility.tsx) | **26.8K** | Oversized — utility bundle, not a single component |
| [micro-interactions.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/micro-interactions.tsx) | **26.1K** | Oversized — animation utilities bundle |
| [performance.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/performance.tsx) | **26.8K** | Oversized — perf utilities bundle |
| [glass-card.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/glass-card.tsx) | 11.9K | Multiple glass variants |
| [neo-button.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/neo-button.tsx) | 11K | Premium button with many effects |
| [card-3d.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/card-3d.tsx) | 13.9K | 3D tilt card |
| [tilt-card.tsx](file:///Users/root9581/Desktop/prosektorweb_dashboard/apps/web/src/components/ui/tilt-card.tsx) | 6.7K | Similar to card-3d (possible duplicate) |

---

## 🔴 Critical Findings

### 1. Duplicate EmptyState Pattern

Two separate empty-state components exist with different APIs:

| Component | Props Difference |
|-----------|-----------------|
| `ui/empty-state.tsx` | `icon: ReactNode`, action with `href` support |
| `admin/admin-empty-state.tsx` | `icon: LucideIcon`, action with `icon` support, uses `<Button>` |

> [!WARNING]
> **Action:** Merge into a single `EmptyState` with unified API, then alias `AdminEmptyState` for backwards compatibility.

### 2. Potential Duplicate Card Components

- `card-3d.tsx` (13.9K) and `tilt-card.tsx` (6.7K) appear to serve similar purposes
- Both provide tilt/parallax card effects

> [!IMPORTANT]
> **Action:** Evaluate usage, keep one, alias the other.

### 3. Oversized Utility Files in `components/ui/`

Three files (`ai-accessibility`, `micro-interactions`, `performance`) are each ~26KB. These are utility bundles, not single components, and inflate the `ui/` directory:

> [!TIP]
> **Action:** Move to `lib/` or `utils/` directory. They are not UI primitives.

---

## 🟡 Gaps Identified

### Accessibility

| Gap | Impact | Pages Affected |
|-----|--------|----------------|
| Most icon-only buttons lack `aria-label` | Screen readers can't identify actions | Admin, Inbox |
| No keyboard shortcut hints on tooltips | Power users miss shortcuts | Sidebar, Topbar |
| ARIA compliance only in 5/39 UI primitives | Accessibility score low | All |

### Missing Components

| Component | Need | Priority |
|-----------|------|----------|
| `Breadcrumbs` used but minimal | Needs active route auto-detection | Medium |
| `Pagination` standalone | Currently embedded in DataTable only | Low |
| `ProgressBar` (determinate) | i18n progress uses inline `<div>` | Low |
| `StatusDot` | Repeated inline `<span>` pattern in sidebar, users | Low |

### `forwardRef` Inconsistency

Only **9/39** UI primitives use `forwardRef`. This matters for:
- Tooltip trigger targets
- Form field composition
- Animation libraries (framer-motion ref)

---

## 🟢 Strengths

- ✅ Consistent design token usage (`primary`, `destructive`, `success`, `warning`, `info`)
- ✅ Skeleton loading on all major pages (40+ files)
- ✅ EmptyState coverage on 13 pages
- ✅ `cn()` utility used everywhere for className merging
- ✅ shadcn/ui `new-york` style, CSS variables enabled
- ✅ All Radix primitives properly wrapped

---

## Recommended Actions (Priority Order)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | Merge `EmptyState` variants | Reduces confusion, single API | Small |
| 2 | Move utility bundles out of `ui/` | Cleaner `ui/` directory | Small |
| 3 | Consolidate `card-3d` / `tilt-card` | Remove dead code | Small |
| 4 | Add `aria-label` to icon-only buttons | Accessibility compliance | Medium |
| 5 | Add `forwardRef` to remaining primitives | Composability | Medium |
| 6 | Extract `StatusDot` component | Reduce inline patterns | Small |
