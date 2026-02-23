'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Globe,
    Package,
    Inbox,
    BarChart2,
    Settings,
    FileText,
    Pencil,
    Link2,
    Search,
    Send,
    Briefcase,
    Users,
    Scale,
    ChevronRight,
    Sparkles,
    PanelLeftClose,
    PanelLeftOpen,
    Shield,
    Database,
    ArrowLeft,
    Zap,
    MessageSquare,
    LayoutDashboard,
} from 'lucide-react';
import { useState, useMemo, memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebar } from './app-shell';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useSite } from '@/components/site/site-provider';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { useAuth } from '@/components/auth/auth-provider';
import { adminNavItems, superAdminNavItems } from '@/features/admin/components/admin-sidebar';

export interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    children?: NavItem[];
    badge?: string;
    color?: string; // section accent color class
}

export interface NavSection {
    label?: string;
    items: NavItem[];
}

const NAV_ICON_SIZE_CLASS = 'h-[18px] w-[18px]';
const CHILD_ICON_SIZE_CLASS = 'h-[14px] w-[14px]';

export const navSections: NavSection[] = [
    {
        items: [
            {
                label: 'Ana Sayfa',
                href: '/home',
                icon: <LayoutDashboard className={NAV_ICON_SIZE_CLASS} />,
            },
        ],
    },
    {
        label: 'SİTE',
        items: [
            {
                label: 'Site',
                href: '/site',
                icon: <Globe className={NAV_ICON_SIZE_CLASS} />,
                color: 'text-blue-400',
                children: [
                    { label: 'Vibe Üretim', href: '/site/generate', icon: <Sparkles className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'Sayfalar', href: '/site/pages', icon: <FileText className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'Sayfa Editörü', href: '/site/builder', icon: <Pencil className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'Domainler', href: '/site/domains', icon: <Link2 className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'SEO', href: '/site/seo', icon: <Search className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'Yayınla', href: '/site/publish', icon: <Send className={CHILD_ICON_SIZE_CLASS} /> },
                ],
            },
            {
                label: 'Modüller',
                href: '/modules',
                icon: <Package className={NAV_ICON_SIZE_CLASS} />,
                color: 'text-violet-400',
                children: [
                    { label: 'Teklif Alma', href: '/modules/offer', icon: <Zap className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'İletişim', href: '/modules/contact', icon: <MessageSquare className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'İş İlanları', href: '/modules/hr/job-posts', icon: <Briefcase className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'Başvurular', href: '/modules/hr/applications', icon: <Users className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'Yasal Metinler', href: '/modules/legal', icon: <Scale className={CHILD_ICON_SIZE_CLASS} /> },
                ],
            },
        ],
    },
    {
        label: 'GELEN KUTUSU',
        items: [
            {
                label: 'Gelen Kutusu',
                href: '/inbox',
                icon: <Inbox className={NAV_ICON_SIZE_CLASS} />,
                color: 'text-emerald-400',
                children: [
                    { label: 'Teklifler', href: '/inbox/offers', icon: <Zap className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'İletişim', href: '/inbox/contact', icon: <MessageSquare className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'Başvurular', href: '/inbox/applications', icon: <Briefcase className={CHILD_ICON_SIZE_CLASS} /> },
                ],
            },
        ],
    },
    {
        label: 'HESAP',
        items: [
            {
                label: 'Analitik',
                href: '/analytics',
                icon: <BarChart2 className={NAV_ICON_SIZE_CLASS} />,
                color: 'text-amber-400',
            },
            {
                label: 'Ayarlar',
                href: '/settings',
                icon: <Settings className={NAV_ICON_SIZE_CLASS} />,
                children: [
                    { label: 'Kullanıcılar', href: '/settings/users', icon: <Users className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'Bildirimler', href: '/settings/notifications', icon: <Inbox className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'Fatura & Plan', href: '/settings/billing', icon: <FileText className={CHILD_ICON_SIZE_CLASS} /> },
                    { label: 'Supabase', href: '/settings/supabase', icon: <Database className={CHILD_ICON_SIZE_CLASS} /> },
                ],
            },
        ],
    },
];

// Flat list for legacy compatibility
export const navItems: NavItem[] = navSections.flatMap(s => s.items);

// ── NavItem Component ─────────────────────────────────────────────────────────

