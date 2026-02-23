import { describe, it, expect } from 'vitest';
import {
    generateWebSiteSchema,
    generateOrganizationSchema,
    generateBreadcrumbSchema,
    generateArticleSchema,
    schemaToJsonLd,
    breadcrumbs,
} from '@/lib/structured-data';

describe('structured-data utilities', () => {
    describe('generateWebSiteSchema', () => {
        it('should generate basic WebSite schema', () => {
            const schema = generateWebSiteSchema({
                name: 'Test Site',
                url: 'https://test.com',
            });

            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@type']).toBe('WebSite');
            expect(schema.name).toBe('Test Site');
            expect(schema.url).toBe('https://test.com');
        });

        it('should include optional description', () => {
            const schema = generateWebSiteSchema({
                name: 'Test Site',
                url: 'https://test.com',
                description: 'A test website',
            });

            expect(schema.description).toBe('A test website');
        });

        it('should include optional alternateName', () => {
            const schema = generateWebSiteSchema({
                name: 'Test Site',
                url: 'https://test.com',
                alternateName: 'Test',
            });

            expect(schema.alternateName).toBe('Test');
        });
    });

    describe('generateOrganizationSchema', () => {
        it('should generate basic Organization schema', () => {
            const schema = generateOrganizationSchema({
                name: 'Test Company',
                url: 'https://test.com',
            });

            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@type']).toBe('Organization');
            expect(schema.name).toBe('Test Company');
            expect(schema.url).toBe('https://test.com');
        });

        it('should include logo when provided', () => {
            const schema = generateOrganizationSchema({
                name: 'Test Company',
                url: 'https://test.com',
                logo: 'https://test.com/logo.png',
            });

            expect(schema.logo).toBe('https://test.com/logo.png');
        });

        it('should include social links when provided', () => {
            const schema = generateOrganizationSchema({
                name: 'Test Company',
                url: 'https://test.com',
                sameAs: ['https://twitter.com/test', 'https://linkedin.com/company/test'],
            });

            expect(schema.sameAs).toEqual(['https://twitter.com/test', 'https://linkedin.com/company/test']);
        });

        it('should include contact point when provided', () => {
            const schema = generateOrganizationSchema({
                name: 'Test Company',
                url: 'https://test.com',
                contactPoint: [
                    { telephone: '+90-212-123-4567', contactType: 'customer service' },
                ],
            });

            expect(schema.contactPoint).toHaveLength(1);
            expect(schema.contactPoint?.[0].telephone).toBe('+90-212-123-4567');
            expect(schema.contactPoint?.[0].contactType).toBe('customer service');
        });

        it('should include address when provided', () => {
            const schema = generateOrganizationSchema({
                name: 'Test Company',
                url: 'https://test.com',
                address: {
                    streetAddress: 'Test Street 123',
                    addressLocality: 'Istanbul',
                    addressRegion: 'Istanbul',
                    postalCode: '34000',
                    addressCountry: 'TR',
                },
            });

            expect(schema.address).toBeDefined();
            expect(schema.address?.streetAddress).toBe('Test Street 123');
            expect(schema.address?.addressLocality).toBe('Istanbul');
        });
    });

    describe('generateBreadcrumbSchema', () => {
        it('should generate basic breadcrumb schema', () => {
            const schema = generateBreadcrumbSchema({
                items: [{ name: 'Home', url: 'https://test.com' }],
            });

            expect(schema['@type']).toBe('BreadcrumbList');
            expect(schema.itemListElement).toHaveLength(1);
            expect(schema.itemListElement[0].name).toBe('Home');
            expect(schema.itemListElement[0].position).toBe(1);
        });

        it('should handle multiple items', () => {
            const schema = generateBreadcrumbSchema({
                items: [
                    { name: 'Home', url: 'https://test.com' },
                    { name: 'Category', url: 'https://test.com/category' },
                    { name: 'Product', url: 'https://test.com/category/product' },
                ],
            });

            expect(schema.itemListElement).toHaveLength(3);
            expect(schema.itemListElement[0].position).toBe(1);
            expect(schema.itemListElement[1].position).toBe(2);
            expect(schema.itemListElement[2].position).toBe(3);
        });

        it('should handle items without URL', () => {
            const schema = generateBreadcrumbSchema({
                items: [{ name: 'Current Page' }],
            });

            expect(schema.itemListElement[0].name).toBe('Current Page');
            expect((schema.itemListElement[0] as Record<string, unknown>).item).toBeUndefined();
        });
    });

    describe('generateArticleSchema', () => {
        it('should generate basic Article schema', () => {
            const schema = generateArticleSchema({
                headline: 'Test Article',
                url: 'https://test.com/article',
            });

            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@type']).toBe('Article');
            expect(schema.headline).toBe('Test Article');
        });

        it('should include dates when provided', () => {
            const schema = generateArticleSchema({
                headline: 'Test Article',
                url: 'https://test.com/article',
                datePublished: '2024-01-15T10:00:00Z',
                dateModified: '2024-01-16T12:00:00Z',
            });

            expect(schema.datePublished).toBe('2024-01-15T10:00:00Z');
            expect(schema.dateModified).toBe('2024-01-16T12:00:00Z');
        });

        it('should include images when provided', () => {
            const schema = generateArticleSchema({
                headline: 'Test Article',
                url: 'https://test.com/article',
                images: ['https://test.com/image1.jpg', 'https://test.com/image2.jpg'],
            });

            expect(schema.image).toEqual(['https://test.com/image1.jpg', 'https://test.com/image2.jpg']);
        });

        it('should include author when provided', () => {
            const schema = generateArticleSchema({
                headline: 'Test Article',
                url: 'https://test.com/article',
                authorName: 'John Doe',
            });

            expect(schema.author).toHaveLength(1);
            expect((schema.author as Record<string, unknown>[])[0].name).toBe('John Doe');
        });

        it('should include publisher when provided', () => {
            const schema = generateArticleSchema({
                headline: 'Test Article',
                url: 'https://test.com/article',
                publisherName: 'Test Publisher',
                publisherLogo: 'https://test.com/logo.png',
            });

            expect(schema.publisher).toBeDefined();
            expect((schema.publisher as Record<string, unknown>).name).toBe('Test Publisher');
            expect((schema.publisher as Record<string, unknown>).logo).toBe('https://test.com/logo.png');
        });
    });

    describe('schemaToJsonLd', () => {
        it('should convert schema to JSON string', () => {
            const schema = generateWebSiteSchema({
                name: 'Test',
                url: 'https://test.com',
            });

            const jsonLd = schemaToJsonLd(schema);
            expect(typeof jsonLd).toBe('string');
            expect(() => JSON.parse(jsonLd)).not.toThrow();
        });
    });

    describe('breadcrumbs helper', () => {
        it('should generate home breadcrumb', () => {
            const schema = breadcrumbs.home('Test Site', 'https://test.com');
            expect(schema.itemListElement).toHaveLength(1);
            expect(schema.itemListElement[0].name).toBe('Test Site');
        });

        it('should generate page breadcrumb', () => {
            const schema = breadcrumbs.page('Test Site', 'https://test.com', 'About', '/about');
            expect(schema.itemListElement).toHaveLength(2);
            expect(schema.itemListElement[0].name).toBe('Test Site');
            expect(schema.itemListElement[1].name).toBe('About');
        });

        it('should generate job breadcrumb', () => {
            const schema = breadcrumbs.job('Test Site', 'https://test.com', 'Software Developer', 'software-developer');
            expect(schema.itemListElement).toHaveLength(3);
            expect(schema.itemListElement[1].name).toBe('İlanlar');
            expect(schema.itemListElement[2].name).toBe('Software Developer');
        });
    });
});
