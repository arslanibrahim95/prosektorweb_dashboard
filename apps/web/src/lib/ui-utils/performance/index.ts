/**
 * Performance Monitoring & Core Web Vitals Components - Production Ready
 * 
 * @module performance
 * @version 2.0.0
 */

// Types
export type {
    WebVitalName,
    WebVitalMetric,
    LargestContentfulPaintEntry,
    LayoutShiftEntry,
    EventTimingEntry,
    ResourceEntry,
} from './types';

// Constants
export { WEB_VITAL_THRESHOLDS } from './constants';

// Error Boundary
export { PerformanceErrorBoundary } from './error-boundary';

// Components
export { PerformanceMonitor } from './performance-monitor';
export type { PerformanceMonitorProps } from './performance-monitor';

export { LazyLoad } from './lazy-load';
export type { LazyLoadProps } from './lazy-load';

export { OptimizedImage } from './optimized-image';
export type { OptimizedImageProps } from './optimized-image';

export { VirtualScroll } from './virtual-scroll';
export type { VirtualScrollProps } from './virtual-scroll';

export { PerformanceBudget } from './performance-budget';
export type { PerformanceBudgetProps } from './performance-budget';

export { LoadingSkeleton } from './loading-skeleton';
export type { LoadingSkeletonProps } from './loading-skeleton';

export { ResourceHint } from './resource-hint';
export type { ResourceHintProps } from './resource-hint';

export { Deferred } from './deferred';
export type { DeferredProps } from './deferred';

export { PerformanceReport } from './performance-report';
export type { PerformanceReportProps } from './performance-report';

// Hooks
export { useINPTracker } from './hooks';
