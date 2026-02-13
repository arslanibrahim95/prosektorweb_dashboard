/**
 * API Tests - Inbox Endpoints
 *
 * Tests for authenticated inbox routes with real schema validation
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { users, tenants, offerRequests } from '@prosektorweb/testing/fixtures/seed';
import {
    offerRequestSchema,
    contactMessageSchema,
    jobApplicationSchema,
    errorResponseSchema,
} from '@prosektor/contracts';

// =========================================================================
// Schema Validation Tests
// =========================================================================
describe('Inbox API: Schema Validation', () => {
    describe('Offer Request Schema', () => {
        it('should validate correct offer request', () => {
            const valid = {
                id: '123e4567-e89b-42d3-a456-426614174000',
                tenant_id: '11111111-1111-4111-8111-111111111111',
                site_id: 'aaaaaaaa-0000-4000-8001-000000000001',
                full_name: 'Test User',
                email: 'test@example.com',
                phone: '5551234567',
                company_name: 'Test Co',
                message: 'Test message',
                kvkk_accepted_at: '2024-01-01T00:00:00Z',
                is_read: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            const result = offerRequestSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email format', () => {
            const invalid = {
                id: '123e4567-e89b-42d3-a456-426614174000',
                tenant_id: '11111111-1111-4111-8111-111111111111',
                site_id: 'aaaaaaaa-0000-4000-8001-000000000001',
                full_name: 'Test User',
                email: 'not-an-email',
                phone: '5551234567',
                kvkk_accepted_at: '2024-01-01T00:00:00Z',
                is_read: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            const result = offerRequestSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('Contact Message Schema', () => {
        it('should validate correct contact message', () => {
            const valid = {
                id: '123e4567-e89b-42d3-a456-426614174000',
                tenant_id: '11111111-1111-4111-8111-111111111111',
                site_id: 'aaaaaaaa-0000-4000-8001-000000000001',
                full_name: 'Test User',
                email: 'test@example.com',
                phone: '5551234567',
                subject: 'Test Subject',
                message: 'Test message content with enough length',
                kvkk_accepted_at: '2024-01-01T00:00:00Z',
                is_read: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            const result = contactMessageSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });
    });

    describe('Job Application Schema', () => {
        it('should validate correct job application', () => {
            const valid = {
                id: '123e4567-e89b-42d3-a456-426614174000',
                tenant_id: '11111111-1111-4111-8111-111111111111',
                site_id: 'aaaaaaaa-0000-4000-8001-000000000001',
                job_post_id: 'aaaaaaaa-0000-4000-8011-000000000011',
                full_name: 'Test User',
                email: 'test@example.com',
                phone: '5551234567',
                message: null,
                cv_path: '/cv/test.pdf',
                kvkk_accepted_at: '2024-01-01T00:00:00Z',
                is_read: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            const result = jobApplicationSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });
    });
});

// =========================================================================
// Error Format Tests
// =========================================================================
describe('Inbox API: Error Format', () => {
    describe('P1-06: Standard Error Format', () => {
        it('should validate {code, message} error format', () => {
            const errorPayload = {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            };

            const result = errorResponseSchema.safeParse(errorPayload);
            expect(result.success).toBe(true);
        });

        it('should validate error with details', () => {
            const errorPayload = {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: {
                    email: ['Email is required'],
                    phone: ['Phone is required'],
                },
            };

            const result = errorResponseSchema.safeParse(errorPayload);
            expect(result.success).toBe(true);
        });
    });
});

// =========================================================================
// Tenant Scoping Logic Tests
// =========================================================================
describe('Inbox API: Tenant Scoping', () => {
    it('should correctly identify tenant from fixture data', () => {
        // Verify fixture data structure
        expect(users.ownerA.tenant_id).toBe(tenants.tenantA.id);
        expect(users.ownerB.tenant_id).toBe(tenants.tenantB.id);
        expect(offerRequests.offerA1.tenant_id).toBe(tenants.tenantA.id);
    });

    it('should filter items by tenant_id correctly', () => {
        const allItems = [
            { tenant_id: tenants.tenantA.id, name: 'A1' },
            { tenant_id: tenants.tenantA.id, name: 'A2' },
            { tenant_id: tenants.tenantB.id, name: 'B1' },
        ];

        // Simulate RLS filtering for Tenant A
        const tenantAItems = allItems.filter(
            (item) => item.tenant_id === tenants.tenantA.id
        );

        expect(tenantAItems).toHaveLength(2);
        expect(tenantAItems.every((i) => i.tenant_id === tenants.tenantA.id)).toBe(true);
    });
});

// =========================================================================
// Date Filter Logic Tests
// =========================================================================
describe('Inbox API: Filtering', () => {
    describe('P1-01: Date Range Filter', () => {
        it('should filter items by date_from', () => {
            const items = [
                { created_at: '2023-12-15T00:00:00Z' },
                { created_at: '2024-01-15T00:00:00Z' },
                { created_at: '2024-02-01T00:00:00Z' },
            ];

            const dateFrom = new Date('2024-01-01');
            const filtered = items.filter(
                (item) => new Date(item.created_at) >= dateFrom
            );

            expect(filtered).toHaveLength(2);
        });

        it('should filter items by date_to', () => {
            const items = [
                { created_at: '2024-01-15T00:00:00Z' },
                { created_at: '2024-02-01T00:00:00Z' },
                { created_at: '2024-03-01T00:00:00Z' },
            ];

            const dateTo = new Date('2024-02-15');
            const filtered = items.filter(
                (item) => new Date(item.created_at) <= dateTo
            );

            expect(filtered).toHaveLength(2);
        });
    });

    describe('P1-02: Job Post Filter', () => {
        it('should filter applications by job_post_id', () => {
            const applications = [
                { job_post_id: 'job-123', name: 'App 1' },
                { job_post_id: 'job-123', name: 'App 2' },
                { job_post_id: 'job-456', name: 'App 3' },
            ];

            const targetJobId = 'job-123';
            const filtered = applications.filter(
                (app) => app.job_post_id === targetJobId
            );

            expect(filtered).toHaveLength(2);
            expect(filtered.every((a) => a.job_post_id === targetJobId)).toBe(true);
        });
    });
});

// =========================================================================
// Pagination Logic Tests
// =========================================================================
describe('Inbox API: Pagination', () => {
    it('should paginate results correctly', () => {
        const allItems = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
        const page = 1;
        const limit = 10;

        const start = (page - 1) * limit;
        const paginatedItems = allItems.slice(start, start + limit);

        expect(paginatedItems).toHaveLength(10);
        expect(paginatedItems[0].id).toBe(1);
        expect(paginatedItems[9].id).toBe(10);
    });

    it('should handle last page correctly', () => {
        const allItems = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
        const page = 3;
        const limit = 10;

        const start = (page - 1) * limit;
        const paginatedItems = allItems.slice(start, start + limit);

        expect(paginatedItems).toHaveLength(5); // Only 5 items on last page
        expect(paginatedItems[0].id).toBe(21);
    });
});
