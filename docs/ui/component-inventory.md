# Component Inventory

shadcn/ui tabanlı component standardı ve uygulama dosyaları.

---

## Layout Components

### AppShell
**Dosya:** `src/components/layout/app-shell.tsx`

| Prop | Type | Description |
|------|------|-------------|
| children | ReactNode | Main content |
| user | User | Current user data |
| tenant | Tenant | Current tenant data |

**Yapı:**
```
┌─────────────────────────────────────────────┐
│ Topbar (fixed)                              │
├──────────┬──────────────────────────────────┤
│ Sidebar  │         Content                  │
│ (fixed)  │         (scrollable)             │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

---

### Sidebar
**Dosya:** `src/components/layout/sidebar.tsx`

| Prop | Type | Description |
|------|------|-------------|
| items | NavItem[] | Navigation structure |
| collapsed | boolean | Collapsed state |
| role | UserRole | For role filtering |

**Özellikler:**
- Collapsible groups
- Active route highlighting
- Role-based item filtering
- Badge for unread counts

---

### Topbar
**Dosya:** `src/components/layout/topbar.tsx`

| Prop | Type | Description |
|------|------|-------------|
| user | User | User info for avatar |
| tenant | Tenant | Tenant badge |

**İçerik:**
- Global search input
- Notification bell (badge count)
- User dropdown (settings, logout)

---

## Data Components

### DataTable
**Kaynak:** `shadcn/ui` table + custom wrapper

| Prop | Type | Description |
|------|------|-------------|
| columns | ColumnDef[] | Column definitions |
| data | T[] | Table data |
| pagination | PaginationProps | Page control |
| onRowClick | (row) => void | Row selection |

**Özellikler:**
- Sortable columns
- Pagination (10/25/50 per page)
- Loading skeleton
- Empty state integration

---

### Drawer
**Kaynak:** `shadcn/ui` sheet

**Kullanım:** Inbox detail view

| Prop | Type | Description |
|------|------|-------------|
| open | boolean | Visibility |
| onClose | () => void | Close handler |
| title | string | Header text |

---

### Dialog
**Kaynak:** `shadcn/ui` dialog

**Kullanım:** Create/Edit forms, confirmations

---

### Toast
**Kaynak:** `sonner`

**Variants:**
- Success (green)
- Error (red)
- Warning (yellow)
- Info (blue)

---

## State Components

### EmptyState
**Dosya:** `src/components/layout/states.tsx`

| Prop | Type | Description |
|------|------|-------------|
| icon | ReactNode | Illustrative icon |
| title | string | Main message |
| description | string | Secondary text |
| action | ActionProps | CTA button |

---

### LoadingState
**Dosya:** `src/components/layout/states.tsx`

Skeleton grid for loading states.

---

### ErrorState
**Dosya:** `src/components/layout/states.tsx`

| Prop | Type | Description |
|------|------|-------------|
| message | string | Error message |
| onRetry | () => void | Retry handler |

---

## Builder Components

### Canvas
**Dosya:** `src/app/(dashboard)/site/builder/page.tsx`

Block rendering area with:
- Drag-drop reordering
- Block selection
- Add block button between blocks

---

### BlockPicker
**Dosya:** `src/app/(dashboard)/site/builder/page.tsx`

Grid of available block types with icons.

---

### InspectorPanel
**Dosya:** `src/app/(dashboard)/site/builder/page.tsx`

Right panel for selected block properties.

---

### PublishBar
**Dosya:** `src/app/(dashboard)/site/publish/page.tsx`

| Elements |
|----------|
| Environment tabs (Staging/Production) |
| Changes count badge |
| Publish button |
| Revision history |

---

## Wizard Components

### WizardContainer
**Kullanım:** Domain setup

| Prop | Type | Description |
|------|------|-------------|
| steps | Step[] | Wizard steps |
| currentStep | number | Active step |
| onNext | () => void | Next handler |
| onBack | () => void | Back handler |

**Özellikler:**
- Progress indicator
- Step validation
- Copy buttons for DNS records

---

## Status Badges

| Badge | Usage | Colors |
|-------|-------|--------|
| `badge-success` | Active, Published | Green |
| `badge-warning` | Pending, Draft | Yellow |
| `badge-danger` | Error, Expired | Red |
| `badge-info` | Info states | Blue |

**Dosya:** `src/app/globals.css` (utilities)

---

## Accessibility Checklist

- [ ] All buttons have accessible names
- [ ] Focus visible on all interactive elements
- [ ] Modal focus trap implemented
- [ ] Keyboard navigation for tables
- [ ] ARIA labels on icon-only buttons
- [ ] Color contrast ≥ 4.5:1
- [ ] Semantic heading hierarchy
