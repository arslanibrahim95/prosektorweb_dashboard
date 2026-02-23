# Layout Patterns

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

Dashboard layout standartları ve responsive davranışları.

---

## AppShell Layout

Ana uygulama yapısı.

```
┌───────────────────────────────────────────────────────┐
│                    Topbar (h-16)                      │
│  [Logo] [Search...               ] [🔔] [Avatar ▼]   │
├────────────┬──────────────────────────────────────────┤
│            │                                          │
│  Sidebar   │              Main Content                │
│  (w-64)    │              (flex-1)                    │
│            │                                          │
│  - Home    │   ┌─────────────────────────────────┐   │
│  - Site    │   │         Page Content            │   │
│  - Modules │   │                                 │   │
│  - Inbox   │   │                                 │   │
│  - Settings│   └─────────────────────────────────┘   │
│            │                                          │
└────────────┴──────────────────────────────────────────┘
```

### Specifications

| Element | Size | Position |
|---------|------|----------|
| Topbar | h-16 (64px) | fixed top |
| Sidebar | w-64 (256px) | fixed left |
| Content | flex-1 | scroll, pt-16 pl-64 |

---

## Page Layout Patterns

### Standard Page
```tsx
<div className="space-y-6">
  <header className="flex justify-between">
    <div>
      <h1 className="text-2xl font-bold">Title</h1>
      <p className="text-gray-500">Description</p>
    </div>
    <Button>Action</Button>
  </header>
  
  <main>{/* content */}</main>
</div>
```

### Grid Dashboard
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>Widget 1</Card>
  <Card>Widget 2</Card>
  <Card>Widget 3</Card>
  <Card>Widget 4</Card>
</div>
```

### Two-Column Settings
```tsx
<div className="max-w-2xl space-y-6">
  <Card>Section 1</Card>
  <Card>Section 2</Card>
</div>
```

---

## Builder Layout

Three-panel layout for page builder.

```
┌────────────────────────────────────────────────────────┐
│  [Preview Mobile][Tablet][Desktop]    [Save] [Publish] │
├──────────┬─────────────────────────────┬───────────────┤
│          │                             │               │
│  Block   │         Canvas              │   Inspector   │
│  Picker  │         (flex-1)            │   (w-72)      │
│  (w-64)  │                             │               │
│          │   ┌─────────────────────┐   │   Props       │
│  [Hero]  │   │      Block 1        │   │   form        │
│  [Text]  │   └─────────────────────┘   │               │
│  [Image] │   ┌─────────────────────┐   │               │
│  [CTA]   │   │      Block 2        │   │               │
│          │   └─────────────────────┘   │               │
│          │                             │               │
└──────────┴─────────────────────────────┴───────────────┘
```

### Specifications

| Element | Width | Behavior |
|---------|-------|----------|
| Block Picker | w-64 | Scrollable |
| Canvas | flex-1 | Responsive preview |
| Inspector | w-72 | Sticky |

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 768px | Sidebar hidden, hamburger menu |
| Tablet | 768-1024px | Collapsed sidebar |
| Desktop | ≥ 1024px | Full layout |

### Mobile Adaptation
- Topbar shows hamburger menu
- Sidebar as overlay drawer
- Single column content
- Stacked cards

---

## Spacing Standards

| Context | Spacing |
|---------|---------|
| Page padding | p-6 |
| Section gap | space-y-6 |
| Card padding | p-6 |
| Card gap | gap-4 |
| Form field gap | space-y-4 |
| Button gap | gap-2 |

---

## Z-Index Scale

| Layer | Value | Usage |
|-------|-------|-------|
| Dropdown | 50 | Select menus |
| Sticky | 100 | Sticky headers |
| Fixed | 200 | Topbar, Sidebar |
| Modal Backdrop | 300 | Dialog overlay |
| Modal | 400 | Dialog content |
| Popover | 500 | Tooltips, popovers |
| Toast | 600 | Notifications |
