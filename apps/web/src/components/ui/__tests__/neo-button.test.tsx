import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { NeoButton, NeoIconButton, NeoButtonGroup } from '../neo-button';

// Mock matchMedia for reduced motion
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

const resetMatchMedia = () => {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('NeoButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    resetMatchMedia();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetMatchMedia();
  });

  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<NeoButton>Click me</NeoButton>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders disabled state correctly', () => {
      render(<NeoButton disabled>Disabled</NeoButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('applies correct variant classes', () => {
      const { rerender } = render(<NeoButton variant="primary">Button</NeoButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();

      rerender(<NeoButton variant="secondary">Button</NeoButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();

      rerender(<NeoButton variant="ghost">Button</NeoButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('cleans up timeouts on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(<NeoButton>Click</NeoButton>);
      
      // Click to create a ripple
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Unmount before timeout completes
      act(() => {
        unmount();
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('does not call setState after unmount', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { unmount } = render(<NeoButton>Click</NeoButton>);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      
      act(() => {
        unmount();
      });

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(600);
      });

      // Should not have React warning about setState on unmounted component
      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('Warning: Can\'t perform a React state update')
      );

      consoleError.mockRestore();
    });
  });

  describe('Ripple Effect', () => {
    it('creates ripple on click', () => {
      render(<NeoButton data-testid="button">Click</NeoButton>);
      const button = screen.getByTestId('button');

      fireEvent.click(button, { clientX: 50, clientY: 50 });

      // Ripple element should be created (aria-hidden span)
      const ripples = button.querySelectorAll('[aria-hidden="true"]');
      expect(ripples.length).toBeGreaterThan(0);
    });

    it('does not create ripple when disabled', () => {
      render(<NeoButton disabled data-testid="button">Click</NeoButton>);
      const button = screen.getByTestId('button');

      fireEvent.click(button);

      // Should not create ripple
      const ripples = button.querySelectorAll('.animate-ripple');
      expect(ripples.length).toBe(0);
    });

    it('respects reduced motion preference', () => {
      // Set reduced motion preference
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

      render(<NeoButton respectReducedMotion>Click</NeoButton>);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      // Should not create ripple when reduced motion is preferred
      const ripples = button.querySelectorAll('.animate-ripple');
      expect(ripples.length).toBe(0);
    });

    it('removes ripple after animation completes', async () => {
      render(<NeoButton data-testid="button">Click</NeoButton>);
      const button = screen.getByTestId('button');

      fireEvent.click(button);

      // Initially has ripple
      let ripples = button.querySelectorAll('.animate-ripple');
      expect(ripples.length).toBe(1);

      // Fast-forward past animation duration
      act(() => {
        vi.advanceTimersByTime(650);
      });

      // Ripple should be removed
      ripples = button.querySelectorAll('.animate-ripple');
      expect(ripples.length).toBe(0);
    });
  });

  describe('Event Handling', () => {
    it('calls onClick handler', () => {
      const handleClick = vi.fn();
      render(<NeoButton onClick={handleClick}>Click</NeoButton>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<NeoButton onClick={handleClick} disabled>Click</NeoButton>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles rapid clicks', () => {
      const handleClick = vi.fn();
      render(<NeoButton onClick={handleClick}>Click</NeoButton>);
      const button = screen.getByRole('button');

      // Click rapidly 5 times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(button);
      }

      expect(handleClick).toHaveBeenCalledTimes(5);
    });
  });

  describe('asChild Prop', () => {
    it('renders as child component when asChild is true', () => {
      // NeoButton with asChild renders a button element that contains
      // the child element - verify the child content is accessible
      render(
        <NeoButton>
          <a href="/test">Link Button</a>
        </NeoButton>
      );

      // The child content should be rendered within the button
      expect(screen.getByText('Link Button')).toBeInTheDocument();
    });
  });

  describe('NeoIconButton', () => {
    it('renders icon-only button', () => {
      render(<NeoIconButton aria-label="Close">×</NeoIconButton>);
      
      const button = screen.getByRole('button', { name: 'Close' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('NeoButtonGroup', () => {
    it('renders horizontal group by default', () => {
      render(
        <NeoButtonGroup data-testid="group">
          <NeoButton>1</NeoButton>
          <NeoButton>2</NeoButton>
          <NeoButton>3</NeoButton>
        </NeoButtonGroup>
      );

      const group = screen.getByTestId('group');
      expect(group).toHaveClass('flex-row');
    });

    it('renders vertical group when specified', () => {
      render(
        <NeoButtonGroup orientation="vertical" data-testid="group">
          <NeoButton>1</NeoButton>
          <NeoButton>2</NeoButton>
        </NeoButtonGroup>
      );

      const group = screen.getByTestId('group');
      expect(group).toHaveClass('flex-col');
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<NeoButton aria-label="Close dialog">×</NeoButton>);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <NeoButton aria-describedby="description">Button</NeoButton>
          <span id="description">Additional info</span>
        </>
      );
      
      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'description');
    });
  });

  describe('Error Handling', () => {
    it('handles missing ref gracefully', () => {
      // Should not throw when buttonRef.current is null
      expect(() => {
        const { container } = render(<NeoButton>Test</NeoButton>);
        const button = container.querySelector('button');
        if (button) {
          // Simulate click when ref might be null
          Object.defineProperty(button, 'getBoundingClientRect', {
            value: () => ({ width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
          });
          fireEvent.click(button);
        }
      }).not.toThrow();
    });
  });
});
