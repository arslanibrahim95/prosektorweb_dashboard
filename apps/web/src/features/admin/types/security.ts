// ── Security Feature Types ────────────────────────────────────────────────────

export type IpBlockDuration = '1h' | '24h' | '7d' | '30d' | 'permanent';

export interface SecuritySession {
    id: string;
    user_id: string;
    user_email?: string | null;
    user_name?: string | null;
    device?: string | null;
    browser?: string | null;
    ip_address?: string | null;
    location?: string | null;
    last_activity?: string | null;
    is_current?: boolean;
}

export interface IpBlockRecord {
    id: string;
    ip_address: string;
    reason?: string | null;
    blocked_until?: string | null;
    expires_at?: string | null;
    created_at: string;
    created_by?: string | null;
    created_by_email?: string | null;
    blocked_by?: string | null;
}

export interface SecuritySettingsPayload {
    twofa_enabled?: boolean;
    session_timeout?: string;
    twofa_required?: boolean;
    twofa_methods?: {
        authenticator?: boolean;
        sms?: boolean;
        email?: boolean;
    };
    auto_block?: {
        failedLoginLimit?: number;
        blockDuration?: string;
    };
}

export interface AdminSessionsResponse {
    items?: SecuritySession[];
}

export interface AdminIpBlocksResponse {
    items?: IpBlockRecord[];
}

export interface AdminSettingsResponse {
    tenant?: {
        settings?: {
            security?: SecuritySettingsPayload;
        };
    };
}

export interface IpBlockFormData {
    ip_address: string;
    reason: string;
    duration: IpBlockDuration;
    type: 'block' | 'allow';
}
