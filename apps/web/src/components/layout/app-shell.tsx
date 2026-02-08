'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Toaster } from '@/components/ui/sonner';

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

/**
 * AppShell - Main layout wrapper per agents.md spec
 * 
 * Layout structure:
 * - Fixed sidebar (left, 256px)
 * - Fixed topbar (top, 64px)
 * - Main content area with scroll
 */
export function AppShell({ children, user, tenant }: AppShellProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <Topbar user={user} tenant={tenant} />

            {/* Main content */}
            <main className="ml-64 pt-16">
                <div className="p-6">
                    {children}
                </div>
            </main>

            <Toaster />
        </div>
    );
}
