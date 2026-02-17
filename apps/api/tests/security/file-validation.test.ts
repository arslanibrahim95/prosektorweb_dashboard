/**
 * File Validation Security Tests
 * 
 * Tests for comprehensive file validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
    validateFileType,
    validateFileSize,
    checkMagicBytes,
    validateFileContent,
    sanitizeFilename,
    validateCVFile,
    ALLOWED_CV_MIME_TYPES,
    MAX_CV_FILE_SIZE,
} from '@/server/security/file-validation';

describe('File Validation Security', () => {
    describe('validateFileType', () => {
        it('should accept PDF files', () => {
            const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            expect(validateFileType(file, ALLOWED_CV_MIME_TYPES)).toBe(true);
        });

        it('should accept DOC files', () => {
            const file = new File(['test'], 'test.doc', { type: 'application/msword' });
            expect(validateFileType(file, ALLOWED_CV_MIME_TYPES)).toBe(true);
        });

        it('should accept DOCX files', () => {
            const file = new File(['test'], 'test.docx', {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            expect(validateFileType(file, ALLOWED_CV_MIME_TYPES)).toBe(true);
        });

        it('should reject executable files', () => {
            const file = new File(['test'], 'malware.exe', { type: 'application/x-msdownload' });
            expect(validateFileType(file, ALLOWED_CV_MIME_TYPES)).toBe(false);
        });

        it('should reject image files', () => {
            const file = new File(['test'], 'image.jpg', { type: 'image/jpeg' });
            expect(validateFileType(file, ALLOWED_CV_MIME_TYPES)).toBe(false);
        });

        it('should reject files with no type', () => {
            const file = new File(['test'], 'unknown', { type: '' });
            expect(validateFileType(file, ALLOWED_CV_MIME_TYPES)).toBe(false);
        });
    });

    describe('validateFileSize', () => {
        it('should accept files within size limit', () => {
            const file = new File(['x'.repeat(1024)], 'small.pdf', { type: 'application/pdf' });
            expect(validateFileSize(file, MAX_CV_FILE_SIZE)).toBe(true);
        });

        it('should reject files exceeding size limit', () => {
            const largeContent = 'x'.repeat(MAX_CV_FILE_SIZE + 1);
            const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
            expect(validateFileSize(file, MAX_CV_FILE_SIZE)).toBe(false);
        });

        it('should reject empty files', () => {
            const file = new File([], 'empty.pdf', { type: 'application/pdf' });
            expect(validateFileSize(file, MAX_CV_FILE_SIZE)).toBe(false);
        });

        it('should accept file at exact size limit', () => {
            const content = 'x'.repeat(MAX_CV_FILE_SIZE);
            const file = new File([content], 'exact.pdf', { type: 'application/pdf' });
            expect(validateFileSize(file, MAX_CV_FILE_SIZE)).toBe(true);
        });
    });

    describe('checkMagicBytes', () => {
        it('should detect PDF signature', () => {
            const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
            const pdfContent = Buffer.concat([pdfSignature, Buffer.from('rest of file')]);
            // Convert to ArrayBuffer properly
            const arrayBuffer = pdfContent.buffer.slice(pdfContent.byteOffset, pdfContent.byteOffset + pdfContent.byteLength);
            expect(checkMagicBytes(arrayBuffer, [pdfSignature])).toBe(true);
        });

        it('should detect DOC signature', () => {
            const docSignature = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
            const docContent = Buffer.concat([docSignature, Buffer.from('rest of file')]);
            const arrayBuffer = docContent.buffer.slice(docContent.byteOffset, docContent.byteOffset + docContent.byteLength);
            expect(checkMagicBytes(arrayBuffer, [docSignature])).toBe(true);
        });

        it('should detect DOCX signature (ZIP)', () => {
            const zipSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // PK..
            const docxContent = Buffer.concat([zipSignature, Buffer.from('rest of file')]);
            const arrayBuffer = docxContent.buffer.slice(docxContent.byteOffset, docxContent.byteOffset + docxContent.byteLength);
            expect(checkMagicBytes(arrayBuffer, [zipSignature])).toBe(true);
        });

        it('should reject files with wrong signature', () => {
            const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]);
            const wrongContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG signature
            const arrayBuffer = wrongContent.buffer.slice(wrongContent.byteOffset, wrongContent.byteOffset + wrongContent.byteLength);
            expect(checkMagicBytes(arrayBuffer, [pdfSignature])).toBe(false);
        });

        it('should reject empty buffers', () => {
            const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]);
            const emptyBuffer = Buffer.from([]);
            const arrayBuffer = emptyBuffer.buffer.slice(emptyBuffer.byteOffset, emptyBuffer.byteOffset + emptyBuffer.byteLength);
            expect(checkMagicBytes(arrayBuffer, [pdfSignature])).toBe(false);
        });

        it('should match any of multiple signatures', () => {
            const sig1 = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
            const sig2 = Buffer.from([0x50, 0x4B, 0x05, 0x06]);
            const content = Buffer.concat([sig2, Buffer.from('rest')]);
            const arrayBuffer = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength);
            expect(checkMagicBytes(arrayBuffer, [sig1, sig2])).toBe(true);
        });
    });

    describe('validateFileContent', () => {
        it('should validate PDF content', () => {
            const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]);
            const pdfContent = Buffer.concat([pdfSignature, Buffer.from('-1.4')]);
            const arrayBuffer = pdfContent.buffer.slice(pdfContent.byteOffset, pdfContent.byteOffset + pdfContent.byteLength);
            const result = validateFileContent(arrayBuffer, 'application/pdf');
            expect(result.valid).toBe(true);
        });

        it('should validate DOC content', () => {
            const docSignature = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
            const docContent = Buffer.concat([docSignature, Buffer.from('rest')]);
            const arrayBuffer = docContent.buffer.slice(docContent.byteOffset, docContent.byteOffset + docContent.byteLength);
            const result = validateFileContent(arrayBuffer, 'application/msword');
            expect(result.valid).toBe(true);
        });

        it('should validate DOCX content', () => {
            const zipSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
            const docxContent = Buffer.concat([zipSignature, Buffer.from('rest')]);
            const arrayBuffer = docxContent.buffer.slice(docxContent.byteOffset, docxContent.byteOffset + docxContent.byteLength);
            const result = validateFileContent(
                arrayBuffer,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
            expect(result.valid).toBe(true);
        });

        it('should reject PDF with wrong magic bytes', () => {
            const wrongContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG
            const arrayBuffer = wrongContent.buffer.slice(wrongContent.byteOffset, wrongContent.byteOffset + wrongContent.byteLength);
            const result = validateFileContent(arrayBuffer, 'application/pdf');
            expect(result.valid).toBe(false);
        });

        it('should reject unknown MIME types', () => {
            const content = Buffer.from([0x25, 0x50, 0x44, 0x46]);
            const arrayBuffer = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength);
            const result = validateFileContent(arrayBuffer, 'application/unknown');
            expect(result.valid).toBe(false);
        });
    });

    describe('sanitizeFilename', () => {
        it('should preserve valid filenames', () => {
            expect(sanitizeFilename('resume.pdf')).toBe('resume.pdf');
            expect(sanitizeFilename('my-cv_2024.docx')).toBe('my-cv_2024.docx');
        });

        it('should remove special characters', () => {
            expect(sanitizeFilename('my resume!@#$.pdf')).toBe('my_resume.pdf');
            expect(sanitizeFilename('cv<script>.pdf')).toBe('cv_script.pdf');
        });

        it('should handle unicode characters', () => {
            expect(sanitizeFilename('özgeçmiş.pdf')).toBe('zge_mi.pdf');
            expect(sanitizeFilename('简历.pdf')).toBe('cv.pdf'); // Falls back to 'cv' when name is empty after sanitization
        });

        it('should limit filename length', () => {
            const longName = 'a'.repeat(100) + '.pdf';
            const result = sanitizeFilename(longName);
            expect(result.length).toBeLessThanOrEqual(80);
            expect(result.endsWith('.pdf')).toBe(true);
        });

        it('should handle filenames without extensions', () => {
            expect(sanitizeFilename('resume')).toBe('resume');
            expect(sanitizeFilename('my cv')).toBe('my_cv');
        });

        it('should handle empty or invalid filenames', () => {
            expect(sanitizeFilename('')).toBe('cv');
            expect(sanitizeFilename('   ')).toBe('cv');
            expect(sanitizeFilename('!!!')).toBe('cv');
        });

        it('should remove leading/trailing underscores', () => {
            expect(sanitizeFilename('___resume___.pdf')).toBe('resume.pdf');
        });

        it('should handle multiple dots', () => {
            expect(sanitizeFilename('my.resume.final.pdf')).toBe('my.resume.final.pdf');
        });

        it('should handle path traversal attempts', () => {
            expect(sanitizeFilename('../../../etc/passwd')).toBe('.._.._..etcpasswd');
            expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('.._..windowssystem32');
        });
    });

    describe('validateCVFile (integration)', () => {
        it('should accept valid PDF file', async () => {
            const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
            const file = new File([pdfSignature], 'resume.pdf', { type: 'application/pdf' });
            const arrayBuffer = pdfSignature.buffer.slice(pdfSignature.byteOffset, pdfSignature.byteOffset + pdfSignature.byteLength);
            const result = await validateCVFile(file, arrayBuffer);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should reject file with wrong type', async () => {
            const content = Buffer.from('test content');
            const file = new File([content], 'image.jpg', { type: 'image/jpeg' });
            const result = await validateCVFile(file, content.buffer);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('file type');
        });

        it('should reject oversized file', async () => {
            const largeContent = Buffer.alloc(MAX_CV_FILE_SIZE + 1);
            const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
            const result = await validateCVFile(file, largeContent.buffer);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('size');
        });

        it('should reject file with mismatched content (extension spoofing)', async () => {
            const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG magic bytes
            const file = new File([jpegSignature], 'fake.pdf', { type: 'application/pdf' });
            const result = await validateCVFile(file, jpegSignature.buffer);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('content');
        });

        it('should accept valid DOCX file', async () => {
            const zipSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
            const file = new File([zipSignature], 'resume.docx', {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            const arrayBuffer = zipSignature.buffer.slice(zipSignature.byteOffset, zipSignature.byteOffset + zipSignature.byteLength);
            const result = await validateCVFile(file, arrayBuffer);
            expect(result.valid).toBe(true);
        });

        it('should accept valid DOC file', async () => {
            const docSignature = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
            const file = new File([docSignature], 'resume.doc', { type: 'application/msword' });
            const arrayBuffer = docSignature.buffer.slice(docSignature.byteOffset, docSignature.byteOffset + docSignature.byteLength);
            const result = await validateCVFile(file, arrayBuffer);
            expect(result.valid).toBe(true);
        });
    });
});
