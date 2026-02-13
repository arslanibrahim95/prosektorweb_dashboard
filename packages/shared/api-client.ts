import { z } from 'zod';

// === Error Types ===
export interface APIError {
    code: string;
    message: string;
    details?: Record<string, string[]>;
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

// === API Client ===
export class ApiClient {
    private baseUrl: string;
    private accessTokenProvider: (() => Promise<string | null> | string | null) | null = null;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    setAccessTokenProvider(provider: (() => Promise<string | null> | string | null) | null) {
        this.accessTokenProvider = provider;
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
        const url = `${this.baseUrl}${path}${options?.params ? buildQueryString(options.params) : ''}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        const maybeToken = this.accessTokenProvider ? await this.accessTokenProvider() : null;
        if (maybeToken) {
            headers.Authorization = `Bearer ${maybeToken}`;
        }

        const response = await fetch(url, {
            method,
            headers,
            body: options?.body ? JSON.stringify(options.body) : undefined,
            credentials: 'include',
            signal: options?.signal,
        });

        const data = await response.json();

        if (!response.ok) {
            const error = data as APIError;
            throw new ApiError(error.code, error.message, response.status, error.details);
        }

        // Validate with Zod if schema provided
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

    async delete<T>(path: string, schema?: z.ZodType<T>): Promise<T> {
        return this.request<T>('DELETE', path, { schema });
    }
}
