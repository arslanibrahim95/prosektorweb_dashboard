import { ApiClient, ApiError } from '@prosektorweb/shared';
export type { APIError, PaginatedResponse, QueryParams } from '@prosektorweb/shared';
export { ApiError } from '@prosektorweb/shared';

// === Singleton Export ===
export const api = new ApiClient();

export function setApiAccessTokenProvider(
  provider: (() => Promise<string | null> | string | null) | null
) {
  api.setAccessTokenProvider(provider);
}

export function setApiContextHeadersProvider(
  provider:
    (() => Promise<Record<string, string> | null> | Record<string, string> | null) | null
) {
  api.setContextHeadersProvider(provider);
}
