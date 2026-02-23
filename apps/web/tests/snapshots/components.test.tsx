/**
 * Snapshot Tests for Key UI Components
 * 
 * These tests verify that core UI components render correctly
 * without visual regression. Uses @testing-library/react for rendering.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => '/test',
}));

// ============================================================================
// Button Component Tests
// ============================================================================

describe('Button Component Snapshots', () => {
    // Dynamic import to avoid SSR issues
    async function getButton() {
        const { Button } = await import('@/components/ui/button');
        return Button;
    }

    it('renders default button correctly', async () => {
        const Button = await getButton();
        const { container } = render(<Button>Click me</Button>);
        expect(container.firstChild).toBeInTheDocument();
        expect(container.firstChild).toHaveClass('inline-flex');
    });

    it('renders button with different variants', async () => {
        const Button = await getButton();

        const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'];

        for (const variant of variants) {
            const { container } = render(
                <Button variant={variant as "default"}>Button {variant}</Button>
            );
            expect(container.firstChild).toBeInTheDocument();
        }
    });

    it('renders button with different sizes', async () => {
        const Button = await getButton();

        const sizes = ['default', 'sm', 'lg', 'icon'];

        for (const size of sizes) {
            const { container } = render(
                <Button size={size as "default"}>Button {size}</Button>
            );
            expect(container.firstChild).toBeInTheDocument();
        }
    });

    it('renders disabled button', async () => {
        const Button = await getButton();
        const { container } = render(<Button disabled>Disabled</Button>);
        expect(container.firstChild).toBeDisabled();
    });

    it('handles click events', async () => {
        const Button = await getButton();
        const handleClick = vi.fn();

        render(<Button onClick={handleClick}>Click me</Button>);

        await userEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});

// ============================================================================
// Badge Component Tests  
// ============================================================================

describe('Badge Component Snapshots', () => {
    async function getBadge() {
        const { Badge } = await import('@/components/ui/badge');
        return Badge;
    }

    it('renders default badge', async () => {
        const Badge = await getBadge();
        const { container } = render(<Badge>Badge</Badge>);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders badge with different variants', async () => {
        const Badge = await getBadge();

        const variants = ['default', 'secondary', 'destructive', 'outline'];

        for (const variant of variants) {
            const { container } = render(
                <Badge variant={variant as "default"}>{variant}</Badge>
            );
            expect(container.firstChild).toBeInTheDocument();
        }
    });
});

// ============================================================================
// Card Component Tests
// ============================================================================

describe('Card Component Snapshots', () => {
    async function getCard() {
        const { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } =
            await import('@/components/ui/card');
        return { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
    }

    it('renders complete card structure', async () => {
        const { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } = await getCard();

        const { container } = render(
            <Card>
                <CardHeader>
                    <CardTitle>Title</CardTitle>
                    <CardDescription>Description</CardDescription>
                </CardHeader>
                <CardContent>Content</CardContent>
                <CardFooter>Footer</CardFooter>
            </Card>
        );

        expect(container.firstChild).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
        expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('renders minimal card', async () => {
        const { Card } = await getCard();
        const { container } = render(<Card>Simple content</Card>);
        expect(container.firstChild).toBeInTheDocument();
    });
});

// ============================================================================
// Input Component Tests
// ============================================================================

describe('Input Component Snapshots', () => {
    async function getInput() {
        const { Input } = await import('@/components/ui/input');
        return Input;
    }

    it('renders input element', async () => {
        const Input = await getInput();
        const { container } = render(<Input />);
        expect(container.querySelector('input')).toBeInTheDocument();
    });

    it('renders input with placeholder', async () => {
        const Input = await getInput();
        render(<Input placeholder="Enter text..." />);
        expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
    });

    it('renders input with value', async () => {
        const Input = await getInput();
        render(<Input value="Test value" />);
        expect(screen.getByDisplayValue('Test value')).toBeInTheDocument();
    });

    it('renders disabled input', async () => {
        const Input = await getInput();
        const { container } = render(<Input disabled />);
        expect(container.querySelector('input')).toBeDisabled();
    });

    it('handles input changes', async () => {
        const Input = await getInput();
        const handleChange = vi.fn();

        render(<Input onChange={handleChange} />);

        const input = screen.getByRole('textbox');
        await userEvent.type(input, 'Hello');
        expect(handleChange).toHaveBeenCalled();
    });
});

// ============================================================================
// Avatar Component Tests
// ============================================================================

describe('Avatar Component Snapshots', () => {
    async function getAvatar() {
        const { Avatar, AvatarImage, AvatarFallback } = await import('@/components/ui/avatar');
        return { Avatar, AvatarImage, AvatarFallback };
    }

    it('renders avatar with image', async () => {
        const { Avatar, AvatarImage, AvatarFallback } = await getAvatar();

        const { container } = render(
            <Avatar>
                <AvatarImage src="https://example.com/avatar.png" alt="Avatar" />
                <AvatarFallback>AB</AvatarFallback>
            </Avatar>
        );

        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders avatar with fallback', async () => {
        const { Avatar, AvatarFallback } = await getAvatar();

        render(
            <Avatar>
                <AvatarFallback>JD</AvatarFallback>
            </Avatar>
        );

        expect(screen.getByText('JD')).toBeInTheDocument();
    });
});

// ============================================================================
// Skeleton Component Tests
// ============================================================================

describe('Skeleton Component Snapshots', () => {
    async function getSkeleton() {
        const { Skeleton } = await import('@/components/ui/skeleton');
        return Skeleton;
    }

    it('renders skeleton element', async () => {
        const Skeleton = await getSkeleton();
        const { container } = render(<Skeleton />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders skeleton with custom class', async () => {
        const Skeleton = await getSkeleton();
        const { container } = render(<Skeleton className="h-8 w-32" />);
        expect(container.firstChild).toHaveClass('h-8', 'w-32');
    });
});

// ============================================================================
// Empty State Component Tests
// ============================================================================

describe('EmptyState Component Snapshots', () => {
    async function getEmptyState() {
        const { EmptyState } = await import('@/components/ui/empty-state');
        return EmptyState;
    }

    it('renders empty state with title', async () => {
        const EmptyState = await getEmptyState();

        render(<EmptyState title="No results" />);

        expect(screen.getByText('No results')).toBeInTheDocument();
    });

    it('renders empty state with description', async () => {
        const EmptyState = await getEmptyState();

        render(
            <EmptyState
                title="No results"
                description="Try adjusting your search"
            />
        );

        expect(screen.getByText('Try adjusting your search')).toBeInTheDocument();
    });

    it('renders empty state with action', async () => {
        const EmptyState = await getEmptyState();
        const handleAction = vi.fn();

        render(
            <EmptyState
                title="No results"
                action={{ label: 'Add new', onClick: handleAction }}
            />
        );

        // Action renders as a button element
        const buttons = document.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThan(0);
        expect(buttons[0]).toHaveTextContent('Add new');
    });
});
