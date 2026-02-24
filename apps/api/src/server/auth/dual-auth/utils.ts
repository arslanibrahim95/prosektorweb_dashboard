import { HttpError } from '../../api/http';

/**
 * Extracts Bearer token from request headers.
 *
 * SECURITY: Does NOT inspect/decode the token payload before verification.
 */
export function extractBearerToken(req: Request): string | null {
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) return null;

    const MAX_TOKEN_LENGTH = 8 * 1024;
    if (authHeader.length > MAX_TOKEN_LENGTH + 20) return null;

    const parts = authHeader.split(' ');
    const firstPart = parts[0];
    const secondPart = parts[1];
    if (parts.length !== 2 || !firstPart || firstPart.toLowerCase() !== 'bearer') return null;
    if (!secondPart) return null;

    const token = secondPart;
    if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null;
    if (token.split('.').length !== 3) return null;

    return token;
}

/**
 * SECURITY: Adds random jitter to prevent timing attacks.
 * SECURITY FIX: Increased jitter range to be more effective against timing attacks.
 * Network latency typically ranges 20-200ms, so 100-300ms jitter provides better protection.
 */
export function addJitter(minMs: number = 100, maxMs: number = 300): Promise<void> {
    const jitter = Math.random() * (maxMs - minMs) + minMs;
    return new Promise(resolve => setTimeout(resolve, jitter));
}

/**
 * SECURITY: Normalizes execution time to prevent timing attacks.
 * SECURITY FIX: Increased minimum duration to 300ms for better protection.
 */
export async function withTimingNormalization<T>(
    fn: () => Promise<T>,
    minDurationMs: number = 300
): Promise<T> {
    const start = performance.now();
    try {
        const result = await fn();
        const elapsed = performance.now() - start;
        // Always add minimum delay to prevent timing analysis
        const delay = Math.max(0, minDurationMs - elapsed);
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        return result;
    } catch (error) {
        const elapsed = performance.now() - start;
        // Always add minimum delay even on error
        const delay = Math.max(0, minDurationMs - elapsed);
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        throw error;
    }
}

export function shouldFallbackToSupabase(error: unknown): boolean {
    if (error instanceof HttpError) {
        return error.code === 'CUSTOM_JWT_INVALID' || error.code === 'CUSTOM_JWT_EXPIRED';
    }

    if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = (error as { code?: unknown }).code;
        return code === 'CUSTOM_JWT_INVALID' || code === 'CUSTOM_JWT_EXPIRED';
    }

    if (error instanceof Error) {
        const jwtErrorNames = [
            'JWSSignatureVerificationFailed',
            'JWSInvalid',
            'JWTInvalid',
        ];
        return jwtErrorNames.includes(error.name);
    }

    return false;
}
