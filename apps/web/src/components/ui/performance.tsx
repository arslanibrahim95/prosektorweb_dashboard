"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

/**
 * Performance Monitoring & Core Web Vitals Components - Production Ready
 * 
 * Features:
 * - Type-safe Performance API usage
 * - Proper observer cleanup
 * - Error boundaries
 * - Memory leak free
 * - SSR safe
 * 
 * @module performance
 * @version 2.0.0
 */

// =============================================================================
// TYPES
// =============================================================================

type WebVitalName = "LCP" | "INP" | "CLS" | "TTFB" | "FCP";

interface WebVitalMetric {
  name: WebVitalName;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

// Type-safe Performance Entry interfaces
interface LargestContentfulPaintEntry extends PerformanceEntry {
  renderTime?: number;
  loadTime?: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface EventTimingEntry extends PerformanceEntry {
  duration: number;
}

interface ResourceEntry extends PerformanceEntry {
  encodedBodySize?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const WEB_VITAL_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 600, poor: 1000 },
  FCP: { good: 1800, poor: 3000 },
} as const;

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

interface PerformanceErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface PerformanceErrorBoundaryState {
  hasError: boolean;
}

class PerformanceErrorBoundary extends React.Component<
  PerformanceErrorBoundaryProps,
  PerformanceErrorBoundaryState
> {
  constructor(props: PerformanceErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): PerformanceErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.warn("Performance monitoring error", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

// =============================================================================
// CORE WEB VITALS MONITOR
// =============================================================================

interface PerformanceMonitorProps {
  onMetric?: (metric: WebVitalMetric) => void;
  showOverlay?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onMetric,
  showOverlay = process.env.NODE_ENV === "development",
  position = "bottom-right",
}) => {
  const [metrics, setMetrics] = React.useState<WebVitalMetric[]>([]);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const observersRef = React.useRef<PerformanceObserver[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as LargestContentfulPaintEntry;
        
        if (!lastEntry) return;

        const value = lastEntry.renderTime ?? lastEntry.loadTime ?? lastEntry.startTime;
        
        const metric: WebVitalMetric = {
          name: "LCP",
          value: Math.round(value),
          rating: value <= WEB_VITAL_THRESHOLDS.LCP.good 
            ? "good" 
            : value <= WEB_VITAL_THRESHOLDS.LCP.poor 
              ? "needs-improvement" 
              : "poor",
          timestamp: Date.now(),
        };
        
        setMetrics((prev) => [...prev.filter((m) => m.name !== "LCP"), metric]);
        onMetric?.(metric);
      });

      // CLS Observer
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const lsEntry = entry as LayoutShiftEntry;
          if (!lsEntry.hadRecentInput) {
            clsValue += lsEntry.value;
          }
        }

        const metric: WebVitalMetric = {
          name: "CLS",
          value: parseFloat(clsValue.toFixed(3)),
          rating: clsValue <= WEB_VITAL_THRESHOLDS.CLS.good
            ? "good"
            : clsValue <= WEB_VITAL_THRESHOLDS.CLS.poor
              ? "needs-improvement"
              : "poor",
          timestamp: Date.now(),
        };

