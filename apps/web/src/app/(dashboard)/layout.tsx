'use client';

import { AppShell } from '@/components/layout';
import { SiteProvider } from '@/components/site/site-provider';
import { useAuth } from '@/components/auth/auth-provider';
import { InlineSessionWarning } from '@/components/auth/session-timeout-alert';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthLoadingSkeleton } from '@/components/auth/auth-loading-skeleton';

function DashboardGate({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (auth.status === 'unauthenticated') {
            router.replace('/login');
        }
    }, [auth.status, router]);

    if (auth.envError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="glass max-w-lg w-full">
                    <CardHeader>
                        <CardTitle>Konfigürasyon Eksik</CardTitle>
                        <CardDescription>Supabase environment ayarları eksik.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs whitespace-pre-wrap">{auth.envError}</pre>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (auth.status === 'loading') {
        return <AuthLoadingSkeleton />;
    }

    if (!auth.session) {
        return <AuthLoadingSkeleton />;
    }

    return (
        <AppShell
            user={auth.me?.user}
            tenant={auth.me?.tenant ? { name: auth.me.tenant.name } : undefined}
        >
            {children}
        </AppShell>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SiteProvider>
            {/* Session timeout warning banner */}
            <InlineSessionWarning />
            <DashboardGate>{children}</DashboardGate>
        </SiteProvider>
    );
}
