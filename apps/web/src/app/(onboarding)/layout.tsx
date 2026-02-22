'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Toaster } from '@/components/ui/sonner';

interface OnboardingLayoutProps {
    children: ReactNode;
}

function OnboardingGate({ children }: { children: ReactNode }) {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect unauthenticated users to login
        if (auth.status === 'unauthenticated') {
            router.replace('/login');
        }
    }, [auth.status, router]);

    useEffect(() => {
        // Redirect users who already have a tenant to dashboard
        if (auth.me?.tenant) {
            router.replace('/home');
        }
    }, [auth.me, router]);

    // Show loading state while checking auth
    if (auth.status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated or already has tenant
    if (!auth.session || auth.me?.tenant) {
        return <div className="min-h-screen" />;
    }

    return <>{children}</>;
}

/**
 * Onboarding Layout - Kullanıcı ilk kez giriş yaptığında gösterilen layout
 * 
 * Özellikler:
 * - Dashboard elementlerinden bağımsız (sidebar, topbar yok)
 * - Temiz, odaklanmış deneyim
 * - Gradient background
 * - Mobil-first responsive tasarım
 * - Auth guard ile korumalı
 */
export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
    return (
        <OnboardingGate>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                {/* Logo */}
                <div className="fixed top-6 left-6 z-50">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-white font-bold text-sm">P</span>
                        </div>
                        <span className="font-semibold text-lg hidden sm:inline">ProsektorWeb</span>
                    </div>
                </div>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
                    <div className="w-full">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="fixed bottom-6 left-0 right-0 text-center">
                    <p className="text-sm text-muted-foreground">
                        © 2024 ProsektorWeb. Tüm hakları saklıdır.
                    </p>
                </footer>

                <Toaster richColors position="bottom-right" />
            </div>
        </OnboardingGate>
    );
}
