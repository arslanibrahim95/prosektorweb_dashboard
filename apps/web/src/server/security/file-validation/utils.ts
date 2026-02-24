import { MAX_FILENAME_LENGTH } from './constants';

/**
 * Gets file extension from filename (lowercase)
 */
export function getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
        return '';
    }
    return filename.substring(lastDotIndex).toLowerCase();
}

/**
 * Sanitizes a filename by removing special characters and limiting length
 * 
 * Rules:
 * - Removes all characters except alphanumeric, dots, hyphens, and underscores
 * - Replaces sequences of invalid characters with a single underscore
 * - Removes leading/trailing underscores
 * - Limits length to MAX_FILENAME_LENGTH characters
 * - Preserves file extension if present
 * - Returns "cv" as fallback if result is empty
 * 
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
        return 'cv';
    }

    // Trim whitespace
    const trimmed = filename.trim();
    if (trimmed.length === 0) {
        return 'cv';
    }

    // Split filename and extension
    const lastDotIndex = trimmed.lastIndexOf('.');
    let name = trimmed;
    let extension = '';

    if (lastDotIndex > 0 && lastDotIndex < trimmed.length - 1) {
        name = trimmed.substring(0, lastDotIndex);
        extension = trimmed.substring(lastDotIndex); // includes the dot
    }

    // Sanitize the name part
    let sanitizedName = name.replace(/[^a-zA-Z0-9._-]+/g, '_');

    // Remove leading/trailing underscores
    sanitizedName = sanitizedName.replace(/^_+|_+$/g, '');

    // If name is empty after sanitization, use default
    if (sanitizedName.length === 0) {
        sanitizedName = 'cv';
    }

    // Sanitize extension (remove any non-alphanumeric except the dot)
    const sanitizedExtension = extension.replace(/[^a-zA-Z0-9.]/g, '');

    // Combine name and extension
    let result = sanitizedName + sanitizedExtension;

    // Limit total length
    if (result.length > MAX_FILENAME_LENGTH) {
        // Try to preserve extension
        if (sanitizedExtension.length > 0 && sanitizedExtension.length < MAX_FILENAME_LENGTH - 2) {
            const maxNameLength = MAX_FILENAME_LENGTH - sanitizedExtension.length;
            result = sanitizedName.substring(0, maxNameLength) + sanitizedExtension;
        } else {
            result = result.substring(0, MAX_FILENAME_LENGTH);
        }
    }

    return result;
}