        setMetrics((prev) => [...prev.filter((m) => m.name !== "CLS"), metric]);
        onMetric?.(metric);
      });

      // FCP and TTFB from navigation timing
      const observeNavigation = () => {
        const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        
        if (navEntry) {
          const ttfbValue = navEntry.responseStart;
          const ttfbMetric: WebVitalMetric = {
            name: "TTFB",
            value: Math.round(ttfbValue),
            rating: ttfbValue <= WEB_VITAL_THRESHOLDS.TTFB.good
              ? "good"
              : ttfbValue <= WEB_VITAL_THRESHOLDS.TTFB.poor
                ? "needs-improvement"
                : "poor",
            timestamp: Date.now(),
          };
          setMetrics((prev) => [...prev.filter((m) => m.name !== "TTFB"), ttfbMetric]);
          onMetric?.(ttfbMetric);

          const fcpEntries = performance.getEntriesByName("first-contentful-paint");
          const fcpEntry = fcpEntries[0] as PerformanceEntry | undefined;
          
          if (fcpEntry) {
            const fcpMetric: WebVitalMetric = {
              name: "FCP",
              value: Math.round(fcpEntry.startTime),
              rating: fcpEntry.startTime <= WEB_VITAL_THRESHOLDS.FCP.good
                ? "good"
                : fcpEntry.startTime <= WEB_VITAL_THRESHOLDS.FCP.poor
                  ? "needs-improvement"
                  : "poor",
              timestamp: Date.now(),
            };
            setMetrics((prev) => [...prev.filter((m) => m.name !== "FCP"), fcpMetric]);
            onMetric?.(fcpMetric);
          }
        }
      };

      // Observe LCP
      try {
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
        observersRef.current.push(lcpObserver);
      } catch {
        logger.warn("LCP observation not supported");
      }

      // Observe CLS
      try {
        clsObserver.observe({ type: "layout-shift", buffered: true });
        observersRef.current.push(clsObserver);
      } catch {
        logger.warn("CLS observation not supported");
      }

      // Navigation timing
      if (document.readyState === "complete") {
        observeNavigation();
      } else {
        window.addEventListener("load", observeNavigation, { once: true });
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error("Failed to initialize performance monitoring");
      setError(error);
      logger.warn("Performance monitoring initialization failed", { error });
    }

    return () => {
      // Proper cleanup - clear buffers before disconnect
      observersRef.current.forEach((observer) => {
        try {
          observer.takeRecords();
          observer.disconnect();
        } catch (e) {
          logger.warn("Error disconnecting observer", { error: e });
        }
      });
      observersRef.current = [];
    };
  }, [onMetric]);

  if (!showOverlay) return null;
  if (error) return null; // Silently fail in production

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "good":
        return "bg-green-500";
      case "needs-improvement":
        return "bg-yellow-500";
      case "poor":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMetricDisplay = (metric: WebVitalMetric) => {
    if (metric.name === "CLS") {
      return metric.value.toFixed(3);
    }
    return `${metric.value}ms`;
  };

  return (
    <div className={cn("fixed z-[9999] font-mono text-xs", positionClasses[position])}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-background/95 backdrop-blur-sm border shadow-lg",
          "hover:bg-accent transition-colors"
        )}
      >
        <span className="font-semibold">Web Vitals</span>
        {metrics.length > 0 && (
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              getRatingColor(
                metrics.every((m) => m.rating === "good")
                  ? "good"
                  : metrics.some((m) => m.rating === "poor")
                    ? "poor"
                    : "needs-improvement"
              )
            )}
          />
        )}
      </button>

      {isExpanded && (
        <div
          className={cn(
            "mt-2 p-3 rounded-lg",
            "bg-background/95 backdrop-blur-sm border shadow-lg",
            "space-y-2 min-w-[200px]"
          )}
        >
          {(["LCP", "INP", "CLS", "TTFB", "FCP"] as WebVitalName[]).map((name) => {
            const metric = metrics.find((m) => m.name === name);
            return (
              <div key={name} className="flex items-center justify-between">
                <span className="font-medium">{name}</span>
                {metric ? (
                  <span className={cn("px-2 py-0.5 rounded text-white", getRatingColor(metric.rating))}>
                    {getMetricDisplay(metric)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Loading...</span>
                )}
              </div>
            );
          })}

          <div className="pt-2 mt-2 border-t text-muted-foreground">
            <p className="text-[10px]">2026 Targets:</p>
            <p className="text-[10px]">LCP &lt;1.8s | INP &lt;150ms | CLS &lt;0.05</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// LAZY LOAD
// =============================================================================

interface LazyLoadProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  onVisible?: () => void;
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  placeholder,
  threshold = 0.1,
  rootMargin = "50px",
  triggerOnce = true,
  onVisible,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setIsVisible(true);
          onVisible?.();
          if (triggerOnce && observerRef.current) {
            observerRef.current.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(container);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, onVisible]);

  return (
    <div ref={containerRef} className="min-h-[1px]">
      {isVisible ? children : placeholder || <div className="animate-pulse bg-muted h-32 rounded-lg" />}
    </div>
  );
};

// =============================================================================
// OPTIMIZED IMAGE
// =============================================================================

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholderSrc?: string;
  priority?: boolean;
  quality?: number;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  placeholderSrc,
  priority = false,
  className,
  objectFit = "cover",
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState(placeholderSrc || src);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (priority) {
      setCurrentSrc(src);
      return;
    }

    // Load actual image
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      logger.warn("Failed to load image", { src });
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, priority]);

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ width, height }}>
      {placeholderSrc && !isLoaded && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 w-full h-full transition-opacity duration-300",
            "blur-sm scale-105",
            isLoaded ? "opacity-0" : "opacity-100"
          )}
          style={{ objectFit }}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        onLoad={() => setIsLoaded(true)}
        onError={() => logger.warn("Image failed to load", { src: currentSrc })}
        className={cn(
          "w-full h-full transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{ objectFit }}
        {...props}
      />
    </div>
  );
};

