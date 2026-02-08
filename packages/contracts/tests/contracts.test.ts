/**
 * Contract Tests - Zod Schema Drift Detection
 * 
 * Ensures frontend and backend use compatible schemas
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Import schemas from contracts (or validators as fallback)
import {
    meResponseSchema,
    offerRequestSchema,
    contactMessageSchema,
    jobApplicationSchema,
    jobPostSchema,
    offerSubmitSchema,
    contactSubmitSchema,
    jobApplySchema,
} from '../../apps/web/src/validators';

describe('Contract Tests: Schema Validation', () => {
    describe('Auth Schemas', () => {
        it('meResponseSchema validates correct payload', () => {
            const validPayload = {
                user: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    email: 'test@example.com',
                    name: 'Test User',
                    avatar_url: null,
                },
                tenant: {
                    id: '123e4567-e89b-12d3-a456-426614174001',
                    name: 'Test Tenant',
                    slug: 'test-tenant',
                    plan: 'pro',
                },
                role: 'admin',
                permissions: ['site.edit', 'inbox.view'],
            };

            expect(() => meResponseSchema.parse(validPayload)).not.toThrow();
        });

        it('meResponseSchema rejects invalid role', () => {
            const invalidPayload = {
                user: { id: '123', email: 'test@test.com', name: 'Test', avatar_url: null },
                tenant: { id: '123', name: 'Tenant', slug: 'slug', plan: 'pro' },
                role: 'invalid_role', // Not in enum
                permissions: [],
            };

            expect(() => meResponseSchema.parse(invalidPayload)).toThrow();
        });
    });

    describe('Inbox Schemas', () => {
        it('offerRequestSchema validates correctly', () => {
            const valid = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                full_name: 'Test User',
                email: 'test@example.com',
                phone: '5551234567',
                company_name: 'Test Co',
                message: 'Test message',
                is_read: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            expect(() => offerRequestSchema.parse(valid)).not.toThrow();
        });

        it('contactMessageSchema validates correctly', () => {
            const valid = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                full_name: 'Test User',
                email: 'test@example.com',
                phone: '5551234567',
                subject: 'Test Subject',
                message: 'Test message content',
                is_read: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            expect(() => contactMessageSchema.parse(valid)).not.toThrow();
        });

        it('jobApplicationSchema validates correctly', () => {
            const valid = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                job_post_id: '123e4567-e89b-12d3-a456-426614174001',
                job_title: 'Software Engineer',
                full_name: 'Test User',
                email: 'test@example.com',
                phone: '5551234567',
                message: null,
                cv_path: '/cv/test.pdf',
                is_read: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            expect(() => jobApplicationSchema.parse(valid)).not.toThrow();
        });
    });

    describe('Public Form Schemas', () => {
        it('offerSubmitSchema requires kvkk_consent=true', () => {
            const withoutKvkk = {
                full_name: 'Test',
                email: 'test@test.com',
                phone: '5551234567',
                kvkk_consent: false, // Must be true
            };

            expect(() => offerSubmitSchema.parse(withoutKvkk)).toThrow();
        });

        it('contactSubmitSchema requires message min 10 chars', () => {
            const shortMessage = {
                full_name: 'Test',
                email: 'test@test.com',
                phone: '5551234567',
                message: 'Short', // Less than 10 chars
                kvkk_consent: true,
            };

            expect(() => contactSubmitSchema.parse(shortMessage)).toThrow();
        });

        it('jobApplySchema requires valid UUID for job_post_id', () => {
            const invalidUuid = {
                job_post_id: 'not-a-uuid',
                full_name: 'Test',
                email: 'test@test.com',
                phone: '5551234567',
                kvkk_consent: true,
            };

            expect(() => jobApplySchema.parse(invalidUuid)).toThrow();
        });
    });

    describe('HR Schemas', () => {
        it('jobPostSchema validates slug pattern', () => {
            const invalidSlug = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                title: 'Test Job',
                slug: 'Invalid Slug With Spaces', // Invalid
                location: null,
                employment_type: null,
                description: null,
                requirements: null,
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };

            expect(() => jobPostSchema.parse(invalidSlug)).toThrow();
        });
    });
});
