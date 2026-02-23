'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Sparkles,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import { navSections, type NavSection } from './sidebar-nav-data';
import { memo, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebar } from './app-shell';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useSite } from '@/components/site/site-provider';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { useAuth } from '@/components/auth/auth-provider';
import { adminNavItems, superAdminNavItems } from '@/features/admin/components/admin-sidebar';
import { NavItemComponent } from './sidebar-nav-item';
import { UserCard } from './sidebar-user-card';
import { SiteStatusBadge } from './sidebar-status-badge';

const SectionLabel = memo(function SectionLabel({ label }: { label: string }) {
    return (
        <div className="px-3 pt-4 pb-1.5">
            <span className="text-[9px] font-bold tracking-[0.12em] text-white/25 uppercase select-none">
                {label}
            </span>
        </div>
    );
});

interface SidebarProps {
    collapsed?: boolean;
    onToggleCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
    const { isMobileOpen } = useSidebar();
    const site = useSite();
    const { data: unreadCount = 0 } = useUnreadCount(site.currentSiteId);
    const auth = useAuth();
    const pathname = usePathname();

    const userRole = auth.me?.role;
    const isAdmin = userRole === 'owner' || userRole === 'admin' || userRole === 'super_admin';
    const isSuperAdmin = userRole === 'super_admin';
    const isAdminPath = pathname.startsWith('/admin');

    const currentSections: NavSection[] = useMemo((): NavSection[] => {
        if (isAdminPath) {
            const items = isSuperAdmin ? [...adminNavItems, ...superAdminNavItems] : adminNavItems;
            return [{ items }];
        }

        const filtered = navSections.map(section => ({
            ...section,
            items: section.items.map(item => {
                if (item.href !== '/settings' || !item.children) return item;
                return {
                    ...item,
                    children: isSuperAdmin
                        ? item.children
                        : item.children.filter(c => c.href !== '/settings/supabase'),
                };
            }),
        }));

        return filtered;
    }, [isAdminPath, isSuperAdmin]);

    return (
        <TooltipProvider>
            <aside className={cn(
                'fixed top-3 left-3 z-50 flex flex-col',
                'h-[calc(100vh-24px)]',
                'bg-[#0a0a0f]/80 backdrop-blur-2xl',
                'border border-white/[0.08]',
                'rounded-[20px]',
                'shadow-2xl shadow-black/40',
                'transition-all duration-500 ease-[var(--ease-spring)]',
                'lg:translate-x-0',
                collapsed ? 'w-[60px]' : 'w-[240px]',
                isMobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+12px)]',
            )}>

                <div className={cn(
                    'flex items-center shrink-0 mt-1',
                    collapsed ? 'justify-center px-2 h-14' : 'px-4 h-14',
                )}>
                    <Link href="/home" className="flex items-center gap-2.5 group min-w-0">
                        <div className="h-8 w-8 shrink-0 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25 transition-transform duration-200 group-hover:scale-105">
                            <Sparkles className="h-[15px] w-[15px] text-white" />
                        </div>
                        {!collapsed && (
                            <div className="min-w-0">
                                <span className="block font-bold text-[14px] text-white tracking-tight leading-tight">
                                    ProsektorWeb
                                </span>
                                <span className="block text-[9px] text-white/35 font-semibold tracking-[0.14em] uppercase leading-tight mt-0.5">
                                    Dashboard
                                </span>
                            </div>
                        )}
                    </Link>
                </div>

                <div className="mx-3 h-px bg-white/[0.06] shrink-0" />

                {!collapsed && (
                    <div className="shrink-0 pt-2">
                        <SiteStatusBadge collapsed={collapsed} />
                    </div>
                )}

                <ScrollArea className="flex-1 min-h-0 px-2 py-1">
                    <nav>
                        {isAdminPath && (
                            <div className="mb-2">
                                <NavItemComponent
                                    item={{
                                        label: "Dashboard'a Dön",
                                        href: '/home',
                                        icon: 'LayoutDashboard',
                                    }}
                                    collapsed={collapsed}
                                    unreadCount={0}
                                />
                                <div className="my-2 mx-1 h-px bg-white/[0.06]" />
                                {!collapsed && (
                                    <div className="px-3 py-1">
                                        <span className="text-[9px] font-bold tracking-[0.12em] text-white/25 uppercase select-none">
                                            Yönetici Paneli
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentSections.map((section, si) => (
                            <div key={si}>
                                {section.label && !collapsed && (
                                    <SectionLabel label={section.label} />
                                )}
                                <div className="space-y-0.5">
                                    {section.items.map(item => (
                                        <NavItemComponent
                                            key={item.href}
                                            item={item}
                                            collapsed={collapsed}
                                            unreadCount={unreadCount}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {isAdmin && !isAdminPath && (
                            <>
                                <div className="my-3 mx-1 h-px bg-white/[0.06]" />
                                {!collapsed && <SectionLabel label="YÖNETİCİ" />}
                                <div className="space-y-0.5">
                                    <NavItemComponent
                                        item={{
                                            label: 'Yönetici Paneli',
                                            href: '/admin',
                                            icon: 'Shield',
                                            color: 'text-rose-400',
                                        }}
                                        collapsed={collapsed}
                                        unreadCount={0}
                                    />
                                </div>
                            </>
                        )}
                    </nav>
                </ScrollArea>

                <div className="shrink-0">
                    <div className="mx-2 mb-2 h-px bg-white/[0.05]" />
                    <UserCard collapsed={collapsed} />
                </div>

                <div className={cn(
                    'shrink-0 px-2 pb-2 hidden lg:block',
                )}>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onToggleCollapse?.(!collapsed)}
                                className="w-full h-8 text-white/30 hover:text-white/70 hover:bg-white/[0.05] rounded-lg"
                                aria-label={collapsed ? 'Kenar çubuğunu genişlet' : 'Kenar çubuğunu daralt'}
                            >
                                {collapsed
                                    ? <PanelLeftOpen className="h-[15px] w-[15px]" />
                                    : <PanelLeftClose className="h-[15px] w-[15px]" />
                                }
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8} className="text-[13px]">
                            {collapsed ? 'Genişlet' : 'Daralt'}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </aside>
        </TooltipProvider>
    );
}
