/**
 * Security Module Exports
 * 
 * Central export point for all security-related utilities
 */

export {
    validateFileType,
    validateFileSize,
    checkMagicBytes,
    validateFileContent,
    sanitizeFilename,
    validateCVFile,
    ALLOWED_CV_MIME_TYPES,
    MAX_CV_FILE_SIZE,
    MAX_FILENAME_LENGTH,
} from './file-validation';
