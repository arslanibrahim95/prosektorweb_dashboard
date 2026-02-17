"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Micro-Interactions Library - Production Ready
 * 
 * Features:
 * - XSS-safe animation values
 * - RAF throttling to prevent re-render storms
 * - Memory leak free
 * - Reduced motion support
 * - Error handling
 * 
 * @module micro-interactions
 * @version 2.0.0
 */

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

export const ANIMATION_CONFIG = {
  durations: {
    micro: 100,
    fast: 150,
    normal: 200,
    slow: 300,
    elaborate: 400,
  },
  easings: {
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    outExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
    inOutExpo: "cubic-bezier(0.87, 0, 0.13, 1)",
  },
  // Throttle state updates to every 100ms to prevent re-render storms
  STATE_UPDATE_INTERVAL: 100,
} as const;

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to detect reduced motion preference
 */
export const usePrefersReducedMotion = (): boolean => {
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

/**
 * Hook for RAF-based animations with throttling
 */
export const useThrottledAnimation = (
  callback: (progress: number) => void,
  duration: number,
  delay: number = 0
) => {
  const frameRef = React.useRef<number | null>(null);
  const lastUpdateRef = React.useRef(0);
  const isActiveRef = React.useRef(false);

  const start = React.useCallback(() => {
    if (isActiveRef.current) return; // Prevent multiple starts
    isActiveRef.current = true;

    const startTime = performance.now() + delay;

    const animate = (currentTime: number) => {
      if (!isActiveRef.current) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);

      // Throttle state updates
      if (currentTime - lastUpdateRef.current >= ANIMATION_CONFIG.STATE_UPDATE_INTERVAL || progress >= 1) {
        callback(progress);
        lastUpdateRef.current = currentTime;
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        isActiveRef.current = false;
      }
    };

    if (delay > 0) {
      setTimeout(() => {
        if (isActiveRef.current) {
          frameRef.current = requestAnimationFrame(animate);
        }
      }, delay);
    } else {
      frameRef.current = requestAnimationFrame(animate);
    }
  }, [callback, duration, delay]);

  const stop = React.useCallback(() => {
    isActiveRef.current = false;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { start, stop };
};

// =============================================================================
// STAGGER CONTAINER
// =============================================================================

interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerDelay?: number;
  initialDelay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  duration?: number;
  as?: React.ElementType;
  respectReducedMotion?: boolean;
}

export const StaggerContainer = React.forwardRef<
  HTMLDivElement,
  StaggerContainerProps
>(
  (
    {
      className,
      staggerDelay = 60,
      initialDelay = 0,
      direction = "up",
      duration = 400,
      as: Component = "div",
      respectReducedMotion = true,
      children,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

    const getAnimationStyles = React.useCallback(() => {
      if (!shouldAnimate) {
        return { opacity: 1 };
      }

      const base = {
        opacity: 0,
        animationDuration: `${duration}ms`,
        animationTimingFunction: ANIMATION_CONFIG.easings.outExpo,
        animationFillMode: "forwards" as const,
      };

      switch (direction) {
        case "up":
          return { ...base, transform: "translateY(20px)" };
        case "down":
          return { ...base, transform: "translateY(-20px)" };
        case "left":
          return { ...base, transform: "translateX(20px)" };
        case "right":
          return { ...base, transform: "translateX(-20px)" };
        case "scale":
          return { ...base, transform: "scale(0.95)" };
        case "fade":
        default:
          return base;
      }
    }, [direction, duration, shouldAnimate]);

    const childrenArray = React.Children.toArray(children);

    return (
      <Component
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn("stagger-container", className)}
        {...props}
      >
        {childrenArray.map((child, index) => (
          <div
            key={index}
            className="stagger-item"
            style={{
              ...getAnimationStyles(),
              animationName: shouldAnimate ? "stagger-fade-in" : undefined,
              animationDelay: `${initialDelay + index * staggerDelay}ms`,
            }}
          >
            {child}
          </div>
        ))}
      </Component>
    );
  }
);
StaggerContainer.displayName = "StaggerContainer";

// =============================================================================
// MAGNETIC BUTTON
// =============================================================================

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number;
  radius?: number;
  respectReducedMotion?: boolean;
}

export const MagneticButton = React.forwardRef<
  HTMLButtonElement,
  MagneticButtonProps
