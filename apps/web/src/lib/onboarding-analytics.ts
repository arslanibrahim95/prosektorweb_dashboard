/**
 * Onboarding Analytics Tracking
 * 
 * Bu dosya onboarding sürecindeki kullanıcı davranışlarını izlemek için kullanılır.
 * PostHog, Mixpanel, Google Analytics veya benzeri bir analytics servisi ile entegre edilebilir.
 */

import { logger } from '@/lib/logger';

export type OnboardingEvent =
    | 'onboarding_started'
    | 'onboarding_welcome_viewed'
    | 'onboarding_organization_viewed'
    | 'onboarding_organization_created'
    | 'onboarding_organization_failed'
    | 'onboarding_complete_viewed'
    | 'onboarding_dashboard_redirect'
    | 'onboarding_abandoned'
    | 'onboarding_skipped';

export interface OnboardingEventProperties {
    [key: string]: unknown;
    step?: string;
    duration?: number;
    organizationName?: string;
    organizationSlug?: string;
    error?: string;
    reason?: string;
    timestamp?: string;
}

type OnboardingEventPayload = OnboardingEventProperties & { timestamp: string };

export interface OnboardingAnalyticsAdapter {
    /**
     * Unique adapter identifier used for deduplication/logging.
     */
    name: string;
    /**
     * Called whenever a new onboarding analytics event is emitted.
     */
    track: (event: OnboardingEvent, properties: OnboardingEventPayload) => void | Promise<void>;
}

const ANALYTICS_LOG_NAMESPACE = '[Onboarding Analytics]';

const adapterRegistry = new Map<string, OnboardingAnalyticsAdapter>();

export function registerOnboardingAnalyticsAdapter(adapter: OnboardingAnalyticsAdapter | undefined): void {
    if (!adapter) {
        logger.warn(`${ANALYTICS_LOG_NAMESPACE} Tried to register empty adapter`);
        return;
    }

    const name = adapter.name?.trim();
    if (!name) {
        logger.warn(`${ANALYTICS_LOG_NAMESPACE} Adapter registration skipped due to missing name`);
        return;
    }

    if (typeof adapter.track !== 'function') {
        logger.warn(`${ANALYTICS_LOG_NAMESPACE} Adapter registration skipped due to missing track()`, {
            adapterName: name,
        });
        return;
    }

    adapterRegistry.set(name, { ...adapter, name });
}

export function unregisterOnboardingAnalyticsAdapter(
    adapterOrName: string | OnboardingAnalyticsAdapter,
): void {
    const name = typeof adapterOrName === "string" ? adapterOrName : adapterOrName?.name;
    if (!name) {
        return;
    }
    adapterRegistry.delete(name);
}

export function clearOnboardingAnalyticsAdapters(): void {
    adapterRegistry.clear();
}

function getCustomAdaptersSnapshot(): OnboardingAnalyticsAdapter[] {
    return Array.from(adapterRegistry.values());
}

type BrowserAnalyticsWindow = Window & {
    posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void };
    mixpanel?: { track: (event: string, properties?: Record<string, unknown>) => void };
    analytics?: { track: (event: string, properties?: Record<string, unknown>) => void };
    gtag?: (...args: unknown[]) => void;
};

function detectBrowserAdapters(): OnboardingAnalyticsAdapter[] {
    if (typeof window === 'undefined') {
        return [];
    }

    const adapters: OnboardingAnalyticsAdapter[] = [];
    const analyticsWindow = window as BrowserAnalyticsWindow;

    if (analyticsWindow.posthog?.capture) {
        adapters.push({
            name: 'posthog',
            track: (event, properties) => analyticsWindow.posthog!.capture(event, properties),
        });
    }

    if (analyticsWindow.mixpanel?.track) {
        adapters.push({
            name: 'mixpanel',
            track: (event, properties) => analyticsWindow.mixpanel!.track(event, properties),
        });
    }

    if (typeof analyticsWindow.gtag === 'function') {
        adapters.push({
            name: 'gtag',
            track: (event, properties) => analyticsWindow.gtag!('event', event, properties),
        });
    }

    if (analyticsWindow.analytics?.track) {
        adapters.push({
            name: 'segment',
            track: (event, properties) => analyticsWindow.analytics!.track(event, properties),
        });
    }

    return adapters;
}

function getActiveAdapters(): OnboardingAnalyticsAdapter[] {
    const seen = new Set<string>();
    const adapters: OnboardingAnalyticsAdapter[] = [];

    for (const adapter of getCustomAdaptersSnapshot()) {
        if (seen.has(adapter.name)) continue;
        adapters.push(adapter);
        seen.add(adapter.name);
    }

    for (const adapter of detectBrowserAdapters()) {
        if (seen.has(adapter.name)) continue;
        adapters.push(adapter);
        seen.add(adapter.name);
    }

    return adapters;
}

function isPromise<T>(value: unknown): value is Promise<T> {
    return !!value && typeof (value as Promise<T>).then === "function";
}

function logAdapterFailure(adapterName: string, error: unknown): void {
    logger.warn(`${ANALYTICS_LOG_NAMESPACE} Adapter failed`, {
        adapter: adapterName,
        error,
    });
}

/**
 * Track onboarding event
 * SECURITY FIX: Added error handling to prevent component crashes
 * 
 * @param event - Event name
 * @param properties - Event properties
 */
export function trackOnboardingEvent(
    event: OnboardingEvent,
    properties?: OnboardingEventProperties
): void {
    // Add timestamp if not provided
    const eventData: OnboardingEventPayload = {
        ...properties,
        timestamp: properties?.timestamp || new Date().toISOString(),
    };

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
        logger.info('[Onboarding Analytics]', { event, eventData });
    }

    const adapters = getActiveAdapters();

    for (const adapter of adapters) {
        try {
            const result = adapter.track(event, eventData);
            if (isPromise(result)) {
                result.catch(error => logAdapterFailure(adapter.name, error));
            }
        } catch (error) {
            logAdapterFailure(adapter.name, error);
        }
    }
}

/**
 * Track onboarding step time
 * 
 * @param step - Step name
 * @param startTime - Start time in milliseconds
 */
export function trackOnboardingStepTime(step: string, startTime: number): void {
    const duration = Date.now() - startTime;
    trackOnboardingEvent('onboarding_started', { step, duration });
}

/**
 * Hook to track page view on mount
 * 
 * Usage:
 * ```tsx
 * useOnboardingPageView('welcome');
 * ```
 */
export function useOnboardingPageView(step: string): void | (() => void) {
    if (typeof window === 'undefined') return;

    const startTime = Date.now();

    // Track page view
    trackOnboardingEvent('onboarding_started', { step });

    // Track page leave (cleanup)
    return () => {
        trackOnboardingStepTime(step, startTime);
    };
}
