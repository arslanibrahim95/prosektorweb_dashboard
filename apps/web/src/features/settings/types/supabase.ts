import type { User as SupabaseUser } from '@supabase/supabase-js';

// ── Supabase Feature Types ──────────────────────────────────────────────────

export interface SupabaseBucket {
    id: string;
    public: boolean;
    created_at?: string | null;
}

export interface SupabaseTable {
    name: string;
    [key: string]: unknown;
}

export interface SupabaseFileMetadata {
    mimetype?: string;
    size?: number;
}

export interface SupabaseFileEntry {
    id?: string;
    name: string;
    metadata?: SupabaseFileMetadata | null;
}

export type SupabaseAuthUser = Pick<SupabaseUser, 'id' | 'email' | 'role' | 'email_confirmed_at'>;

export interface ConfirmDialogState {
    type: 'auth-user' | 'bucket' | 'file';
    id: string;
    name: string;
}
