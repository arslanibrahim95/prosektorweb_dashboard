/**
 * API Client Configuration - Web App
 * 
 * ARCHITECTURE: Factory pattern with dependency injection
 * Client-side API client configuration with auth providers.
 */

import { createApiClient, ApiClient } from '@prosektorweb/shared';
export type { APIError, PaginatedResponse, QueryParams, ApiClientDependencies } from '@prosektorweb/shared';
export { ApiError, createApiClient, getGlobalApiClient } from '@prosektorweb/shared';

// DI: Create API client with dependencies
const apiClient = createApiClient('/api');

/**
 * Sets the access token provider for authentication
 */
export function setApiAccessTokenProvider(
  provider: (() => Promise<string | null> | string | null) | null
) {
  apiClient.setAccessTokenProvider(provider);
}

/**
 * Sets the context headers provider (e.g., for tenant ID)
 */
export function setApiContextHeadersProvider(
  provider:
    | (() => Promise<Record<string, string> | null> | Record<string, string> | null)
    | null
) {
  apiClient.setContextHeadersProvider(provider);
}

/**
 * Gets the configured API client instance
 * Factory pattern allows for singleton-like behavior with DI
 */
export function getApiClient(): ApiClient {
  return apiClient;
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
export const api = apiClient;

// Set the global API client for cross-package compatibility
import { setGlobalApiClient } from '@prosektorweb/shared';
setGlobalApiClient(apiClient);
