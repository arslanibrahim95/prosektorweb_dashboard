import { z } from 'zod';

// === Error Types ===
interface APIError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// === Response Types ===
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// === Query Params Builder ===
interface QueryParams {
  [key: string]: string | number | boolean | undefined | null;
}

function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// === API Client ===
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: QueryParams;
      schema?: z.ZodType<T>;
    }
  ): Promise<T> {
    const url = `${this.baseUrl}${path}${options?.params ? buildQueryString(options.params) : ''}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
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

  async get<T>(path: string, params?: QueryParams, schema?: z.ZodType<T>): Promise<T> {
    return this.request<T>('GET', path, { params, schema });
  }

  async post<T>(path: string, body?: unknown, schema?: z.ZodType<T>): Promise<T> {
    return this.request<T>('POST', path, { body, schema });
  }

  async patch<T>(path: string, body?: unknown, schema?: z.ZodType<T>): Promise<T> {
    return this.request<T>('PATCH', path, { body, schema });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
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

// === Singleton Export ===
export const api = new ApiClient();

// === Re-exports ===
export type { APIError, PaginatedResponse, QueryParams };
