/**
 * Test Payloads - Sample request bodies
 */

import { tenants, sites, jobPosts } from './seed';

// ========================================
// VALID PAYLOADS
// ========================================

export const validOfferSubmit = {
    site_token: 'test-site-token-a',
    full_name: 'Test Kullanıcı',
    email: 'test@example.com',
    phone: '5551234567',
    company_name: 'Test Şirketi',
    message: 'Teklif almak istiyorum',
    kvkk_consent: true,
    honeypot: '',
};

export const validContactSubmit = {
    site_token: 'test-site-token-a',
    full_name: 'Test Kullanıcı',
    email: 'test@example.com',
    phone: '5551234567',
    subject: 'Bilgi Talebi',
    message: 'Merhaba, bilgi almak istiyorum.',
    kvkk_consent: true,
    honeypot: '',
};

export const validJobApply = {
    site_token: 'test-site-token-a',
    job_post_id: jobPosts.jobA1.id,
    full_name: 'Test Aday',
    email: 'aday@example.com',
    phone: '5559876543',
    message: 'Başvuru mesajı',
    kvkk_consent: true,
    honeypot: '',
    // cv_file: File (handled separately in tests)
};

export const validJobPostCreate = {
    title: 'Yeni Test İlan',
    slug: 'yeni-test-ilan',
    location: 'İstanbul',
    employment_type: 'full-time',
    description: 'İlan açıklaması',
    requirements: 'Gereksinimler',
    is_active: true,
};

// ========================================
// INVALID PAYLOADS (For validation tests)
// ========================================

export const invalidOfferMissingEmail = {
    ...validOfferSubmit,
    email: undefined,
};

export const invalidOfferMissingPhone = {
    ...validOfferSubmit,
    phone: undefined,
};

export const invalidOfferNoKvkk = {
    ...validOfferSubmit,
    kvkk_consent: false,
};

export const invalidOfferHoneypotFilled = {
    ...validOfferSubmit,
    honeypot: 'spam bot text',
};

export const invalidContactShortMessage = {
    ...validContactSubmit,
    message: 'Kısa', // min 10 chars
};

export const invalidJobApplyInvalidJobId = {
    ...validJobApply,
    job_post_id: 'invalid-uuid',
};

// ========================================
// FILE PAYLOADS
// ========================================

export function createTestPDF(): Blob {
    // Minimal valid PDF
    const pdfContent = '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>';
    return new Blob([pdfContent], { type: 'application/pdf' });
}

export function createTestDoc(): Blob {
    const docContent = 'PK\x03\x04'; // Minimal DOCX header
    return new Blob([docContent], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
}

export function createInvalidFile(): Blob {
    return new Blob(['malicious'], { type: 'application/x-executable' });
}

export function createOversizedFile(): Blob {
    // 6MB file (limit is 5MB)
    const size = 6 * 1024 * 1024;
    return new Blob([new ArrayBuffer(size)], { type: 'application/pdf' });
}

// ========================================
// AUTH HEADERS
// ========================================

export function authHeader(userId: string): Record<string, string> {
    // Mock JWT for testing
    return {
        Authorization: `Bearer test-token-${userId}`,
    };
}
