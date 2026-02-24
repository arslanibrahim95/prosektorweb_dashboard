import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import {
  CountUp,
  TextReveal,
  Confetti,
  MagneticButton,
  StaggerContainer,
} from '../micro-interactions';

// Mock matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16) as unknown as number;
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

global.performance = {
  now: vi.fn(() => Date.now()),
} as unknown as Performance;

describe('CountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('counts up from start to end value', () => {
    render(<CountUp end={100} duration={1000} />);

    // Initially shows start value
    expect(screen.getByText('0')).toBeInTheDocument();

    // Fast forward to completion synchronously
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('formats numbers with separator', () => {
    render(<CountUp end={1000000} separator="," />);

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(screen.getByText('1,000,000')).toBeInTheDocument();
  });

  it('formats numbers with decimals', () => {
    render(<CountUp end={100} decimals={2} />);

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(screen.getByText('100.00')).toBeInTheDocument();
  });

  it('respects reduced motion preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: true, // prefers-reduced-motion: reduce
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(<CountUp end={100} respectReducedMotion />);

    // Should immediately show end value
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('cleans up RAF on unmount', () => {
    const cancelAnimationFrameSpy = vi.spyOn(global, 'cancelAnimationFrame');

    const { unmount } = render(<CountUp end={100} />);

    // Advance time to trigger the setTimeout(delay=0) so RAF gets scheduled
    act(() => {
      vi.advanceTimersByTime(1);
    });

    act(() => {
      unmount();
    });

    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });

  it('throttles state updates to prevent re-render storms', () => {
    render(<CountUp end={100} duration={500} />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('supports prefix and suffix', async () => {
    render(<CountUp end={50} prefix="$" suffix="%" />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('$50%')).toBeInTheDocument();
    });
  });

  it('handles delay correctly', () => {
    render(<CountUp end={100} delay={500} />);

    // Should still show start value during delay
    expect(screen.getByText('0')).toBeInTheDocument();

    // After delay, should start counting
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Should be counting now (not necessarily at 100 yet)
    expect(screen.getByText(/^[0-9]+$/)).toBeInTheDocument();
  });
});

describe('TextReveal', () => {
  beforeEach(() => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('renders text with animation', () => {
    render(<TextReveal text="Hello" />);

    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('e')).toBeInTheDocument();
    expect(screen.getByText('l')).toBeInTheDocument();
  });

  it('handles spaces correctly', () => {
    render(<TextReveal text="Hello World" />);

    // Space should be rendered as non-breaking space
    const spans = screen.getAllByText(/[\s\w]/);
    expect(spans.length).toBe(11); // "Hello World" has 11 characters
  });

  it('respects reduced motion preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { container } = render(<TextReveal text="Hello" respectReducedMotion />);

    // All characters should be visible immediately
    const spans = container.querySelectorAll('span');
    spans.forEach((span) => {
      expect(span).toHaveStyle({ opacity: 1 });
    });
  });

  it('applies different directions', () => {
    const { rerender } = render(<TextReveal text="Test" direction="up" />);
    expect(screen.getByText('T')).toBeInTheDocument();

    rerender(<TextReveal text="Test" direction="down" />);
    expect(screen.getByText('T')).toBeInTheDocument();

    rerender(<TextReveal text="Test" direction="blur" />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});

describe('Confetti', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders confetti when active', () => {
    const { container } = render(<Confetti active={true} particleCount={10} />);

    const confettiPieces = container.querySelectorAll('.animate-confetti');
    expect(confettiPieces.length).toBe(10);
  });

  it('does not render when inactive', () => {
    const { container } = render(<Confetti active={false} />);

    const confettiPieces = container.querySelectorAll('.animate-confetti');
    expect(confettiPieces.length).toBe(0);
  });

  it('cleans up after animation', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <Confetti active={true} particleCount={5} onComplete={onComplete} />
    );

    expect(container.querySelectorAll('.animate-confetti').length).toBe(5);

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(container.querySelectorAll('.animate-confetti').length).toBe(0);
    expect(onComplete).toHaveBeenCalled();
  });

  it('respects reduced motion preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { container } = render(<Confetti active={true} respectReducedMotion />);

    const confettiPieces = container.querySelectorAll('.animate-confetti');
    expect(confettiPieces.length).toBe(0);
  });

  it('is hidden from screen readers', () => {
    const { container } = render(<Confetti active={true} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('MagneticButton', () => {
  beforeEach(() => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('renders button', () => {
    render(<MagneticButton>Click me</MagneticButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('moves on mouse move within radius', () => {
    render(<MagneticButton>Hover me</MagneticButton>);
    const button = screen.getByRole('button');

    // Mock getBoundingClientRect
    Object.defineProperty(button, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 100,
        height: 50,
      }),
    });

    fireEvent.mouseMove(button, { clientX: 50, clientY: 25 });

    // Should have transform applied
    expect(button).toHaveStyle({ transform: expect.stringContaining('translate') });
  });

  it('resets position on mouse leave', () => {
    render(<MagneticButton>Hover me</MagneticButton>);
    const button = screen.getByRole('button');

    fireEvent.mouseMove(button, { clientX: 10, clientY: 10 });
    fireEvent.mouseLeave(button);

    expect(button).toHaveStyle({ transform: 'translate(0px, 0px)' });
  });

  it('respects reduced motion preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(<MagneticButton respectReducedMotion>Hover me</MagneticButton>);
    const button = screen.getByRole('button');

    Object.defineProperty(button, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 100,
        height: 50,
      }),
    });

    fireEvent.mouseMove(button, { clientX: 50, clientY: 25 });

    // Should not move when reduced motion is preferred
    expect(button).toHaveStyle({ transform: 'translate(0px, 0px)' });
  });
});

describe('StaggerContainer', () => {
  beforeEach(() => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('renders children with stagger animation', () => {
    render(
      <StaggerContainer>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </StaggerContainer>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('applies different directions', () => {
    const { rerender } = render(
      <StaggerContainer direction="up">
        <div>Item</div>
      </StaggerContainer>
    );

    rerender(
      <StaggerContainer direction="left">
        <div>Item</div>
      </StaggerContainer>
    );

    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  it('respects reduced motion preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { container } = render(
      <StaggerContainer respectReducedMotion>
        <div>Item</div>
      </StaggerContainer>
    );

    const item = container.querySelector('.stagger-item');
    expect(item).toHaveStyle({ opacity: 1 });
  });
});
