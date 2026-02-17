import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import {
  SmartThemeProvider,
  useSmartTheme,
  useThemeState,
  useThemeDispatch,
  safeStorageSet,
  safeStorageGet,
  StorageError,
  FocusTrap,
  AccessibleButton,
  LiveRegion,
  useAnnouncer,
  AccessibleTabs,
  VisuallyHidden,
} from './ai-accessibility';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

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

const TestComponent = () => {
  const { theme, density, setTheme, setDensity } = useSmartTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="density">{density}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setDensity('compact')}>Set Compact</button>
    </div>
  );
};

describe('SmartThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-motion');
    document.documentElement.removeAttribute('data-color-scheme');
  });

  describe('Initialization', () => {
    it('initializes with default values', () => {
      render(
        <SmartThemeProvider>
          <TestComponent />
        </SmartThemeProvider>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('system');
      expect(screen.getByTestId('density')).toHaveTextContent('comfortable');
    });

    it('reads values from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key.includes('mode')) return 'dark';
        if (key.includes('density')) return 'compact';
        return null;
      });

      render(
        <SmartThemeProvider>
          <TestComponent />
        </SmartThemeProvider>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('density')).toHaveTextContent('compact');
    });

    it('applies theme to document element', () => {
      render(
        <SmartThemeProvider defaultTheme="dark">
          <TestComponent />
        </SmartThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('localStorage Error Handling', () => {
    it('handles QuotaExceededError gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError');
        throw error;
      });

      const onError = vi.fn();

      render(
        <SmartThemeProvider onError={onError}>
          <TestComponent />
        </SmartThemeProvider>
      );

      fireEvent.click(screen.getByText('Set Dark'));

      // Should call error handler
      expect(onError).toHaveBeenCalled();
      // State should still update despite storage error
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });

    it('handles SecurityError gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('Security error', 'SecurityError');
      });

      const onError = vi.fn();

      render(
        <SmartThemeProvider onError={onError}>
          <TestComponent />
        </SmartThemeProvider>
      );

      fireEvent.click(screen.getByText('Set Compact'));

      expect(onError).toHaveBeenCalled();
      expect(screen.getByTestId('density')).toHaveTextContent('compact');
    });
  });

  describe('Context Separation', () => {
    it('useThemeState only subscribes to state changes', () => {
      const StateComponent = () => {
        const state = useThemeState();
        renderCountState++;
        return <span data-testid="state">{state.theme}</span>;
      };

      const DispatchComponent = () => {
        const dispatch = useThemeDispatch();
        renderCountDispatch++;
        return <button onClick={() => dispatch.setTheme('dark')}>Change</button>;
      };

      let renderCountState = 0;
      let renderCountDispatch = 0;

      render(
        <SmartThemeProvider>
          <StateComponent />
          <DispatchComponent />
        </SmartThemeProvider>
      );

      const initialStateRenders = renderCountState;
      const initialDispatchRenders = renderCountDispatch;

      fireEvent.click(screen.getByText('Change'));

      // State component should re-render
      expect(renderCountState).toBeGreaterThan(initialStateRenders);
      // Dispatch component should NOT re-render
      expect(renderCountDispatch).toBe(initialDispatchRenders);
    });
  });
});

describe('safeStorageSet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully sets item', () => {
    expect(() => safeStorageSet('key', 'value')).not.toThrow();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('key', 'value');
  });

  it('throws StorageError on QuotaExceededError', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    expect(() => safeStorageSet('key', 'value')).toThrow(StorageError);
  });

  it('throws StorageError on SecurityError', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new DOMException('Security error', 'SecurityError');
    });

    expect(() => safeStorageSet('key', 'value')).toThrow(StorageError);
  });
});

describe('safeStorageGet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns value on success', () => {
    localStorageMock.getItem.mockReturnValue('stored-value');
    expect(safeStorageGet('key')).toBe('stored-value');
  });

  it('returns null on error', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    expect(safeStorageGet('key')).toBeNull();
  });
});

