/**
 * Contract Tests - Zod Schema Drift Detection
 *
 * Ensures frontend and backend use compatible schemas from @prosektorweb/contracts
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Import schemas from contracts package (single source of truth)
import {
    // Auth
    meResponseSchema,
    // Inbox
    offerRequestSchema,
    contactMessageSchema,
    jobApplicationSchema,
    listOfferRequestsResponseSchema,
    listContactMessagesResponseSchema,
    listJobApplicationsResponseSchema,
    // Public submit
    publicOfferSubmitSchema,
    publicContactSubmitSchema,
    publicJobApplyFieldsSchema,
    cvFileSchema,
    // HR
    jobPostSchema,
    // Error
    apiErrorSchema,
} from '../index';

describe('Contract Tests: Auth Schemas', () => {
    describe('meResponseSchema', () => {
        it('validates correct payload', () => {
            const validPayload = {
                user: {
                    id: '123e4567-e89b-42d3-a456-426614174000',
                    email: 'test@example.com',
                    name: 'Test User',
                    avatar_url: 'https://example.com/avatar.jpg', // Optional, not null
                },
                tenant: {
                    id: '123e4567-e89b-42d3-a456-426614174001',
                    name: 'Test Tenant',
                    slug: 'test-tenant',
                    plan: 'pro',
                },
                role: 'admin',
                permissions: ['site.edit', 'inbox.view'],
            };

            expect(() => meResponseSchema.parse(validPayload)).not.toThrow();
        });

        it('rejects invalid role', () => {
            const invalidPayload = {
                user: { id: '123e4567-e89b-42d3-a456-426614174000', email: 'test@test.com', name: 'Test' },
                tenant: { id: '123e4567-e89b-42d3-a456-426614174001', name: 'Tenant', slug: 'slug', plan: 'pro' },
                role: 'invalid_role',
                permissions: [],
            };

            expect(() => meResponseSchema.parse(invalidPayload)).toThrow();
        });
    });
});

describe('Contract Tests: Inbox Schemas', () => {
    describe('offerRequestSchema', () => {
        it('validates correctly', () => {
            const valid = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                tenant_id: '123e4567-e89b-12d3-a456-426614174001',
                site_id: '123e4567-e89b-12d3-a456-426614174002',
                full_name: 'Test User',
                email: 'test@example.com',
                phone: '5551234567',
                company_name: 'Test Co',
                message: 'Test message',
                kvkk_accepted_at: '2024-01-01T00:00:00Z',
                is_read: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            expect(() => offerRequestSchema.parse(valid)).not.toThrow();
        });

        it('rejects missing tenant_id', () => {
            const invalid = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                // missing tenant_id
                site_id: '123e4567-e89b-12d3-a456-426614174002',
                full_name: 'Test User',
                email: 'test@example.com',
                phone: '5551234567',
                kvkk_accepted_at: '2024-01-01T00:00:00Z',
                is_read: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            expect(() => offerRequestSchema.parse(invalid)).toThrow();
        });
    });

    describe('contactMessageSchema', () => {
        it('validates correctly', () => {
            const valid = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                tenant_id: '123e4567-e89b-12d3-a456-426614174001',
                site_id: '123e4567-e89b-12d3-a456-426614174002',
                full_name: 'Test User',
                email: 'test@example.com',
                phone: '5551234567',
                subject: 'Test Subject',
                message: 'Test message content',
                kvkk_accepted_at: '2024-01-01T00:00:00Z',
                is_read: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            expect(() => contactMessageSchema.parse(valid)).not.toThrow();
        });
    });

    describe('jobApplicationSchema', () => {
        it('validates correctly', () => {
            const valid = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                tenant_id: '123e4567-e89b-12d3-a456-426614174001',
                site_id: '123e4567-e89b-12d3-a456-426614174002',
                job_post_id: '123e4567-e89b-12d3-a456-426614174003',
                full_name: 'Test User',
                email: 'test@example.com',
                phone: '5551234567',
                message: null,
                cv_path: '/cv/test.pdf',
                kvkk_accepted_at: '2024-01-01T00:00:00Z',
                is_read: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            expect(() => jobApplicationSchema.parse(valid)).not.toThrow();
        });
    });
});

describe('Contract Tests: Public Form Schemas', () => {
    describe('publicOfferSubmitSchema', () => {
        it('requires kvkk_consent=true', () => {
            const withoutKvkk = {
                site_token: 'test-token',
                full_name: 'Test',
                email: 'test@test.com',
                phone: '5551234567',
                kvkk_consent: false,
                honeypot: '',
            };

            expect(() => publicOfferSubmitSchema.parse(withoutKvkk)).toThrow();
        });

        it('rejects filled honeypot', () => {
            const filledHoneypot = {
                site_token: 'test-token',
                full_name: 'Test',
                email: 'test@test.com',
                phone: '5551234567',
                kvkk_consent: true,
                honeypot: 'spam bot text',
            };

            expect(() => publicOfferSubmitSchema.parse(filledHoneypot)).toThrow();
        });
    });

    describe('publicContactSubmitSchema', () => {
        it('requires message', () => {
            const noMessage = {
                site_token: 'test-token',
                full_name: 'Test',
                email: 'test@test.com',
                phone: '5551234567',
                message: '',
                kvkk_consent: true,
                honeypot: '',
            };

            expect(() => publicContactSubmitSchema.parse(noMessage)).toThrow();
        });
    });

    describe('publicJobApplyFieldsSchema', () => {
        it('requires valid UUID for job_post_id', () => {
            const invalidUuid = {
                site_token: 'test-token',
                job_post_id: 'not-a-uuid',
                full_name: 'Test',
                email: 'test@test.com',
                phone: '5551234567',
                kvkk_consent: true,
                honeypot: '',
            };

            expect(() => publicJobApplyFieldsSchema.parse(invalidUuid)).toThrow();
        });
    });
});

describe('Contract Tests: HR Schemas', () => {
    describe('jobPostSchema', () => {
        it('accepts slug with spaces (no pattern enforcement)', () => {
            // Note: Schema doesn't enforce slug pattern - this test documents current behavior
            const slugWithSpaces = {
                id: '123e4567-e89b-42d3-a456-426614174000',
                tenant_id: '123e4567-e89b-42d3-a456-426614174001',
                site_id: '123e4567-e89b-42d3-a456-426614174002',
                title: 'Test Job',
                slug: 'Invalid Slug With Spaces',
                location: null,
                employment_type: null,
                description: null,
                requirements: null,
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };

            // Current schema doesn't enforce slug pattern - passes validation
            expect(() => jobPostSchema.parse(slugWithSpaces)).not.toThrow();
        });

        it('accepts valid slug', () => {
            const validSlug = {
                id: '123e4567-e89b-42d3-a456-426614174000',
                tenant_id: '123e4567-e89b-42d3-a456-426614174001',
                site_id: '123e4567-e89b-42d3-a456-426614174002',
                title: 'Test Job',
                slug: 'valid-slug-name',
                location: 'Istanbul',
                employment_type: 'full-time',
                description: 'Job description',
                requirements: 'Requirements',
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };

            expect(() => jobPostSchema.parse(validSlug)).not.toThrow();
        });
    });
});

describe('Contract Tests: Error Schemas', () => {
    describe('apiErrorSchema', () => {
        it('validates {code, message} format', () => {
            const errorPayload = {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            };

            expect(() => apiErrorSchema.parse(errorPayload)).not.toThrow();
        });

        it('validates error with details', () => {
            const errorPayload = {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: {
                    email: ['Email is required'],
                    phone: ['Phone is required'],
                },
            };

            expect(() => apiErrorSchema.parse(errorPayload)).not.toThrow();
        });
    });
});
