'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Inbox, Package, Settings, MoreHorizontal, BarChart2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSite } from '@/components/site/site-provider';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const mobileNavItems = [
  { label: 'Ana Sayfa', href: '/home', icon: Home },
  { label: 'Gelen Kutusu', href: '/inbox/offers', icon: Inbox, matchPrefix: '/inbox' },
  { label: 'Modüller', href: '/modules/offer', icon: Package, matchPrefix: '/modules' },
];

const moreMenuItems = [
  { label: 'Analitik', href: '/analytics', icon: BarChart2 },
  { label: 'Site', href: '/site/pages', icon: Globe, matchPrefix: '/site' },
  { label: 'Ayarlar', href: '/settings/users', icon: Settings, matchPrefix: '/settings' },
];

export function MobileNav() {
  const pathname = usePathname();
  const site = useSite();
  const { data: unreadCount } = useUnreadCount(site.currentSiteId);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Check if any of the more menu items are active
  const isMoreMenuActive = moreMenuItems.some(item =>
    item.matchPrefix ? pathname.startsWith(item.matchPrefix) : pathname.startsWith(item.href)
  );

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
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 relative active:scale-95',
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

        {/* More menu */}
        <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 relative active:scale-95',
                isMoreMenuActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {/* Active indicator dot */}
              {isMoreMenuActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">Daha Fazla</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Daha Fazla</SheetTitle>
            </SheetHeader>
            <div className="grid gap-2 py-4">
              {moreMenuItems.map((item) => {
                const isActive = item.matchPrefix
                  ? pathname.startsWith(item.matchPrefix)
                  : pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-[0.98]',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-foreground',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
