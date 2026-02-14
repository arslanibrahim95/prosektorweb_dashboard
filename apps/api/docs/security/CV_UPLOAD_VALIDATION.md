# CV Upload File Validation Security

## Overview

This document describes the comprehensive file validation security measures implemented for the CV upload endpoint in the ProsektorWeb Dashboard.

## Security Vulnerability Fixed

**Issue**: The CV file upload endpoint at [`/api/public/hr/apply`](../../src/app/api/public/hr/apply/route.ts) lacked comprehensive file validation, potentially allowing malicious file uploads through:
- Extension spoofing (e.g., renaming `malware.exe` to `malware.pdf`)
- Oversized file uploads
- Unsupported file types
- Path traversal attacks via filenames

## Implementation

### 1. File Validation Utility

Created a reusable security utility at [`apps/api/src/server/security/file-validation.ts`](../../src/server/security/file-validation.ts) with the following functions:

#### `validateFileType(file: File, allowedTypes: string[]): boolean`
- Validates file MIME type against a whitelist
- Only allows: PDF, DOC, DOCX files
- Rejects all other file types

#### `validateFileSize(file: File, maxSizeBytes: number): boolean`
- Enforces maximum file size limit of 5MB
- Rejects empty files
- Prevents resource exhaustion attacks

#### `checkMagicBytes(buffer: ArrayBuffer, expectedSignatures: Buffer[]): boolean`
- Verifies file content by checking magic bytes (file signatures)
- Prevents extension spoofing attacks
- Validates actual file content matches declared MIME type

**Supported File Signatures:**
- **PDF**: `%PDF` (0x25 0x50 0x44 0x46)
- **DOC**: OLE2 signature (0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1)
- **DOCX**: ZIP signature (0x50 0x4B 0x03 0x04, 0x50 0x4B 0x05 0x06, 0x50 0x4B 0x07 0x08)

#### `sanitizeFilename(filename: string): string`
- Removes special characters and path traversal sequences
- Limits filename length to 80 characters
- Preserves file extension
- Prevents directory traversal attacks
- Falls back to "cv" for invalid filenames

#### `validateCVFile(file: File, buffer: ArrayBuffer): Promise<{valid: boolean; error?: string}>`
- Comprehensive validation combining all checks
- Returns detailed error messages for failures
- Single function for complete file validation

### 2. Error Codes

Added new error codes to [`apps/api/src/server/errors/error-codes.ts`](../../src/server/errors/error-codes.ts):

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `INVALID_FILE_TYPE` | 400 | File type not in whitelist |
| `FILE_TOO_LARGE` | 413 | File exceeds 5MB limit |
| `INVALID_FILE_CONTENT` | 400 | Magic bytes don't match declared type |

### 3. Error Messages

Added user-friendly error messages in both Turkish and English to [`apps/api/src/server/errors/messages.tr.ts`](../../src/server/errors/messages.tr.ts):

**Turkish:**
- `INVALID_FILE_TYPE`: "Geçersiz dosya türü. Sadece PDF, DOC ve DOCX dosyaları kabul edilir."
- `FILE_TOO_LARGE`: "Dosya boyutu çok büyük. Maksimum 5MB yükleyebilirsiniz."
- `INVALID_FILE_CONTENT`: "Dosya içeriği geçersiz veya bozuk. Lütfen geçerli bir dosya yükleyin."

**English:**
- `INVALID_FILE_TYPE`: "Invalid file type. Only PDF, DOC, and DOCX files are allowed."
- `FILE_TOO_LARGE`: "File size is too large. Maximum 5MB allowed."
- `INVALID_FILE_CONTENT`: "File content is invalid or corrupted. Please upload a valid file."

### 4. Updated Route

Modified [`apps/api/src/app/api/public/hr/apply/route.ts`](../../src/app/api/public/hr/apply/route.ts) to:
1. Import validation utilities
2. Convert uploaded file to ArrayBuffer
3. Perform comprehensive validation before storage
4. Use specific error codes for different validation failures
5. Reuse buffer to avoid reading file twice
6. Use secure filename sanitization

