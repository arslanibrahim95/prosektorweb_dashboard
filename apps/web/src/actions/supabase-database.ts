'use server';

import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminSettings } from './update-env';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.';
}

async function getClient() {
    const settings = await getSupabaseAdminSettings();
    if (!settings.url || !settings.serviceRoleKey) {
        throw new Error('Supabase URL or Service Role Key is missing');
    }
    return createClient(settings.url, settings.serviceRoleKey);
}

export async function listTables() {
    try {
        const client = await getClient();

        // Attempt 1: Call 'get_tables' RPC (custom setup).
        const { data: rpcData, error: rpcError } = await client.rpc('get_tables');

        if (!rpcError && rpcData) {
            return { success: true, data: rpcData };
        }

        // Attempt 2: If we have Service Role Key, we might try to use the admin API or just return a helpful message.
        // Standard client without RPC cannot list tables reliably.

        return {
            success: true,
            data: [],
            message: "Tabloları listelemek için veritabanınızda 'get_tables' isimli bir fonksiyon oluşturmanız gerekmektedir. Lütfen 'Veritabanı' sekmesindeki SQL kodunu Supabase SQL Editor'de çalıştırın."
        };

    } catch (error: unknown) {
        console.error('Error listing tables:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}
