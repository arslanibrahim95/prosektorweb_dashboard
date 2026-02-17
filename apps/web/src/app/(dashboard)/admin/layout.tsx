'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { RoleGuard, UnauthorizedScreen } from '@/components/layout/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { AdminSidebar } from '@/features/admin/components/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { AdminMobileNav } from '@/features/admin/components/admin-mobile-nav';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const auth = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Check if user has admin or owner role
    const userRole = auth.me?.role;

    return (
        <RoleGuard
            allowedRoles={['owner', 'admin', 'super_admin']}
            userRole={userRole ?? 'viewer'}
            fallback={<UnauthorizedScreen />}
        >
            <div className="flex min-h-[calc(100vh-var(--topbar-height))]">
                {/* Admin Sidebar - Desktop */}
                <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

                {/* Mobile Header with hamburger */}
                <div className="lg:hidden fixed top-[var(--topbar-height)] left-0 right-0 z-20 border-b border-border bg-card px-4 py-3 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Admin menüsünü aç"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <h2 className="text-sm font-semibold text-foreground">
                        Admin Panel
                    </h2>
                </div>

                {/* Mobile Sidebar Sheet */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetContent side="left" className="w-72 p-0">
                        <SheetHeader className="px-4 py-3 border-b">
                            <SheetTitle>Admin Panel</SheetTitle>
                        </SheetHeader>
                        <AdminMobileNav onNavigate={() => setMobileOpen(false)} />
                    </SheetContent>
                </Sheet>

                {/* Main Content */}
                <main
                    className={cn(
                        'flex-1 transition-all duration-300 ease-[var(--ease-smooth)]',
                        'pt-12 lg:pt-0', // offset for mobile header
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
