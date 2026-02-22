'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Inbox, Package, Settings, BarChart2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSite } from '@/components/site/site-provider';
import { useUnreadCount } from '@/hooks/use-unread-count';

const mobileNavItems = [
  { label: 'Ana Sayfa', href: '/home', icon: Home },
  { label: 'Gelen Kutusu', href: '/inbox/offers', icon: Inbox, matchPrefix: '/inbox' },
  { label: 'Site', href: '/site/generate', icon: Globe, matchPrefix: '/site' },
  { label: 'Modüller', href: '/modules/offer', icon: Package, matchPrefix: '/modules' },
  { label: 'Analitik', href: '/analytics', icon: BarChart2 },
  { label: 'Ayarlar', href: '/settings/users', icon: Settings, matchPrefix: '/settings' },
];

export function MobileNav() {
  const pathname = usePathname();
  const site = useSite();
  const { data: unreadCount } = useUnreadCount(site.currentSiteId);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-strong border-t border-border/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {mobileNavItems.map((item) => {
          const isActive = item.matchPrefix
            ? pathname.startsWith(item.matchPrefix)
            : pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          const showBadge = item.label === 'Gelen Kutusu' && unreadCount && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 relative active:scale-95 min-h-11 min-w-11',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