describe('FocusTrap', () => {
  it('traps focus within container', () => {
    render(
      <FocusTrap isActive={true}>
        <div>
          <button data-testid="first">First</button>
          <button data-testid="second">Second</button>
          <button data-testid="last">Last</button>
        </div>
      </FocusTrap>
    );

    const first = screen.getByTestId('first');

    // Focus should start on first element
    expect(document.activeElement).toBe(first);
  });

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    
    render(
      <FocusTrap isActive={true} onEscape={onEscape}>
        <button>Button</button>
      </FocusTrap>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onEscape).toHaveBeenCalled();
  });

  it('does not trap focus when inactive', () => {
    render(
      <FocusTrap isActive={false}>
        <button>Button</button>
      </FocusTrap>
    );

    // Should not auto-focus
    expect(document.activeElement).not.toBe(screen.getByRole('button'));
  });

  it('skips disabled elements', () => {
    render(
      <FocusTrap isActive={true}>
        <div>
          <button data-testid="enabled">Enabled</button>
          <button disabled>Disabled</button>
          <button data-testid="last">Last</button>
        </div>
      </FocusTrap>
    );

    expect(document.activeElement).toBe(screen.getByTestId('enabled'));
  });

  it('skips hidden elements', () => {
    render(
      <FocusTrap isActive={true}>
        <div>
          <button data-testid="visible">Visible</button>
          <button style={{ display: 'none' }}>Hidden</button>
          <button data-testid="last">Last</button>
        </div>
      </FocusTrap>
    );

    expect(document.activeElement).toBe(screen.getByTestId('visible'));
  });
});

describe('AccessibleButton', () => {
  it('renders with correct aria attributes when loading', () => {
    render(<AccessibleButton isLoading loadingText="Processing">Submit</AccessibleButton>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('renders loading spinner', () => {
    render(<AccessibleButton isLoading>Loading</AccessibleButton>);

    const spinner = screen.getByRole('button').querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports description for screen readers', () => {
    render(
      <AccessibleButton description="This button saves your changes">Save</AccessibleButton>
    );

    expect(screen.getByText('This button saves your changes')).toHaveClass('sr-only');
  });

  it('supports left and right icons', () => {
    render(
      <AccessibleButton 
        leftIcon={<span data-testid="left-icon">←</span>}
        rightIcon={<span data-testid="right-icon">→</span>}
      >
        Navigate
      </AccessibleButton>
    );

    expect(screen.getByTestId('left-icon')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('right-icon')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('LiveRegion', () => {
  it('renders with correct aria attributes', () => {
    render(<LiveRegion id="status">Update complete</LiveRegion>);

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region).toHaveClass('sr-only');
  });

  it('supports assertive politeness', () => {
    render(
      <LiveRegion id="alert" politeness="assertive">
        Error occurred
      </LiveRegion>
    );

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'assertive');
  });
});

describe('useAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces message to screen readers', () => {
    const TestComponent = () => {
      const { announce } = useAnnouncer('announcement-region');
      return <button onClick={() => announce('Operation complete')}>Announce</button>;
    };

    render(
      <>
        <LiveRegion id="announcement-region" />
        <TestComponent />
      </>
    );

    fireEvent.click(screen.getByText('Announce'));

    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Operation complete');

    // Should clear after 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(region).toHaveTextContent('');
  });
});

describe('AccessibleTabs', () => {
  const tabs = [
    { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
    { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
    { id: 'tab3', label: 'Tab 3', content: 'Content 3' },
  ];

  it('renders tabs with correct roles', () => {
    render(<AccessibleTabs tabs={tabs} />);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();

    const tabButtons = screen.getAllByRole('tab');
    expect(tabButtons).toHaveLength(3);
  });

  it('displays first tab content by default', () => {
    render(<AccessibleTabs tabs={tabs} />);

    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('switches tabs on click', () => {
    render(<AccessibleTabs tabs={tabs} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Tab 2' }));

    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('supports keyboard navigation with arrow keys', () => {
    render(<AccessibleTabs tabs={tabs} />);

    const firstTab = screen.getByRole('tab', { name: 'Tab 1' });
    firstTab.focus();

    // Arrow right should go to next tab
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
    
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('tabindex', '0');
  });

  it('calls onChange when tab changes', () => {
    const onChange = vi.fn();
    render(<AccessibleTabs tabs={tabs} onChange={onChange} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Tab 2' }));

    expect(onChange).toHaveBeenCalledWith('tab2');
  });

  it('skips disabled tabs', () => {
    const tabsWithDisabled = [
      { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
      { id: 'tab2', label: 'Tab 2', content: 'Content 2', disabled: true },
      { id: 'tab3', label: 'Tab 3', content: 'Content 3' },
    ];

    render(<AccessibleTabs tabs={tabsWithDisabled} />);

    const disabledTab = screen.getByRole('tab', { name: 'Tab 2' });
    expect(disabledTab).toBeDisabled();
    expect(disabledTab).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('VisuallyHidden', () => {
  it('hides content visually but keeps it accessible', () => {
    render(<VisuallyHidden>Screen reader only text</VisuallyHidden>);

    const element = screen.getByText('Screen reader only text');
    expect(element).toHaveClass('sr-only');
    expect(element).toHaveStyle({
      clip: 'rect(0, 0, 0, 0)',
      clipPath: 'inset(50%)',
    });
  });
});
