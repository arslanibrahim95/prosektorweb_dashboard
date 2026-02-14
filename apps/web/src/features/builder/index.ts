/**
 * Site Builder Feature Module
 * 
 * Page management and builder utilities
 */

export type PageStatus = 'draft' | 'published';

export interface PageBlock {
    id: string;
    type: string;
    props: Record<string, unknown>;
    children?: PageBlock[];
}

export interface PageRevision {
    id: string;
    page_id: string;
    blocks: PageBlock[];
    created_at: string;
    created_by: string;
}

/**
 * Block types available in builder
 */
export const blockTypes = [
    { type: 'hero', label: 'Hero', icon: 'Layout' },
    { type: 'text', label: 'Metin', icon: 'Type' },
    { type: 'image', label: 'Görsel', icon: 'Image' },
    { type: 'gallery', label: 'Galeri', icon: 'Grid' },
    { type: 'cta', label: 'CTA', icon: 'MousePointer' },
    { type: 'features', label: 'Özellikler', icon: 'Star' },
    { type: 'contact-form', label: 'İletişim Formu', icon: 'Mail' },
    { type: 'offer-form', label: 'Teklif Formu', icon: 'FileText' },
    { type: 'job-list', label: 'İş İlanları', icon: 'Briefcase' },
] as const;

/**
 * Create empty block
 */
export function createBlock(type: string): PageBlock {
    return {
        id: crypto.randomUUID(),
        type,
        props: getDefaultProps(type),
    };
}

/**
 * Get default props for block type
 */
function getDefaultProps(type: string): Record<string, unknown> {
    switch (type) {
        case 'hero':
            return { title: '', subtitle: '', backgroundUrl: '' };
        case 'text':
            return { content: '' };
        case 'image':
            return { src: '', alt: '' };
        case 'cta':
            return { title: '', buttonText: '', buttonUrl: '' };
        default:
            return {};
    }
}

/**
 * Auto-save debounce helper
 */
export function createAutoSave(
    saveFn: () => Promise<void>,
    intervalMs = 30000
) {
    let timeout: NodeJS.Timeout | null = null;

    return {
        trigger() {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(saveFn, intervalMs);
        },
        cancel() {
            if (timeout) clearTimeout(timeout);
        },
        flush() {
            if (timeout) {
                clearTimeout(timeout);
                saveFn();
            }
        },
    };
}
