import { ALLOWED_CV_EXTENSIONS, MIN_CV_FILE_SIZE } from './constants';
import { getFileExtension } from './utils';

/**
 * Validates file extension against allowed list
 * SECURITY: Prevents extension spoofing attacks
 */
export function validateFileExtension(filename: string): boolean {
    const extension = getFileExtension(filename);
    if (!extension) return false;
    return (ALLOWED_CV_EXTENSIONS as readonly string[]).includes(extension);
}

/**
 * Validates if a file's MIME type is in the allowed list
 * SECURITY NOTE: This checks browser-provided type, but we also sniff the actual content
 * 
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns true if file type is allowed, false otherwise
 */
export function validateFileType(file: File, allowedTypes: readonly string[]): boolean {
    if (!file || !file.type) {
        return false;
    }
    return allowedTypes.includes(file.type);
}

/**
 * Validates if a file's size is within the allowed limit
 * 
 * @param file - The file to validate
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @param minSizeBytes - Minimum allowed size in bytes (default: 10)
 * @returns true if file size is within limit, false otherwise
 */
export function validateFileSize(
    file: File,
    maxSizeBytes: number,
    minSizeBytes: number = MIN_CV_FILE_SIZE
): boolean {
    if (!file || typeof file.size !== 'number') {
        return false;
    }
    return file.size >= minSizeBytes && file.size <= maxSizeBytes;
}
