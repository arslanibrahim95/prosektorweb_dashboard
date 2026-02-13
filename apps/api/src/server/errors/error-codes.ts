/**
 * API Error Codes
 *
 * Tüm API hata kodları merkezi olarak tanımlanmıştır.
 * Hata kodları 4 haneli formatta: XXXX (örn: 4001, 5001)
 *
 * Kategoriler:
 * - 1xxx: Authentication & Authorization
 * - 2xxx: Validation Errors
 * - 3xxx: Not Found Errors
 * - 4xxx: Business Logic Errors
 * - 5xxx: Server Errors
 * - 9xxx: Rate Limiting & Security
 */

export const ErrorCodes = {
    // === Authentication & Authorization (1xxx) ===
    AUTH_UNAUTHORIZED: 'UNAUTHORIZED',
    AUTH_FORBIDDEN: 'FORBIDDEN',
    AUTH_TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    AUTH_INVALID_TOKEN: 'INVALID_TOKEN',
    AUTH_NO_TENANT: 'NO_TENANT',
    AUTH_SESSION_EXPIRED: 'SESSION_EXPIRED',
    AUTH_SESSION_REFRESH_FAILED: 'SESSION_REFRESH_FAILED',
    AUTH_REMEMBER_ME_TOKEN_INVALID: 'REMEMBER_ME_TOKEN_INVALID',
    AUTH_CUSTOM_JWT_INVALID: 'CUSTOM_JWT_INVALID',
    AUTH_CUSTOM_JWT_EXPIRED: 'CUSTOM_JWT_EXPIRED',
    AUTH_INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

    // === Validation Errors (2xxx) ===
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_REQUEST_BODY: 'INVALID_REQUEST_BODY',
    INVALID_QUERY_PARAMS: 'INVALID_QUERY_PARAMS',
    INVALID_UUID: 'INVALID_UUID',

    // === Not Found Errors (3xxx) ===
    NOT_FOUND: 'NOT_FOUND',
    SITE_NOT_FOUND: 'SITE_NOT_FOUND',
    PAGE_NOT_FOUND: 'PAGE_NOT_FOUND',
    MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
    USER_NOT_FOUND: 'USER_NOT_FOUND',

    // === Business Logic Errors (4xxx) ===
    CONFLICT: 'CONFLICT',
    INVALID_STATE: 'INVALID_STATE',
    MODULE_DISABLED: 'MODULE_DISABLED',
    RESOURCE_LOCKED: 'RESOURCE_LOCKED',
    SLUG_EXISTS: 'SLUG_EXISTS',

    // === Server Errors (5xxx) ===
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

    // === Rate Limiting & Security (9xxx) ===
    RATE_LIMITED: 'RATE_LIMITED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * HTTP Status code mapping for error codes
 */
export const ErrorCodeToStatus: Record<ErrorCode, number> = {
    // 1xxx - Auth
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    TOKEN_EXPIRED: 401,
    INVALID_TOKEN: 401,
    NO_TENANT: 403,
    SESSION_EXPIRED: 401,
    SESSION_REFRESH_FAILED: 401,
    REMEMBER_ME_TOKEN_INVALID: 401,
    CUSTOM_JWT_INVALID: 401,
    CUSTOM_JWT_EXPIRED: 401,
    INVALID_CREDENTIALS: 401,

    // 2xxx - Validation
    VALIDATION_ERROR: 400,
    INVALID_REQUEST_BODY: 400,
    INVALID_QUERY_PARAMS: 400,
    INVALID_UUID: 400,

    // 3xxx - Not Found
    NOT_FOUND: 404,
    SITE_NOT_FOUND: 404,
    PAGE_NOT_FOUND: 404,
    MODULE_NOT_FOUND: 404,
    USER_NOT_FOUND: 404,

    // 4xxx - Business Logic
    CONFLICT: 409,
    INVALID_STATE: 409,
    MODULE_DISABLED: 404,
    RESOURCE_LOCKED: 423,
    SLUG_EXISTS: 409,

    // 5xxx - Server
    INTERNAL_ERROR: 500,
    DATABASE_ERROR: 500,
    UPLOAD_FAILED: 500,
    EXTERNAL_SERVICE_ERROR: 502,

    // 9xxx - Rate Limiting
    RATE_LIMITED: 429,
    SUSPICIOUS_ACTIVITY: 403,
};
