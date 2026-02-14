/**
 * Admin Panel Types
 * 
 * Comprehensive TypeScript types for the admin panel.
 */

import type { UserRole } from '@prosektor/contracts';

// === User Management ===

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    role: UserRole;
    tenant_id: string;
    tenant_name: string;
    created_at: string;
    last_login_at?: string;
    is_active: boolean;
    email_verified: boolean;
}

export interface AdminRole {
    role: UserRole;
    label: string;
    description: string;
    permissions: Permission[];
}

export interface Permission {
    id: string;
    name: string;
    description: string;
    category: 'content' | 'users' | 'settings' | 'analytics' | 'system';
}

// === Activity & Logs ===

export interface ActivityLog {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
}

// === API Management ===

export interface ApiKey {
    id: string;
    name: string;
    key_prefix: string;
    tenant_id: string;
    created_by: string;
    created_at: string;
    last_used_at?: string;
    expires_at?: string;
    is_active: boolean;
    scopes: string[];
    rate_limit?: number;
}

export interface Webhook {
    id: string;
    tenant_id: string;
    url: string;
    events: string[];
    is_active: boolean;
    secret: string;
    created_at: string;
    last_triggered_at?: string;
    failure_count: number;
    headers?: Record<string, string>;
}

// === Security ===

export interface Session {
    id: string;
    user_id: string;
    user_email: string;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    expires_at: string;
    last_activity_at: string;
    is_current: boolean;
}

export interface IpBlockRule {
    id: string;
    ip_address: string;
    reason: string;
    created_by: string;
    created_at: string;
    expires_at?: string;
    is_active: boolean;
}

// === Notifications ===

export interface NotificationTemplate {
    id: string;
    name: string;
    type: 'email' | 'sms' | 'push' | 'in_app';
    subject?: string;
    body: string;
    variables: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    html_body: string;
    text_body?: string;
    from_email?: string;
    from_name?: string;
    variables: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// === System ===

export interface Backup {
    id: string;
    type: 'full' | 'incremental' | 'database' | 'files';
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    size_bytes?: number;
    file_path?: string;
    created_at: string;
    completed_at?: string;
    error_message?: string;
    created_by?: string;
}

export interface Language {
    code: string;
    name: string;
    native_name: string;
    is_active: boolean;
    is_default: boolean;
    translation_progress: number;
}

export interface Translation {
    id: string;
    language_code: string;
    key: string;
    value: string;
    namespace: string;
    created_at: string;
    updated_at: string;
}

export interface CacheStatus {
    name: string;
    type: 'redis' | 'memory' | 'disk';
    size_bytes: number;
    item_count: number;
    hit_rate: number;
    miss_rate: number;
    last_cleared_at?: string;
}

// === Dashboard & Analytics ===

export interface AdminDashboardStats {
    users: {
        total: number;
        active_today: number;
        new_this_week: number;
        by_role: Record<UserRole, number>;
    };
    content: {
        total_pages: number;
        published_pages: number;
        draft_pages: number;
        total_modules: number;
    };
    activity: {
        total_actions_today: number;
        total_actions_this_week: number;
        failed_logins_today: number;
        api_calls_today: number;
    };
    system: {
        database_size_mb: number;
        storage_used_mb: number;
        cache_hit_rate: number;
        avg_response_time_ms: number;
    };
    security: {
        active_sessions: number;
        blocked_ips: number;
        failed_auth_attempts_today: number;
        suspicious_activities: number;
    };
}

export interface AdminWidget {
    id: string;
    title: string;
    type: 'stat' | 'chart' | 'table' | 'list';
    position: number;
    size: 'small' | 'medium' | 'large';
    config: Record<string, unknown>;
    is_visible: boolean;
}

// === Settings ===

export interface SystemSettings {
    id: string;
    category: string;
    key: string;
    value: string | number | boolean | Record<string, unknown>;
    type: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
    is_public: boolean;
    updated_at: string;
    updated_by?: string;
}

export interface ThemeSettings {
    id: string;
    name: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    text_color: string;
    font_family: string;
    border_radius: string;
    is_active: boolean;
    is_default: boolean;
    custom_css?: string;
}

// === Content Management ===

export interface ContentPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    author_id: string;
    author_name: string;
    status: 'draft' | 'published' | 'archived';
    published_at?: string;
    created_at: string;
    updated_at: string;
    tags: string[];
    category?: string;
    featured_image?: string;
    seo_title?: string;
    seo_description?: string;
}

export interface MediaItem {
    id: string;
    filename: string;
    original_filename: string;
    mime_type: string;
    size_bytes: number;
    url: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
    uploaded_by: string;
    uploaded_at: string;
    folder?: string;
    alt_text?: string;
    caption?: string;
}

// === Filter & Query Types ===

export type AdminUserFilter = {
    role?: UserRole;
    is_active?: boolean;
    search?: string;
    tenant_id?: string;
};

export type ActivityLogFilter = {
    user_id?: string;
    action?: string;
    resource_type?: string;
    severity?: ActivityLog['severity'];
    date_from?: string;
    date_to?: string;
};

export type DateRange = {
    from: Date;
    to: Date;
};

// === Bulk Operations ===

export type BulkAction =
    | { type: 'delete'; ids: string[] }
    | { type: 'activate'; ids: string[] }
    | { type: 'deactivate'; ids: string[] }
    | { type: 'export'; ids: string[] }
    | { type: 'assign_role'; ids: string[]; role: UserRole };

// === API Response Types ===

export interface AdminApiResponse<T> {
    data: T;
    meta?: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    };
}

export interface AdminActionResult {
    success: boolean;
    message: string;
    affected_count?: number;
    errors?: Array<{ id: string; error: string }>;
}
