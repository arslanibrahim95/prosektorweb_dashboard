'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { RoleGuard, UnauthorizedScreen } from '@/components/layout/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { AdminSidebar } from '@/features/admin/components/admin-sidebar';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const auth = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    // Check if user has admin or owner role
    const userRole = auth.me?.role;

    return (
        <RoleGuard
            allowedRoles={['owner', 'admin', 'super_admin']}
            userRole={userRole ?? 'viewer'}
            fallback={<UnauthorizedScreen />}
        >
            <div className="flex min-h-[calc(100vh-var(--topbar-height))]">
                {/* Admin Sidebar */}
                <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

                {/* Mobile Sidebar - Simplified for now */}
                <div className="lg:hidden">
                    <div className="border-b border-border bg-card px-4 py-3">
                        <h2 className="text-sm font-semibold text-foreground">
                            Admin Panel
                        </h2>
                    </div>
                </div>

                {/* Main Content */}
                <main
                    className={cn(
                        'flex-1 transition-all duration-300 ease-[var(--ease-smooth)]',
                        'lg:ml-[var(--sidebar-width)]',
                        collapsed ? 'lg:ml-16' : 'lg:ml-64'
                    )}
                >
                    <div className="container mx-auto p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
