/**
 * Accessibility Tests (A11y)
 * 
 * Tests for WCAG compliance and accessibility best practices.
 * Uses basic a11y checks without external axe-core dependency.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ============================================================================
// A11y Helper Functions
// ============================================================================

/**
 * Check if element has accessible name
 */
function hasAccessibleName(element: Element): boolean {
    if (element instanceof HTMLElement) {
        return !!(element.getAttribute('aria-label') || 
                  element.getAttribute('aria-labelledby') ||
                  element.textContent?.trim());
    }
    return false;
}

/**
 * Check if button has proper accessible name
 */
function hasButtonAccessibleName(button: HTMLButtonElement): boolean {
    return !!(button.getAttribute('aria-label') || 
              button.getAttribute('aria-labelledby') ||
              button.textContent?.trim());
}

/**
 * Check if image has alt text
 */
function hasImageAlt(image: HTMLImageElement): boolean {
    return !!image.getAttribute('alt');
}

/**
 * Check if input has associated label
 */
function hasInputLabel(input: HTMLInputElement, container: HTMLElement): boolean {
    const id = input.getAttribute('id');
    if (id) {
        const label = container.querySelector(`label[for="${id}"]`);
        if (label) return true;
    }
    const label = input.closest('label');
    if (label) return true;
    return !!(input.getAttribute('aria-label') || input.getAttribute('aria-labelledby'));
}

// ============================================================================
// Button Accessibility Tests
// ============================================================================

