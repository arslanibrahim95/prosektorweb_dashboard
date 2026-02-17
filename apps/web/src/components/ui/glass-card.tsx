"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Glass Card Component - Production Ready
 * 
 * Features:
 * - XSS-safe CSS value handling
 * - GPU-accelerated blur effects
 * - Reduced motion support
 * - Memory leak free event handling
 * - Error boundary compatible
 * 
 * @module glass-card
 * @version 2.0.0
 */

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Sanitizes numeric values for CSS to prevent XSS
 */
const sanitizeCssValue = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value) || Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
};

/**
 * Validates and sanitizes CSS position values
 */
const sanitizePosition = (value: number): number => {
  return sanitizeCssValue(value, 0, 100);
};

// =============================================================================
// CVA VARIANTS
// =============================================================================

const glassCardVariants = cva(
  "relative overflow-hidden rounded-2xl transition-all duration-300",
  {
    variants: {
      intensity: {
        subtle: [
          "bg-white/[0.03] dark:bg-black/[0.2]",
          "backdrop-blur-sm",
          "border border-white/[0.05] dark:border-white/[0.08]",
          "shadow-sm",
        ],
        default: [
          "bg-white/[0.06] dark:bg-black/[0.3]",
          "backdrop-blur-xl saturate-[180%]",
          "border border-white/[0.08] dark:border-white/[0.1]",
          "shadow-lg",
        ],
        strong: [
          "bg-white/[0.12] dark:bg-black/[0.5]",
          "backdrop-blur-2xl saturate-[200%]",
          "border border-white/[0.15] dark:border-white/[0.15]",
          "shadow-xl",
        ],
        frosted: [
          "bg-white/[0.03] dark:bg-black/[0.2]",
          "backdrop-blur-[32px] saturate-[250%]",
          "border border-white/[0.12] dark:border-white/[0.08]",
          "shadow-2xl",
        ],
      },
      hover: {
        none: "",
        lift: [
          "hover:-translate-y-1",
          "hover:shadow-xl dark:hover:shadow-2xl",
          "hover:bg-white/[0.08] dark:hover:bg-black/[0.4]",
        ],
        glow: [
          "hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]",
          "dark:hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)]",
        ],
        border: [
          "hover:border-primary/30",
          "hover:shadow-lg",
        ],
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      intensity: "default",
      hover: "lift",
      size: "default",
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  /** Inner glow effect */
  innerGlow?: boolean;
  /** Border gradient effect */
  borderGradient?: boolean;
  /** Shine effect on hover - follows mouse */
  shine?: boolean;
  /** Mesh gradient background */
  meshGradient?: boolean;
  /** Disable animations for reduced motion */
  respectReducedMotion?: boolean;
}

export type GlassCardRef = HTMLDivElement;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const GlassCard = React.forwardRef<GlassCardRef, GlassCardProps>(
  (
    {
      className,
      intensity,
      hover,
      size,
      innerGlow = false,
      borderGradient = false,
      shine = false,
      meshGradient = false,
      respectReducedMotion = true,
      children,
      ...props
    },
    ref
  ) => {
    // State
    const [isHovered, setIsHovered] = React.useState(false);
    const [mousePosition, setMousePosition] = React.useState({ x: 50, y: 50 });
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);
    const animationFrameRef = React.useRef<number | null>(null);

    // Check for reduced motion preference
    React.useEffect(() => {
      if (!respectReducedMotion || typeof window === "undefined") return;
      
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }, [respectReducedMotion]);

    // Expose ref
    React.useImperativeHandle(ref, () => cardRef.current!, []);

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!shine || !cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        
        // Prevent division by zero
        if (rect.width === 0 || rect.height === 0) return;

        // Sanitize position values
        const rawX = ((e.clientX - rect.left) / rect.width) * 100;
        const rawY = ((e.clientY - rect.top) / rect.height) * 100;

        // Use RAF for smooth updates
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          setMousePosition({
            x: sanitizePosition(rawX),
            y: sanitizePosition(rawY),
          });
        });
      },
      [shine]
    );

    const handleMouseEnter = React.useCallback(() => {
      setIsHovered(true);
    }, []);

    const handleMouseLeave = React.useCallback(() => {
      setIsHovered(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }, []);

    const shouldDisableEffects = respectReducedMotion && prefersReducedMotion;

    return (
      <div
        ref={cardRef}
        className={cn(
          glassCardVariants({ intensity, hover, size, className }),
          "group"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={shouldDisableEffects ? undefined : handleMouseMove}
        data-reduced-motion={prefersReducedMotion}
        {...props}
      >
        {/* Mesh gradient background */}
        {meshGradient && !shouldDisableEffects && (
          <div
            className="absolute inset-0 opacity-50 pointer-events-none mesh-gradient"
            aria-hidden="true"
            style={{
              background: `
                radial-gradient(at 40% 20%, oklch(0.55 0.20 250 / 0.15) 0px, transparent 50%),
                radial-gradient(at 80% 0%, oklch(0.55 0.22 290 / 0.1) 0px, transparent 50%),
                radial-gradient(at 0% 50%, oklch(0.65 0.24 180 / 0.1) 0px, transparent 50%),
                radial-gradient(at 80% 50%, oklch(0.55 0.24 160 / 0.08) 0px, transparent 50%)
              `,
            }}
          />
        )}

        {/* Inner glow effect */}
        {innerGlow && !shouldDisableEffects && (
          <div
            className={cn(
              "absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none",
              "bg-gradient-to-br from-white/10 via-transparent to-white/5",
              isHovered && "opacity-100"
            )}
            aria-hidden="true"
          />
        )}

        {/* Border gradient */}
        {borderGradient && (
          <div
            className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none border-gradient-container"
            aria-hidden="true"
            style={{
              background: `linear-gradient(135deg, 
                oklch(0.55 0.20 250 / 0.5) 0%, 
                oklch(0.45 0.22 290 / 0.3) 50%,
                transparent 100%)`,
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "xor",
              WebkitMaskComposite: "xor",
            }}
          />
        )}

        {/* Shine effect */}
        {shine && !shouldDisableEffects && (
          <div
            className={cn(
              "absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none shine-effect",
              isHovered && "opacity-100"
            )}
            aria-hidden="true"
            style={{
              background: `radial-gradient(
                circle at ${mousePosition.x}% ${mousePosition.y}%,
                oklch(1 0 0 / 0.15) 0%,
                transparent 50%
              )`,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
GlassCardTitle.displayName = "GlassCardTitle";

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
GlassCardDescription.displayName = "GlassCardDescription";

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 mt-4", className)}
    {...props}
  />
));
GlassCardFooter.displayName = "GlassCardFooter";

const GlassCardGradientBorder = React.forwardRef<
  HTMLDivElement,
  Omit<GlassCardProps, "borderGradient">
>(({ className, children, ...props }, ref) => (
  <GlassCard
    ref={ref}
    borderGradient
    className={cn("relative", className)}
    {...props}
  >
    <div className="absolute inset-[1px] rounded-2xl bg-background/80 dark:bg-background/50 backdrop-blur-xl" />
    <div className="relative z-10">{children}</div>
  </GlassCard>
));
GlassCardGradientBorder.displayName = "GlassCardGradientBorder";

// =============================================================================
// EXPORTS
// =============================================================================

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
  GlassCardGradientBorder,
  glassCardVariants,
  sanitizeCssValue,
  sanitizePosition,
};
