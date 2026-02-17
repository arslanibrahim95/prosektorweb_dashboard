import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * 2026 Input Component
 * 
 * Trend Rationale:
 * - Glassmorphism variants: Premium blur effects
 * - Neomorphism: Soft UI input fields
 * - Focus glow: Enhanced focus states
 * - Smooth transitions: Premium feel
 */

function Input({
  className,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & {
  variant?: "default" | "glass" | "neo" | "filled"
}) {
  const variantClasses = {
    default:
      "border-input bg-transparent",
    glass:
      "glass border-white/20 bg-white/5",
    neo:
      "neo-pressed border-transparent bg-transparent",
    filled:
      "bg-muted border-transparent hover:bg-muted/80",
  }

  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(
        // Base styles
        "file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground",
        // Sizing & layout
        "h-10 w-full min-w-0 rounded-lg border px-4 py-2 text-base shadow-xs",
        // Transitions
        "transition-all duration-200 ease-out-expo outline-none",
        // Focus states with glow
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:shadow-glow-primary",
        // Error states
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Variant
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

/**
 * 2026: Search Input with icon
 */
function SearchInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <Input
        type="search"
        className={cn("pl-10", className)}
        {...props}
      />
    </div>
  )
}

/**
 * 2026: Input with floating label
 */
function FloatingInput({
  className,
  label,
  ...props
}: React.ComponentProps<"input"> & { label: string }) {
  const [focused, setFocused] = React.useState(false)
  const hasValue = props.value !== undefined && props.value !== ""

  return (
    <div className="relative">
      <Input
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "peer pt-6 pb-2",
          (focused || hasValue) && "pt-6",
          className
        )}
      />
      <label
        className={cn(
          "absolute left-4 transition-all duration-200 pointer-events-none",
          focused || hasValue
            ? "top-2 text-xs text-primary"
            : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        )}
      >
        {label}
      </label>
    </div>
  )
}

export { Input, SearchInput, FloatingInput }
