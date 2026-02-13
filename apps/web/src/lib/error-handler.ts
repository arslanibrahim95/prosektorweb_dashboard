import { WifiOff, Lock, ServerCrash, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

/**
 * Maps API error codes to user-friendly Turkish messages
 */
const errorMessages: Record<string, { title: string; message: string; icon: typeof AlertTriangle }> = {
  // Auth
  UNAUTHORIZED: {
    title: 'Yetkisiz erişim',
    message: 'Lütfen tekrar giriş yapın.',
    icon: Lock,
  },
  FORBIDDEN: {
    title: 'Erişim reddedildi',
    message: 'Bu işlem için yetkiniz bulunmuyor.',
    icon: ShieldAlert,
  },
  SESSION_EXPIRED: {
    title: 'Oturum süresi doldu',
    message: 'Güvenliğiniz için tekrar giriş yapın.',
    icon: Lock,
  },
  TOKEN_EXPIRED: {
    title: 'Oturum süresi doldu',
    message: 'Lütfen sayfayı yenileyip tekrar giriş yapın.',
    icon: Lock,
  },
  INVALID_CREDENTIALS: {
    title: 'Hatalı bilgiler',
    message: 'Email veya şifre yanlış. Lütfen kontrol edip tekrar deneyin.',
    icon: Lock,
  },

  // Validation
  VALIDATION_ERROR: {
    title: 'Geçersiz veri',
    message: 'Lütfen girdiğiniz bilgileri kontrol edin.',
    icon: AlertTriangle,
  },
  INVALID_REQUEST_BODY: {
    title: 'Geçersiz istek',
    message: 'Gönderilen veriler hatalı. Lütfen formu kontrol edin.',
    icon: AlertTriangle,
  },

  // Not Found
  NOT_FOUND: {
    title: 'Bulunamadı',
    message: 'Aradığınız kayıt bulunamadı veya silinmiş olabilir.',
    icon: AlertTriangle,
  },
  SITE_NOT_FOUND: {
    title: 'Site bulunamadı',
    message: 'İstenen site bulunamadı. Lütfen site seçiminizi kontrol edin.',
    icon: AlertTriangle,
  },

  // Business Logic
  CONFLICT: {
    title: 'Çakışma',
    message: 'Bu kayıt zaten mevcut veya başka bir kullanıcı tarafından değiştirilmiş.',
    icon: AlertTriangle,
  },
  SLUG_EXISTS: {
    title: 'URL yolu zaten var',
    message: 'Bu slug başka bir kayıt tarafından kullanılıyor. Farklı bir slug deneyin.',
    icon: AlertTriangle,
  },
  MODULE_DISABLED: {
    title: 'Modül kapalı',
    message: 'Bu modül aktif değil. Modül ayarlarından etkinleştirin.',
    icon: AlertTriangle,
  },

  // Server
  INTERNAL_ERROR: {
    title: 'Sunucu hatası',
    message: 'Beklenmeyen bir hata oluştu. Lütfen birkaç dakika sonra tekrar deneyin.',
    icon: ServerCrash,
  },
  DATABASE_ERROR: {
    title: 'Veritabanı hatası',
    message: 'Veri kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.',
    icon: ServerCrash,
  },
  UPLOAD_FAILED: {
    title: 'Yükleme başarısız',
    message: 'Dosya yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.',
    icon: ServerCrash,
  },

  // Rate Limiting
  RATE_LIMITED: {
    title: 'Çok fazla istek',
    message: 'Lütfen 30 saniye bekleyip tekrar deneyin.',
    icon: Clock,
  },
  SUSPICIOUS_ACTIVITY: {
    title: 'Şüpheli aktivite',
    message: 'Güvenlik nedeniyle bu işlem engellendi.',
    icon: ShieldAlert,
  },
};

interface ParsedError {
  title: string;
  message: string;
  icon: typeof AlertTriangle;
  code?: string;
}

/**
 * Parse an API error response into a user-friendly format
 */
export function parseApiError(error: unknown): ParsedError {
  // Handle fetch/network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      title: 'Bağlantı hatası',
      message: 'Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.',
      icon: WifiOff,
    };
  }

  // Handle API error responses
  if (error instanceof Error) {
    // Try to extract error code from message (format: "CODE: message")
    const codeMatch = error.message.match(/^([A-Z_]+):/);
    const code = codeMatch?.[1];

    if (code && errorMessages[code]) {
      return { ...errorMessages[code], code };
    }

    // Try JSON parsing for structured errors
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.code && errorMessages[parsed.code]) {
        return { ...errorMessages[parsed.code], code: parsed.code };
      }
    } catch {
      // Not JSON, use raw message
    }

    return {
      title: 'Bir hata oluştu',
      message: error.message,
      icon: AlertTriangle,
    };
  }

  return {
    title: 'Beklenmeyen hata',
    message: 'Lütfen sayfayı yenileyip tekrar deneyin.',
    icon: AlertTriangle,
  };
}

/**
 * Get a simple user-friendly error message string
 */
export function getErrorMessage(error: unknown): string {
  const parsed = parseApiError(error);
  return parsed.message;
}
