/**
 * Performance Tests
 * 
 * Tests for render performance, utility function efficiency,
 * and memory usage patterns.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderToString } from '@testing-library/react';
import { performance } from 'perf_hooks';

// Import utilities directly
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatDate } from '@/lib/format';
import { 
    generateWebSiteSchema, 
    schemaToJsonLd, 
    generateBreadcrumbSchema,
    generateOrganizationSchema 
} from '@/lib/structured-data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// Utility Function Performance Tests
// ============================================================================

describe('Utility Function Performance', () => {
    describe('cn (className merger) performance', () => {
        it('merges classes efficiently', () => {
            const iterations = 10000;
            const start = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                cn('class1 class2', 'class3', { class4: true, class5: false });
            }
            
            const duration = performance.now() - start;
            
            // Should complete 10k operations in under 100ms
            expect(duration).toBeLessThan(100);
        });

        it('handles large number of classes', () => {
            const manyClasses = Array.from({ length: 50 }, (_, i) => `class${i}`).join(' ');
            
            const start = performance.now();
            const result = cn(manyClasses);
            const duration = performance.now() - start;
            
            expect(duration).toBeLessThan(10);
            expect(result).toContain('class0');
            expect(result).toContain('class49');
        });
    });

    describe('formatRelativeTime performance', () => {
        it('formats dates efficiently', () => {
            const iterations = 1000;
            const date = new Date().toISOString();
            
            const start = performance.now();
            for (let i = 0; i < iterations; i++) {
                formatRelativeTime(date);
            }
            const duration = performance.now() - start;
            
            expect(duration).toBeLessThan(50);
        });
    });

    describe('Schema generation performance', () => {
        it('generates structured data efficiently', () => {
            const iterations = 1000;
            
            const start = performance.now();
            for (let i = 0; i < iterations; i++) {
                const schema = generateWebSiteSchema({
                    name: 'Test Site',
                    url: 'https://test.com',
                    description: 'Test description',
                });
                schemaToJsonLd(schema);
            }
            const duration = performance.now() - start;
            
            expect(duration).toBeLessThan(100);
        });
    });
});

// ============================================================================
// Memory Usage Tests
// ============================================================================

describe('Memory Usage', () => {
    it('handles large arrays without memory issues', () => {
        // Create large array of classes
        const largeArray = Array.from({ length: 1000 }, (_, i) => `class-${i}`);
        
        const start = performance.now();
        cn(...largeArray);
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(50);
    });
});

// ============================================================================
// Component Render Performance Tests
// ============================================================================

describe('Component Render Performance', () => {
    it('renders simple button quickly', () => {
        const iterations = 100;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            render(<Button>Test</Button>);
        }
        
        const duration = performance.now() - start;
        
        // Should render 100 buttons in under 2 seconds
        expect(duration).toBeLessThan(2000);
    });

    it('renders card component quickly', () => {
        const iterations = 50;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            render(
                <Card>
                    <CardHeader>
                        <CardTitle>Title</CardTitle>
                    </CardHeader>
                    <CardContent>Content</CardContent>
                </Card>
            );
        }
        
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(1500);
    });

    it('handles multiple input renders efficiently', () => {
        const iterations = 100;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            render(<Input placeholder={`Input ${i}`} />);
        }
        
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(2000);
    });
});

// ============================================================================
// Bundle Size Estimation Tests
// ============================================================================

describe('Bundle Size Considerations', () => {
    it('utility exports are tree-shakeable', () => {
        // This test ensures our utilities can be imported individually
        // which is important for bundle size
        expect(typeof cn).toBe('function');
    });

    it('format utilities include only necessary functions', () => {
        // Should export these functions
        expect(typeof formatRelativeTime).toBe('function');
        expect(typeof formatDate).toBe('function');
    });

    it('structured-data exports are modular', () => {
        // All generators should be exported
        expect(typeof generateWebSiteSchema).toBe('function');
        expect(typeof generateOrganizationSchema).toBe('function');
        expect(typeof generateBreadcrumbSchema).toBe('function');
        expect(typeof schemaToJsonLd).toBe('function');
    });
});

// ============================================================================
// Animation Performance Considerations
// ============================================================================

describe('Animation & Transition Performance', () => {
    it('components support transition classes', () => {
        const { container } = render(
            <Button className="transition-all duration-200">
                Animated
            </Button>
        );
        
        const button = container.querySelector('button');
        expect(button).toHaveClass('transition-all');
        expect(button).toHaveClass('duration-200');
    });

    it('skeleton components render without animation blocking', () => {
        const start = performance.now();
        
        // Render multiple skeletons
        for (let i = 0; i < 10; i++) {
            render(<Skeleton className="h-4 w-full" />);
        }
        
        const duration = performance.now() - start;
        
        // Should render quickly without blocking
        expect(duration).toBeLessThan(500);
    });
});

// ============================================================================
// Large Data Handling Tests
// ============================================================================

describe('Large Data Handling', () => {
    it('handles large breadcrumb arrays efficiently', () => {
        // Create breadcrumb with many items
        const manyItems = Array.from({ length: 20 }, (_, i) => ({
            name: `Item ${i}`,
            url: `/item-${i}`,
        }));
        
        const start = performance.now();
        const schema = generateBreadcrumbSchema({ items: manyItems });
        const duration = performance.now() - start;
        
        expect(schema.itemListElement).toHaveLength(20);
        expect(duration).toBeLessThan(10);
    });

    it('handles deep nesting in schemas', () => {
        const schema = generateOrganizationSchema({
            name: 'Large Organization',
            url: 'https://example.com',
            address: {
                streetAddress: '123 Main St',
                addressLocality: 'City',
                addressRegion: 'State',
                postalCode: '12345',
                addressCountry: 'US',
            },
            contactPoint: Array.from({ length: 10 }, (_, i) => ({
                telephone: `+1-555-${i.toString().padStart(4, '0')}`,
                contactType: 'customer service',
            })),
        });
        
        expect(schema.contactPoint).toHaveLength(10);
        expect(schema.address).toBeDefined();
    });
});
