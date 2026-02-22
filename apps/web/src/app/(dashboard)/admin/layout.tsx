'use client';

import { ReactNode } from 'react';
import { RoleGuard, UnauthorizedScreen } from '@/components/layout/role-guard';
import { useAuth } from '@/components/auth/auth-provider';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const auth = useAuth();

    // Check if user has admin or owner role
    const userRole = auth.me?.role;

    return (
        <RoleGuard
            allowedRoles={['owner', 'admin', 'super_admin']}
            userRole={userRole ?? 'viewer'}
            fallback={<UnauthorizedScreen />}
        >
            <div className="flex min-h-[calc(100vh-var(--topbar-height))]">
                {/* Main Content */}
                <main className="flex-1 transition-all duration-300 ease-[var(--ease-smooth)] overflow-x-hidden">
                    <div className="w-full max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
