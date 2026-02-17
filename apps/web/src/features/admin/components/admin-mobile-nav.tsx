'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/auth/auth-provider';
import { adminNavItems, superAdminNavItems } from './admin-sidebar';

interface AdminMobileNavProps {
    onNavigate: () => void;
}

export function AdminMobileNav({ onNavigate }: AdminMobileNavProps) {
    const pathname = usePathname();
    const auth = useAuth();
    const isSuperAdmin = auth.me?.role === 'super_admin';
    const items = isSuperAdmin ? [...adminNavItems, ...superAdminNavItems] : adminNavItems;

    return (
        <ScrollArea className="flex-1">
            <nav className="space-y-1 p-2">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                                'hover:bg-accent hover:text-accent-foreground',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                isActive
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </ScrollArea>
    );
}