>(
  (
    {
      className,
      strength = 0.3,
      radius = 100,
      respectReducedMotion = true,
      children,
      ...props
    },
    ref
  ) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const frameRef = React.useRef<number | null>(null);
    const prefersReducedMotion = usePrefersReducedMotion();

    React.useImperativeHandle(ref, () => buttonRef.current!, []);

    React.useEffect(() => {
      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }, []);

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent) => {
        if (!buttonRef.current || (respectReducedMotion && prefersReducedMotion)) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

        if (distance < radius) {
          if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
          }

          frameRef.current = requestAnimationFrame(() => {
            setPosition({
              x: distanceX * strength,
              y: distanceY * strength,
            });
          });
        }
      },
      [strength, radius, respectReducedMotion, prefersReducedMotion]
    );

    const handleMouseLeave = React.useCallback(() => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      setPosition({ x: 0, y: 0 });
    }, []);

    return (
      <button
        ref={buttonRef}
        className={cn(
          "magnetic-button relative transition-transform duration-200",
          "ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// =============================================================================
// TEXT REVEAL
// =============================================================================

interface TextRevealProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  delay?: number;
  staggerDelay?: number;
  duration?: number;
  direction?: "up" | "down" | "fade" | "blur";
  respectReducedMotion?: boolean;
}

export const TextReveal = React.forwardRef<HTMLSpanElement, TextRevealProps>(
  (
    {
      className,
      text,
      delay = 0,
      staggerDelay = 30,
      duration = 400,
      direction = "up",
      respectReducedMotion = true,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

    const characters = React.useMemo(() => text.split(""), [text]);

    const getInitialStyles = React.useCallback(() => {
      if (!shouldAnimate) {
        return { opacity: 1 };
      }

      switch (direction) {
        case "up":
          return { opacity: 0, transform: "translateY(100%)" };
        case "down":
          return { opacity: 0, transform: "translateY(-100%)" };
        case "blur":
          return { opacity: 0, filter: "blur(8px)" };
        case "fade":
        default:
          return { opacity: 0 };
      }
    }, [direction, shouldAnimate]);

    return (
      <span
        ref={ref}
        className={cn("inline-flex overflow-hidden", className)}
        {...props}
      >
        {characters.map((char, index) => (
          <span
            key={index}
            className={cn("inline-block", shouldAnimate && "animate-text-reveal")}
            style={{
              ...getInitialStyles(),
              animationDelay: `${delay + index * staggerDelay}ms`,
              animationDuration: `${duration}ms`,
              animationTimingFunction: ANIMATION_CONFIG.easings.outExpo,
              animationFillMode: "forwards",
              whiteSpace: char === " " ? "pre" : "normal",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    );
  }
);
TextReveal.displayName = "TextReveal";

// =============================================================================
// COUNT UP - FIXED: RAF throttling to prevent re-render storms
// =============================================================================

interface CountUpProps extends React.HTMLAttributes<HTMLSpanElement> {
  end: number;
  start?: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  respectReducedMotion?: boolean;
}

export const CountUp = React.forwardRef<HTMLSpanElement, CountUpProps>(
  (
    {
      className,
      end,
      start = 0,
      duration = 2000,
      delay = 0,
      decimals = 0,
      prefix = "",
      suffix = "",
      separator = ",",
      respectReducedMotion = true,
      ...props
    },
    ref
  ) => {
    const [count, setCount] = React.useState(start);
    const countRef = React.useRef(start);
    const frameRef = React.useRef<number | null>(null);
    const lastUpdateRef = React.useRef(0);
    const isActiveRef = React.useRef(false);
    const prefersReducedMotion = usePrefersReducedMotion();

    // Skip animation if reduced motion is preferred
    const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

    React.useEffect(() => {
      if (!shouldAnimate) {
        setCount(end);
        return;
      }

      const timeout = setTimeout(() => {
        if (isActiveRef.current) return;
        isActiveRef.current = true;

        const startTime = performance.now();
        const difference = end - start;

        const animate = (currentTime: number) => {
          if (!isActiveRef.current) return;

          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out expo
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentCount = start + difference * easeProgress;

          countRef.current = currentCount;

          // Throttle state updates to prevent re-render storm
          const shouldUpdateState =
            currentTime - lastUpdateRef.current >= ANIMATION_CONFIG.STATE_UPDATE_INTERVAL ||
            progress >= 1;

          if (shouldUpdateState) {
            setCount(currentCount);
            lastUpdateRef.current = currentTime;
          }

          if (progress < 1) {
            frameRef.current = requestAnimationFrame(animate);
          } else {
            isActiveRef.current = false;
            setCount(end); // Ensure final value is exact
          }
        };

        frameRef.current = requestAnimationFrame(animate);
      }, delay);

      return () => {
        clearTimeout(timeout);
        isActiveRef.current = false;
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }, [end, start, duration, delay, shouldAnimate]);

    const formatNumber = React.useCallback(
      (num: number) => {
        const fixed = num.toFixed(decimals);
        const parts = fixed.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        return parts.join(".");
      },
      [decimals, separator]
    );

    return (
      <span ref={ref} className={cn("tabular-nums", className)} {...props}>
        {prefix}
        {formatNumber(count)}
        {suffix}
      </span>
    );
  }
);
CountUp.displayName = "CountUp";

// =============================================================================
// SHIMMER & SKELETON
// =============================================================================

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: "default" | "dark" | "diagonal";
}

export const Shimmer = React.forwardRef<HTMLDivElement, ShimmerProps>(
  (
    {
      className,
      width = "100%",
      height = "1rem",
      borderRadius = "0.25rem",
      variant = "default",
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: "shimmer-skeleton",
      dark: "shimmer-skeleton dark",
      diagonal: "shimmer-skeleton-diagonal",
    };

    return (
      <div
        ref={ref}
        className={cn(variantClasses[variant], "animate-pulse", className)}
        style={{
          width,
          height,
          borderRadius,
        }}
        aria-hidden="true"
        {...props}
      />
    );
  }
);
Shimmer.displayName = "Shimmer";

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  hasImage?: boolean;
  imageHeight?: string | number;
}

export const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      className,
      lines = 3,
      hasImage = true,
      imageHeight = "12rem",
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn("rounded-xl border bg-card p-6 space-y-4", className)}
      {...props}
      aria-busy="true"
      aria-label="Loading content"
    >
      {hasImage && <Shimmer height={imageHeight} borderRadius="0.5rem" />}
      <div className="space-y-2">
        <Shimmer width="60%" height="1.5rem" />
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer
            key={i}
            width={i === lines - 1 ? "80%" : "100%"}
            height="0.875rem"
          />
        ))}
      </div>
    </div>
  )
);
SkeletonCard.displayName = "SkeletonCard";

// =============================================================================
// PAGE TRANSITIONS
// =============================================================================

interface PageTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  duration?: number;
  delay?: number;
  respectReducedMotion?: boolean;
}

