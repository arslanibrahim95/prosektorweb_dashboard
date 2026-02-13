'use client';

import { AppShell } from '@/components/layout';
import { SiteProvider } from '@/components/site/site-provider';
import { useAuth } from '@/components/auth/auth-provider';
import { InlineSessionWarning } from '@/components/auth/session-timeout-alert';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        return <div className="min-h-screen" />;
    }

    // If user is signed in but has no tenant membership yet, /api/me will 403.
    if (auth.session && !auth.me) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="glass max-w-lg w-full">
                    <CardHeader>
                        <CardTitle>Tenant Üyeliği Yok</CardTitle>
                        <CardDescription>
                            Giriş yaptınız ama bu kullanıcı herhangi bir tenant&apos;a bağlı değil.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Devam etmek için bu kullanıcıya <span className="font-medium">tenant_members</span> kaydı eklenmeli
                            (role: owner/admin/editor/viewer).
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => auth.signOut().then(() => router.replace('/login'))}
                                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Çıkış Yap
                            </button>
                            <button
                                onClick={() => auth.refreshMe()}
                                className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors"
                            >
                                Tekrar Dene
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!auth.me) {
        // Redirect effect will handle unauthenticated; keep a blank frame for hydration.
        return <div className="min-h-screen" />;
    }

    return (
        <AppShell
            user={auth.me.user}
            tenant={{ name: auth.me.tenant.name }}
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
