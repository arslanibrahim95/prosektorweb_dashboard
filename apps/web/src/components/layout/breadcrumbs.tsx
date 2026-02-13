'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  home: 'Ana Sayfa',
  site: 'Site',
  pages: 'Sayfalar',
  builder: 'Sayfa Düzenleyici',
  menus: 'Menüler',
  media: 'Medya',
  domains: 'Domainler',
  seo: 'SEO',
  publish: 'Yayınla',
  modules: 'Modüller',
  offer: 'Teklif Alma',
  contact: 'İletişim',
  hr: 'İK',
  'job-posts': 'İş İlanları',
  applications: 'Başvurular',
  legal: 'Yasal Metinler',
  inbox: 'Gelen Kutusu',
  offers: 'Teklifler',
  analytics: 'Analitik',
  settings: 'Ayarlar',
  users: 'Kullanıcılar',
  notifications: 'Bildirimler',
  billing: 'Fatura & Plan',
};

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/home') return null;

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = routeLabels[segment] ?? segment;
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            href="/home"
            className="flex items-center gap-1 hover:text-foreground transition-colors duration-200"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Ana Sayfa</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            {crumb.isLast ? (
              <span className={cn('font-medium text-foreground')}>{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors duration-200"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
