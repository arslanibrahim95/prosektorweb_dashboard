'use client';

import { ReactNode, useState, createContext, useContext, useMemo, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Breadcrumbs } from './breadcrumbs';
import { Toaster } from '@/components/ui/sonner';
import { MobileNav } from './mobile-nav';
import { safeLocalStorageGetItem, safeLocalStorageSetItem } from '@/lib/storage';
import type { User, Tenant } from '@/types/entities';

const CommandPalette = dynamic(() => import('@/components/search/command-palette').then(m => m.CommandPalette), { ssr: false });
const ShortcutsHelp = dynamic(() => import('./shortcuts-help').then(m => m.ShortcutsHelp), { ssr: false });
const HelpSheet = dynamic(() => import('@/components/help/help-sheet').then(m => m.HelpSheet), { ssr: false });
const WelcomeModal = dynamic(() => import('@/components/onboarding/welcome-modal').then(m => m.WelcomeModal), { ssr: false });
const TenantOnboardingDrawer = dynamic(() => import('@/components/onboarding/tenant-onboarding-drawer').then(m => m.TenantOnboardingDrawer), { ssr: false });

interface AppShellProps {
    children: ReactNode;
    defaultSidebarCollapsed?: boolean;
    user?: Pick<User, 'name' | 'email' | 'avatar_url'>;
    tenant?: Pick<Tenant, 'name'>;
}

interface SidebarContextValue {
    isMobileOpen: boolean;
    isDesktopCollapsed: boolean;
    toggleMobile: () => void;
    closeMobile: () => void;
    toggleDesktop: () => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within an AppShell SidebarProvider");
    }
    return context;
};

// --- Custom Hook to abstract viewport logic ---
function useMobileViewport() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia('(max-width: 1024px)'); // lg breakpoint in tailwind
        const onChange = () => setIsMobile(mql.matches);

        onChange(); // initial check
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    return isMobile;
}


export function AppShell({ children, user, tenant, defaultSidebarCollapsed = false }: AppShellProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Server render ve ilk client render eşleşmesi (Hydration) için prope güveniyoruz
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
        const stored = safeLocalStorageGetItem('sidebar-collapsed');
        if (stored !== null) {
            return stored === 'true';
        }
        return defaultSidebarCollapsed;
    });

    const isMobileViewport = useMobileViewport();

    const handleToggleDesktop = useCallback(() => {
        setIsDesktopCollapsed(prev => {
            const nextValue = !prev;
            // Best effort async call, do not block render
            requestAnimationFrame(() => {
                safeLocalStorageSetItem('sidebar-collapsed', String(nextValue));
            });
            return nextValue;
        });
    }, []);

    const handleToggleMobile = useCallback(() => setIsMobileOpen(p => !p), []);
    const handleCloseMobile = useCallback(() => setIsMobileOpen(false), []);

    // Performans için context bellek referansını Memoize et
    const contextValue = useMemo(() => ({
        isMobileOpen,
        isDesktopCollapsed,
        toggleMobile: handleToggleMobile,
        closeMobile: handleCloseMobile,
        toggleDesktop: handleToggleDesktop
    }), [isMobileOpen, isDesktopCollapsed, handleToggleMobile, handleCloseMobile, handleToggleDesktop]);

    const mainStyle = {
        '--app-shell-gap': '16px',
    } as CSSProperties;

    return (
        <SidebarContext.Provider value={contextValue}>
            <ErrorBoundary fallback={() => <div className="p-6 text-destructive">Layout bileşenleri yüklenirken kritik bir hata oluştu.</div>}>
                <div className="min-h-screen bg-background flex flex-col relative w-full overflow-hidden">

                    {isMobileViewport && isMobileOpen && (
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label="Menüyü Kapat"
                            onKeyDown={(event) => {
                                if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
                                    event.preventDefault();
                                    handleCloseMobile();
                                }
                            }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity cursor-pointer"
                            onClick={handleCloseMobile}
                        />
                    )}

                    <Sidebar
                        collapsed={isDesktopCollapsed}
                        onToggleCollapse={handleToggleDesktop}
                    />

                    <Topbar
                        user={user}
                        tenant={tenant}
                        sidebarCollapsed={isDesktopCollapsed}
                    />

                    <main
                        style={mainStyle}
                        className={`pt-[var(--topbar-height)] pb-[var(--mobile-nav-height)] lg:pb-0 min-h-screen transition-[margin-left] duration-500 ease-[var(--ease-spring)] ${isDesktopCollapsed
                            ? 'lg:ml-[calc(var(--sidebar-width-collapsed)+var(--app-shell-gap))]'
                            : 'lg:ml-[calc(var(--sidebar-width)+var(--app-shell-gap))]'
                            }`}
                    >
                        <div className="dashboard-main-content page-enter h-full w-full">
                            <ErrorBoundary fallback={() => <div className="p-4 text-destructive">Dashboard yüklenirken kritik bir hata oluştu.</div>}>
                                <Breadcrumbs />
                                {children}
                            </ErrorBoundary>
                        </div>
                    </main>

                    <MobileNav />

                    <>
                        <CommandPalette />
                        <ShortcutsHelp />
                        <HelpSheet />
                        <WelcomeModal />
                        <TenantOnboardingDrawer />
                        <Toaster richColors position="bottom-right" />
                    </>
                </div>
            </ErrorBoundary>
        </SidebarContext.Provider>
    );
}
