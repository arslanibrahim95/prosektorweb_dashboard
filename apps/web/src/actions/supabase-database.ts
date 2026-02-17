'use server';

import { createClient } from '@supabase/supabase-js';
import { getSupabaseSettings } from './update-env';

async function getClient() {
    const settings = await getSupabaseSettings();
    if (!settings.url || !settings.anonKey) {
        throw new Error('Supabase URL or Anon Key is missing');
    }
    const key = settings.serviceRoleKey || settings.anonKey;
    return createClient(settings.url, key);
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

    } catch (error: any) {
        console.error('Error listing tables:', error);
        return { success: false, error: error.message };
    }
}
