'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Home,
    Globe,
    Package,
    Inbox,
    BarChart2,
    Settings,
    FileText,
    Palette,
    Menu as MenuIcon,
    Image as ImageIcon,
    Link2,
    Search,
    Send,
    Briefcase,
    Users,
    Scale,
    ChevronDown,
    Sparkles,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebar } from './app-shell';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useSite } from '@/components/site/site-provider';
import { useUnreadCount } from '@/hooks/use-unread-count';

export interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    children?: NavItem[];
    badge?: string;
}

const NAV_ICON_SIZE_CLASS = 'h-[var(--font-size-lg)] w-[var(--font-size-lg)]';

export const navItems: NavItem[] = [
    {
        label: 'Ana Sayfa',
        href: '/home',
        icon: <Home className={NAV_ICON_SIZE_CLASS} />,
    },
    {
        label: 'Site',
        href: '/site',
        icon: <Globe className={NAV_ICON_SIZE_CLASS} />,
        children: [
            { label: 'Sayfalar', href: '/site/pages', icon: <FileText className="h-4 w-4" /> },
            { label: 'Sayfa Düzenleyici', href: '/site/builder', icon: <Palette className="h-4 w-4" /> },
            { label: 'Menüler', href: '/site/menus', icon: <MenuIcon className="h-4 w-4" /> },
            { label: 'Medya', href: '/site/media', icon: <ImageIcon className="h-4 w-4" /> },
            { label: 'Domainler', href: '/site/domains', icon: <Link2 className="h-4 w-4" /> },
            { label: 'SEO', href: '/site/seo', icon: <Search className="h-4 w-4" /> },
            { label: 'Yayınla', href: '/site/publish', icon: <Send className="h-4 w-4" /> },
        ],
    },
    {
        label: 'Modüller',
        href: '/modules',
        icon: <Package className={NAV_ICON_SIZE_CLASS} />,
        children: [
            { label: 'Teklif Alma', href: '/modules/offer', icon: <FileText className="h-4 w-4" /> },
            { label: 'İletişim', href: '/modules/contact', icon: <Users className="h-4 w-4" /> },
            { label: 'İş İlanları', href: '/modules/hr/job-posts', icon: <Briefcase className="h-4 w-4" /> },
            { label: 'Başvurular', href: '/modules/hr/applications', icon: <Users className="h-4 w-4" /> },
            { label: 'Yasal Metinler', href: '/modules/legal', icon: <Scale className="h-4 w-4" /> },
        ],
    },
    {
        label: 'Gelen Kutusu',
        href: '/inbox',
        icon: <Inbox className={NAV_ICON_SIZE_CLASS} />,
        children: [
            { label: 'Teklifler', href: '/inbox/offers', icon: <FileText className="h-4 w-4" /> },
            { label: 'İletişim Mesajları', href: '/inbox/contact', icon: <Users className="h-4 w-4" /> },
            { label: 'İş Başvuruları', href: '/inbox/applications', icon: <Briefcase className="h-4 w-4" /> },
        ],
    },
    {
        label: 'Analitik',
        href: '/analytics',
        icon: <BarChart2 className={NAV_ICON_SIZE_CLASS} />,
    },
    {
        label: 'Ayarlar',
        href: '/settings',
        icon: <Settings className={NAV_ICON_SIZE_CLASS} />,
        children: [
            { label: 'Kullanıcılar', href: '/settings/users', icon: <Users className="h-4 w-4" /> },
            { label: 'Bildirimler', href: '/settings/notifications', icon: <Inbox className="h-4 w-4" /> },
            { label: 'Fatura & Plan', href: '/settings/billing', icon: <FileText className="h-4 w-4" /> },
        ],
    },
];

