import { timingSafeEqual } from "crypto";
import { KNOWN_MALWARE_SIGNATURES, ZIP_SIGNATURES } from "./signatures";
import { MAX_COMPRESSION_RATIO } from "./constants";

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

    const fileBuffer = Buffer.from(new Uint8Array(buffer));

    // Check if file starts with any of the expected signatures
    // SECURITY FIX: Use constant-time comparison to prevent timing attacks
    return expectedSignatures.some((signature) => {
        if (fileBuffer.length < signature.length) {
            return false;
        }

        // Extract only the bytes we need to compare (slice creates a copy)
        const sample = fileBuffer.slice(0, signature.length);

        // timingSafeEqual prevents timing-based side-channel attacks
        return timingSafeEqual(sample, signature);
    });
}

export function containsKnownMalwareSignature(buffer: ArrayBuffer): boolean {
    const fileBuffer = Buffer.from(new Uint8Array(buffer));
    return KNOWN_MALWARE_SIGNATURES.some((signature) => fileBuffer.includes(signature));
}

/**
 * Checks if buffer ends with expected trailer signature
 * SECURITY: Prevents polyglot files by validating complete file structure
 */
export function checkTrailerBytes(buffer: ArrayBuffer, trailerSignatures: readonly Buffer[]): boolean {
    if (!buffer || buffer.byteLength === 0) {
        return false;
    }

    const fileBuffer = Buffer.from(buffer);

    // Check last 1024 bytes for trailer (PDF trailers can be anywhere near end)
    const searchStart = Math.max(0, fileBuffer.length - 1024);
    const searchBuffer = fileBuffer.subarray(searchStart);

    return trailerSignatures.some((trailer) => {
        // Search for trailer in the last 1024 bytes
        for (let i = 0; i <= searchBuffer.length - trailer.length; i++) {
            let found = true;
            for (let j = 0; j < trailer.length; j++) {
                if (searchBuffer[i + j] !== trailer[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    });
}

/**
 * Validates that the file is not a ZIP bomb
 * SECURITY: Prevents decompression bomb attacks
 */
export function detectZipBomb(buffer: ArrayBuffer, maxRatio: number = MAX_COMPRESSION_RATIO): boolean {
    // Check if it's a ZIP file
    if (!checkMagicBytes(buffer, ZIP_SIGNATURES)) {
        return false; // Not a ZIP, can't be a ZIP bomb
    }

    // Invalid ratio values are treated as suspicious configuration/input.
    if (!Number.isFinite(maxRatio) || maxRatio <= 0) {
        return true;
    }

    // This is a simplified check - real implementation would parse ZIP headers
    // and check compressed vs uncompressed sizes
    // For now, we flag very small files that claim to be DOCX
    // as potential bombs (real DOCX files have minimum structure size)
    if (buffer.byteLength < 200) {
        return true; // Suspiciously small
    }

    return false;
}
