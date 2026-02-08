// === Core Entity Types ===

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: 'demo' | 'starter' | 'pro';
    status: 'active' | 'suspended' | 'deleted';
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface Site {
    id: string;
    tenant_id: string;
    name: string;
    status: 'draft' | 'staging' | 'published';
    primary_domain: string | null;
    settings: SiteSettings;
    created_at: string;
    updated_at: string;
}

export interface SiteSettings {
    theme: ThemeSettings;
    seo: SEOSettings;
}

export interface ThemeSettings {
    logo_light?: string;
    logo_dark?: string;
    favicon?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    text_color: string;
    background_color: string;
    heading_font: string;
    body_font: string;
    base_font_size: number;
}

export interface SEOSettings {
    title_template: string;
    default_description: string;
    og_image?: string;
    robots_txt?: string;
}

export interface Page {
    id: string;
    tenant_id: string;
    site_id: string;
    slug: string;
    title: string;
    status: 'draft' | 'published';
    seo: PageSEO;
    order_index: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface PageSEO {
    title?: string;
    description?: string;
    og_image?: string;
}

export interface Block {
    id: string;
    type: BlockType;
    props: Record<string, unknown>;
}

export type BlockType =
    | 'hero'
    | 'text'
    | 'image'
    | 'gallery'
    | 'features'
    | 'cta'
    | 'testimonials'
    | 'team'
    | 'faq'
    | 'contact_form'
    | 'offer_form'
    | 'map'
    | 'spacer'
    | 'divider';

// === Module Types ===

export interface ModuleInstance {
    id: string;
    tenant_id: string;
    site_id: string;
    module_key: 'offer' | 'contact' | 'hr' | 'legal';
    enabled: boolean;
    settings: ModuleSettings;
    created_at: string;
    updated_at: string;
}

export interface ModuleSettings {
    recipient_emails?: string[];
    success_message?: string;
    kvkk_text_id?: string;
}

// === Inbox Types ===

export interface OfferRequest {
    id: string;
    tenant_id: string;
    site_id: string;
    full_name: string;
    email: string;
    phone: string;
    company_name: string | null;
    message: string | null;
    kvkk_accepted_at: string;
    source: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
}

export interface ContactMessage {
    id: string;
    tenant_id: string;
    site_id: string;
    full_name: string;
    email: string;
    phone: string;
    subject: string | null;
    message: string;
    kvkk_accepted_at: string;
    source: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
}

// === HR Types ===

export interface JobPost {
    id: string;
    tenant_id: string;
    site_id: string;
    title: string;
    slug: string;
    location: string | null;
    employment_type: 'full-time' | 'part-time' | 'contract' | null;
    description: Record<string, unknown> | null;
    requirements: Record<string, unknown> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    applications_count?: number;
}

export interface JobApplication {
    id: string;
    tenant_id: string;
    site_id: string;
    job_post_id: string;
    job_post?: JobPost;
    full_name: string;
    email: string;
    phone: string;
    message: string | null;
    cv_path: string;
    kvkk_accepted_at: string;
    is_read: boolean;
    created_at: string;
}

// === Domain Types ===

export interface Domain {
    id: string;
    tenant_id: string;
    site_id: string;
    domain: string;
    status: 'pending' | 'verified' | 'active' | 'failed';
    ssl_status: 'pending' | 'active' | 'expired';
    is_primary: boolean;
    verified_at: string | null;
    created_at: string;
    updated_at: string;
}

// === User Types ===

export interface TenantMember {
    id: string;
    tenant_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    created_at: string;
    user?: {
        id: string;
        email: string;
        name: string;
        avatar_url?: string;
    };
    status?: 'active' | 'pending' | 'suspended';
}

// === Legal Types ===

export interface LegalText {
    id: string;
    tenant_id: string;
    title: string;
    type: 'kvkk' | 'consent' | 'disclosure';
    content: string;
    version: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// === Menu Types ===

export interface Menu {
    id: string;
    tenant_id: string;
    site_id: string;
    name: 'header' | 'footer' | 'mobile';
    items: MenuItem[];
    created_at: string;
    updated_at: string;
}

export interface MenuItem {
    id: string;
    label: string;
    url: string;
    type: 'page' | 'url' | 'anchor';
    children?: MenuItem[];
}

// === Media Types ===

export interface Media {
    id: string;
    tenant_id: string;
    site_id: string;
    filename: string;
    path: string;
    type: 'image' | 'document';
    mime_type: string;
    size_bytes: number;
    meta: MediaMeta;
    created_at: string;
    created_by: string;
}

export interface MediaMeta {
    width?: number;
    height?: number;
    alt?: string;
}
