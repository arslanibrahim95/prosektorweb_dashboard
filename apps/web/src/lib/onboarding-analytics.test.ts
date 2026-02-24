import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    trackOnboardingEvent,
    registerOnboardingAnalyticsAdapter,
    clearOnboardingAnalyticsAdapters,
} from '@/lib/onboarding-analytics';
import { logger } from '@/lib/logger';

const flushPromises = () => new Promise<void>(resolve => setTimeout(resolve, 0));

type TrackingFn = (event: string, properties?: Record<string, unknown>) => unknown;

type TestAnalyticsWindow = Window & {
    posthog?: { capture: TrackingFn };
    mixpanel?: { track: TrackingFn };
    analytics?: { track: TrackingFn };
    gtag?: (...args: unknown[]) => unknown;
};

const getAnalyticsWindow = () => window as TestAnalyticsWindow;

describe('onboarding analytics', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
        clearOnboardingAnalyticsAdapters();
        const analyticsWindow = getAnalyticsWindow();
        analyticsWindow.posthog = undefined;
        analyticsWindow.mixpanel = undefined;
        analyticsWindow.analytics = undefined;
        analyticsWindow.gtag = undefined;
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('invokes registered adapters with normalized payload', () => {
        const trackSpy = vi.fn();
        registerOnboardingAnalyticsAdapter({
            name: 'custom',
            track: trackSpy,
        });

        trackOnboardingEvent('onboarding_started', { step: 'welcome' });

        expect(trackSpy).toHaveBeenCalledTimes(1);
        expect(trackSpy).toHaveBeenCalledWith(
            'onboarding_started',
            expect.objectContaining({ step: 'welcome', timestamp: expect.any(String) }),
        );
    });

    it('auto-detects window.posthog integrations', () => {
        const captureSpy = vi.fn();
        const analyticsWindow = getAnalyticsWindow();
        analyticsWindow.posthog = { capture: captureSpy };

        trackOnboardingEvent('onboarding_welcome_viewed');

        expect(captureSpy).toHaveBeenCalledTimes(1);
        expect(captureSpy).toHaveBeenCalledWith('onboarding_welcome_viewed', expect.objectContaining({ timestamp: expect.any(String) }));
    });

    it('logs and swallows adapter errors (sync + async)', async () => {
        const syncError = new Error('sync fail');
        const asyncError = new Error('async fail');

        registerOnboardingAnalyticsAdapter({
            name: 'sync',
            track: () => {
                throw syncError;
            },
        });

        registerOnboardingAnalyticsAdapter({
            name: 'async',
            track: () => Promise.reject(asyncError),
        });

        expect(() => trackOnboardingEvent('onboarding_complete_viewed')).not.toThrow();

        await flushPromises();

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Adapter failed'), expect.objectContaining({ adapter: 'sync', error: syncError }));
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Adapter failed'), expect.objectContaining({ adapter: 'async', error: asyncError }));
    });
});
