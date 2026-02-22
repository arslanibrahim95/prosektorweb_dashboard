# UI Component Style Guide - 2026 Edition

This guide documents the styling patterns and conventions used in the ProsektorWeb Dashboard UI components, updated for 2026 trends.

---

## Table of Contents

- [Class Name Utility (`cn()`)](#class-name-utility-cn)
- [Responsive Breakpoints](#responsive-breakpoints)
- [Design Tokens](#design-tokens)
- [Component Patterns](#component-patterns)
- [2026 Trends](#2026-trends)
- [Accessibility](#accessibility)

---

## Class Name Utility (`cn()`)

The `cn()` utility is the standard way to combine class names in this project. It uses `clsx` for conditional class names and `tailwind-merge` to resolve Tailwind CSS conflicts.

### Location
`src/lib/utils.ts`

### Usage

```tsx
import { cn } from '@/lib/utils'

// Basic usage
className={cn('base-class', 'additional-class')}

// With conditional classes
className={cn(
  'base-class',
  isActive && 'active-class',
  isDisabled && 'disabled-class'
)}

// With overrides (later classes override earlier ones)
className={cn('px-4 py-2', className)} // className prop can override defaults
```

### Rules

1. **Always use `cn()`** when combining multiple class names
2. **Put the `className` prop last** to allow parent overrides
3. **Prefer conditional expressions** over template literals for conditions
4. **Use semantic ordering**: base classes → modifiers → overrides

```tsx
// ✅ Good
className={cn(
  'flex items-center gap-2', // base layout
  isActive && 'bg-primary',  // conditional modifier
  className                  // parent override
)}

// ❌ Bad
className={`flex items-center gap-2 ${isActive ? 'bg-primary' : ''}`}
```

---

## Responsive Breakpoints

The project uses Tailwind CSS's default breakpoints:

| Breakpoint | Min Width | Prefix | Usage |
|------------|-----------|--------|-------|
| `sm` | 640px | `sm:` | Small tablets |
| `md` | 768px | `md:` | Tablets |
| `lg` | 1024px | `lg:` | Small laptops |
| `xl` | 1280px | `xl:` | Desktops |
| `2xl` | 1536px | `2xl:` | Large screens |

### Mobile-First Approach

Write styles for mobile first, then use `min-width` breakpoints:

```tsx
// ✅ Good - mobile-first
className="p-4 md:p-6 lg:p-8"

// ❌ Bad - desktop-first (avoid)
className="p-8 md:p-6 lg:p-4"
```

### Common Responsive Patterns

```tsx
// Hidden on mobile, visible on desktop
className="hidden lg:block"

// Full width on mobile, constrained on desktop
className="w-full lg:w-1/2"

// Stack on mobile, side-by-side on desktop
className="flex flex-col md:flex-row"

// Smaller text on mobile
className="text-sm md:text-base lg:text-lg"
```

---

## Design Tokens

Design tokens are stored in `@prosektorweb/design-tokens` and should be used instead of hardcoded values.

### Typography Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--font-size-xs` | 0.625rem (10px) | Badge numbers, tiny labels |
| `--font-size-sm` | 0.75rem (12px) | Small text, captions |
| `--font-size-base` | 0.875rem (14px) | Body text |
| `--font-size-md` | 1rem (16px) | Default text |
| `--font-size-lg` | 1.125rem (18px) | Large text |
| `--font-size-xl` | 1.25rem (20px) | Headings |
| `--font-size-2xl` | 1.5rem (24px) | Hero headings |
| `--font-size-3xl` | 1.875rem (30px) | Large hero |
| `--font-size-4xl` | 2.25rem (36px) | Hero titles |
| `--font-size-5xl` | 3rem (48px) | Impact statements |

**2026: Fluid Typography**
```tsx
// ✅ Good - fluid text that scales with viewport
className="text-fluid-lg"  // clamp(1.125rem, 1rem + 0.625vw, 1.25rem)
className="text-fluid-xl"
className="text-fluid-2xl"
className="text-fluid-3xl"
className="text-fluid-4xl"
```

### Layout Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-width` | 260px | Sidebar width |
| `--sidebar-width-collapsed` | 72px | Collapsed sidebar |
| `--topbar-height` | 64px | Topbar/header height |
| `--header-height` | 64px | Generic header height |
| `--content-max-width` | 1440px | Max content width |
| `--content-narrow` | 768px | Narrow content |
| `--content-wide` | 1200px | Wide content |

### Color Tokens

Use semantic tokens instead of hardcoded colors:

```tsx
// ✅ Good - semantic tokens
className="bg-primary text-primary-foreground"
className="bg-card text-card-foreground"
className="border-border"
className="text-muted-foreground"

// ❌ Bad - hardcoded colors
className="bg-blue-600 text-white"
className="bg-slate-50 text-slate-900"
```

### 2026: New Accent Colors

```tsx
// Coral - Energetic accent
className="bg-coral-500 text-white"
className="text-gradient-coral"

// Turquoise - Fresh accent
className="bg-turquoise-500 text-white"

// Violet - Premium accent
className="bg-violet-500 text-white"
className="text-gradient-violet"

// Emerald - Success evolution
className="bg-emerald-500 text-white"
```

### Radius Tokens

```tsx
// ✅ Good
className="rounded-[var(--radius-md)]"
className="rounded-[var(--radius-lg)]"

// ✅ Also acceptable - Tailwind utilities
className="rounded-md"
className="rounded-lg"

// 2026: New radius values
className="rounded-xl"
className="rounded-2xl"
className="rounded-3xl"  // 2026 trend
```

### Transition Tokens

```tsx
// ✅ Good
style={{ transitionDuration: 'var(--transition-normal)' }}
style={{ transitionDuration: 'var(--transition-micro)' }}  // 2026: Micro-interactions

// ✅ Also acceptable - Tailwind utilities
className="transition-all duration-200"
className="transition-all duration-micro"  // 2026
```

---

## Component Patterns

### Button Component

The Button component uses `class-variance-authority` for variant management.

```tsx
import { Button } from '@/components/ui/button'

// Default variants
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// 2026: New variants
<Button variant="glass">Glass</Button>
<Button variant="neo">Neo</Button>
<Button variant="gradient">Gradient</Button>
<Button variant="coral">Coral</Button>
<Button variant="turquoise">Turquoise</Button>
<Button variant="violet">Violet</Button>

// Sizes
<Button size="micro">Micro</Button>
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>  // 2026
<Button size="icon">Icon</Button>
<Button size="icon-xl">Icon XL</Button>  // 2026
```

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, GlassCard, NeoCard, GradientCard } from '@/components/ui/card'

// Default
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>

// 2026: Glass card with hover effect
<GlassCard hover>
  Premium glass content
</GlassCard>

// 2026: Neo card
<NeoCard>
  Neomorphic content
</NeoCard>

// 2026: Gradient card
<GradientCard hover>
  Gradient content
</GradientCard>

// Card with variant prop
<Card variant="glass" hover>Content</Card>
<Card variant="neo" hover>Content</Card>
<Card variant="gradient" hover>Content</Card>
```

### Input Component

```tsx
import { Input, SearchInput, FloatingInput } from '@/components/ui/input'

// Default
<Input placeholder="Enter text" />

// 2026: Glass input
<Input variant="glass" placeholder="Glass input" />

// 2026: Neo input
<Input variant="neo" placeholder="Neo input" />

// 2026: Filled input
<Input variant="filled" placeholder="Filled input" />

// Search input with icon
<SearchInput placeholder="Search..." />

// Floating label input
<FloatingInput label="Email address" type="email" />
```

---

## 2026 Trends

### Glassmorphism

```tsx
<div className="glass">Standard glass effect</div>
<div className="glass-strong">Strong glass effect</div>
<div className="glass-dark">Dark glass effect</div>
<div className="glass-frosted">Frosted glass - Maximum blur</div>
```

### Neomorphism

```tsx
<div className="neo">Neomorphic card</div>
<div className="neo-pressed">Pressed neomorphic</div>
<Button variant="neo">Neomorphic button</Button>
<Input variant="neo">Neomorphic input</Input>
```

### Gradients

```tsx
<div className="gradient-primary">Primary gradient</div>
<div className="gradient-coral">Coral gradient</div>
<div className="gradient-turquoise">Turquoise gradient</div>
<div className="gradient-violet">Violet gradient</div>
<div className="gradient-ai">AI gradient</div>
<div className="gradient-mesh">Mesh gradient</div>
<div className="gradient-mesh-animated">Animated mesh</div>
```

### Glow Effects

```tsx
<div className="glow-primary">Primary glow</div>
<div className="glow-coral">Coral glow</div>
<div className="glow-turquoise">Turquoise glow</div>
<div className="glow-violet">Violet glow</div>
<div className="glow-pulse">Pulsing glow</div>
```

### Micro-interactions

```tsx
// Hover lift effect
<div className="hover-lift">Lifts on hover</div>

// Scale on hover
<div className="hover-scale">Scales on hover</div>

// Page entrance
<div className="page-enter-elastic">Elastic entrance</div>

// Staggered children
<div className="stagger-children">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### 3D Utilities

```tsx
<div className="preserve-3d">Preserves 3D</div>
<div className="perspective-1000">Perspective</div>
<div className="rotate-y-180">Rotates 180deg</div>
<div className="backface-hidden">Hidden backface</div>
```

### Gradient Text

```tsx
<h1 className="text-gradient">Gradient Title</h1>
<h1 className="text-gradient-coral">Coral Gradient</h1>
<h1 className="text-gradient-turquoise">Turquoise Gradient</h1>
<h1 className="text-gradient-violet">Violet Gradient</h1>
```

---

## Best Practices

### DO ✅

- Use design tokens instead of hardcoded values
- Put `className` prop last in `cn()` calls
- Use mobile-first responsive design
- Add `data-slot` attributes for components
- Use semantic color tokens
- Keep component styles composable
- Use `class-variance-authority` for variants
- Use 2026 trends: glassmorphism, neomorphism, glows

### DON'T ❌

- Don't use arbitrary values like `text-[10px]` (use tokens instead)
- Don't put `className` prop first in `cn()`
- Don't use desktop-first responsive design
- Don't use arbitrary colors like `bg-blue-600` (use semantic tokens)
- Don't create overly complex nested component structures
- Don't use inline styles (except for dynamic values)

---

## Migration Checklist

When migrating old styles to the new system:

1. Replace `text-[10px]` → `text-[var(--font-size-xs)]`
2. Replace `text-[11px]` → `text-[var(--font-size-xs)]`
3. Replace `w-[260px]` → `w-[var(--sidebar-width)]`
4. Replace `h-16` → `h-[var(--topbar-height)]`
5. Replace `left-[260px]` → `left-[var(--sidebar-width)]`
6. Replace arbitrary colors with semantic tokens
7. Add `data-slot` attributes where missing
8. Consider 2026 glassmorphism/neomorphism for premium feel
9. Add micro-interactions for better UX
10. Use fluid typography for responsive text

---

## Accessibility

### Reduced Motion

The system automatically respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus States

Always ensure proper focus states for keyboard navigation:

```tsx
// Default focus ring
<Button>Focus me</Button>

// Enhanced glow focus (2026)
<Input className="focus-glow" />
```

### Color Contrast

All semantic tokens are designed to meet WCAG 2.1 AA standards.
