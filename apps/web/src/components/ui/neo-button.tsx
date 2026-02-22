"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Neo Button Component - Production Ready
 * 
 * Features:
 * - XSS-safe ripple effect
 * - Memory leak free animations
 * - Reduced motion support
 * - Proper cleanup on unmount
 * - Error handling
 * 
 * @module neo-button
 * @version 2.0.0
 */

// =============================================================================
// TYPES
// =============================================================================

interface Ripple {
  x: number;
  y: number;
  id: number;
}

// =============================================================================
// CVA VARIANTS
// =============================================================================

const neoButtonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "gap-2 whitespace-nowrap",
    "text-sm font-medium",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-br from-white to-neutral-100",
          "shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.5)]",
          "text-neutral-900",
          "hover:shadow-[8px_8px_16px_rgba(0,0,0,0.08),-8px_-8px_16px_rgba(255,255,255,0.5)]",
          "hover:-translate-y-0.5",
          "active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.06),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]",
          "active:translate-y-0",
          "dark:bg-gradient-to-br dark:from-neutral-800 dark:to-neutral-900",
          "dark:shadow-[6px_6px_14px_rgba(0,0,0,0.35),-6px_-6px_14px_rgba(255,255,255,0.03)]",
          "dark:text-neutral-100",
          "dark:hover:shadow-[8px_8px_18px_rgba(0,0,0,0.45),-8px_-8px_18px_rgba(255,255,255,0.04)]",
          "dark:active:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.4),inset_-4px_-4px_10px_rgba(255,255,255,0.03)]",
        ],
        pressed: [
          "bg-neutral-100",
          "shadow-[inset_4px_4px_8px_rgba(0,0,0,0.06),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]",
          "text-neutral-700",
          "dark:bg-neutral-800",
          "dark:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.4),inset_-4px_-4px_10px_rgba(255,255,255,0.03)]",
          "dark:text-neutral-300",
        ],
        primary: [
          "bg-gradient-to-br from-primary to-primary/90",
          "shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.1)]",
          "text-primary-foreground",
          "hover:shadow-[8px_8px_16px_rgba(0,0,0,0.12),-8px_-8px_16px_rgba(255,255,255,0.12)]",
          "hover:brightness-110",
          "hover:-translate-y-0.5",
          "active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.15),inset_-4px_-4px_8px_rgba(255,255,255,0.15)]",
          "active:brightness-95",
          "active:translate-y-0",
        ],
        secondary: [
          "bg-gradient-to-br from-secondary to-secondary/90",
          "shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.5)]",
          "text-secondary-foreground",
          "hover:shadow-[8px_8px_16px_rgba(0,0,0,0.08),-8px_-8px_16px_rgba(255,255,255,0.5)]",
          "hover:-translate-y-0.5",
          "active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.06),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]",
          "active:translate-y-0",
          "dark:shadow-[6px_6px_14px_rgba(0,0,0,0.35),-6px_-6px_14px_rgba(255,255,255,0.03)]",
          "dark:hover:shadow-[8px_8px_18px_rgba(0,0,0,0.45),-8px_-8px_18px_rgba(255,255,255,0.04)]",
          "dark:active:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.4),inset_-4px_-4px_10px_rgba(255,255,255,0.03)]",
        ],
        ghost: [
          "bg-transparent",
          "hover:bg-neutral-100",
          "hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.03),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]",
          "dark:hover:bg-neutral-800",
          "dark:hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.02)]",
        ],
        glow: [
          "bg-gradient-to-br from-primary to-primary/90",
          "shadow-[0_0_20px_rgba(59,130,246,0.3),6px_6px_12px_rgba(0,0,0,0.1)]",
          "text-primary-foreground",
          "hover:shadow-[0_0_30px_rgba(59,130,246,0.4),8px_8px_16px_rgba(0,0,0,0.12)]",
          "hover:brightness-110",
          "active:shadow-[0_0_15px_rgba(59,130,246,0.2),inset_4px_4px_8px_rgba(0,0,0,0.15)]",
        ],
      },
      size: {
        default: "h-10 px-4 py-2 rounded-xl",
        sm: "h-9 px-3 rounded-lg text-xs",
        lg: "h-12 px-6 rounded-2xl text-base",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-2xl",
      },
      animation: {
        none: "",
        bounce: "active:scale-[0.98] transition-transform",
        pulse: "",
        glow: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "bounce",
    },
  }
);

