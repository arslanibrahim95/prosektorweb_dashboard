'use server';

import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminSettings } from './update-env';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.';
}

async function getAdminClient() {
    const settings = await getSupabaseAdminSettings();
    if (!settings.url || !settings.serviceRoleKey) {
        throw new Error('Supabase URL or Service Role Key is missing. Admin access required.');
    }
    return createClient(settings.url, settings.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

export async function listAuthUsers(page: number = 1, perPage: number = 50) {
    try {
        const client = await getAdminClient();
        const { data, error } = await client.auth.admin.listUsers({
            page: page,
            perPage: perPage
        });

        if (error) throw error;

        return { success: true, data: data.users, total: data.total };
    } catch (error: unknown) {
        console.error('Error listing auth users:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteAuthUser(userId: string) {
    try {
        const client = await getAdminClient();
        const { data, error } = await client.auth.admin.deleteUser(userId);
        if (error) throw error;
        return { success: true, data };
    } catch (error: unknown) {
        console.error('Error deleting auth user:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}