function NavItemComponent({
    item,
    depth = 0,
    collapsed = false,
    unreadCount = 0,
}: {
    item: NavItem;
    depth?: number;
    collapsed?: boolean;
    unreadCount?: number;
}) {
    const pathname = usePathname();
    const { closeMobile } = useSidebar();
    const [isExpanded, setIsExpanded] = useState(
        () => item.children?.some(child => pathname.startsWith(child.href)) ?? false
    );

    const isActive = pathname === item.href
        || (item.children && item.children.some(child => pathname.startsWith(child.href)));
    const isLeafActive = pathname === item.href;
    const hasChildren = !!item.children?.length;
    const showBadge = item.href === '/inbox' && unreadCount > 0;

    // ── Parent item (with children) ───────────────────────────────────────────
    if (hasChildren) {
        const trigger = (
            <button
                type="button"
                onClick={() => !collapsed && setIsExpanded(v => !v)}
                className={cn(
                    'w-full flex items-center rounded-xl text-[13px] font-medium',
                    'transition-all duration-200 ease-out select-none',
                    collapsed ? 'justify-center px-2.5 py-2.5' : 'justify-between px-3 py-2',
                    isActive
                        ? 'bg-white/[0.09] text-white'
                        : 'text-white/60 hover:text-white/90 hover:bg-white/[0.05]',
                )}
            >
                <div className={cn('flex items-center', collapsed ? '' : 'gap-2.5')}>
                    <span className={cn(
                        'shrink-0 transition-colors duration-200',
                        isActive ? (item.color ?? 'text-white') : 'text-white/40 group-hover:text-white/70',
                        item.color && isActive ? item.color : '',
                    )}>
                        {item.icon}
                    </span>
                    {!collapsed && (
                        <span className={cn(isActive ? 'text-white' : '')}>{item.label}</span>
                    )}
                </div>
                {!collapsed && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        {showBadge && (
                            <span className="h-4 min-w-4 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                        <ChevronRight className={cn(
                            'h-3.5 w-3.5 text-white/30 transition-transform duration-200',
                            isExpanded && 'rotate-90'
                        )} />
                    </div>
                )}
            </button>
        );

        return (
            <div>
                {collapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8} className="font-medium text-[13px]">
                            {item.label}
                            {showBadge && <span className="ml-1.5 text-emerald-400">({unreadCount})</span>}
                        </TooltipContent>
                    </Tooltip>
                ) : trigger}

                {!collapsed && (
                    <div className={cn(
                        'overflow-hidden transition-all duration-300 ease-out',
                        isExpanded ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0',
                    )}>
                        <div className="mt-0.5 ml-[22px] pl-3 border-l border-white/[0.07] space-y-0.5 pb-1">
                            {item.children!.map(child => (
                                <NavItemComponent
                                    key={child.href}
                                    item={child}
                                    depth={depth + 1}
                                    collapsed={collapsed}
                                    unreadCount={unreadCount}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Leaf item ─────────────────────────────────────────────────────────────
    const link = (
        <Link
            href={item.href}
            onClick={closeMobile}
            className={cn(
                'group relative flex items-center rounded-xl text-[13px] font-medium',
                'transition-all duration-200 ease-out select-none',
                collapsed
                    ? 'justify-center px-2.5 py-2.5'
                    : depth > 0
                        ? 'gap-2 px-2.5 py-[5px]'
                        : 'gap-2.5 px-3 py-2',
                depth === 0 && isLeafActive
                    ? 'bg-white/[0.09] text-white'
                    : depth > 0 && isLeafActive
                        ? 'text-white'
                        : 'text-white/55 hover:text-white/90 hover:bg-white/[0.04]',
            )}
        >
            {/* Active pill — left border for top-level, dot for children */}
            {isLeafActive && !collapsed && depth === 0 && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
            )}
            {isLeafActive && !collapsed && depth > 0 && (
                <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary" />
            )}

            <span className={cn(
                'shrink-0 transition-colors duration-200',
                depth === 0 && isLeafActive ? (item.color ?? 'text-primary') : '',
                depth === 0 && !isLeafActive ? 'text-white/40' : '',
                depth > 0 && isLeafActive ? 'text-white/90' : '',
                depth > 0 && !isLeafActive ? 'text-white/35' : '',
            )}>
                {item.icon}
            </span>
            {!collapsed && (
                <span>{item.label}</span>
            )}
        </Link>
    );

    if (collapsed && depth === 0) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-medium text-[13px]">
                    {item.label}
                </TooltipContent>
            </Tooltip>
        );
    }

    return link;
}

// ── Section Label ─────────────────────────────────────────────────────────────

const SectionLabel = memo(function SectionLabel({ label }: { label: string }) {
    return (
        <div className="px-3 pt-4 pb-1.5">
            <span className="text-[9px] font-bold tracking-[0.12em] text-white/25 uppercase select-none">
                {label}
            </span>
        </div>
    );
});

// ── User Card (bottom) ────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Süper Admin',
    owner: 'Hesap Sahibi',
    admin: 'Yönetici',
    editor: 'Editör',
    viewer: 'İzleyici',
};

