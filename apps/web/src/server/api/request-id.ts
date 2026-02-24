/**
 * Request ID utilities for tracking API requests
 * 
 * Provides functions to generate, extract, and attach request IDs to requests/responses
 * for better monitoring and debugging.
 * 
 * SECURITY: Client-supplied request IDs are validated to prevent log injection.
 */

/** Max length for client-supplied request IDs */
const MAX_REQUEST_ID_LENGTH = 128;

/** UUID v4 format regex (case-insensitive) */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a safe request ID.
 * Only UUID format and reasonable alphanumeric IDs are accepted.
 * This prevents log injection, log forgery, and DoS via oversized headers.
 */
function isValidRequestId(value: string): boolean {
    if (value.length === 0 || value.length > MAX_REQUEST_ID_LENGTH) return false;
    // Accept UUID format or safe alphanumeric/dash/underscore IDs
    return UUID_REGEX.test(value) || /^[a-zA-Z0-9._-]+$/.test(value);
}

/**
 * Generate unique request ID for each API request
 * Uses crypto.randomUUID() for RFC 4122 compliant UUIDs
 */
export function generateRequestId(): string {
    return crypto.randomUUID();
}

/**
 * Extract or generate request ID from headers
 * 
 * SECURITY: Client-supplied x-request-id headers are validated against
 * UUID format and safe character patterns. Invalid values (potential injection
 * payloads) are silently rejected and a fresh UUID is generated.
 * 
 * @param req - The incoming request
 * @returns Request ID string (UUID format or validated alphanumeric)
 */
export function getRequestId(req: Request): string {
    const clientId = req.headers.get("x-request-id");
    if (clientId && isValidRequestId(clientId)) {
        return clientId;
    }
    return generateRequestId();
}

/**
 * Add request ID to response headers
 * Mutates the response headers to include x-request-id
 * 
 * @param response - The response object to modify
 * @param requestId - The request ID to attach
 * @returns The same response object with modified headers
 */
export function withRequestId(response: Response, requestId: string): Response {
    response.headers.set("x-request-id", requestId);
    return response;
}