## Validation Flow

```
1. User uploads CV file
   ↓
2. Basic Zod schema validation (file instance check)
   ↓
3. Convert file to ArrayBuffer
   ↓
4. validateCVFile() performs:
   - File type whitelist check
   - File size limit check (5MB)
   - Magic bytes verification
   ↓
5. If validation fails:
   - Return specific error code
   - Return user-friendly error message
   ↓
6. If validation passes:
   - Sanitize filename
   - Upload to Supabase storage
   - Create database record
```

## Security Benefits

### 1. **Extension Spoofing Prevention**
Magic bytes verification ensures that a file claiming to be a PDF actually contains PDF content, preventing attackers from uploading executables disguised as documents.

### 2. **File Type Whitelist**
Only PDF, DOC, and DOCX files are accepted, reducing attack surface significantly.

### 3. **Size Limit Enforcement**
5MB limit prevents:
- Resource exhaustion attacks
- Storage abuse
- Denial of service attempts

### 4. **Filename Sanitization**
Prevents:
- Path traversal attacks (`../../../etc/passwd`)
- Special character injection
- Filename-based exploits

### 5. **Proper Error Handling**
- Specific error codes for different failures
- User-friendly messages in multiple languages
- No sensitive information leakage

## Testing

Comprehensive test suite at [`apps/api/tests/security/file-validation.test.ts`](../../tests/security/file-validation.test.ts) with 36 tests covering:

- File type validation (6 tests)
- File size validation (4 tests)
- Magic bytes detection (6 tests)
- File content validation (5 tests)
- Filename sanitization (9 tests)
- Integration tests (6 tests)

**Test Coverage:**
- ✅ Valid PDF, DOC, DOCX files
- ✅ Invalid file types (executables, images)
- ✅ Oversized files
- ✅ Extension spoofing attempts
- ✅ Unicode characters in filenames
- ✅ Path traversal attempts
- ✅ Empty files
- ✅ Special characters in filenames

## Usage Example

```typescript
import { validateCVFile, sanitizeFilename } from '@/server/security/file-validation';

// In your route handler
const cvFile = formData.get('cv_file') as File;
const buffer = await cvFile.arrayBuffer();

// Validate file
const result = await validateCVFile(cvFile, buffer);
if (!result.valid) {
  throw new HttpError(400, {
    code: ErrorCodes.INVALID_FILE_CONTENT,
    message: result.error,
  });
}

// Sanitize filename
const safeName = sanitizeFilename(cvFile.name);
```

## Configuration

Constants defined in [`file-validation.ts`](../../src/server/security/file-validation.ts):

```typescript
export const ALLOWED_CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_CV_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILENAME_LENGTH = 80;
```

## Future Enhancements

Potential improvements for future iterations:

1. **Virus Scanning**: Integrate with ClamAV or similar for malware detection
2. **Content Analysis**: Validate document structure (e.g., PDF structure validation)
3. **Rate Limiting**: Per-user upload limits
4. **File Quarantine**: Temporary storage before final validation
5. **Audit Logging**: Log all upload attempts for security monitoring
6. **Additional Formats**: Support for RTF, TXT if needed

## References

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [File Signature Database](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [CWE-434: Unrestricted Upload of File with Dangerous Type](https://cwe.mitre.org/data/definitions/434.html)

## Compliance

This implementation addresses:
- **OWASP Top 10**: A05:2021 – Security Misconfiguration
- **OWASP Top 10**: A08:2021 – Software and Data Integrity Failures
- **CWE-434**: Unrestricted Upload of File with Dangerous Type
- **CWE-22**: Improper Limitation of a Pathname to a Restricted Directory

## Maintenance

- Review allowed file types quarterly
- Update magic bytes signatures as needed
- Monitor for new attack vectors
- Keep error messages user-friendly and informative
- Regularly review and update tests
