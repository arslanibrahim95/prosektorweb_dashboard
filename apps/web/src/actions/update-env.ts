'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { assertSuperAdminAction } from './auth-guard';
import { logger } from '@/lib/logger';

const ENV_FILE_PATH = path.join(process.cwd(), '.env.local');

interface SupabaseSettingsInput {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
}

interface SupabasePublicSettings {
    url: string;
    anonKey: string;
    hasServiceRoleKey: boolean;
}

interface SupabaseAdminSettings extends SupabasePublicSettings {
    serviceRoleKey: string;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.';
}

function sanitizeEnvValue(value: string): string {
    return value.replace(/[\r\n]/g, '').trim();
}

export async function getSupabaseAdminSettings(): Promise<SupabaseAdminSettings> {
    await assertSuperAdminAction();

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    return {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        hasServiceRoleKey: serviceRoleKey.length > 0,
        serviceRoleKey,
    };
}

export async function testSupabaseConnection(settings: SupabaseSettingsInput) {
    try {
        await assertSuperAdminAction();
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
            logger.error("Supabase connection test error", { error });
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
    } catch (error: unknown) {
        return { success: false, message: `Bağlantı hatası: ${getErrorMessage(error)}` };
    }
}

export async function updateSupabaseSettings(settings: SupabaseSettingsInput) {
    try {
        await assertSuperAdminAction();
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
            const safeValue = sanitizeEnvValue(value);
            const regex = new RegExp(`^${key}=.*`, 'm');
            if (regex.test(newEnvContent)) {
                newEnvContent = newEnvContent.replace(regex, `${key}=${safeValue}`);
            } else {
                newEnvContent += `\n${key}=${safeValue}`;
            }
        }

        // Clean up multiple newlines
        newEnvContent = newEnvContent.replace(/\n\n\n+/g, '\n\n').trim() + '\n';

        fs.writeFileSync(ENV_FILE_PATH, newEnvContent, 'utf-8');

        // Revalidate relevant paths if necessary
        revalidatePath('/settings/supabase');

        return { success: true, message: 'Ayarlar başarıyla güncellendi. Değişikliklerin etkili olması için sunucunun yeniden başlatılması gerekebilir.' };
    } catch (error) {
        logger.error('Error updating .env.local', { error });
        return { success: false, message: 'Ayarlar güncellenirken bir hata oluştu.' };
    }
}

export async function getSupabaseSettings() {
    const settings = await getSupabaseAdminSettings();
    const publicSettings: SupabasePublicSettings = {
        url: settings.url,
        anonKey: settings.anonKey,
        hasServiceRoleKey: settings.hasServiceRoleKey,
    };
    return publicSettings;
}
