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
  maxLength = 255, // Standard security limit for text inputs
  ...props
}: React.ComponentProps<"input"> & {
  variant?: "default" | "glass" | "neo" | "filled"
}) {
  const variantClasses = {
    default:
      "bg-background border-input hover:border-primary/40 hover:bg-muted/10",
    glass:
      "glass border-white/20 bg-white/5 hover:bg-white/10",
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
      maxLength={maxLength}
      className={cn(
        // Base styles
        "flex file:text-foreground placeholder:text-muted-foreground/70 text-foreground selection:bg-primary selection:text-primary-foreground",
        // Sizing & layout
        "h-10 w-full min-w-0 rounded-lg border px-4 py-2 text-base shadow-sm",
        // Transitions
        "transition-all duration-300 ease-in-out outline-none",
        // Focus states with glow
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:shadow-[0_0_15px_rgba(var(--primary),0.15)]",
        // Error states 
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30 aria-invalid:shadow-[0_0_15px_rgba(var(--destructive),0.15)]",
        "[&:not(:placeholder-shown):invalid]:border-destructive [&:not(:placeholder-shown):invalid]:ring-destructive/30 [&:not(:placeholder-shown):invalid]:text-destructive",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Type specific adjustments
        "type-[file]:border-0 type-[file]:bg-transparent type-[file]:text-sm type-[file]:font-medium",
        "md:text-sm",
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
