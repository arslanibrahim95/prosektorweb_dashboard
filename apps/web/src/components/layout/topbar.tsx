'use client';

import {
    Bell,
    Menu,
    Sun,
    Moon,
    ChevronsUpDown,
    Globe,
    Check,
    Building2,
    HelpCircle,
    Loader2,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from './app-shell';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useSite } from '@/components/site/site-provider';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface TopbarProps {
    user?: {
        name: string;
        email: string;
        avatar_url?: string;
    };
    tenant?: {
        name: string;
    };
    sidebarCollapsed?: boolean;
}

const HEADER_ICON_SIZE_CLASS = 'h-[var(--font-size-lg)] w-[var(--font-size-lg)]';

import { ROUTE_LABELS } from '@/constants/routes';

function useBreadcrumb() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((seg) => ROUTE_LABELS[seg] ?? seg);
}

import { UserDropdown } from '@/features/auth/components/user-dropdown';
import { SearchPaletteTrigger } from '@/features/search/components/search-palette-trigger';

export function Topbar({ user, tenant, sidebarCollapsed = false }: TopbarProps) {
    const { toggleMobile } = useSidebar();
    const { theme, setTheme } = useTheme();
    const auth = useAuth();
    const router = useRouter();
    const site = useSite();
    const { data: unreadData } = useUnreadCount(site.currentSiteId);
    const unreadCount = unreadData?.total ?? 0;
    const breadcrumbs = useBreadcrumb();
    const isSuperAdmin = auth.me?.role === 'super_admin';
    const availableTenants = auth.availableTenants;
    const currentTenantId = auth.me?.active_tenant_id ?? auth.activeTenantId;
    const currentTenant =
        availableTenants.find((item) => item.id === currentTenantId) ??
        availableTenants.find((item) => item.id === auth.me?.tenant.id);

    // Tenant switch: show toast on completion
    const prevSwitching = useRef(false);
    useEffect(() => {
        if (prevSwitching.current && !auth.isSwitchingTenant) {
            const name = currentTenant?.name ?? 'Tenant';
            toast.success(`${name} hesabına geçildi`);
        }
        prevSwitching.current = auth.isSwitchingTenant;
    }, [auth.isSwitchingTenant, currentTenant?.name]);

    return (
        <header className={`fixed top-0 right-0 left-0 z-30 h-[var(--topbar-height)] glass transition-[left] duration-300 ease-[var(--ease-smooth)] ${sidebarCollapsed
            ? 'lg:left-[var(--sidebar-width-collapsed)]'
            : 'lg:left-[var(--sidebar-width)]'
            }`}>
            <div className="dashboard-topbar-content flex h-full items-center justify-between">
                {/* Left: Hamburger + Search */}
                <div className="flex items-center gap-3 flex-1">
                    {/* Mobile hamburger */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden shrink-0"
                        onClick={toggleMobile}
                        aria-label="Navigasyon menüsünü aç"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    {/* Desktop Breadcrumb */}
                    <nav className="hidden lg:flex items-center gap-1.5" aria-label="Breadcrumb">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
                                <span className={
                                    i === breadcrumbs.length - 1
                                        ? 'text-sm text-foreground font-medium'
                                        : 'text-sm text-muted-foreground'
                                }>
                                    {crumb}
                                </span>
                            </span>
                        ))}
                    </nav>

                    {/* Mobile: show only last segment */}
                    <span className="lg:hidden text-sm font-medium text-foreground truncate max-w-[140px]">
                        {breadcrumbs[breadcrumbs.length - 1] ?? ''}
                    </span>

                    {/* Command Palette Trigger */}
                    <SearchPaletteTrigger />
                </div>

                {/* Right section */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Tenant context */}
                    {isSuperAdmin ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1.5 h-7 text-xs">
                                    <Building2 className="h-3 w-3" />
                                    <span className="max-w-[160px] truncate">
                                        {currentTenant?.name ?? tenant?.name ?? 'Tenant seçin'}
                                    </span>
                                    <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-72">
                                <DropdownMenuLabel>Tenant Seçin</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {availableTenants.map((item) => (
                                    <DropdownMenuItem
                                        key={item.id}
                                        onClick={() => auth.switchTenant(item.id)}
                                        disabled={auth.isSwitchingTenant}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">{item.name}</div>
                                            <div className="text-[11px] text-muted-foreground">
                                                {item.slug} · {item.plan} · {item.status}
                                            </div>
                                        </div>
                                        {item.id === currentTenantId && (
                                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : tenant ? (
                        <Badge variant="outline" className="hidden md:flex bg-primary/5 text-primary border-primary/20 font-medium">
                            {tenant.name}
                        </Badge>
                    ) : null}

                    {/* Site Selector */}
                    {site.sites.length > 1 ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1.5 h-7 text-xs">
                                    <Globe className="h-3 w-3" />
                                    <span className="max-w-[120px] truncate">
                                        {site.sites.find(s => s.id === site.currentSiteId)?.name ?? 'Site'}
                                    </span>
                                    <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Site Seçin</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {site.sites.map(s => (
                                    <DropdownMenuItem
                                        key={s.id}
                                        onClick={() => site.setCurrentSiteId(s.id)}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="truncate">{s.name}</span>
                                        {s.id === site.currentSiteId && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : site.sites.length === 1 ? (
                        <Badge variant="secondary" className="hidden md:flex text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {site.sites[0]?.name ?? 'Site'}
                        </Badge>
                    ) : null}

                    {/* Help */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-help-sheet'))}
                        aria-label="Yardım"
                    >
                        <HelpCircle className="h-5 w-5" />
                    </Button>

                    {/* Theme toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-muted-foreground hover:text-foreground"
                                aria-label={`Bildirimler${unreadCount > 0 ? `, ${unreadCount} okunmamış` : ''}`}
                            >
                                <Bell className={HEADER_ICON_SIZE_CLASS} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-[var(--font-size-xs)] font-semibold text-white flex items-center justify-center px-1 ring-2 ring-background animate-[pulse-soft_2s_ease-in-out_infinite]">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                <span>Bildirimler</span>
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                        {unreadCount} yeni
                                    </Badge>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {unreadCount > 0 && unreadData ? (
                                <>
                                    {unreadData.offers > 0 && (
                                        <DropdownMenuItem onClick={() => router.push('/inbox/offers')}>
                                            <div className="flex flex-col gap-1 w-full">
                                                <span className="font-medium text-sm">Teklifler ({unreadData.offers})</span>
                                                <span className="text-xs text-muted-foreground">Gelen kutunuzda okunmamış teklifler var</span>
                                            </div>
                                        </DropdownMenuItem>
                                    )}
                                    {unreadData.contacts > 0 && (
                                        <DropdownMenuItem onClick={() => router.push('/inbox/contact')}>
                                            <div className="flex flex-col gap-1 w-full">
                                                <span className="font-medium text-sm">İletişim ({unreadData.contacts})</span>
                                                <span className="text-xs text-muted-foreground">Yeni iletişim mesajlarınız var</span>
                                            </div>
                                        </DropdownMenuItem>
                                    )}
                                    {unreadData.applications > 0 && (
                                        <DropdownMenuItem onClick={() => router.push('/inbox/applications')}>
                                            <div className="flex flex-col gap-1 w-full">
                                                <span className="font-medium text-sm">Başvurular ({unreadData.applications})</span>
                                                <span className="text-xs text-muted-foreground">Yeni başvurular incelemenizi bekliyor</span>
                                            </div>
                                        </DropdownMenuItem>
                                    )}
                                </>
                            ) : (
                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                    Tüm bildirimler okundu
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Separator */}
                    <div className="hidden sm:block h-6 w-px bg-border/50" />

                    {/* User menu */}
                    <UserDropdown
                        user={user}
                        tenantName={currentTenant?.name ?? tenant?.name}
                        onSignOut={async () => await auth.signOut()}
                    />
                </div>
            </div>
            {/* Gradient border for visual depth */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            {/* Tenant switch loading overlay */}
            {auth.isSwitchingTenant && (
                <div className="absolute inset-0 z-50 flex items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium text-primary">Hesap değiştiriliyor...</span>
                </div>
            )}
        </header>
    );
}

