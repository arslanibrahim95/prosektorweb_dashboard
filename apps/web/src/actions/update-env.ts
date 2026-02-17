'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const ENV_FILE_PATH = path.join(process.cwd(), '.env.local');

interface SupabaseSettings {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
}

export async function testSupabaseConnection(settings: SupabaseSettings) {
    try {
        const client = createClient(settings.url, settings.serviceRoleKey || settings.anonKey);

        // Perform a simple health check or query
        // Since we don't know the table structure, we can try to get the auth settings or just check if the client initializes without error.
        // A more robust check would be listing buckets or a known table. 
        // Let's try to list buckets if service role is present, or just trust the client initialization for now (which is weak).
        // Better: Try to get session or something generic.
        // Actually, `client.from('...').select('*').limit(1)` is standards but we don't know tables.
        // `client.storage.listBuckets()` is a good admin check.

        const { data, error } = await client.storage.listBuckets();

        if (error) {
            console.error("Supabase connection test error:", error);
            // If authorization error, it means variables are likely correct but permissions are tight, which is technically a "connection".
            // But usually invalid key returns 401.
            return { success: false, message: `Bağlantı başarısız: ${error.message}` };
        }

        return {
            success: true,
            message: `Bağlantı başarılı! ${data?.length ?? 0} adet depolama birimi bulundu.`,
            details: {
                buckets: data?.length
            }
        };
    } catch (error: any) {
        return { success: false, message: `Bağlantı hatası: ${error.message}` };
    }
}

export async function updateSupabaseSettings(settings: SupabaseSettings) {
    try {
        let envContent = '';

        if (fs.existsSync(ENV_FILE_PATH)) {
            envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
        }

        const newValues: Record<string, string> = {
            NEXT_PUBLIC_SUPABASE_URL: settings.url,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: settings.anonKey,
        };

        if (settings.serviceRoleKey) {
            newValues.SUPABASE_SERVICE_ROLE_KEY = settings.serviceRoleKey;
        }

        let newEnvContent = envContent;

        for (const [key, value] of Object.entries(newValues)) {
            const regex = new RegExp(`^${key}=.*`, 'm');
            if (regex.test(newEnvContent)) {
                newEnvContent = newEnvContent.replace(regex, `${key}=${value}`);
            } else {
                newEnvContent += `\n${key}=${value}`;
            }
        }

        // Clean up multiple newlines
        newEnvContent = newEnvContent.replace(/\n\n\n+/g, '\n\n').trim() + '\n';

        fs.writeFileSync(ENV_FILE_PATH, newEnvContent, 'utf-8');

        // Revalidate relevant paths if necessary
        revalidatePath('/settings/supabase');

        return { success: true, message: 'Ayarlar başarıyla güncellendi. Değişikliklerin etkili olması için sunucunun yeniden başlatılması gerekebilir.' };
    } catch (error) {
        console.error('Error updating .env.local:', error);
        return { success: false, message: 'Ayarlar güncellenirken bir hata oluştu.' };
    }
}

export async function getSupabaseSettings() {
    // Note: In a real production app, we wouldn't want to expose sensitive keys like this 
    // without strict RBAC. Assuming this is a local dev tool or admin-only area.
    return {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    };
}
