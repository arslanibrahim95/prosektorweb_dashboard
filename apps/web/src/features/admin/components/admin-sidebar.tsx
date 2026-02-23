'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import type { NavIconName } from '@/components/layout/sidebar-nav-icons';

export interface AdminNavItem {
    label: string;
    href: string;
    icon: NavIconName;
    children?: AdminNavItem[];
    badge?: string;
}

export const adminNavItems: AdminNavItem[] = [
    {
        label: 'Genel Bakış',
        href: '/admin',
        icon: 'LayoutDashboard',
    },
    {
        label: 'Site Yönetimi',
        href: '/admin/sites',
        icon: 'Globe',
    },
    {
        label: 'İçerik & Kullanıcı',
        href: '/admin/management',
        icon: 'Users',
        children: [
            { label: 'Kullanıcı Yönetimi', href: '/admin/users', icon: 'Users' },
            { label: 'İçerik Yönetimi', href: '/admin/content', icon: 'FileText' },
        ]
    },
    {
        label: 'Analiz & İzleme',
        href: '/admin/monitoring',
        icon: 'BarChart3',
        children: [
            { label: 'Analitik & İstatistik', href: '/admin/analytics', icon: 'BarChart3' },
            { label: 'Raporlar', href: '/admin/reports', icon: 'FileBarChart' },
            { label: 'Aktivite Logları', href: '/admin/logs', icon: 'ScrollText' },
        ]
    },
    {
        label: 'Sistem & Güvenlik',
        href: '/admin/system',
        icon: 'Shield',
        children: [
            { label: 'Sistem Ayarları', href: '/admin/settings', icon: 'Settings' },
            { label: 'Güvenlik', href: '/admin/security', icon: 'Shield' },
            { label: 'API Anahtarları', href: '/admin/api-keys', icon: 'Key' },
        ]
    },
    {
        label: 'Gelişmiş Ayarlar',
        href: '/admin/advanced',
        icon: 'Database',
        children: [
            { label: 'Önbellek (Cache)', href: '/admin/cache', icon: 'Database' },
            { label: 'Yedekleme', href: '/admin/backup', icon: 'HardDrive' },
        ]
    }
];

export const superAdminNavItems: AdminNavItem[] = [
    {
        label: 'Platform Yönetimi',
        href: '/admin/platform',
        icon: 'Building2',
        children: [
            { label: 'Platform Tenantlar', href: '/admin/platform/tenants', icon: 'Building2' },
            { label: 'Platform Analitik', href: '/admin/platform/analytics', icon: 'BarChart2' },
            { label: 'Platform Ayarları', href: '/admin/platform/settings', icon: 'SlidersHorizontal' },
        ]
    }
];

interface AdminSidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

/**
 * @deprecated Use the consolidated Sidebar in components/layout/sidebar.tsx instead
 */
export function AdminSidebar({ collapsed, setCollapsed }: AdminSidebarProps) {
    const pathname = usePathname();
    const auth = useAuth();
    const isSuperAdmin = auth.me?.role === 'super_admin';
    const items = isSuperAdmin ? [...adminNavItems, ...superAdminNavItems] : adminNavItems;

    return (
        <aside
            aria-label="Admin navigasyonu"
            className={cn(
                'fixed left-[var(--sidebar-width)] top-[var(--topbar-height)] bottom-0 z-30',
                'border-r border-border bg-card transition-all duration-300 ease-[var(--ease-smooth)]',
                'hidden lg:block',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex h-14 items-center justify-between border-b border-border px-4">
                    {!collapsed && (
                        <h2 className="text-sm font-semibold text-foreground">
                            Admin Panel
                        </h2>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 px-2 py-4">
                    <TooltipProvider delayDuration={0}>
                        <nav className="space-y-1">
                            {items.map((item) => {
                                const isActive = pathname === item.href || (item.children && item.children.some(child => pathname.startsWith(child.href)));
                                const linkEl = (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                            'hover:bg-accent hover:text-accent-foreground',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                            isActive
                                                ? 'bg-accent text-accent-foreground'
                                                : 'text-muted-foreground',
                                            collapsed && 'justify-center'
                                        )}
                                    >
                                        {/* Fallback for deprecated component to render basic icon layout */}
                                        <span className={cn(collapsed ? 'h-5 w-5' : 'h-4 w-4')} title={item.icon}>
                                            <span className="sr-only">{item.label}</span>
                                        </span>
                                        {!collapsed && <span>{item.label}</span>}
                                    </Link>
                                );

                                if (collapsed) {
                                    return (
                                        <Tooltip key={item.href}>
                                            <TooltipTrigger asChild>
                                                {linkEl}
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                {item.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                }

                                return linkEl;
                            })}
                        </nav>
                    </TooltipProvider>
                </ScrollArea>
            </div>
        </aside>
    );
}
