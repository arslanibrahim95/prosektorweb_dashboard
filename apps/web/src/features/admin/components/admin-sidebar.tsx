'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Users,
    FileText,
    BarChart3,
    ScrollText,
    Bell,
    Shield,
    Key,
    Settings,
    Languages,
    Palette,
    Database,
    HardDrive,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface AdminNavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const NAV_ICON_SIZE = 'h-5 w-5';

const adminNavItems: AdminNavItem[] = [
    {
        label: 'Genel Bakış',
        href: '/admin',
        icon: <LayoutDashboard className={NAV_ICON_SIZE} />,
    },
    {
        label: 'Kullanıcı Yönetimi',
        href: '/admin/users',
        icon: <Users className={NAV_ICON_SIZE} />,
    },
    {
        label: 'İçerik Yönetimi',
        href: '/admin/content',
        icon: <FileText className={NAV_ICON_SIZE} />,
    },
    {
        label: 'Analitik & İstatistik',
        href: '/admin/analytics',
        icon: <BarChart3 className={NAV_ICON_SIZE} />,
    },
    {
        label: 'Aktivite Logları',
        href: '/admin/logs',
        icon: <ScrollText className={NAV_ICON_SIZE} />,
    },
    {
        label: 'Bildirimler',
        href: '/admin/notifications',
        icon: <Bell className={NAV_ICON_SIZE} />,
    },
    {
        label: 'Güvenlik',
        href: '/admin/security',
        icon: <Shield className={NAV_ICON_SIZE} />,
    },
    {
        label: 'API Yönetimi',
        href: '/admin/api',
        icon: <Key className={NAV_ICON_SIZE} />,
    },
    {
        label: 'Sistem Ayarları',
        href: '/admin/settings',
        icon: <Settings className={NAV_ICON_SIZE} />,
    },
    {
        label: 'Dil Yönetimi',
        href: '/admin/i18n',
        icon: <Languages className={NAV_ICON_SIZE} />,
    },
    {
        label: 'Tema',
        href: '/admin/theme',
        icon: <Palette className={NAV_ICON_SIZE} />,
    },
    {
        label: 'Önbellek',
        href: '/admin/cache',
        icon: <Database className={NAV_ICON_SIZE} />,
    },
    {
        label: 'Yedekleme',
        href: '/admin/backup',
        icon: <HardDrive className={NAV_ICON_SIZE} />,
    },
];

interface AdminSidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

export function AdminSidebar({ collapsed, setCollapsed }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <aside
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
                        className="h-8 w-8"
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
                    <nav className="space-y-1">
                        {adminNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                        'hover:bg-accent hover:text-accent-foreground',
                                        isActive
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground',
                                        collapsed && 'justify-center'
                                    )}
                                    title={collapsed ? item.label : undefined}
                                >
                                    {item.icon}
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>
            </div>
        </aside>
    );
}
