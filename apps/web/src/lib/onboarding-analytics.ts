/**
 * Onboarding Analytics Tracking
 * 
 * Bu dosya onboarding sürecindeki kullanıcı davranışlarını izlemek için kullanılır.
 * PostHog, Mixpanel, Google Analytics veya benzeri bir analytics servisi ile entegre edilebilir.
 */

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
    step?: string;
    duration?: number;
    organizationName?: string;
    organizationSlug?: string;
    error?: string;
    reason?: string;
    timestamp?: string;
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
    const eventData = {
        ...properties,
        timestamp: properties?.timestamp || new Date().toISOString(),
    };

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
        console.log('[Onboarding Analytics]', event, eventData);
    }

    // SECURITY FIX: Wrap analytics calls in try-catch to prevent UI crashes
    try {
        // TODO: Integrate with your analytics service
        // Example integrations:

        // PostHog
        // if (typeof window !== 'undefined' && window.posthog) {
        //     window.posthog.capture(event, eventData);
        // }

        // Mixpanel
        // if (typeof window !== 'undefined' && window.mixpanel) {
        //     window.mixpanel.track(event, eventData);
        // }

        // Google Analytics (gtag)
        // if (typeof window !== 'undefined' && window.gtag) {
        //     window.gtag('event', event, eventData);
        // }

        // Custom API endpoint
        // fetch('/api/analytics/track', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ event, properties: eventData }),
        // }).catch(console.error);
    } catch (error) {
        // Silently fail to prevent breaking the UI
        console.warn('[Analytics] Tracking failed:', error);
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
