/**
 * Request ID utilities for tracking API requests
 * 
 * Provides functions to generate, extract, and attach request IDs to requests/responses
 * for better monitoring and debugging.
 */

/**
 * Generate unique request ID for each API request
 * Uses crypto.randomUUID() for RFC 4122 compliant UUIDs
 */
export function generateRequestId(): string {
    return crypto.randomUUID();
}

/**
 * Extract or generate request ID from headers
 * Checks for x-request-id header, falls back to generating new ID
 * 
 * @param req - The incoming request
 * @returns Request ID string (UUID format)
 */
export function getRequestId(req: Request): string {
    return req.headers.get("x-request-id") || generateRequestId();
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
