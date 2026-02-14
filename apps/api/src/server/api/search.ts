/**
 * Search term escaping utilities for PostgREST queries
 */

/**
 * Escape special characters in search terms for PostgREST ILIKE queries
 * This function escapes backslashes, percent signs, and underscores
 * to prevent them from being interpreted as wildcards or escape sequences.
 * 
 * @param term - The search term to escape
 * @returns The escaped search term safe for use in PostgREST ILIKE queries
 */
export function escapeSearchTerm(term: string): string {
    return term
        .replace(/\\/g, "\\\\")  // Escape backslashes first
        .replace(/%/g, "\\%")     // Escape percent signs (wildcard)
        .replace(/_/g, "\\_");    // Escape underscores (single char wildcard)
}