// =============================================================================
// VIRTUAL SCROLL
// =============================================================================

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  containerHeight?: number | string;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  className,
  containerHeight = "400px",
}: VirtualScrollProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerHeightValue, setContainerHeightValue] = React.useState(0);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setContainerHeightValue(container.clientHeight);

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeightValue(container.clientHeight);
    };

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeightValue) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PERFORMANCE BUDGET
// =============================================================================

interface PerformanceBudgetProps {
  current: number;
  budget: number;
  label: string;
  unit?: string;
}

export const PerformanceBudget: React.FC<PerformanceBudgetProps> = ({
  current,
  budget,
  label,
  unit = "KB",
}) => {
  const percentage = Math.min((current / budget) * 100, 100);
  const isOverBudget = current > budget;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn(isOverBudget ? "text-red-500 font-semibold" : "text-muted-foreground")}>
          {current.toFixed(1)}
          {unit} / {budget}
          {unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            percentage > 90 ? "bg-red-500" : percentage > 75 ? "bg-yellow-500" : "bg-green-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isOverBudget && (
        <p className="text-xs text-red-500">
          Warning: Exceeds budget by {((current - budget)).toFixed(1)}
          {unit}
        </p>
      )}
    </div>
  );
};

// =============================================================================
// LOADING SKELETON
// =============================================================================

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  type?: "text" | "circle" | "rect" | "card";
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  count = 1,
  type = "text",
}) => {
  const baseClasses = "animate-pulse bg-muted rounded";

  const typeClasses = {
    text: "h-4 w-full",
    circle: "h-12 w-12 rounded-full",
    rect: "h-24 w-full",
    card: "h-48 w-full",
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClasses, typeClasses[type], className)}
          style={{ animationDelay: `${i * 100}ms` }}
          aria-hidden="true"
        />
      ))}
    </>
  );
};

// =============================================================================
// RESOURCE HINT
// =============================================================================

interface ResourceHintProps {
  href: string;
  as?: "script" | "style" | "font" | "image" | "fetch";
  type?: "preload" | "prefetch" | "preconnect" | "dns-prefetch";
  crossOrigin?: "anonymous" | "use-credentials";
}

export const ResourceHint: React.FC<ResourceHintProps> = ({
  href,
  as,
  type = "prefetch",
  crossOrigin,
}) => {
  React.useEffect(() => {
    const link = document.createElement("link");
    link.rel = type;
    link.href = href;
    if (as) link.as = as;
    if (crossOrigin) link.crossOrigin = crossOrigin;

    try {
      document.head.appendChild(link);
    } catch (e) {
      logger.warn("Failed to add resource hint", { href, as, type, error: e });
    }

    return () => {
      try {
        document.head.removeChild(link);
      } catch {
        // Link might already be removed
      }
    };
  }, [href, as, type, crossOrigin]);

  return null;
};

// =============================================================================
// DEFERRED
// =============================================================================

