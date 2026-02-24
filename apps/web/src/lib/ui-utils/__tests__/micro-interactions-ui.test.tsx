import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import {
    Shimmer,
    SkeletonCard,
    PageTransition,
    HoverLift,
    PulseRing,
    MorphingIcon,
    usePrefersReducedMotion,
    ANIMATION_CONFIG,
} from '../micro-interactions';

// Mock matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
});

describe('Shimmer', () => {
    it('renders shimmer effect', () => {
        render(<Shimmer data-testid="shimmer" />);
        expect(screen.getByTestId('shimmer')).toBeInTheDocument();
    });

    it('applies custom dimensions', () => {
        render(<Shimmer width="200px" height="50px" data-testid="shimmer" />);
        const shimmer = screen.getByTestId('shimmer');
        expect(shimmer).toHaveStyle({ width: '200px', height: '50px' });
    });

    it('is hidden from screen readers', () => {
        render(<Shimmer data-testid="shimmer" />);
        expect(screen.getByTestId('shimmer')).toHaveAttribute('aria-hidden', 'true');
    });
});

describe('SkeletonCard', () => {
    it('renders skeleton card', () => {
        render(<SkeletonCard />);
        expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
    });

    it('renders specified number of lines', () => {
        const { container } = render(<SkeletonCard lines={5} />);
        const shimmers = container.querySelectorAll('.shimmer-skeleton');
        expect(shimmers.length).toBe(6); // 1 for title + 5 lines
    });

    it('can hide image', () => {
        const { container } = render(<SkeletonCard hasImage={false} />);
        const images = container.querySelectorAll('[style*="12rem"]');
        expect(images.length).toBe(0);
    });

    it('has aria-busy attribute', () => {
        render(<SkeletonCard />);
        expect(screen.getByLabelText('Loading content')).toHaveAttribute('aria-busy', 'true');
    });
});

describe('PageTransition', () => {
    beforeEach(() => {
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
    });

    it('renders children', () => {
        render(
            <PageTransition>
                <div>Content</div>
            </PageTransition>
        );
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('respects reduced motion preference', () => {
        mockMatchMedia.mockReturnValue({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });

        const { container } = render(
            <PageTransition respectReducedMotion>
                <div>Content</div>
            </PageTransition>
        );

        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).not.toHaveAttribute('style', expect.stringContaining('animationDuration'));
    });
});

describe('HoverLift', () => {
    beforeEach(() => {
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
    });

    it('renders children', () => {
        render(
            <HoverLift>
                <div>Content</div>
            </HoverLift>
        );
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('respects reduced motion preference', () => {
        mockMatchMedia.mockReturnValue({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });

        const { container } = render(
            <HoverLift respectReducedMotion>
                <div>Content</div>
            </HoverLift>
        );

        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).not.toHaveAttribute('onMouseEnter');
        expect(wrapper).not.toHaveAttribute('onMouseLeave');
    });
});

describe('PulseRing', () => {
    it('renders pulse rings', () => {
        const { container } = render(
            <PulseRing>
                <span>Content</span>
            </PulseRing>
        );

        const rings = container.querySelectorAll('.animate-ping');
        expect(rings.length).toBe(3); // Default ringCount
    });

    it('renders custom number of rings', () => {
        const { container } = render(
            <PulseRing ringCount={5}>
                <span>Content</span>
            </PulseRing>
        );

        const rings = container.querySelectorAll('.animate-ping');
        expect(rings.length).toBe(5);
    });

    it('is hidden from screen readers', () => {
        const { container } = render(
            <PulseRing>
                <span>Content</span>
            </PulseRing>
        );

        const rings = container.querySelectorAll('.animate-ping');
        rings.forEach((ring) => {
            expect(ring).toHaveAttribute('aria-hidden', 'true');
        });
    });
});

describe('MorphingIcon', () => {
    beforeEach(() => {
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
    });

    it('renders active icon when isActive is true', () => {
        render(
            <MorphingIcon
                isActive={true}
                activeIcon={<span data-testid="active">Active</span>}
                inactiveIcon={<span data-testid="inactive">Inactive</span>}
            />
        );

        expect(screen.getByTestId('active')).toBeInTheDocument();
        expect(screen.queryByTestId('inactive')).not.toBeInTheDocument();
    });

    it('renders inactive icon when isActive is false', () => {
        render(
            <MorphingIcon
                isActive={false}
                activeIcon={<span data-testid="active">Active</span>}
                inactiveIcon={<span data-testid="inactive">Inactive</span>}
            />
        );

        expect(screen.queryByTestId('active')).not.toBeInTheDocument();
        expect(screen.getByTestId('inactive')).toBeInTheDocument();
    });

    it('respects reduced motion preference', () => {
        mockMatchMedia.mockReturnValue({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });

        render(
            <MorphingIcon
                isActive={true}
                activeIcon={<span>Active</span>}
                inactiveIcon={<span>Inactive</span>}
                respectReducedMotion
            />
        );

        // Should still show correct icon without animation
        expect(screen.getByText('Active')).toBeInTheDocument();
    });
});

describe('usePrefersReducedMotion', () => {
    it('returns false by default', () => {
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });

        const TestComponent = () => {
            const prefersReducedMotion = usePrefersReducedMotion();
            return <span data-testid="result">{prefersReducedMotion ? 'true' : 'false'}</span>;
        };

        render(<TestComponent />);
        expect(screen.getByTestId('result')).toHaveTextContent('false');
    });

    it('returns true when prefers-reduced-motion is true', () => {
        mockMatchMedia.mockImplementation((query: string) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }));

        const TestComponent = () => {
            const prefersReducedMotion = usePrefersReducedMotion();
            return <span data-testid="result">{prefersReducedMotion ? 'true' : 'false'}</span>;
        };

        render(<TestComponent />);
        expect(screen.getByTestId('result')).toHaveTextContent('true');
    });
});

describe('ANIMATION_CONFIG', () => {
    it('has correct duration values', () => {
        expect(ANIMATION_CONFIG.durations.micro).toBe(100);
        expect(ANIMATION_CONFIG.durations.slow).toBe(300);
    });

    it('has correct easing values', () => {
        expect(ANIMATION_CONFIG.easings.spring).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
        expect(ANIMATION_CONFIG.easings.outExpo).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
    });
});
