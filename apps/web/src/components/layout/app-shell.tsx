'use client';

import { ReactNode, useState, createContext, useContext } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Breadcrumbs } from './breadcrumbs';
import { Toaster } from '@/components/ui/sonner';
import { CommandPalette } from '@/components/search/command-palette';
import { ShortcutsHelp } from './shortcuts-help';
import { WelcomeModal } from '@/components/onboarding/welcome-modal';
import { HelpSheet } from '@/components/help/help-sheet';
import { MobileNav } from './mobile-nav';
import { safeLocalStorageGetItem, safeLocalStorageSetItem } from '@/lib/storage';

interface AppShellProps {
    children: ReactNode;
    user?: {
        name: string;
        email: string;
        avatar_url?: string;
    };
    tenant?: {
        name: string;
    };
}

// Sidebar context for mobile toggle
export const SidebarContext = createContext<{
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
}>({
    isOpen: false,
    toggle: () => { },
    close: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

/**
 * AppShell - Main layout wrapper
 * 
 * Layout structure:
 * - Fixed dark sidebar (left, var(--sidebar-width))
 * - Fixed frosted-glass topbar (top, var(--topbar-height))
 * - Main content area with page transitions
 * - Mobile sidebar overlay
 */
export function AppShell({ children, user, tenant }: AppShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Load sidebar collapsed state from localStorage on initialization (lazy)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return safeLocalStorageGetItem('sidebar-collapsed') === 'true';
    });

    // Persist sidebar collapsed state to localStorage
    const handleSetSidebarCollapsed = (value: boolean) => {
        setSidebarCollapsed(value);
        safeLocalStorageSetItem('sidebar-collapsed', String(value));
    };

    const sidebarCtx = {
        isOpen: isSidebarOpen,
        toggle: () => setIsSidebarOpen(prev => !prev),
        close: () => setIsSidebarOpen(false),
    };

    return (
        <SidebarContext.Provider value={sidebarCtx}>
            <div className="min-h-screen bg-background">
                {/* Mobile overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 glass-strong !bg-black/55 lg:hidden transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={handleSetSidebarCollapsed}
                />

                {/* Topbar */}
                <Topbar
                    user={user}
                    tenant={tenant}
                    sidebarCollapsed={sidebarCollapsed}
                />

                {/* Main content */}
                <main className={`pt-[var(--topbar-height)] pb-16 lg:pb-0 min-h-screen transition-[margin-left] duration-300 ease-[var(--ease-smooth)] ${sidebarCollapsed
                    ? 'lg:ml-[var(--sidebar-width-collapsed)]'
                    : 'lg:ml-[var(--sidebar-width)]'
                    }`}>
                    <div className="dashboard-main-content page-enter">
                        <Breadcrumbs />
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </div>
                </main>

                {/* Mobile bottom navigation */}
                <MobileNav />

                <CommandPalette />
                <ShortcutsHelp />
                <HelpSheet />
                <WelcomeModal />
                <Toaster richColors position="bottom-right" />
            </div>
        </SidebarContext.Provider>
    );
}
