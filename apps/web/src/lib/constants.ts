/**
 * API Constants
 * 
 * Merkezi API yapılandırma sabitleri.
 * Tekrarı önlemek ve kolay değişiklik için kullanılır.
 */

/** Varsayılan sayfalama değerleri */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 100,
} as const;

/** Arama debounce süresi (ms) */
export const SEARCH_DEBOUNCE_MS = 500;

/** Arama için minimum karakter */
export const SEARCH_MIN_CHARS = 2;

/** Tarih formatı */
export const DATE_FORMAT = {
    ISO: 'yyyy-MM-dd',
    DISPLAY: 'dd MMM yyyy',
} as const;

/** CSV dışa aktarım varsayılanları */
export const CSV_EXPORT = {
    DEFAULT_LIMIT: 1000,
    LIMIT: 2000,
} as const;

/** Oturum zaman aşımı (ms) */
export const SESSION_TIMEOUT = 1000 * 60 * 30; // 30 dakika
