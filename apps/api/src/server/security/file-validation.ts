/**
 * File Validation Security Utilities
 * 
 * Provides comprehensive file validation for uploads including:
 * - File type whitelist validation
 * - File size limits
 * - Magic bytes verification (prevents extension spoofing)
 * - Filename sanitization
 */

/**
 * File signature (magic bytes) definitions for common file types
 * These are the first bytes of files that identify their true type
 */
const FILE_SIGNATURES = {
    PDF: [
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
    ],
    DOC: [
        Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]), // DOC (OLE2)
    ],
    DOCX: [
        Buffer.from([0x50, 0x4B, 0x03, 0x04]), // DOCX (ZIP-based)
        Buffer.from([0x50, 0x4B, 0x05, 0x06]), // DOCX (empty ZIP)
        Buffer.from([0x50, 0x4B, 0x07, 0x08]), // DOCX (spanned ZIP)
    ],
} as const;

/**
 * Allowed MIME types for CV uploads
 */
export const ALLOWED_CV_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/**
 * Maximum file size for CV uploads (5MB)
 */
export const MAX_CV_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Maximum filename length after sanitization
 */
export const MAX_FILENAME_LENGTH = 80;

/**
 * Validates if a file's MIME type is in the allowed list
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
 * @returns true if file size is within limit, false otherwise
 */
export function validateFileSize(file: File, maxSizeBytes: number): boolean {
    if (!file || typeof file.size !== 'number') {
        return false;
    }
    return file.size > 0 && file.size <= maxSizeBytes;
}

/**
 * Checks if a buffer starts with any of the expected file signatures (magic bytes)
 * This prevents file extension spoofing attacks
 *
 * @param buffer - The file buffer to check
 * @param expectedSignatures - Array of expected signature buffers
 * @returns true if buffer starts with any expected signature, false otherwise
 */
export function checkMagicBytes(buffer: ArrayBuffer, expectedSignatures: readonly Buffer[]): boolean {
    if (!buffer || buffer.byteLength === 0) {
        return false;
    }

    const fileBuffer = Buffer.from(buffer);

    // Check if file starts with any of the expected signatures
    return expectedSignatures.some((signature) => {
        if (fileBuffer.length < signature.length) {
            return false;
        }

        // Compare the first bytes
        for (let i = 0; i < signature.length; i++) {
            if (fileBuffer[i] !== signature[i]) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Validates file content by checking magic bytes based on declared MIME type
 * 
 * @param buffer - The file buffer to validate
 * @param mimeType - The declared MIME type of the file
 * @returns true if magic bytes match the declared type, false otherwise
 */
export function validateFileContent(buffer: ArrayBuffer, mimeType: string): boolean {
    switch (mimeType) {
        case 'application/pdf':
            return checkMagicBytes(buffer, FILE_SIGNATURES.PDF);

        case 'application/msword':
            return checkMagicBytes(buffer, FILE_SIGNATURES.DOC);

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            // DOCX files are ZIP archives, so they start with ZIP signatures
            return checkMagicBytes(buffer, FILE_SIGNATURES.DOCX);

        default:
            return false;
    }
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
    // Replace any character that's not alphanumeric, dot, hyphen, or underscore with underscore
    let sanitizedName = name.replace(/[^a-zA-Z0-9._-]+/g, '_');

    // Remove leading/trailing underscores
    sanitizedName = sanitizedName.replace(/^_+|_+$/g, '');

    // If name is empty after sanitization, use default
    if (sanitizedName.length === 0) {
        sanitizedName = 'cv';
    }

    // Sanitize extension (remove any non-alphanumeric except the dot)
    let sanitizedExtension = extension.replace(/[^a-zA-Z0-9.]/g, '');

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

/**
 * Comprehensive file validation for CV uploads
 * Performs all security checks in one function
 * 
 * @param file - The file to validate
 * @param buffer - The file buffer for magic bytes checking
 * @returns Object with validation result and error message if invalid
 */
export async function validateCVFile(
    file: File,
    buffer: ArrayBuffer
): Promise<{ valid: boolean; error?: string }> {
    // Check file type
    if (!validateFileType(file, ALLOWED_CV_MIME_TYPES)) {
        return {
            valid: false,
            error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.',
        };
    }

    // Check file size
    if (!validateFileSize(file, MAX_CV_FILE_SIZE)) {
        return {
            valid: false,
            error: `File size exceeds the maximum limit of ${MAX_CV_FILE_SIZE / 1024 / 1024}MB.`,
        };
    }

    // Check magic bytes to prevent extension spoofing
    if (!validateFileContent(buffer, file.type)) {
        return {
            valid: false,
            error: 'File content does not match the declared file type. The file may be corrupted or tampered with.',
        };
    }

    return { valid: true };
}
