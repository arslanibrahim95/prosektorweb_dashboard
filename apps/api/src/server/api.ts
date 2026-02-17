/**
 * API Client Configuration - API App
 * 
 * ARCHITECTURE: Factory pattern with dependency injection
 * Server-side API client configuration.
 */

import { createApiClient, ApiClient } from '@prosektorweb/shared';
export type { APIError, PaginatedResponse, QueryParams, ApiClientDependencies } from '@prosektorweb/shared';
export { ApiError, createApiClient } from '@prosektorweb/shared';

// DI: API Client factory for server-side usage
let apiClientInstance: ApiClient | null = null;

/**
 * Gets or creates API client instance
 * Factory pattern allows for configuration injection
 */
export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    apiClientInstance = createApiClient('/api');
  }
  return apiClientInstance;
}

/**
 * Creates a new API client with custom configuration
 * Use for testing or special configurations
 */
export function createConfiguredApiClient(
  baseUrl: string = '/api',
  deps?: Parameters<typeof createApiClient>[1]
): ApiClient {
  return createApiClient(baseUrl, deps);
}

// Legacy export for backward compatibility
export const api = getApiClient();
