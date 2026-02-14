# UI Component Style Guide

This guide documents the styling patterns and conventions used in the ProsektorWeb Dashboard UI components.

## Table of Contents

- [Class Name Utility (`cn()`)](#class-name-utility-cn)
- [Responsive Breakpoints](responsive-breakpoints)
- [Design Tokens](#design-tokens)
- [Component Patterns](#component-patterns)
- [Custom Variants](#custom-variants)
- [Data Attributes](#data-attributes)

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

**Usage:**
```tsx
// ✅ Good - use token
className="text-[var(--font-size-xs)]"

// ❌ Bad - hardcoded value
className="text-[10px]"
```

### Layout Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-width` | 260px | Sidebar width |
| `--topbar-height` | 64px | Topbar/header height |
| `--header-height` | 64px | Generic header height |

**Usage:**
```tsx
// ✅ Good
className="lg:left-[var(--sidebar-width)]"
className="h-[var(--topbar-height)]"

// ❌ Bad
className="lg:left-[260px]"
className="h-16"
```

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

### Radius Tokens

```tsx
// ✅ Good
className="rounded-[var(--radius-md)]"
className="rounded-[var(--radius-lg)]"

// ✅ Also acceptable - Tailwind utilities
className="rounded-md"
className="rounded-lg"
```

### Transition Tokens

```tsx
// ✅ Good
style={{ transitionDuration: 'var(--transition-normal)' }}

// ✅ Also acceptable - Tailwind utilities
className="transition-all duration-200"
```

---

## Component Patterns

### Button Component

The Button component uses `class-variance-authority` for variant management.

```tsx
import { Button } from '@/components/ui/button'

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>

// With custom className
<Button className="w-full">Full Width</Button>
```

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Base Component Pattern

When creating new components, follow this pattern:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

interface MyComponentProps extends React.ComponentProps<"div"> {
  // Add your custom props here
}

function MyComponent({ className, ...props }: MyComponentProps) {
  return (
    <div
      data-slot="my-component" // For data attributes
      className={cn(
        "base-classes-here", // Default styles
        className // Allow parent overrides
      )}
      {...props}
    />
  )
}

export { MyComponent }
```

---

## Custom Variants

### Adding Variants to Existing Components

For components using `class-variance-authority`:

```tsx
// 1. Add the variant to the cva config
const buttonVariants = cva(baseClasses, {
  variants: {
    variant: {
      // ... existing variants
      'custom': 'custom-variant-classes',
    },
    size: {
      // ... existing sizes
      'custom-size': 'custom-size-classes',
    },
  },
})

// 2. Update the type definition
type ButtonVariants = VariantProps<typeof buttonVariants>
// Type now includes 'custom' and 'custom-size'
```

### Creating Variant Components

```tsx
// Create a specialized variant component
function PrimaryButton(props: React.ComponentProps<typeof Button>) {
  return <Button variant="default" {...props} />
}

function IconButton({ icon: Icon, ...props }: { icon: React.ComponentType<{ className?: string }> } & React.ComponentProps<typeof Button>) {
  return (
    <Button size="icon" {...props}>
      <Icon className="h-4 w-4" />
    </Button>
  )
}
```

---

## Data Attributes

Components use `data-slot` attributes for:

1. **Testing**: Easy selection in tests
2. **Styling**: Targeting specific component parts
3. **Debugging**: Identifying components in browser dev tools

### Pattern

```tsx
<Component data-slot="component-name" />
```

### Examples from the codebase

```tsx
// Button
<Button data-slot="button" data-variant={variant} data-size={size} />

// Card
<div data-slot="card" />
<div data-slot="card-header" />
<div data-slot="card-title" />
<div data-slot="card-content" />
```

### Usage in CSS

```css
/* You can use data attributes for styling */
[data-slot="button"][data-variant="ghost"] {
  /* Custom styles */
}
```

---

## Utility Classes Reference

### Semantic Badge Classes

Available in `globals.css`:

```tsx
<Badge className="badge-success">Success</Badge>
<Badge className="badge-warning">Warning</Badge>
<Badge className="badge-danger">Danger</Badge>
<Badge className="badge-info">Info</Badge>
```

### Glassmorphism Utilities

```tsx
<div className="glass">Glass effect</div>
<div className="glass-strong">Strong glass effect</div>
<div className="glass-dark">Dark glass effect</div>
```

### Gradient Utilities

```tsx
<div className="gradient-sidebar">Sidebar gradient</div>
<div className="gradient-primary">Primary gradient</div>
<div className="gradient-accent">Accent gradient</div>
<div className="gradient-success">Success gradient</div>
<div className="gradient-warning">Warning gradient</div>
<div className="gradient-info">Info gradient</div>
```

### Glow Effects

```tsx
<div className="glow-primary">Primary glow</div>
<div className="glow-success">Success glow</div>
```

### Shadow Utilities

```tsx
<div className="smooth-shadow">Smooth shadow</div>
<div className="smooth-shadow-lg">Large smooth shadow</div>
```

### Animation Utilities

```tsx
<div className="page-enter">Page transition</div>

<div className="stagger-children">
  <div>Item 1</div>
  <div>Item 2</div>
  {/* Staggered animation */}
</div>
```

### Layout Utilities

```tsx
<div className="card-padding">Card padding (p-6)</div>
<div className="table-cell-padding">Table cell padding (p-4)</div>
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
