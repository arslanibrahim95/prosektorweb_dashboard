# ProsektorWeb Design System

Design token reference and usage guide for the dashboard.

---

## Color Palette

### Semantic Colors

| Token | Usage | Light | Dark |
|-------|-------|-------|------|
| `primary` | CTAs, links, brand | oklch(0.55 0.2 250) | oklch(0.65 0.18 250) |
| `destructive` | Delete, errors | oklch(0.58 0.24 27) | oklch(0.70 0.19 22) |
| `success` | Success states | oklch(0.62 0.17 145) | oklch(0.65 0.15 145) |
| `warning` | Cautions | oklch(0.75 0.18 85) | oklch(0.72 0.16 85) |
| `info` | Informational | oklch(0.65 0.15 230) | oklch(0.68 0.14 230) |

### Status Badges

```tsx
<Badge className="badge-success">Aktif</Badge>
<Badge className="badge-warning">Bekliyor</Badge>
<Badge className="badge-danger">Hata</Badge>
<Badge className="badge-info">Bilgi</Badge>
```

---

## Spacing Scale

4px base unit system:

| Token | Size | Usage |
|-------|------|-------|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Icon margins |
| `space-3` | 12px | Small padding |
| `space-4` | 16px | Default padding, table cells |
| `space-6` | 24px | Card/dialog padding |
| `space-8` | 32px | Section gaps |

### Component Consistency

| Element | Padding | Radius |
|---------|---------|--------|
| Card | `p-6` | `rounded-lg` |
| Table cell | `p-4` | - |
| Dialog | `p-6` | `rounded-lg` |
| Drawer | `p-6` | - |
| Button (md) | `px-4 py-2` | `rounded-md` |

---

## Typography

| Class | Size | Line Height |
|-------|------|-------------|
| `text-xs` | 12px | 1.5 |
| `text-sm` | 14px | 1.5 |
| `text-base` | 16px | 1.5 |
| `text-lg` | 18px | 1.375 |
| `text-xl` | 20px | 1.375 |
| `text-2xl` | 24px | 1.25 |

---

## Responsive Breakpoints

| Breakpoint | Width | Device |
|------------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Wide |

### Page Builder Canvas

- Desktop preview: 1280px
- Tablet preview: 768px
- Mobile preview: 375px

---

## Dark Mode

Class-based toggle using `.dark` on `<html>`:

```tsx
// Toggle implementation
document.documentElement.classList.toggle('dark');
```

All semantic colors auto-adjust. No additional classes needed.

---

## Accessibility

> [!CAUTION]
> All text must maintain **4.5:1 contrast ratio** minimum.

### Checklist
- [ ] Focus visible on all interactive elements
- [ ] Semantic heading hierarchy (h1 → h6)
- [ ] ARIA labels on icon-only buttons
- [ ] Keyboard navigation for all actions

---

## shadcn/ui Patterns

### Button Variants

```tsx
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### Badge Combinations

```tsx
// With icons
<Badge className="badge-success">
  <CheckCircle className="h-3 w-3 mr-1" />
  Aktif
</Badge>
```

---

## File Structure

```
packages/design-tokens/
├── package.json
├── tokens.css       # CSS custom properties
├── tailwind-preset.js # Tailwind theme extension
└── index.js         # JS token exports

apps/web/src/app/
└── globals.css      # Imports + app-specific overrides
```
