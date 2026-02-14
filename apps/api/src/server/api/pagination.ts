/**
 * Pagination utilities for API routes
 */

/**
 * Calculate PostgREST range values for pagination
 * @param page - Page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Object with `from` and `to` range values for PostgREST
 */
export function calculatePaginationRange(page: number, limit: number): { from: number; to: number } {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to };
}
