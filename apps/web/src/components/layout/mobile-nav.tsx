'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSite } from '@/components/site/site-provider';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { getMobileNavItems, type MobileNavItem } from './sidebar-nav-data';
import { NavIcons } from './sidebar-nav-icons';
import {
  BADGE_MAX_DISPLAY,
  BADGE_OVERFLOW_TEXT,
  NAV_ICON_SIZE,
  NAV_FONT_SIZE,
  MIN_TOUCH_SIZE,
  NAV_PADDING,
  ACTIVE_SCALE,
  NAV_ITEM_IDS,
} from '@/constants/ui';

/**
 * URL'nin aktif olup olmadığını kontrol eder
 * matchPrefix varsa prefix matching, yoksa exact veya child matching yapar
 */
function isActivePath(pathname: string, href: string, matchPrefix?: string): boolean {
  if (matchPrefix) {
    return pathname.startsWith(matchPrefix);
  }
  // normalize href to ensure proper matching
  const normalizedHref = href.endsWith('/') ? href : href + '/';
  return pathname === href || pathname.startsWith(normalizedHref);
}

/**
 * Badge için gösterilecek metni döndürür
 */
function getBadgeText(count: number): string {
  return count > BADGE_MAX_DISPLAY ? BADGE_OVERFLOW_TEXT : String(count);
}

export function MobileNav() {
  const pathname = usePathname();
  const site = useSite();
  const { data: unreadCount = 0 } = useUnreadCount(site?.currentSiteId ?? '');

  // Error handling: site ID yoksa navigasyonu gösterme
  if (!site?.currentSiteId) {
    return null;
  }

  // Tek kaynak: sidebar-nav-data'dan mobile item'ları al
  const mobileNavItems = getMobileNavItems();

  return (
    <nav
      aria-label="Mobil navigasyon"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-strong border-t border-border/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {mobileNavItems.map((item: MobileNavItem) => {
          const isActive = isActivePath(pathname, item.href, item.matchPrefix);
          const Icon = NavIcons[item.icon];

          // ID-based badge kontrolü - label string karşılaştırması yerine
          const showBadge = item.badgeId === NAV_ITEM_IDS.INBOX &&
            unreadCount != null &&
            unreadCount > 0;

          if (!Icon) {
            console.warn(`Icon not found: ${item.icon}`);
            return null;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5',
                NAV_PADDING.x,
                NAV_PADDING.y,
                'rounded-lg transition-all duration-200 relative',
                ACTIVE_SCALE,
                MIN_TOUCH_SIZE.icon,
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
                <Icon className={NAV_ICON_SIZE.mobile} />
                {showBadge && (
                  <span className={cn(
                    'absolute -top-1.5 -right-2',
                    MIN_TOUCH_SIZE.badge,
                    'flex items-center justify-center rounded-full bg-destructive text-destructive-foreground',
                    NAV_FONT_SIZE.label,
                    'font-bold px-1'
                  )}>
                    {getBadgeText(unreadCount)}
                  </span>
                )}
              </div>
              <span className={cn(NAV_FONT_SIZE.label, 'font-medium leading-none')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
