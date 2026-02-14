/**
 * API Test Helper
 *
 * Utilities for testing Next.js API routes / server actions
 * with simulated HTTP requests and proper test isolation.
 */

import { NextRequest } from 'next/server';

export interface TestRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
    ip?: string;
}

export interface TestResponse<T = unknown> {
    status: number;
    body: T;
    headers: Headers;
}

/**
 * Create a mock NextRequest for testing route handlers
 */
export function createMockRequest(
    url: string,
    options: TestRequestOptions = {}
): NextRequest {
    const {
        method = 'GET',
        body,
        headers = {},
        searchParams = {},
        ip = '127.0.0.1',
    } = options;

    const fullUrl = new URL(url, 'http://localhost:3000');
    Object.entries(searchParams).forEach(([key, value]) => {
        fullUrl.searchParams.set(key, value);
    });

    const requestHeaders = new Headers({
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
        ...headers,
    });

    const requestInit = {
        method,
        headers: requestHeaders,
        body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
    };

    return new NextRequest(fullUrl, requestInit);
}

/**
 * Create a FormData request for file uploads
 */
export function createFormDataRequest(
    url: string,
    formData: FormData,
    options: Omit<TestRequestOptions, 'body'> = {}
): NextRequest {
    const { method = 'POST', headers = {}, ip = '127.0.0.1' } = options;

    const fullUrl = new URL(url, 'http://localhost:3000');

    // Don't set Content-Type for FormData - browser/node will set it with boundary
    const requestHeaders = new Headers({
        'X-Forwarded-For': ip,
        ...headers,
    });

    const requestInit = {
        method,
        headers: requestHeaders,
        body: formData,
    };

    return new NextRequest(fullUrl, requestInit);
}

/**
 * Test a Next.js route handler
 */
export async function testRouteHandler<T = unknown>(
    handler: (req: NextRequest) => Promise<Response>,
    options: TestRequestOptions & { url?: string } = {}
): Promise<TestResponse<T>> {
    const { url = '/api/test', ...requestOptions } = options;
    const request = createMockRequest(url, requestOptions);
    const response = await handler(request);

    let body: T;
    const contentType = response.headers.get('Content-Type') ?? '';

    if (contentType.includes('application/json')) {
        body = await response.json();
    } else {
        body = (await response.text()) as unknown as T;
    }

    return {
        status: response.status,
        body,
        headers: response.headers,
    };
}

/**
 * Rate limit test helper - makes multiple requests and returns statuses
 */
export async function testRateLimit(
    handler: (req: NextRequest) => Promise<Response>,
    url: string,
    count: number,
    ip: string = '192.168.1.100'
): Promise<number[]> {
    const statuses: number[] = [];

    for (let i = 0; i < count; i++) {
        const request = createMockRequest(url, {
            method: 'POST',
            ip,
            body: { test: true },
        });
        const response = await handler(request);
        statuses.push(response.status);
    }

    return statuses;
}

/**
 * Auth header helpers
 */
export function createAuthHeaders(token: string): Record<string, string> {
    return {
        Authorization: `Bearer ${token}`,
    };
}

/**
 * Cookie header helpers
 */
export function createCookieHeaders(
    cookies: Record<string, string>
): Record<string, string> {
    const cookieString = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    return {
        Cookie: cookieString,
    };
}

/**
 * Create a test file for upload tests
 */
export function createTestFile(
    name: string,
    content: string | ArrayBuffer,
    type: string
): File {
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
}

export const testFiles = {
    validPDF: () =>
        createTestFile(
            'test.pdf',
            '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>',
            'application/pdf'
        ),
    validDOCX: () =>
        createTestFile(
            'test.docx',
            'PK\x03\x04',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ),
    invalidEXE: () =>
        createTestFile('malicious.exe', 'MZ...', 'application/x-executable'),
    oversizedPDF: () => {
        // 6MB file
        const size = 6 * 1024 * 1024;
        const content = new Uint8Array(size);
        return createTestFile('large.pdf', content.buffer, 'application/pdf');
    },
};