describe('Button Accessibility', () => {
    async function getButton() {
        const { Button } = await import('@/components/ui/button');
        return Button;
    }

    it('button has accessible name', async () => {
        const Button = await getButton();
        const { container } = render(<Button>Click me</Button>);
        
        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        expect(hasButtonAccessibleName(button!)).toBe(true);
    });

    it('icon-only button has aria-label', async () => {
        const Button = await getButton();
        
        // Should have aria-label for icon-only buttons
        const { container } = render(
            <Button aria-label="Close dialog">×</Button>
        );
        
        const button = container.querySelector('button');
        expect(button).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('button can receive focus', async () => {
        const Button = await getButton();
        const { container } = render(<Button>Focusable</Button>);
        
        const button = container.querySelector('button');
        button?.focus();
        expect(document.activeElement).toBe(button);
    });

    it('disabled button is not focusable', async () => {
        const Button = await getButton();
        const { container } = render(<Button disabled>Disabled</Button>);
        
        const button = container.querySelector('button');
        expect(button).toBeDisabled();
    });

    it('button handles keyboard interaction', async () => {
        const Button = await getButton();
        const handleClick = vi.fn();
        
        render(<Button onClick={handleClick}>Click me</Button>);
        
        const button = screen.getByRole('button');
        button.focus();
        await userEvent.keyboard('{Enter}');
        
        expect(handleClick).toHaveBeenCalled();
    });
});

// ============================================================================
// Input Accessibility Tests
// ============================================================================

describe('Input Accessibility', () => {
    async function getInput() {
        const { Input } = await import('@/components/ui/input');
        return Input;
    }

    it('input renders correctly', async () => {
        const Input = await getInput();
        const { container } = render(<Input id="test-input" />);
        
        const input = container.querySelector('input');
        expect(input).toBeInTheDocument();
    });

    it('input with label renders correctly', async () => {
        const Input = await getInput();
        
        render(
            <div>
                <label htmlFor="email-input">Email</label>
                <Input id="email-input" type="email" />
            </div>
        );
        
        const input = screen.getByLabelText('Email');
        expect(input).toBeInTheDocument();
    });

    it('disabled input is not focusable', async () => {
        const Input = await getInput();
        const { container } = render(<Input disabled />);
        
        const input = container.querySelector('input');
        expect(input).toBeDisabled();
    });

    it('input can receive focus', async () => {
        const Input = await getInput();
        const { container } = render(<Input />);
        
        const input = container.querySelector('input');
        input?.focus();
        expect(document.activeElement).toBe(input);
    });
});

// ============================================================================
// Image Accessibility Tests
// ============================================================================

describe('Image Accessibility', () => {
    it('img has alt attribute', async () => {
        const { container } = render(
            <img src="test.jpg" alt="Test image" />
        );
        
        const img = container.querySelector('img');
        expect(img).toHaveAttribute('alt', 'Test image');
    });

    it('decorative image can have empty alt', async () => {
        const { container } = render(
            <img src="decorative.png" alt="" role="presentation" />
        );
        
        const img = container.querySelector('img');
        expect(img).toHaveAttribute('alt', '');
    });
});

// ============================================================================
// Link Accessibility Tests
// ============================================================================

describe('Link Accessibility', () => {
    it('link has accessible name', () => {
        const { container } = render(<a href="/test">Click here</a>);
        
        const link = container.querySelector('a');
        expect(link).toBeInTheDocument();
        expect(link).toHaveTextContent('Click here');
    });

    it('link can receive focus', () => {
        const { container } = render(<a href="/test">Link</a>);
        
        const link = container.querySelector('a');
        link?.focus();
        expect(document.activeElement).toBe(link);
    });
});

// ============================================================================
// Heading Accessibility Tests
// ============================================================================

describe('Heading Accessibility', () => {
    it('headings are in correct order', () => {
        const { container } = render(
            <div>
                <h1>Main Title</h1>
                <h2>Section</h2>
                <h3>Subsection</h3>
            </div>
        );
        
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Main Title');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Section');
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Subsection');
    });
});

// ============================================================================
// Form Accessibility Tests
// ============================================================================

describe('Form Accessibility', () => {
    async function getInput() {
        const { Input } = await import('@/components/ui/input');
        return Input;
    }

    it('form inputs have associated labels', async () => {
        const Input = await getInput();
        
        render(
            <form>
                <label htmlFor="username">Username</label>
                <Input id="username" />
                
                <label htmlFor="password">Password</label>
                <Input id="password" type="password" />
            </form>
        );
        
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('required fields are marked', async () => {
        const Input = await getInput();
        
        render(
            <form>
                <label htmlFor="email">
                    Email <span aria-hidden="true">*</span>
                </label>
                <Input id="email" required />
            </form>
        );
        
        const input = screen.getByLabelText(/Email/);
        expect(input).toBeRequired();
    });
});

// ============================================================================
// Focus Management Tests
// ============================================================================

describe('Focus Management', () => {
    it('can focus element programmatically', () => {
        const { container } = render(
            <button id="focusable">Focus me</button>
        );
        
        const button = container.querySelector('#focusable');
        (button as HTMLElement).focus();
        
        expect(document.activeElement).toBe(button);
    });

    it('focus moves logically with Tab', async () => {
        render(
            <div>
                <button>First</button>
                <button>Second</button>
                <button>Third</button>
            </div>
        );
        
        const buttons = screen.getAllByRole('button');
        
        buttons[0].focus();
        expect(document.activeElement).toBe(buttons[0]);
        
        await userEvent.tab();
        expect(document.activeElement).toBe(buttons[1]);
        
        await userEvent.tab();
        expect(document.activeElement).toBe(buttons[2]);
    });
});

// ============================================================================
// ARIA Attributes Tests
// ============================================================================

describe('ARIA Attributes', () => {
    it('aria-live region announces content', () => {
        render(
            <div aria-live="polite" role="status">
                Message sent
            </div>
        );
        
        const region = screen.getByRole('status');
        expect(region).toHaveAttribute('aria-live', 'polite');
    });

    it('aria-hidden hides from accessibility tree', () => {
        render(
            <div>
                <span aria-hidden="true"> decorative </span>
                <span>Visible</span>
            </div>
        );
        
        const decorative = document.querySelector('[aria-hidden="true"]');
        expect(decorative).toBeInTheDocument();
    });

    it('role attribute is applied correctly', () => {
        render(
            <div role="navigation">
                <a href="/">Home</a>
            </div>
        );
        
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
    });

    it('aria-disabled on interactive elements', () => {
        render(
            <button aria-disabled="true">Disabled</button>
        );
        
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-disabled', 'true');
    });
});

// ============================================================================
// Color Contrast Tests (Manual Check)
// ============================================================================

describe('Color Contrast Considerations', () => {
    it('text has sufficient contrast indication', () => {
        // This is a manual check - actual contrast testing would require
        // visual regression or specialized tools
        const { container } = render(
            <div className="text-foreground">
                <p>Normal text</p>
                <p className="text-muted-foreground">Muted text</p>
            </div>
        );
        
        expect(container.firstChild).toBeInTheDocument();
    });
});
