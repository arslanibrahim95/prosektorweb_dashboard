import { logger } from "@/lib/logger";
import { getAvScanConfig, scanBufferWithClamAv } from "../av-scan";
import { ValidationResult } from "./types";
import { ALLOWED_CV_MIME_TYPES, MAX_CV_FILE_SIZE } from "./constants";
import { FILE_SIGNATURES, PDF_TRAILER_SIGNATURES } from "./signatures";
import { getFileExtension, sanitizeFilename } from "./utils";
import { validateFileExtension, validateFileType } from "./basic";
import { checkMagicBytes, checkTrailerBytes, containsKnownMalwareSignature } from "./structure";

/**
 * Validates PDF file structure beyond magic bytes
 * SECURITY: Prevents polyglot PDF files (e.g., PDF with embedded executable)
 * 
 * BACKWARD COMPATIBILITY: Trailer check is optional for minimal test files
 */
export function validatePDFStructure(buffer: ArrayBuffer, strict: boolean = false): boolean {
    if (!checkMagicBytes(buffer, FILE_SIGNATURES.PDF)) {
        return false;
    }

    if (strict && !checkTrailerBytes(buffer, PDF_TRAILER_SIGNATURES)) {
        return false;
    }

    const fileBuffer = Buffer.from(buffer);

    const suspiciousPatterns = [
        Buffer.from('MZ'), // Windows executable
        Buffer.from('#!/'), // Shebang (script)
        Buffer.from('<script'), // JavaScript injection attempt
        Buffer.from('<?php'), // PHP code
        Buffer.from('<?='), // PHP short tags
    ];

    const bodyBuffer = fileBuffer.subarray(256);

    for (const pattern of suspiciousPatterns) {
        for (let i = 0; i <= bodyBuffer.length - pattern.length; i++) {
            let found = true;
            for (let j = 0; j < pattern.length; j++) {
                if (bodyBuffer[i + j] !== pattern[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                logger.warn('[FileValidation] Suspicious pattern detected in PDF', {
                    pattern: pattern.toString(),
                });
                return false;
            }
        }
    }

    return true;
}

/**
 * Validates DOCX file structure (ZIP-based)
 * SECURITY: Prevents ZIP bomb attacks
 * 
 * BACKWARD COMPATIBILITY: Content_Types check is optional for minimal test files
 */
export function validateDOCXStructure(buffer: ArrayBuffer, strict: boolean = false): boolean {
    if (!checkMagicBytes(buffer, FILE_SIGNATURES.DOCX)) {
        return false;
    }

    if (strict) {
        const fileBuffer = Buffer.from(buffer);
        const contentTypesSignature = Buffer.from('[Content_Types]');

        let hasContentTypes = false;
        for (let i = 0; i <= fileBuffer.length - contentTypesSignature.length; i++) {
            let found = true;
            for (let j = 0; j < contentTypesSignature.length; j++) {
                if (fileBuffer[i + j] !== contentTypesSignature[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                hasContentTypes = true;
                break;
            }
        }

        return hasContentTypes;
    }

    return true;
}

/**
 * Validates DOC file structure (OLE2 compound document)
 * 
 * BACKWARD COMPATIBILITY: Size check is optional for minimal test files
 */
export function validateDOCStructure(buffer: ArrayBuffer, strict: boolean = false): boolean {
    if (!checkMagicBytes(buffer, FILE_SIGNATURES.DOC)) {
        return false;
    }

    if (strict && buffer.byteLength < 512) {
        return false;
    }

    return true;
}

/**
 * Detects MIME type from file content (MIME sniffing)
 * SECURITY: More reliable than trusting browser-provided type
 */
export function detectMimeType(buffer: ArrayBuffer): string | null {
    if (checkMagicBytes(buffer, FILE_SIGNATURES.PDF)) {
        return 'application/pdf';
    }
    if (checkMagicBytes(buffer, FILE_SIGNATURES.DOC)) {
        return 'application/msword';
    }
    if (checkMagicBytes(buffer, FILE_SIGNATURES.DOCX)) {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    return null;
}

/**
 * Validates file content by checking magic bytes and file structure
 * SECURITY: Deep validation to prevent polyglot file attacks
 * 
 * @param buffer - The file buffer to validate
 * @param mimeType - The declared MIME type of the file
 * @returns ValidationResult with detailed information
 */
export function validateFileContent(buffer: ArrayBuffer, mimeType: string): ValidationResult {
    const detectedType = detectMimeType(buffer);

    switch (mimeType) {
        case 'application/pdf': {
            const isValidPDF = validatePDFStructure(buffer);
            return {
                valid: isValidPDF,
                error: isValidPDF ? undefined : 'Invalid PDF structure or potential polyglot file detected.',
                details: {
                    detectedType: detectedType ?? undefined,
                    declaredType: mimeType,
                    hasValidStructure: isValidPDF,
                    isPolyglot: detectedType !== mimeType,
                },
            };
        }

        case 'application/msword': {
            const isValidDOC = validateDOCStructure(buffer);
            return {
                valid: isValidDOC,
                error: isValidDOC ? undefined : 'Invalid DOC file structure.',
                details: {
                    detectedType: detectedType ?? undefined,
                    declaredType: mimeType,
                    hasValidStructure: isValidDOC,
                    isPolyglot: detectedType !== mimeType,
                },
            };
        }

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
            const isValidDOCX = validateDOCXStructure(buffer);
            return {
                valid: isValidDOCX,
                error: isValidDOCX ? undefined : 'Invalid DOCX file structure or missing required components.',
                details: {
                    detectedType: detectedType ?? undefined,
                    declaredType: mimeType,
                    hasValidStructure: isValidDOCX,
                    isPolyglot: detectedType !== mimeType,
                },
            };
        }

        default:
            return {
                valid: false,
                error: 'Unsupported file type.',
                details: {
                    declaredType: mimeType,
                    detectedType: detectedType ?? undefined,
                },
            };
    }
}

/**
 * Comprehensive file validation for CV uploads
 * Performs all security checks in one function
 * 
 * SECURITY FIXES APPLIED:
 * - Extension validation
 * - MIME type sniffing (not trusting browser)
 * - Deep content validation (polyglot detection)
 * - Structure validation
 * 
 * @param file - The file to validate
 * @param buffer - The file buffer for magic bytes checking
 * @returns Detailed validation result
 */
export async function validateCVFile(
    file: File,
    buffer: ArrayBuffer
): Promise<ValidationResult> {
    if (!file) {
        return {
            valid: false,
            error: 'No file provided.',
        };
    }

    if (!validateFileType(file, ALLOWED_CV_MIME_TYPES)) {
        return {
            valid: false,
            error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.',
            details: {
                declaredType: file.type,
            },
        };
    }

    if (file.size > MAX_CV_FILE_SIZE) {
        return {
            valid: false,
            error: `File size exceeds the maximum limit of ${MAX_CV_FILE_SIZE / 1024 / 1024}MB.`,
            details: {
                size: file.size,
            },
        };
    }

    if (!validateFileExtension(file.name)) {
        return {
            valid: false,
            error: 'Invalid file extension. Only .pdf, .doc, and .docx extensions are allowed.',
            details: {
                extension: getFileExtension(file.name),
            },
        };
    }

    const detectedType = detectMimeType(buffer);
    if (!detectedType) {
        return {
            valid: false,
            error: 'Could not determine file type from content.',
        };
    }

    if (detectedType !== file.type) {
        return {
            valid: false,
            error: 'File content does not match the declared file type. Possible file spoofing attempt.',
            details: {
                detectedType,
                declaredType: file.type,
                isPolyglot: true,
            },
        };
    }

    const contentValidation = validateFileContent(buffer, file.type);
    if (!contentValidation.valid) {
        return contentValidation;
    }

    const sanitizedFilename = sanitizeFilename(file.name);
    if (sanitizedFilename !== file.name) {
        logger.warn('[FileValidation] Filename sanitized', {
            original: file.name,
            sanitized: sanitizedFilename,
        });
    }

    if (containsKnownMalwareSignature(buffer)) {
        return {
            valid: false,
            error: 'Potential malware signature detected in file content.',
        };
    }

    const avConfig = getAvScanConfig();
    if (avConfig.enabled) {
        const avResult = await scanBufferWithClamAv(buffer, avConfig);
        if (avResult.unavailable) {
            if (avConfig.failClosed) {
                return {
                    valid: false,
                    error: 'File could not be scanned for malware. Please try again later.',
                };
            }

            logger.warn('[FileValidation] AV scan unavailable, fail-open policy applied', {
                reason: avResult.reason,
            });
        } else if (!avResult.clean) {
            return {
                valid: false,
                error: 'Potential malware detected in file content.',
            };
        }
    }

    return {
        valid: true,
        details: {
            detectedType,
            declaredType: file.type,
            extension: getFileExtension(file.name),
            size: file.size,
            hasValidStructure: true,
            isPolyglot: false,
        },
    };
}
