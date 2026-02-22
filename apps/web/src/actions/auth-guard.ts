'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function hasSuperAdminRole(appMetadata: unknown): boolean {
    if (!appMetadata || typeof appMetadata !== 'object') {
        return false;
    }

    const metadata = appMetadata as Record<string, unknown>;
    if (metadata.role === 'super_admin') {
        return true;
    }

    if (Array.isArray(metadata.roles) && metadata.roles.includes('super_admin')) {
        return true;
    }

    return false;
}

export async function assertSuperAdminAction(): Promise<void> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
        throw new Error('Supabase yapılandırması eksik.');
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set() {
                // Server action içinde auth cookie mutasyonu gerekmiyor.
            },
            remove() {
                // Server action içinde auth cookie mutasyonu gerekmiyor.
            },
        },
    });

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('Yetkisiz işlem.');
    }

    if (!hasSuperAdminRole(user.app_metadata)) {
        throw new Error('Bu işlem için super_admin yetkisi gerekiyor.');
    }
}
