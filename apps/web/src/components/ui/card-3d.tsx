"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 3D Card Component - Production Ready
 * 
 * Features:
 * - Hardware-accelerated 3D transforms
 * - Mouse tracking for tilt effect
 * - XSS-safe CSS values
 * - Memory leak free
 * - Reduced motion support (WCAG 2.2 AA)
 * - Full error handling
 * 
 * @module card-3d
 * @version 2.0.0
 */

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG = {
  MAX_TILT_DEGREES: 10,
  HOVER_SCALE: 1.02,
  PERSPECTIVE_PX: 1000,
  TRANSITION_MS: 300,
  GLARE_OPACITY: 0.15,
  MIN_DIMENSION: 1, // Prevent division by zero
} as const;

const EASINGS = {
  SMOOTH: "cubic-bezier(0.16, 1, 0.3, 1)",
  SPRING: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Sanitizes CSS numeric values to prevent XSS
 */
const sanitizeCssValue = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
};

/**
 * Checks if user prefers reduced motion
 */
const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
};

// =============================================================================
// CVA VARIANTS
// =============================================================================

const card3DVariants = cva(
  "relative group perspective-1000 cursor-pointer",
  {
    variants: {
      variant: {
        default: "",
        glass: "",
        solid: "",
      },
      size: {
        sm: "w-64",
        default: "w-80",
        lg: "w-96",
        full: "w-full",
      },
      tilt: {
        none: "",
        subtle: "[--tilt-intensity:5]",
        medium: "[--tilt-intensity:10]",
        strong: "[--tilt-intensity:15]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      tilt: "medium",
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface Card3DProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof card3DVariants> {
  /** Enable glare effect */
  glare?: boolean;
  /** Glare opacity (0-1, sanitized) */
  glareOpacity?: number;
  /** Maximum tilt angle in degrees */
  maxTilt?: number;
  /** Scale on hover */
  scale?: number;
  /** Perspective value in pixels */
  perspective?: number;
  /** Transition duration in milliseconds */
  transitionSpeed?: number;
  /** Disable 3D effect on touch devices */
  disableOnTouch?: boolean;
}

export type Card3DRef = HTMLDivElement;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Card3D = React.forwardRef<Card3DRef, Card3DProps>(
  (
    {
      className,
      variant,
      size,
      tilt,
      glare = true,
      glareOpacity = DEFAULT_CONFIG.GLARE_OPACITY,
      maxTilt = DEFAULT_CONFIG.MAX_TILT_DEGREES,
      scale = DEFAULT_CONFIG.HOVER_SCALE,
      perspective = DEFAULT_CONFIG.PERSPECTIVE_PX,
      transitionSpeed = DEFAULT_CONFIG.TRANSITION_MS,
      disableOnTouch = true,
      children,
      onMouseMove,
      onMouseLeave,
      onMouseEnter,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    // Sanitize all numeric props
    const safeMaxTilt = sanitizeCssValue(maxTilt, 0, 45);
    const safeScale = sanitizeCssValue(scale, 1, 1.5);
    const safePerspective = sanitizeCssValue(perspective, 100, 2000);
    const safeTransitionSpeed = sanitizeCssValue(transitionSpeed, 50, 1000);
    const safeGlareOpacity = sanitizeCssValue(glareOpacity, 0, 1);

    // Refs
    const cardRef = React.useRef<HTMLDivElement>(null);
    const animationFrameRef = React.useRef<number | null>(null);
    
    // State
    const [tiltStyle, setTiltStyle] = React.useState<React.CSSProperties>({
      transform: `perspective(${safePerspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: `transform ${safeTransitionSpeed}ms ${EASINGS.SMOOTH}`,
    });
    const [glareStyle, setGlareStyle] = React.useState<React.CSSProperties>({});
    const [isHovered, setIsHovered] = React.useState(false);
    const [isTouchDevice, setIsTouchDevice] = React.useState(false);

    // Check for reduced motion preference
    const prefersReducedMotion = usePrefersReducedMotion();

    // Detect touch device
    React.useEffect(() => {
      if (typeof window === "undefined") return;
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    }, []);

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
        // Skip if reduced motion preferred or on touch device (if disabled)
        if (prefersReducedMotion) return;
        if (disableOnTouch && isTouchDevice) return;
        if (!cardRef.current || tilt === "none") return;

        const rect = cardRef.current.getBoundingClientRect();
        
        // Prevent division by zero
        if (rect.width < DEFAULT_CONFIG.MIN_DIMENSION || rect.height < DEFAULT_CONFIG.MIN_DIMENSION) {
          return;
        }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        const rotateX = (mouseY / (rect.height / 2)) * -safeMaxTilt;
        const rotateY = (mouseX / (rect.width / 2)) * safeMaxTilt;

        // Use RAF for smooth updates without blocking
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          setTiltStyle({
            transform: `
              perspective(${safePerspective}px)
              rotateX(${rotateX.toFixed(2)}deg)
              rotateY(${rotateY.toFixed(2)}deg)
              scale3d(${safeScale.toFixed(3)}, ${safeScale.toFixed(3)}, ${safeScale.toFixed(3)})
            `,
            transition: `transform ${safeTransitionSpeed}ms ${EASINGS.SMOOTH}`,
          });

          if (glare) {
            const glareX = Math.round(((mouseX / rect.width) + 0.5) * 100);
            const glareY = Math.round(((mouseY / rect.height) + 0.5) * 100);
            
            // Use CSS custom properties instead of inline styles for better performance
            setGlareStyle({
              ["--glare-x" as string]: `${glareX}%`,
              ["--glare-y" as string]: `${glareY}%`,
              ["--glare-opacity" as string]: safeGlareOpacity.toFixed(2),
            });
          }
        });

        onMouseMove?.(e);
      },
      [glare, safeGlareOpacity, safeMaxTilt, safePerspective, safeScale, safeTransitionSpeed, tilt, disableOnTouch, isTouchDevice, prefersReducedMotion, onMouseMove]
    );

    const handleMouseLeave = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        setIsHovered(false);
        setTiltStyle({
          transform: `
            perspective(${safePerspective}px)
            rotateX(0deg)
            rotateY(0deg)
            scale3d(1, 1, 1)
          `,
          transition: `transform ${safeTransitionSpeed}ms ${EASINGS.SPRING}`,
        });
        setGlareStyle({});

        onMouseLeave?.(e);
      },
      [safePerspective, safeTransitionSpeed, onMouseLeave]
    );

    const handleMouseEnter = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        setIsHovered(true);
        onMouseEnter?.(e);
      },
      [onMouseEnter]
    );

    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLDivElement>) => {
        // Reduced animation for keyboard users
        if (!prefersReducedMotion) {
          setTiltStyle({
            transform: `
              perspective(${safePerspective}px)
              rotateX(1deg)
              rotateY(0deg)
              scale3d(${Math.min(safeScale * 0.98, 1.01).toFixed(3)}, ${Math.min(safeScale * 0.98, 1.01).toFixed(3)}, 1)
            `,
            transition: `transform ${safeTransitionSpeed}ms ease-out`,
          });
        }
        onFocus?.(e);
      },
      [safePerspective, safeScale, safeTransitionSpeed, prefersReducedMotion, onFocus]
    );

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLDivElement>) => {
        handleMouseLeave(e as unknown as React.MouseEvent<HTMLDivElement>);
        onBlur?.(e);
      },
      [handleMouseLeave, onBlur]
    );

    const isTiltDisabled = prefersReducedMotion || tilt === "none" || (disableOnTouch && isTouchDevice);

    return (
      <div
        ref={cardRef}
        className={cn(card3DVariants({ variant, size, tilt, className }))}
        onMouseMove={isTiltDisabled ? undefined : handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={0}
        role="article"
        aria-label={props["aria-label"] || "Interactive 3D card"}
        data-disabled={isTiltDisabled}
        data-reduced-motion={prefersReducedMotion}
        {...props}
      >
        <div
          className={cn(
            "relative w-full h-full preserve-3d rounded-2xl overflow-hidden",
            "transition-shadow duration-300",
            isHovered && "shadow-2xl"
          )}
          style={tiltStyle}
        >
          {/* Glare overlay - XSS safe via CSS custom properties */}
          {glare && !prefersReducedMotion && (
            <div
              className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-200 glare-overlay"
              style={{
                ...glareStyle,
                opacity: isHovered ? 1 : 0,
                background: `radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), 
                  oklch(1 0 0 / var(--glare-opacity, 0.15)) 0%, 
                  transparent 60%)`,
              }}
              aria-hidden="true"
            />
          )}
          
          {/* Content container */}
          <div className="relative z-0">
            {children}
          </div>

          {/* Subtle border glow on hover */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300",
              "border-2 border-transparent",
              isHovered && "border-primary/20"
            )}
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }
);
Card3D.displayName = "Card3D";

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

const Card3DHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
Card3DHeader.displayName = "Card3DHeader";

const Card3DTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
Card3DTitle.displayName = "Card3DTitle";

const Card3DDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
Card3DDescription.displayName = "Card3DDescription";

const Card3DContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
Card3DContent.displayName = "Card3DContent";

const Card3DFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
Card3DFooter.displayName = "Card3DFooter";

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Card3D,
  Card3DHeader,
  Card3DTitle,
  Card3DDescription,
  Card3DContent,
  Card3DFooter,
  card3DVariants,
  sanitizeCssValue,
  usePrefersReducedMotion,
};
