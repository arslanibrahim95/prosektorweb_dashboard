import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * 2026 Badge Component
 * 
 * Trend Rationale:
 * - Gradient badges for premium feel
 * - Glow effects on hover
 * - Pill shape with softer radius
 * - New accent colors
 */

const badgeVariants = cva(
  // Base styles with 2026 improvements
  "inline-flex items-center justify-center rounded-full border border-transparent px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",

        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",

        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",

        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",

        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",

        link: "text-primary underline-offset-4 [a&]:hover:underline",

        // 2026: Gradient badges
        gradient: "gradient-primary text-white [a&]:hover:opacity-90",
        "gradient-coral": "gradient-coral text-white [a&]:hover:opacity-90",
        "gradient-turquoise": "gradient-turquoise text-white [a&]:hover:opacity-90",
        "gradient-violet": "gradient-violet text-white [a&]:hover:opacity-90",

        // 2026: Glass badges
        glass: "glass bg-white/10 text-foreground border-white/20 [a&]:hover:bg-white/20",

        // 2026: Solid accent colors
        coral: "bg-coral-500 text-white [a&]:hover:bg-coral-600",
        turquoise: "bg-turquoise-500 text-white [a&]:hover:bg-turquoise-600",
        violet: "bg-violet-500 text-white [a&]:hover:bg-violet-600",
        emerald: "bg-emerald-500 text-white [a&]:hover:bg-emerald-600",
        amber: "bg-amber-500 text-amber-950 [a&]:hover:bg-amber-600",
        info: "bg-blue-500 text-white [a&]:hover:bg-blue-600",

        // 2026: Outline accent colors
        "outline-coral": "border-coral-500 text-coral-600 [a&]:hover:bg-coral-50 dark:[a&]:hover:bg-coral-950",
        "outline-turquoise": "border-turquoise-500 text-turquoise-600 [a&]:hover:bg-turquoise-50 dark:[a&]:hover:bg-turquoise-950",
        "outline-violet": "border-violet-500 text-violet-600 [a&]:hover:bg-violet-50 dark:[a&]:hover:bg-violet-950",
        "outline-emerald": "border-emerald-500 text-emerald-600 [a&]:hover:bg-emerald-50 dark:[a&]:hover:bg-emerald-950",
        "outline-amber": "border-amber-500 text-amber-600 [a&]:hover:bg-amber-50 dark:[a&]:hover:bg-amber-950",
        "outline-info": "border-blue-500 text-blue-600 [a&]:hover:bg-blue-50 dark:[a&]:hover:bg-blue-950",

        // 2026: Glow badges (with subtle glow on hover)
        "glow-primary": "bg-primary text-primary-foreground shadow-glow-primary/50 [a&]:hover:shadow-glow-primary",
        "glow-coral": "bg-coral-500 text-white shadow-glow-coral/30 [a&]:hover:shadow-glow-coral",
        "glow-turquoise": "bg-turquoise-500 text-white shadow-glow-turquoise/30 [a&]:hover:shadow-glow-turquoise",
        "glow-violet": "bg-violet-500 text-white shadow-glow-violet/30 [a&]:hover:shadow-glow-violet",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