interface DeferredProps {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}

export const Deferred: React.FC<DeferredProps> = ({
  children,
  delay = 0,
  fallback,
}) => {
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => setShouldRender(true));
      } else {
        setShouldRender(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// =============================================================================
// INP TRACKER - FIXED: Type-safe
// =============================================================================

export const useINPTracker = () => {
  const [inp, setInp] = React.useState<number | null>(null);
  const interactionsRef = React.useRef<number[]>([]);
  const observerRef = React.useRef<PerformanceObserver | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let longestInteraction = 0;

    try {
      observerRef.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const timingEntry = entry as EventTimingEntry;
          interactionsRef.current.push(timingEntry.duration);

          // Keep only recent interactions (last 50)
          if (interactionsRef.current.length > 50) {
            interactionsRef.current.shift();
          }

          // Calculate 98th percentile (INP approximation)
          const sorted = [...interactionsRef.current].sort((a, b) => a - b);
          const index = Math.floor(sorted.length * 0.98);
          const inpValue = sorted[index] || 0;

          if (inpValue > longestInteraction) {
            longestInteraction = inpValue;
            setInp(Math.round(inpValue));
          }
        }
      });

      observerRef.current.observe({ type: "event", buffered: true });
    } catch {
      logger.warn("INP tracking not supported");
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return inp;
};

// =============================================================================
// PERFORMANCE REPORT
// =============================================================================

interface PerformanceReportProps {
  className?: string;
}

export const PerformanceReport: React.FC<PerformanceReportProps> = ({ className }) => {
  const [report, setReport] = React.useState<{
    fcp: number | null;
    lcp: number | null;
    cls: number | null;
    ttfb: number | null;
    resourceCount: number;
    totalSize: number;
  }>({
    fcp: null,
    lcp: null,
    cls: null,
    ttfb: null,
    resourceCount: 0,
    totalSize: 0,
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const generateReport = () => {
      try {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        const resources = performance.getEntriesByType("resource") as ResourceEntry[];

        const fcpEntry = performance.getEntriesByName("first-contentful-paint")[0] as PerformanceEntry | undefined;

        setReport({
          fcp: fcpEntry ? Math.round(fcpEntry.startTime) : null,
          lcp: null,
          cls: null,
          ttfb: navigation ? Math.round(navigation.responseStart) : null,
          resourceCount: resources.length,
          totalSize: resources.reduce((acc, r) => acc + (r.encodedBodySize || 0), 0),
        });
      } catch (e) {
        logger.warn("Failed to generate performance report", { error: e });
      }
    };

    if (document.readyState === "complete") {
      generateReport();
    } else {
      window.addEventListener("load", generateReport, { once: true });
    }
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("p-4 rounded-lg border bg-card", className)}>
      <h3 className="font-semibold mb-4">Performance Report</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">First Contentful Paint</p>
          <p className="text-lg font-mono">{report.fcp ? `${report.fcp}ms` : "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Time to First Byte</p>
          <p className="text-lg font-mono">{report.ttfb ? `${report.ttfb}ms` : "N/A"}</p>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Resources</span>
          <span className="font-mono">{report.resourceCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Size</span>
          <span className="font-mono">{formatBytes(report.totalSize)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        <p>2026 Targets:</p>
        <ul className="mt-1 space-y-1">
          <li>FCP: &lt; 1.0s | LCP: &lt; 1.8s</li>
          <li>INP: &lt; 150ms | CLS: &lt; 0.05</li>
        </ul>
      </div>
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  WebVitalName,
  WebVitalMetric,
  LargestContentfulPaintEntry,
  LayoutShiftEntry,
  EventTimingEntry,
  ResourceEntry,
  PerformanceMonitorProps,
  LazyLoadProps,
  OptimizedImageProps,
  VirtualScrollProps,
  PerformanceBudgetProps,
  LoadingSkeletonProps,
  ResourceHintProps,
  DeferredProps,
  PerformanceReportProps,
};

export {
  WEB_VITAL_THRESHOLDS,
  PerformanceErrorBoundary,
};
