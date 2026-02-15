/**
 * Responsive Builder Tests
 * 
 * Test file for verifying responsive features work correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    isComponentVisible,
    getEffectiveProps,
    DeviceType,
    DeviceVisibility,
    DeviceProps
} from '@/hooks/use-builder';

// ============================================================================
// isComponentVisible Tests
// ============================================================================

describe('isComponentVisible', () => {
    it('should return true when visibility is undefined', () => {
        expect(isComponentVisible(undefined, 'desktop')).toBe(true);
        expect(isComponentVisible(undefined, 'tablet')).toBe(true);
        expect(isComponentVisible(undefined, 'mobile')).toBe(true);
    });

    it('should return true when device visibility is not explicitly set', () => {
        const visibility: DeviceVisibility = {
            desktop: true,
        };
        expect(isComponentVisible(visibility, 'tablet')).toBe(true);
        expect(isComponentVisible(visibility, 'mobile')).toBe(true);
    });

    it('should return false when device visibility is set to false', () => {
        const visibility: DeviceVisibility = {
            desktop: false,
            tablet: true,
            mobile: true,
        };
        expect(isComponentVisible(visibility, 'desktop')).toBe(false);
        expect(isComponentVisible(visibility, 'tablet')).toBe(true);
        expect(isComponentVisible(visibility, 'mobile')).toBe(true);
    });

    it('should return true when all devices are visible', () => {
        const visibility: DeviceVisibility = {
            desktop: true,
            tablet: true,
            mobile: true,
        };
        expect(isComponentVisible(visibility, 'desktop')).toBe(true);
        expect(isComponentVisible(visibility, 'tablet')).toBe(true);
        expect(isComponentVisible(visibility, 'mobile')).toBe(true);
    });

    it('should return false when all devices are hidden', () => {
        const visibility: DeviceVisibility = {
            desktop: false,
            tablet: false,
            mobile: false,
        };
        expect(isComponentVisible(visibility, 'desktop')).toBe(false);
        expect(isComponentVisible(visibility, 'tablet')).toBe(false);
        expect(isComponentVisible(visibility, 'mobile')).toBe(false);
    });
});

// ============================================================================
// getEffectiveProps Tests
// ============================================================================

describe('getEffectiveProps', () => {
    const baseProps = {
        title: 'Test Title',
        subtitle: 'Test Subtitle',
        align: 'center',
    };

    it('should return base props when deviceProps is undefined', () => {
        const result = getEffectiveProps(baseProps, undefined, 'desktop', undefined);
        expect(result).toEqual(baseProps);
    });

    it('should merge device-specific props correctly', () => {
        const deviceProps: DeviceProps = {
            tablet: { title: 'Tablet Title' },
            mobile: { title: 'Mobile Title', align: 'left' },
        };

        // Desktop - should use base props
        let result = getEffectiveProps(baseProps, deviceProps, 'desktop', undefined);
        expect(result.title).toBe('Test Title');
        expect(result.align).toBe('center');

        // Tablet - should override with tablet props
        result = getEffectiveProps(baseProps, deviceProps, 'tablet', undefined);
        expect(result.title).toBe('Tablet Title');
        expect(result.subtitle).toBe('Test Subtitle');

        // Mobile - should override with mobile props
        result = getEffectiveProps(baseProps, deviceProps, 'mobile', undefined);
        expect(result.title).toBe('Mobile Title');
        expect(result.align).toBe('left');
    });

    it('should apply device overrides on top of device props', () => {
        const deviceProps: DeviceProps = {
            desktop: { title: 'Desktop Title' },
        };

        const overrides = {
            title: 'Override Title',
        };

        const result = getEffectiveProps(baseProps, deviceProps, 'desktop', overrides);
        expect(result.title).toBe('Override Title');
    });

    it('should handle empty deviceProps correctly', () => {
        const deviceProps: DeviceProps = {
            desktop: {},
            tablet: {},
            mobile: {},
        };

        const result = getEffectiveProps(baseProps, deviceProps, 'desktop', undefined);
        expect(result).toEqual(baseProps);
    });
});

// ============================================================================
// DeviceType Tests
// ============================================================================

describe('DeviceType', () => {
    it('should accept valid device types', () => {
        const devices: DeviceType[] = ['desktop', 'tablet', 'mobile'];
        devices.forEach(device => {
            const visibility: DeviceVisibility = { [device]: true };
            expect(isComponentVisible(visibility, device)).toBe(true);
        });
    });
});
