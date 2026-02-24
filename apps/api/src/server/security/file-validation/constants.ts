export const ALLOWED_CV_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const ALLOWED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;

export const MAX_CV_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const MIN_CV_FILE_SIZE = 10; // bytes
export const MAX_FILENAME_LENGTH = 80;
export const MAX_COMPRESSION_RATIO = 100;
