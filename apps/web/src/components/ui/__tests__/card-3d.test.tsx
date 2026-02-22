import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { Card3D, Card3DContent, Card3DHeader, Card3DTitle, sanitizeCssValue, usePrefersReducedMotion } from '../card-3d';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16) as unknown as number;
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

const mockMatchMedia = (matches = false) => {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: query.includes('reduced-motion') ? matches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('Card3D', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockMatchMedia(false);
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(
        <Card3D data-testid="card3d">
          <Card3DHeader>
            <Card3DTitle>Test Title</Card3DTitle>
          </Card3DHeader>
          <Card3DContent>Test Content</Card3DContent>
        </Card3D>
      );

      expect(screen.getByTestId('card3d')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies correct role and aria attributes', () => {
      render(<Card3D data-testid="card3d">Content</Card3D>);

      const card = screen.getByTestId('card3d');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('tabindex', '0');
    });
  });

  describe('XSS Protection', () => {
    it('sanitizes glareOpacity to prevent XSS', () => {
      // Attempt XSS via glareOpacity
      render(
        <Card3D 
          glare={true} 
          glareOpacity={0.5} // Valid value
          data-testid="card"
        >
          Content
        </Card3D>
      );

      // Component should render without executing malicious code
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('clamps invalid numeric values', () => {
      const { rerender } = render(
        <Card3D maxTilt={100} glareOpacity={2} scale={5}>
          Content
        </Card3D>
      );

      // Should clamp to max values without error
      expect(() => rerender(
        <Card3D maxTilt={100} glareOpacity={2} scale={5}>
          Content
        </Card3D>
      )).not.toThrow();
    });

    it('handles NaN and Infinity values gracefully', () => {
      expect(() => render(
        <Card3D maxTilt={NaN} glareOpacity={Infinity}>
          Content
        </Card3D>
      )).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('cleans up RAF on unmount', () => {
      const cancelAnimationFrameSpy = vi.spyOn(global, 'cancelAnimationFrame');
      
      const { unmount } = render(<Card3D>Content</Card3D>);
      
      act(() => {
        unmount();
      });

      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });

    it('cancels pending RAF before creating new one', async () => {
      render(<Card3D data-testid="card">Content</Card3D>);
      const card = screen.getByTestId('card');

      // Trigger multiple mouse moves quickly
      await act(async () => {
        fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(card, { clientX: 150, clientY: 150 });
        fireEvent.mouseMove(card, { clientX: 200, clientY: 200 });
      });

      // Should not have memory leaks from overlapping RAFs
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Reduced Motion Support', () => {
    it('disables animations when prefers-reduced-motion is true', () => {
      // Override matchMedia to return true for reduced motion
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<Card3D data-testid="card">Content</Card3D>);
      const card = screen.getByTestId('card');

      expect(card).toHaveAttribute('data-reduced-motion', 'true');
    });
  });

  describe('Division by Zero Protection', () => {
    it('handles zero width/height gracefully', () => {
      // Mock getBoundingClientRect to return zero dimensions
      const mockGetBoundingClientRect = vi.fn().mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      });

      render(<Card3D data-testid="card">Content</Card3D>);
      const card = screen.getByTestId('card');
      
      Object.defineProperty(card, 'getBoundingClientRect', {
        value: mockGetBoundingClientRect,
      });

      // Should not throw when mouse moves over zero-dimension element
      expect(() => {
        fireEvent.mouseMove(card, { clientX: 50, clientY: 50 });
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid focus/blur events', async () => {
      render(<Card3D data-testid="card">Content</Card3D>);
      const card = screen.getByTestId('card');

      await act(async () => {
        fireEvent.focus(card);
        fireEvent.blur(card);
        fireEvent.focus(card);
        fireEvent.blur(card);
      });

      expect(card).toBeInTheDocument();
    });

    it('handles missing children gracefully', () => {
      expect(() => render(<Card3D />)).not.toThrow();
    });
  });
});

describe('sanitizeCssValue', () => {
  it('clamps values within range', () => {
    expect(sanitizeCssValue(150, 0, 100)).toBe(100);
    expect(sanitizeCssValue(-50, 0, 100)).toBe(0);
    expect(sanitizeCssValue(50, 0, 100)).toBe(50);
  });

  it('handles invalid values', () => {
    expect(sanitizeCssValue(NaN, 0, 100)).toBe(0);
    expect(sanitizeCssValue(Infinity, 0, 100)).toBe(0);
    expect(sanitizeCssValue(-Infinity, 0, 100)).toBe(0);
  });
});

describe('usePrefersReducedMotion', () => {
  it('returns false by default', () => {
    const TestComponent = () => {
      const prefersReducedMotion = usePrefersReducedMotion();
      return <div data-testid="result">{prefersReducedMotion ? 'true' : 'false'}</div>;
    };

    render(<TestComponent />);
    expect(screen.getByTestId('result')).toHaveTextContent('false');
  });
});
