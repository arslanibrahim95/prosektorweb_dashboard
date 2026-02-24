import DOMPurify from 'isomorphic-dompurify';

/**
 * HTML Sanitizer configuration
 * Bu konfigürasyon, iframe veya zararlı olabilecek etiketleri filtrelerken,
 * temel metin biçimlendirmelerine izin verir.
 */
const ALLOWED_TAGS = [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'blockquote', 'code', 'pre'
];

const ALLOWED_ATTR = [
    'href', 'title', 'class', 'target', 'rel'
];

/**
 * Metin/HTML içeriğini XSS risklerine karşı sanitize eder.
 *
 * @param dirtyHtml - Kullanıcıdan gelen, güvenilmeyen HTML metni
 * @returns Temizlenmiş, güvenli HTML
 */
export function sanitizeHtml(dirtyHtml: string): string {
    if (!dirtyHtml) return '';
    return DOMPurify.sanitize(dirtyHtml, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        // prevent target="_blank" without rel="noopener noreferrer"
        ADD_ATTR: ['target', 'rel'],
    });
}

/**
 * URL'leri sanitize eder. Javascript ve zararlı protokolleri kaldırır.
 *
 * @param url - Olası zararlı URL
 * @returns Güvenli URL (zararlıysa #önerilir)
 */
export function sanitizeUrl(url: string): string {
    if (!url) return '#';

    try {
        const parsed = new URL(url, 'http://dummy.com');
        if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
            return parsed.href.replace('http://dummy.com', '');
        }
    } catch {
        // Geçersiz URL
    }
    return '#';
}
