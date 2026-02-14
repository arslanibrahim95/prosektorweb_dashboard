/**
 * Request logging utilities
 * 
 * Simple request logging with timing and appropriate log levels based on status codes
 */

/**
 * Log request with timing information
 * 
 * Logs at different levels based on status code:
 * - error: 5xx status codes
 * - warn: 4xx status codes
 * - info: 2xx and 3xx status codes
 * 
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - Request path
 * @param requestId - Unique request ID for tracking
 * @param startTime - Request start timestamp (from Date.now())
 * @param statusCode - HTTP response status code
 */
export function logRequest(
    method: string,
    path: string,
    requestId: string,
    startTime: number,
    statusCode: number
): void {
    const duration = Date.now() - startTime;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    console[level](`[${requestId}] ${method} ${path} ${statusCode} ${duration}ms`);
}
