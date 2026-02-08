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
    Image,
    Link2,
    Search,
    Send,
    Briefcase,
    Users,
    Scale,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    children?: NavItem[];
}

const navItems: NavItem[] = [
    {
        label: 'Ana Sayfa',
        href: '/home',
        icon: <Home className="h-5 w-5" />,
    },
    {
        label: 'Site',
        href: '/site',
        icon: <Globe className="h-5 w-5" />,
        children: [
            { label: 'Sayfalar', href: '/site/pages', icon: <FileText className="h-4 w-4" /> },
            { label: 'Sayfa Düzenleyici', href: '/site/builder', icon: <Palette className="h-4 w-4" /> },
            { label: 'Menüler', href: '/site/menus', icon: <MenuIcon className="h-4 w-4" /> },
            { label: 'Medya', href: '/site/media', icon: <Image className="h-4 w-4" /> },
            { label: 'Domainler', href: '/site/domains', icon: <Link2 className="h-4 w-4" /> },
            { label: 'SEO', href: '/site/seo', icon: <Search className="h-4 w-4" /> },
            { label: 'Yayınla', href: '/site/publish', icon: <Send className="h-4 w-4" /> },
        ],
    },
    {
        label: 'Modüller',
        href: '/modules',
        icon: <Package className="h-5 w-5" />,
        children: [
            { label: 'Teklif Alma', href: '/modules/offer', icon: <FileText className="h-4 w-4" /> },
            { label: 'İletişim', href: '/modules/contact', icon: <Users className="h-4 w-4" /> },
            { label: 'İş İlanları', href: '/modules/hr/job-posts', icon: <Briefcase className="h-4 w-4" /> },
            { label: 'Başvurular (HR)', href: '/modules/hr/applications', icon: <Users className="h-4 w-4" /> },
            { label: 'Yasal Metinler', href: '/modules/legal', icon: <Scale className="h-4 w-4" /> },
        ],
    },
    {
        label: 'Gelen Kutusu',
        href: '/inbox',
        icon: <Inbox className="h-5 w-5" />,
        children: [
            { label: 'Teklifler', href: '/inbox/offers', icon: <FileText className="h-4 w-4" /> },
            { label: 'İletişim Mesajları', href: '/inbox/contact', icon: <Users className="h-4 w-4" /> },
            { label: 'İş Başvuruları', href: '/inbox/applications', icon: <Briefcase className="h-4 w-4" /> },
        ],
    },
    {
        label: 'Analitik',
        href: '/analytics',
        icon: <BarChart2 className="h-5 w-5" />,
    },
    {
        label: 'Ayarlar',
        href: '/settings',
        icon: <Settings className="h-5 w-5" />,
        children: [
            { label: 'Kullanıcılar', href: '/settings/users', icon: <Users className="h-4 w-4" /> },
            { label: 'Bildirimler', href: '/settings/notifications', icon: <Inbox className="h-4 w-4" /> },
            { label: 'Fatura & Plan', href: '/settings/billing', icon: <FileText className="h-4 w-4" /> },
        ],
    },
];

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(
        item.children?.some(child => pathname.startsWith(child.href)) || false
    );

    const isActive = pathname === item.href ||
        (item.children && item.children.some(child => pathname.startsWith(child.href)));

    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
        return (
            <div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                >
                    <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>
                {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                        {item.children!.map((child) => (
                            <NavItemComponent key={child.href} item={child} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
        >
            {item.icon}
            <span>{item.label}</span>
        </Link>
    );
}

export function Sidebar() {
    return (
        <aside className="fixed top-0 left-0 z-40 h-screen w-64 border-r bg-white">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/home" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <span className="font-semibold text-lg">ProsektorWeb</span>
                </Link>
            </div>

            {/* Navigation */}
            <ScrollArea className="h-[calc(100vh-4rem)] py-4 px-3">
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <NavItemComponent key={item.href} item={item} />
                    ))}
                </nav>
            </ScrollArea>
        </aside>
    );
}
