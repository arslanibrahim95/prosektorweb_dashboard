# `cn()` Function Usage Guidelines

## Overview

The `cn()` function (from `@/lib/utils`) is a utility for merging Tailwind CSS classes. It combines `clsx` for conditional class handling and `tailwind-merge` for resolving Tailwind conflicts.

## When to Use `cn()`

### ✅ DO Use `cn()` When:

1. **Merging base classes with dynamic overrides**
   ```tsx
   // Component accepts className prop
   <button className={cn('px-4 py-2 bg-blue-500', className)} />
   ```

2. **Conditional classes based on state**
   ```tsx
   // Object syntax for multiple conditions
   <div className={cn('base', {
     'bg-red-500': hasError,
     'bg-green-500': isSuccess,
     'opacity-50': isDisabled,
   })} />

   // Or with && for single conditions
   <div className={cn('nav-item', isActive && 'bg-accent')} />
   ```

3. **Combining variant classes with overrides**
   ```tsx
   const Button = ({ variant, size, className }) => (
     <button className={cn(
       buttonVariants({ variant, size }),
       className
     )} />
   )
   ```

4. **Building reusable UI components**
   ```tsx
   // All shadcn/ui components use this pattern
   <Card className={cn('p-4', className)} />
   ```

### ❌ DON'T Use `cn()` When:

1. **Static, unchanging classes**
   ```tsx
   // Bad - unnecessary overhead
   <div className={cn('flex items-center justify-center')} />

   // Good - direct string
   <div className="flex items-center justify-center" />
   ```

2. **Single class without conditions**
   ```tsx
   // Bad - no benefit
   <div className={cn('text-red-500')} />

   // Good - direct string
   <div className="text-red-500" />
   ```

3. **In hot loops/render-intensive paths**
   ```tsx
   // Bad - called thousands of times per second
   {items.map(item => (
     <span key={item.id} className={cn('static-class')} />
   ))}

   // Good - direct string for static classes
   {items.map(item => (
     <span key={item.id} className="static-class" />
   ))}
   ```

## Performance Considerations

`cn()` has a small runtime cost because it:
1. Parses and normalizes all inputs
2. Runs Tailwind's conflict resolution algorithm
3. Returns a new string

**Impact:** Negligible for normal UI usage, but avoid in:
- Very large lists (1000+ items) with static classes
- Animation loops
- Hot code paths

## Best Practices

### 1. Consistent Ordering
```tsx
// Good: predictable, easier to debug
className={cn(
  'base-classes',        // 1. Base styles
  variantClasses,         // 2. Variant styles
  condition && 'cond',    // 3. Conditional styles
  className              // 4. User override (always last)
)}
```

### 2. Type-Safe Variants (when applicable)
```tsx
import { cva } from 'class-variance-authority'

const buttonVariants = cva('base-class', {
  variants: { /* ... */ }
})

// Then use cn only for overrides
<Button className={cn(buttonVariants({ variant }), className)} />
```

### 3. Extract Reusable Patterns
```tsx
// Instead of repeating
className={cn('px-4 py-2 rounded', condition && 'bg-red-500')}

// Create a component or variant
const cardClass = 'px-4 py-2 rounded'
className={cn(cardClass, condition && 'bg-red-500')}
```

## Common Patterns

### Conditional Active State
```tsx
<Link href="/about" className={cn(
  'nav-link',
  pathname === '/about' && 'bg-accent text-accent-foreground'
)}>
  About
</Link>
```

### Props Override Pattern
```tsx
interface MyComponentProps {
  className?: string
}

export function MyComponent({ className }: MyComponentProps) {
  return (
    <div className={cn('default-styles', className)} />
  )
}
```

### Multiple Conditions
```tsx
// Object syntax is cleaner than multiple &&
<div className={cn('input', {
  'border-red-500': error,
  'border-green-500': success,
  'opacity-50': disabled,
})} />
```

## Testing

When testing components that use `cn()`, test the behavior not the exact class string:

```tsx
// Bad - brittle
expect(screen.getByRole('button')).toHaveClass('px-4 py-2 bg-blue-500')

// Good - flexible
expect(screen.getByRole('button')).toHaveClass('px-4')
expect(screen.getByRole('button')).toHaveClass('bg-blue-500')
```

## See Also

- [clsx documentation](https://github.com/lukeed/clsx)
- [tailwind-merge documentation](https://github.com/dcastil/tailwind-merge)
- `tests/lib/utils.test.ts` for comprehensive examples
