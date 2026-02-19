/**
 * API Client with Dependency Injection
 * 
 * ARCHITECTURE FIX: Factory pattern with dependency injection
 * Replaces singleton pattern for better testability and flexibility.
 */

import { z } from 'zod';

// === Error Types ===
export interface APIError {
    code: string;
    message: string;
    details?: Record<string, string[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toApiError(payload: unknown, status: number): APIError {
    const source = isRecord(payload) && isRecord(payload.error) ? payload.error : payload;

    if (!isRecord(source)) {
        return {
            code: 'INTERNAL_ERROR',
            message: `Request failed with status ${status}`,
        };
    }

    const code =
        typeof source.code === 'string' && source.code.length > 0
            ? source.code
            : 'INTERNAL_ERROR';
    const message =
        typeof source.message === 'string' && source.message.length > 0
            ? source.message
            : `Request failed with status ${status}`;

    const details = isRecord(source.details)
        ? Object.fromEntries(
            Object.entries(source.details).map(([key, value]) => [
                key,
                Array.isArray(value) ? value.map((v) => String(v)) : [String(value)],
            ]),
        )
        : undefined;

    return { code, message, details };
}

// === Response Types ===
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

// === Query Params ===
export interface QueryParams {
    [key: string]: string | number | boolean | undefined | null;
}

export function buildQueryString(params: QueryParams): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
        }
    });
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
}

// === Error Class ===
export class ApiError extends Error {
    constructor(
        public code: string,
        message: string,
        public status: number,
        public details?: Record<string, string[]>
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// === Dependencies Interface ===
export interface ApiClientDependencies {
    baseUrl: string;
    accessTokenProvider?: () => Promise<string | null> | string | null;
    contextHeadersProvider?: () => Promise<Record<string, string> | null> | Record<string, string> | null;
}

// === API Client ===
export class ApiClient {
    private deps: ApiClientDependencies;

    constructor(deps: ApiClientDependencies | string) {
        this.deps = typeof deps === 'string' ? { baseUrl: deps } : deps;
    }

    setAccessTokenProvider(provider: (() => Promise<string | null> | string | null) | null) {
        this.deps.accessTokenProvider = provider ?? undefined;
    }

    setContextHeadersProvider(
        provider:
            | (() => Promise<Record<string, string> | null> | Record<string, string> | null)
            | null
    ) {
        this.deps.contextHeadersProvider = provider ?? undefined;
    }

    async request<T>(
        method: string,
        path: string,
        options?: {
            body?: unknown;
            params?: QueryParams;
            schema?: z.ZodType<T>;
            signal?: AbortSignal;
        }
    ): Promise<T> {
        const url = `${this.deps.baseUrl}${path}${options?.params ? buildQueryString(options.params) : ''}`;

        const headers: Record<string, string> = {};

        if (options?.body) {
            headers['Content-Type'] = 'application/json';
        }

        const maybeToken = this.deps.accessTokenProvider
            ? await this.deps.accessTokenProvider()
            : null;

        if (maybeToken) {
            headers.Authorization = `Bearer ${maybeToken}`;
        }

        const contextHeaders = this.deps.contextHeadersProvider
            ? await this.deps.contextHeadersProvider()
            : null;
        if (contextHeaders) {
            Object.entries(contextHeaders).forEach(([key, value]) => {
                headers[key] = value;
            });
        }

        const response = await fetch(url, {
            method,
            headers,
            body: options?.body ? JSON.stringify(options.body) : undefined,
            credentials: 'omit',
            signal: options?.signal,
        });

        let data: unknown;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            const error = toApiError(data, response.status);
            throw new ApiError(error.code, error.message, response.status, error.details);
        }

        if (options?.schema) {
            const result = options.schema.safeParse(data);
            if (!result.success) {
                console.error('API Response validation failed:', result.error);
                throw new ApiError(
                    'VALIDATION_ERROR',
                    'Invalid response format from server',
                    500
                );
            }
            return result.data;
        }

        return data as T;
    }

    async get<T>(
        path: string,
        params?: QueryParams,
        schema?: z.ZodType<T>,
        requestOptions?: { signal?: AbortSignal }
    ): Promise<T> {
        return this.request<T>('GET', path, {
            params,
            schema,
            signal: requestOptions?.signal,
        });
    }

    async post<T>(path: string, body?: unknown, schema?: z.ZodType<T>): Promise<T> {
        return this.request<T>('POST', path, { body, schema });
    }

    async patch<T>(path: string, body?: unknown, schema?: z.ZodType<T>): Promise<T> {
        return this.request<T>('PATCH', path, { body, schema });
    }

    async put<T>(path: string, body?: unknown, schema?: z.ZodType<T>): Promise<T> {
        return this.request<T>('PUT', path, { body, schema });
    }

    async delete<T>(path: string, body?: unknown, schema?: z.ZodType<T>): Promise<T> {
        return this.request<T>('DELETE', path, { body, schema });
    }
}

// === Factory Function ===
// Creates a new API client instance with dependencies
export function createApiClient(
    baseUrl: string = '/api',
    deps?: Partial<ApiClientDependencies>
): ApiClient {
    return new ApiClient({
        baseUrl,
        ...deps,
    });
}

// === Legacy Exports (for backward compatibility during migration) ===
// These will be removed after full migration to DI pattern

let globalApiClient: ApiClient | null = null;

/**
 * @deprecated Use createApiClient() with dependency injection instead
 */
export function getGlobalApiClient(): ApiClient {
    if (!globalApiClient) {
        globalApiClient = createApiClient();
    }
    return globalApiClient;
}

/**
 * @deprecated Use createApiClient() with dependency injection instead
 */
export function setGlobalApiClient(client: ApiClient): void {
    globalApiClient = client;
}