const UserCard = memo(function UserCard({ collapsed }: { collapsed: boolean }) {
    const auth = useAuth();
    const user = auth.me;

    const userName = user?.user?.name;
    const initials = userName
        ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    if (collapsed) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <div className="flex justify-center p-2">
                        <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 ring-2 ring-white/10 cursor-default">
                            <span className="text-[11px] font-bold text-white">{initials}</span>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-medium text-[13px]">
                    {userName ?? 'Kullanıcı'}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <div className="mx-2 mb-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20 ring-2 ring-white/10">
                <span className="text-[11px] font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white/90 truncate leading-tight">
                    {userName ?? 'Kullanıcı'}
                </p>
                <p className="text-[11px] text-white/35 truncate leading-tight mt-0.5">
                    {user?.role ? (ROLE_LABELS[user.role] ?? user.role) : '—'}
                </p>
            </div>
            <div className="shrink-0">
                <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
            </div>
        </div>
    );
});

// ── Site Status Badge ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    published: { dot: 'bg-emerald-400', text: 'Canlı' },
    staging: { dot: 'bg-amber-400', text: 'Staging' },
    draft: { dot: 'bg-white/30', text: 'Taslak' },
} as const;

const SiteStatusBadge = memo(function SiteStatusBadge({ collapsed }: { collapsed: boolean }) {
    const site = useSite();
    const currentSite = site.sites.find(s => s.id === site.currentSiteId);

    if (!currentSite || collapsed) return null;

    const status = STATUS_CONFIG[currentSite.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;

    return (
        <div className="mx-3 mb-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Globe className="h-3 w-3 text-white/30 shrink-0" />
            <span className="text-[12px] text-white/60 truncate flex-1 min-w-0">
                {currentSite.name}
            </span>
            <span className="flex items-center gap-1 shrink-0">
                <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                <span className="text-[10px] text-white/40 font-medium">{status.text}</span>
            </span>
        </div>
    );
});

// ── Sidebar ───────────────────────────────────────────────────────────────────

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

    const currentSections = useMemo((): NavSection[] => {
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

                {/* ── Logo ─────────────────────────────────────────────────── */}
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

                {/* ── Divider ──────────────────────────────────────────────── */}
                <div className="mx-3 h-px bg-white/[0.06] shrink-0" />

                {/* ── Site Status ──────────────────────────────────────────── */}
                {!collapsed && (
                    <div className="shrink-0 pt-2">
                        <SiteStatusBadge collapsed={collapsed} />
                    </div>
                )}

                {/* ── Navigation ───────────────────────────────────────────── */}
                <ScrollArea className="flex-1 min-h-0 px-2 py-1">
                    <nav>
                        {/* Admin back button */}
                        {isAdminPath && (
                            <div className="mb-2">
                                <NavItemComponent
                                    item={{
                                        label: "Dashboard'a Dön",
                                        href: '/home',
                                        icon: <ArrowLeft className={NAV_ICON_SIZE_CLASS} />,
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

                        {/* Sections */}
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

                        {/* Admin link */}
                        {isAdmin && !isAdminPath && (
                            <>
                                <div className="my-3 mx-1 h-px bg-white/[0.06]" />
                                {!collapsed && <SectionLabel label="YÖNETİCİ" />}
                                <div className="space-y-0.5">
                                    <NavItemComponent
                                        item={{
                                            label: 'Yönetici Paneli',
                                            href: '/admin',
                                            icon: <Shield className={NAV_ICON_SIZE_CLASS} />,
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

                {/* ── User Card ────────────────────────────────────────────── */}
                <div className="shrink-0">
                    <div className="mx-2 mb-2 h-px bg-white/[0.05]" />
                    <UserCard collapsed={collapsed} />
                </div>

                {/* ── Collapse Toggle ──────────────────────────────────────── */}
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
