import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * 2026 Button Component
 * 
 * Trend Rationale:
 * - Mikro-etkileşimler: Button tıklamalarında haptic feedback etkisi
 * - Glow efektleri: Premium his için hover'da glow
 * - Akıcı geçişler: Daha yumuşak hover/active durumları
 * - Neo variant: 2026 neomorfizm trendi
 */
const buttonVariants = cva(
  // Base styles with 2026 improvements
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out-expo disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Default with glow effect - 2026
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-glow-primary active:scale-[0.98]",

        // Destructive with coral glow
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 hover:shadow-glow-coral",

        // Glass effect - 2026
        glass:
          "glass bg-background/50 text-foreground hover:bg-background/80 hover:shadow-glass border border-border/50",

        // Neo - 2026 Neomorphism
        neo:
          "neo-button bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-foreground hover:shadow-lg active:scale-[0.98]",

        // Outline with glow
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 hover:shadow-sm",

        // Secondary with subtle gradient
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 bg-gradient-to-b from-secondary to-secondary/80",

        // Ghost enhanced - 2026
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 hover:rounded-lg",

        // Link with underline animation
        link: "text-primary underline-offset-4 hover:underline decoration-primary/50 hover:decoration-primary",

        // 2026: Gradient button
        gradient:
          "gradient-primary text-white hover:opacity-90 hover:shadow-glow-primary active:scale-[0.98]",

        // 2026: Coral accent
        coral:
          "bg-coral-500 text-white hover:bg-coral-600 hover:shadow-glow-coral active:scale-[0.98]",

        // 2026: Turquoise accent
        turquoise:
          "bg-turquoise-500 text-white hover:bg-turquoise-600 hover:shadow-glow-turquoise active:scale-[0.98]",

        // 2026: Violet accent
        violet:
          "bg-violet-500 text-white hover:bg-violet-600 hover:shadow-glow-violet active:scale-[0.98]",
      },
      size: {
        // 2026: Micro size for compact UIs
        micro: "h-7 gap-1 rounded-md px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",

        default: "h-9 px-4 py-2 has-[>svg]:px-3",

        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",

        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",

        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4 text-base",

        // 2026: XL for hero sections
        xl: "h-12 rounded-lg px-8 has-[>svg]:px-5 text-lg font-semibold",

        icon: "size-11 min-w-11 rounded-lg",

        "icon-xs": "size-6 min-w-6 rounded-md [&_svg:not([class*='size-'])]:size-3",

        "icon-sm": "size-9 min-w-9 rounded-md",

        "icon-lg": "size-12 min-w-12 rounded-lg",

        // 2026: Square icon for modern UIs
        "icon-xl": "size-16 min-w-16 rounded-xl [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