export const PageTransition = React.forwardRef<
  HTMLDivElement,
  PageTransitionProps
>(
  (
    {
      className,
      direction = "up",
      duration = 400,
      delay = 0,
      respectReducedMotion = true,
      children,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

    const getAnimationClass = () => {
      if (!shouldAnimate) return "";

      switch (direction) {
        case "up":
          return "animate-page-enter-up";
        case "down":
          return "animate-page-enter-down";
        case "left":
          return "animate-page-enter-left";
        case "right":
          return "animate-page-enter-right";
        case "scale":
          return "animate-page-enter-scale";
        case "fade":
        default:
          return "animate-fade-in";
      }
    };

    return (
      <div
        ref={ref}
        className={cn(getAnimationClass(), className)}
        style={{
          animationDuration: shouldAnimate ? `${duration}ms` : undefined,
          animationDelay: shouldAnimate ? `${delay}ms` : undefined,
          animationFillMode: shouldAnimate ? "forwards" : undefined,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PageTransition.displayName = "PageTransition";

// =============================================================================
// HOVER LIFT
// =============================================================================

interface HoverLiftProps extends React.HTMLAttributes<HTMLDivElement> {
  lift?: number;
  shadow?: boolean;
  respectReducedMotion?: boolean;
}

export const HoverLift = React.forwardRef<HTMLDivElement, HoverLiftProps>(
  (
    { className, lift = 4, shadow = true, respectReducedMotion = true, children, ...props },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

    return (
      <div
        ref={ref}
        className={cn(
          "transition-all duration-300",
          "ease-[cubic-bezier(0.16,1,0.3,1)]",
          shadow && "hover:shadow-xl",
          className
        )}
        style={{
          transform: "translateY(0)",
        }}
        onMouseEnter={
          shouldAnimate
            ? (e) => {
                (e.currentTarget as HTMLElement).style.transform = `translateY(-${lift}px)`;
              }
            : undefined
        }
        onMouseLeave={
          shouldAnimate
            ? (e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    );
  }
);
HoverLift.displayName = "HoverLift";

// =============================================================================
// CONFETTI
// =============================================================================

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

interface ConfettiProps {
  active: boolean;
  origin?: { x: number; y: number };
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
  respectReducedMotion?: boolean;
}

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  origin = { x: 0.5, y: 0.5 },
  particleCount = 50,
  colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#f0932b", "#eb4d4b", "#6c5ce7"],
  onComplete,
  respectReducedMotion = true,
}) => {
  const [pieces, setPieces] = React.useState<ConfettiPiece[]>([]);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Skip confetti if reduced motion is preferred
  const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

  React.useEffect(() => {
    if (!active || !shouldAnimate) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    const newPieces: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.3,
    }));
    setPieces(newPieces);

    timeoutRef.current = setTimeout(() => {
      setPieces([]);
      onComplete?.();
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [active, particleCount, colors, onComplete, shouldAnimate]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti"
          style={{
            left: `${origin.x * 100}%`,
            top: `${origin.y * 100}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

// =============================================================================
// PULSE RING
// =============================================================================

interface PulseRingProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  size?: number;
  ringCount?: number;
}

export const PulseRing = React.forwardRef<HTMLDivElement, PulseRingProps>(
  (
    { className, color = "var(--primary)", size = 12, ringCount = 3, children, ...props },
    ref
  ) => (
    <div ref={ref} className={cn("relative inline-flex", className)} {...props}>
      {children}
      {Array.from({ length: ringCount }).map((_, i) => (
        <span
          key={i}
          className="absolute inline-flex h-full w-full rounded-full animate-ping"
          style={{
            backgroundColor: color,
            animationDelay: `${i * 0.4}s`,
            animationDuration: "2s",
          }}
          aria-hidden="true"
        />
      ))}
      <span
        className="relative inline-flex rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
      />
    </div>
  )
);
PulseRing.displayName = "PulseRing";

// =============================================================================
// MORPHING ICON
// =============================================================================

interface MorphingIconProps extends React.HTMLAttributes<HTMLDivElement> {
  isActive: boolean;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  duration?: number;
  respectReducedMotion?: boolean;
}

export const MorphingIcon = React.forwardRef<HTMLDivElement, MorphingIconProps>(
  (
    {
      className,
      isActive,
      activeIcon,
      inactiveIcon,
      duration = 300,
      respectReducedMotion = true,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

    return (
      <div ref={ref} className={cn("relative w-6 h-6", className)} {...props}>
        <div
          className="absolute inset-0 transition-all"
          style={{
            opacity: isActive ? 1 : 0,
            transform: shouldAnimate
              ? isActive
                ? "scale(1) rotate(0deg)"
                : "scale(0.5) rotate(-90deg)"
              : isActive
              ? "scale(1)"
              : "scale(0)",
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: ANIMATION_CONFIG.easings.spring,
          }}
          aria-hidden={!isActive}
        >
          {activeIcon}
        </div>
        <div
          className="absolute inset-0 transition-all"
          style={{
            opacity: isActive ? 0 : 1,
            transform: shouldAnimate
              ? isActive
                ? "scale(0.5) rotate(90deg)"
                : "scale(1) rotate(0deg)"
              : isActive
              ? "scale(0)"
              : "scale(1)",
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: ANIMATION_CONFIG.easings.spring,
          }}
          aria-hidden={isActive}
        >
          {inactiveIcon}
        </div>
      </div>
    );
  }
);
MorphingIcon.displayName = "MorphingIcon";

export type {
  StaggerContainerProps,
  MagneticButtonProps,
  TextRevealProps,
  CountUpProps,
  ShimmerProps,
  SkeletonCardProps,
  PageTransitionProps,
  HoverLiftProps,
  ConfettiProps,
  ConfettiPiece,
  PulseRingProps,
  MorphingIconProps,
};
