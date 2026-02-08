/**
 * HR Feature Module
 * 
 * Job posts and applications management utilities
 */

export type EmploymentType = 'full-time' | 'part-time' | 'contract';

export interface JobPostFormData {
    title: string;
    slug: string;
    location?: string;
    employment_type?: EmploymentType;
    description?: string;
    requirements?: string;
    is_active: boolean;
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Check if slug is unique
 */
export async function checkSlugUniqueness(
    slug: string,
    excludeId?: string
): Promise<boolean> {
    const params = new URLSearchParams({ slug });
    if (excludeId) {
        params.set('exclude_id', excludeId);
    }

    const response = await fetch(`/api/hr/job-posts/check-slug?${params}`);
    const data = await response.json();
    return data.available;
}

/**
 * Get signed URL for CV download
 */
export async function getCVDownloadUrl(applicationId: string): Promise<string> {
    const response = await fetch(`/api/hr/applications/${applicationId}/cv-url`);
    const data = await response.json();
    return data.url;
}

/**
 * Employment type labels (Turkish)
 */
export const employmentTypeLabels: Record<EmploymentType, string> = {
    'full-time': 'Tam Zamanlı',
    'part-time': 'Yarı Zamanlı',
    'contract': 'Sözleşmeli',
};
