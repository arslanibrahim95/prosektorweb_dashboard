/**
 * Centralized Error Service
 * 
 * Proje genelinde hata oluşturma ve yönetimi için merkezi servis.
 * Tutarlı hata mesajları ve formatı sağlar.
 */

import { HttpError } from '../api/http';
import { ErrorCode, ErrorCodeToStatus } from './error-codes';
import { translateError } from './messages.tr';

/**
 * Error details tipi - Zod validasyon hataları için
 */
export type ErrorDetails = Record<string, string[]>;

/**
 * API Error body tipi
 */
export interface ApiErrorBody {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
}

/**
 * Hata oluşturma seçenekleri
 */
export interface CreateErrorOptions {
    /** Hata kodu */
    code: ErrorCode;
    /** Kullanıcıya gösterilecek özel mesaj (varsayılan: standart mesaj) */
    message?: string;
    /** Detaylı hata bilgisi (validasyon için) */
    details?: ErrorDetails;
    /** Orijinal hata (loglama için) */
    originalError?: unknown;
}

/**
 * Merkezi hata oluşturma fonksiyonu
 */
export function createError(options: CreateErrorOptions): HttpError {
    const status = ErrorCodeToStatus[options.code];
    const message = options.message ?? translateError(options.code);

    // Log the original error for debugging (in production, use proper logging)
    if (options.originalError && process.env.NODE_ENV === 'development') {
        console.error(`[Error ${options.code}]`, options.originalError);
    }

    return new HttpError(status, {
        code: options.code,
        message,
        ...(options.details && { details: options.details }),
    });
}

/**
 * Validasyon hatası oluştur
 */
export function createValidationError(
    message: string = 'Girdiğiniz bilgilerde hata var. Lütfen kontrol edin.',
    details?: ErrorDetails
): HttpError {
    return createError({
        code: 'VALIDATION_ERROR',
        message,
        details,
    });
}

/**
 * Yetkilendirme hatası oluştur
 */
export function createAuthError(
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NO_TENANT',
    message?: string
): HttpError {
    return createError({
        code,
        message,
    });
}

/**
 * Bulunamadı hatası oluştur
 */
export function createNotFoundError(
    resource: string = 'Kaynak',
    message?: string
): HttpError {
    return createError({
        code: 'NOT_FOUND',
        message: message ?? `${resource} bulunamadı.`,
    });
}

/**
 * Çakışma (conflict) hatası oluştur
 */
export function createConflictError(
    message: string = 'Bu işlem şu anda gerçekleştirilemiyor.',
    details?: ErrorDetails
): HttpError {
    return createError({
        code: 'CONFLICT',
        message,
        details,
    });
}

/**
 * İç sunucu hatası oluştur
 */
export function createInternalError(
    message: string = 'Bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
    originalError?: unknown
): HttpError {
    return createError({
        code: 'INTERNAL_ERROR',
        message,
        originalError,
    });
}

/**
 * Rate limit hatası oluştur
 */
export function createRateLimitError(
    message: string = 'Çok fazla istek gönderildi. Lütfen bekleyin.'
): HttpError {
    return createError({
        code: 'RATE_LIMITED',
        message,
    });
}

/**
 * Hata kodunun HTTP durumunu döndürür
 */
export function getErrorStatus(code: ErrorCode): number {
    return ErrorCodeToStatus[code] ?? 500;
}

/**
 * Hatanın client-side gösterilip gösterilmeyeceğini belirler
 */
export function isClientSafeError(code: ErrorCode): boolean {
    // Server errors should not expose details to client
    const serverErrors: ErrorCode[] = [
        'INTERNAL_ERROR',
        'DATABASE_ERROR',
        'UPLOAD_FAILED',
        'EXTERNAL_SERVICE_ERROR',
    ];
    return !serverErrors.includes(code);
}