// =============================================================================
// MAIN COMPONENT PROPS
// =============================================================================

export interface NeoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neoButtonVariants> {
  asChild?: boolean;
  /** Show ripple effect on click */
  ripple?: boolean;
  /** Ripple animation duration in ms */
  rippleDuration?: number;
  /** Disable ripple on reduced motion */
  respectReducedMotion?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
  (
    {
      className,
      variant,
      size,
      animation,
      asChild = false,
      ripple = true,
      rippleDuration = 600,
      respectReducedMotion = true,
      onClick,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // State
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    
    // Refs
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const timeoutsRef = React.useRef<Set<NodeJS.Timeout>>(new Set());
    const prefersReducedMotionRef = React.useRef(false);
    const isUnmountingRef = React.useRef(false);

    // Check for reduced motion preference
    React.useEffect(() => {
      if (!respectReducedMotion || typeof window === "undefined") return;
      
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      prefersReducedMotionRef.current = mediaQuery.matches;

      const handler = (e: MediaQueryListEvent) => {
        prefersReducedMotionRef.current = e.matches;
      };

      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }, [respectReducedMotion]);

    // Cleanup on unmount - CRITICAL: Clear all timeouts
    React.useEffect(() => {
      const timeouts = timeoutsRef.current;
      return () => {
        isUnmountingRef.current = true;
        timeouts.forEach((timeout) => {
          clearTimeout(timeout);
        });
        timeouts.clear();
      };
    }, []);

    // Expose ref
    React.useImperativeHandle(
      ref,
      () => buttonRef.current as HTMLButtonElement,
      []
    );

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        // Skip ripple if disabled
        if (disabled) {
          onClick?.(e);
          return;
        }

        // Create ripple if enabled and not reduced motion
        if (
          ripple &&
          buttonRef.current &&
          (!respectReducedMotion || !prefersReducedMotionRef.current)
        ) {
          const rect = buttonRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const id = Date.now();

          setRipples((prev) => [...prev, { x, y, id }]);

          // Schedule ripple removal
          const timeout = setTimeout(() => {
            if (!isUnmountingRef.current) {
              setRipples((prev) => prev.filter((r) => r.id !== id));
            }
            timeoutsRef.current.delete(timeout);
          }, rippleDuration);

          timeoutsRef.current.add(timeout);
        }

        onClick?.(e);
      },
      [ripple, rippleDuration, respectReducedMotion, disabled, onClick]
    );

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={buttonRef}
        className={cn(
          neoButtonVariants({ variant, size, animation, className }),
          "relative overflow-hidden"
        )}
        onClick={handleClick}
        disabled={disabled}
        aria-disabled={disabled}
        {...props}
      >
        {/* Ripple effects - hidden from screen readers */}
        {ripple &&
          ripples.map((rippleItem) => (
            <span
              key={rippleItem.id}
              className="absolute pointer-events-none bg-white/30 rounded-full animate-ripple"
              aria-hidden="true"
              style={{
                left: rippleItem.x,
                top: rippleItem.y,
                width: "10px",
                height: "10px",
                marginLeft: "-5px",
                marginTop: "-5px",
              }}
            />
          ))}

        {/* Content wrapper */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Comp>
    );
  }
);
NeoButton.displayName = "NeoButton";

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

const NeoIconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<NeoButtonProps, "size">
>(({ className, ...props }, ref) => (
  <NeoButton ref={ref} size="icon" className={className} {...props} />
));
NeoIconButton.displayName = "NeoIconButton";

const NeoButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
  }
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex",
      orientation === "horizontal" ? "flex-row gap-3" : "flex-col gap-3",
      className
    )}
    {...props}
  />
));
NeoButtonGroup.displayName = "NeoButtonGroup";

// =============================================================================
// EXPORTS
// =============================================================================

export {
  NeoButton,
  NeoIconButton,
  NeoButtonGroup,
  neoButtonVariants,
};

export type { Ripple };
