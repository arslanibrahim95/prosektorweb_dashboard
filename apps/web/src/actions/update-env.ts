'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { assertSuperAdminAction } from './auth-guard';
import { logger } from '@/lib/logger';

const ENV_FILE_PATH = path.join(process.cwd(), '.env.local');

const ALLOWED_SUPABASE_HOSTS = new Set<string>();

function getAllowedHosts(): Set<string> {
    if (ALLOWED_SUPABASE_HOSTS.size === 0) {
        const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (configuredUrl) {
            try {
                const parsed = new URL(configuredUrl);
                ALLOWED_SUPABASE_HOSTS.add(parsed.host);
            } catch {
                // Invalid URL in env, ignore
            }
        }
    }
    return ALLOWED_SUPABASE_HOSTS;
}

function validateSupabaseUrl(urlString: string): URL {
    let parsed: URL;
    try {
        parsed = new URL(urlString);
    } catch {
        throw new Error('Geçersiz URL formatı');
    }
    
    if (parsed.protocol !== 'https:') {
        throw new Error('Sadece HTTPS desteklenmektedir');
    }
    
    const allowed = getAllowedHosts();
    if (allowed.size > 0 && !allowed.has(parsed.host)) {
        throw new Error(`Bilinen Supabase host'ları dışında: ${parsed.host}. Önce .env dosyasında NEXT_PUBLIC_SUPABASE_URL ayarlayın.`);
    }
    
    return parsed;
}

const PROTECTED_ENV_KEYS = new Set([
    'SUPABASE_SERVICE_ROLE_KEY',
    'CUSTOM_JWT_SECRET',
    'SITE_TOKEN_SECRET',
    'WEBHOOK_SECRET',
]);

function isProtectedKey(key: string): boolean {
    return PROTECTED_ENV_KEYS.has(key);
}

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

/**
 * Test Supabase connection with provided credentials
 * SECURITY: Validates URL against allowlist and adds timeout
 */
export async function testSupabaseConnection(settings: SupabaseSettingsInput) {
    try {
        await assertSuperAdminAction();
        
        const validatedUrl = validateSupabaseUrl(settings.url);
        
        const client = createClient(validatedUrl.origin, settings.serviceRoleKey || settings.anonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            }
        });

        const timeoutMs = 5000;
        const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        );

        try {
            const { data, error } = await Promise.race([
                client.storage.listBuckets(),
                timeoutPromise
            ]) as Awaited<ReturnType<typeof client.storage.listBuckets>>;

            if (error) {
                logger.error("Supabase connection test error", { error });
                return { success: false, message: `Bağlantı başarısız: ${error.message}` };
            }

            return {
                success: true,
                message: `Bağlantı başarılı! ${data?.length ?? 0} adet depolama birimi bulundu.`,
                details: {
                    buckets: data?.length
                }
            };
        } catch (fetchError) {
            if (fetchError instanceof Error && fetchError.message === 'Timeout') {
                return { success: false, message: 'Bağlantı zaman aşımı (5 saniye)' };
            }
            throw fetchError;
        }
    } catch (error: unknown) {
        return { success: false, message: `Bağlantı hatası: ${getErrorMessage(error)}` };
    }
}

/**
 * Update Supabase settings in .env.local
 * @deprecated Bu fonksiyon güvenlik nedeniyle kaldırılmalıdır.
 * Deployment sürecinde environment variable'lar kullanılmalıdır.
 */
export async function updateSupabaseSettings(settings: SupabaseSettingsInput) {
    try {
        await assertSuperAdminAction();
        
        // SECURITY: Prevent modification of protected keys
        if (settings.serviceRoleKey && isProtectedKey('SUPABASE_SERVICE_ROLE_KEY')) {
            return { 
                success: false, 
                message: 'Güvenlik anahtarları UI üzerinden değiştirilemez. Lütfen deployment sürecini kullanın.' 
            };
        }

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