function NavItemComponent({ item, depth = 0, collapsed = false, unreadCount = 0 }: { item: NavItem; depth?: number; collapsed?: boolean; unreadCount?: number }) {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(
        item.children?.some(child => pathname.startsWith(child.href)) || false
    );
    const { close } = useSidebar();

    const isActive = pathname === item.href ||
        (item.children && item.children.some(child => pathname.startsWith(child.href)));

    const hasChildren = item.children && item.children.length > 0;

    // Show badge for inbox with unread count
    const showBadge = item.label === 'Gelen Kutusu' && unreadCount > 0;

    if (hasChildren) {
        const buttonContent = (
            <button
                type="button"
                onClick={() => !collapsed && setIsExpanded(!isExpanded)}
                className={cn(
                    'w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                    collapsed ? 'justify-center px-3 py-2.5' : 'justify-between px-3 py-2.5',
                    isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90'
                )}
            >
                <div className={cn('flex items-center', collapsed ? '' : 'gap-3')}>
                    <span className={cn(
                        'transition-colors duration-200',
                        isActive ? 'text-sidebar-primary' : 'text-white/50'
                    )} aria-hidden="true">
                        {item.icon}
                    </span>
                    {!collapsed && (
                        <>
                            <span className="sr-only">
                                {isExpanded ? `${item.label} menüsünü daralt` : `${item.label} menüsünü genişlet`}
                            </span>
                            <span aria-hidden="true">{item.label}</span>
                        </>
                    )}
                </div>
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        {showBadge && (
                            <span className="h-5 min-w-5 flex items-center justify-center rounded-full bg-sidebar-primary/20 text-sidebar-primary text-[var(--font-size-xs)] font-semibold px-1.5">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                        <ChevronDown className={cn(
                            'h-4 w-4 text-white/60 transition-transform duration-200',
                            isExpanded ? 'rotate-0' : '-rotate-90'
                        )} aria-hidden="true" />
                    </div>
                )}
            </button>
        );

        return (
            <div>
                {collapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            {buttonContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                            {item.label}
                            {showBadge && ` (${unreadCount})`}
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    buttonContent
                )}
                {!collapsed && (
                    <div className={cn(
                        'overflow-hidden transition-all duration-200',
                        isExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                    )}>
                        <div className="ml-4 space-y-0.5 border-l border-white/[0.06] pl-3">
                            {item.children!.map((child) => (
                                <NavItemComponent key={child.href} item={child} depth={depth + 1} collapsed={collapsed} unreadCount={unreadCount} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const linkContent = (
        <Link
            href={item.href}
            onClick={close}
            className={cn(
                'group flex items-center rounded-lg text-sm font-medium transition-all duration-200 relative',
                collapsed ? 'justify-center px-3 py-2.5' : 'gap-3 px-3 py-2.5',
                depth > 0 && !collapsed ? 'py-2' : '',
                pathname === item.href
                    ? 'bg-sidebar-primary/15 text-white'
                    : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90'
            )}
        >
            {/* Active indicator */}
            {pathname === item.href && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary" />
            )}
            <span className={cn(
                'transition-colors duration-200',
                pathname === item.href ? 'text-sidebar-primary' : depth > 0 ? 'text-white/60' : 'text-white/50'
            )} aria-hidden="true">
                {item.icon}
            </span>
            {!collapsed && (
                <>
                    <span className="sr-only">{`${item.label} sayfasına git`}</span>
                    <span aria-hidden="true">{item.label}</span>
                </>
            )}
        </Link>
    );

    if (collapsed && depth === 0) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                    {item.label}
                </TooltipContent>
            </Tooltip>
        );
    }

    return linkContent;
}

interface SidebarProps {
    collapsed?: boolean;
    onToggleCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
    const { isOpen } = useSidebar();
    const site = useSite();
    const { data: unreadCount = 0 } = useUnreadCount(site.currentSiteId);

    return (
        <TooltipProvider>
            <aside className={cn(
                'fixed top-0 left-0 z-50 h-screen gradient-sidebar transition-all duration-300 ease-[var(--ease-smooth)]',
                'lg:translate-x-0',
                collapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Logo */}
                <div className={cn(
                    'flex h-[var(--topbar-height)] items-center',
                    collapsed ? 'justify-center px-3' : 'px-5'
                )}>
                    <Link href="/home" className="flex items-center gap-3 group">
                        <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        {!collapsed && (
                            <div>
                                <span className="font-bold text-[15px] text-white tracking-tight">ProsektorWeb</span>
                                <span className="block text-[var(--font-size-xs)] text-white/60 font-medium tracking-widest uppercase">Dashboard</span>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Separator */}
                <div className="mx-[var(--spacing-dashboard-content-x-mobile)] h-px bg-white/[0.06]" />

                {/* Navigation */}
                <ScrollArea className="h-[calc(100vh-var(--topbar-height)-var(--spacing-dashboard-content-y-mobile)-60px)] py-[var(--spacing-dashboard-content-y-mobile)] px-3">
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavItemComponent key={item.href} item={item} collapsed={collapsed} unreadCount={unreadCount} />
                        ))}
                    </nav>

                    {/* Bottom section */}
                    <div className={cn(
                        'mt-8 mx-1 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]',
                        collapsed && 'flex justify-center p-2'
                    )}>
                        <div className={cn(
                            'flex items-center text-[var(--font-size-xs)] text-white/60',
                            collapsed ? 'justify-center' : 'gap-2'
                        )}>
                            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            {!collapsed && <span>Sistem aktif</span>}
                        </div>
                        {!collapsed && (
                            <p className="text-[var(--font-size-xs)] text-white/20 mt-1">v1.0.0 MVP</p>
                        )}
                    </div>
                </ScrollArea>

                {/* Collapse toggle button */}
                <div className={cn(
                    'absolute bottom-0 left-0 right-0 p-3 border-t border-white/[0.06]',
                    'hidden lg:block'
                )}>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onToggleCollapse?.(!collapsed)}
                                className={cn(
                                    'w-full text-white/60 hover:text-white hover:bg-white/[0.06]',
                                    collapsed ? 'h-9' : 'h-9'
                                )}
                                aria-label={collapsed ? 'Kenar çubuğunu genişlet' : 'Kenar çubuğunu daralt'}
                            >
                                {collapsed ? (
                                    <PanelLeftOpen className="h-4 w-4" />
                                ) : (
                                    <>
                                        <PanelLeftClose className="h-4 w-4" />
                                        <span className="ml-2 text-sm font-medium">Daralt</span>
                                    </>
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                            {collapsed ? 'Kenar çubuğunu genişlet' : 'Kenar çubuğunu daralt'}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </aside>
        </TooltipProvider>
    );
}
