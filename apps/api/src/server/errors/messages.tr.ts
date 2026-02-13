/**
 * API Error Messages (Türkçe)
 * 
 * Kullanıcıya gösterilecek hata mesajları.
 * Teknik detaylar burada YER ALMAZ - sadece kullanıcı dostu mesajlar.
 * 
 * i18n yapısı: Her dil için ayrı dosya oluşturulabilir.
 */

import { ErrorCode } from './error-codes';

export const errorMessages: Record<ErrorCode, string> = {
    // === Authentication & Authorization ===
    UNAUTHORIZED: 'Oturumunuz geçersiz. Lütfen tekrar giriş yapın.',
    FORBIDDEN: 'Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor.',
    TOKEN_EXPIRED: 'Oturumunuz süresi doldu. Lütfen tekrar giriş yapın.',
    INVALID_TOKEN: 'Geçersiz oturum bilgisi. Lütfen tekrar giriş yapın.',
    NO_TENANT: 'Bu hesaba bağlı bir workspace bulunmuyor.',
    SESSION_EXPIRED: 'Oturumunuz süresi doldu. Lütfen tekrar giriş yapın.',
    SESSION_REFRESH_FAILED: 'Oturum yenilenirken hata oluştu.',
    REMEMBER_ME_TOKEN_INVALID: 'Beni hatırla bilgisi geçersiz.',
    CUSTOM_JWT_INVALID: 'Oturum bilgisi geçersiz.',
    CUSTOM_JWT_EXPIRED: 'Oturum süreniz doldu.',
    INVALID_CREDENTIALS: 'Email veya şifre hatalı.',

    // === Validation ===
    VALIDATION_ERROR: 'Girdiğiniz bilgilerde hata var. Lütfen kontrol edin.',
    INVALID_REQUEST_BODY: 'Geçersiz veri gönderimi. Lütfen formu kontrol edin.',
    INVALID_QUERY_PARAMS: 'Arama parametreleri geçersiz.',
    INVALID_UUID: 'Geçersiz kaynak referansı.',

    // === Not Found ===
    NOT_FOUND: 'Aradığınız kaynak bulunamadı.',
    SITE_NOT_FOUND: 'Site bulunamadı veya erişim izniniz yok.',
    PAGE_NOT_FOUND: 'Sayfa bulunamadı.',
    MODULE_NOT_FOUND: 'Modül bulunamadı.',
    USER_NOT_FOUND: 'Kullanıcı bulunamadı.',

    // === Business Logic ===
    CONFLICT: 'Bu işlem şu anda gerçekleştirilemiyor. Değişiklikleri kontrol edin.',
    INVALID_STATE: 'İşlem şu anda gerçekleştirilemiyor.',
    MODULE_DISABLED: 'Bu modül aktif değil.',
    RESOURCE_LOCKED: 'Kaynak şu anda kullanımda. Lütfen daha sonra tekrar deneyin.',
    SLUG_EXISTS: 'Bu URL adresi zaten kullanılıyor. Farklı bir adres seçin.',

    // === Server Errors ===
    INTERNAL_ERROR: 'Bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
    DATABASE_ERROR: 'Veritabanı işlemi başarısız. Lütfen daha sonra tekrar deneyin.',
    UPLOAD_FAILED: 'Dosya yükleme başarısız. Lütfen tekrar deneyin.',
    EXTERNAL_SERVICE_ERROR: 'Harici servis hatası. Lütfen daha sonra tekrar deneyin.',

    // === Rate Limiting ===
    RATE_LIMITED: 'Çok fazla istek gönderildi. Lütfen bekleyin.',
    SUSPICIOUS_ACTIVITY: 'Şüpheli aktivite tespit edildi.',
};

/**
 * Hata mesajını çevirir
 */
export function translateError(code: ErrorCode, lang: 'tr' | 'en' = 'tr'): string {
    if (lang === 'en') {
        // English fallback messages
        return englishErrorMessages[code] ?? errorMessages[code];
    }
    return errorMessages[code];
}

// English fallback messages
const englishErrorMessages: Partial<Record<ErrorCode, string>> = {
    UNAUTHORIZED: 'Your session is invalid. Please log in again.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    INVALID_TOKEN: 'Invalid session information. Please log in again.',
    NO_TENANT: 'No workspace found associated with this account.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    SESSION_REFRESH_FAILED: 'Failed to refresh session.',
    REMEMBER_ME_TOKEN_INVALID: 'Remember me information is invalid.',
    CUSTOM_JWT_INVALID: 'Invalid session information.',
    CUSTOM_JWT_EXPIRED: 'Your session has expired.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    VALIDATION_ERROR: 'The information you entered contains errors. Please check.',
    NOT_FOUND: 'The requested resource was not found.',
    INTERNAL_ERROR: 'An error occurred. Please try again later.',
    RATE_LIMITED: 'Too many requests. Please wait.',
};
