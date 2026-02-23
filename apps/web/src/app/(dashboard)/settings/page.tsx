import Link from 'next/link';
import { Users, Bell, CreditCard, Database, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const navigationItems = [
    {
      href: '/settings/users',
      icon: Users,
      title: 'Kullanıcılar & Erişim',
      description: 'Ekip üyelerini ve erişim yetkilerini yönetin',
    },
    {
      href: '/settings/notifications',
      icon: Bell,
      title: 'Bildirimler',
      description: 'Email ve tarayıcı bildirim tercihleriniz',
    },
    {
      href: '/settings/billing',
      icon: CreditCard,
      title: 'Fatura & Abonelik',
      description: 'Plan ve fatura bilgilerinizi görüntüleyin',
    },
    {
      href: '/settings/supabase',
      icon: Database,
      title: 'Supabase Bağlantısı',
      description: 'Veritabanı bağlantı ayarları',
    },
  ];

  return (
    <div className={cn('dashboard-page')}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">Hesap ve site ayarlarınızı yönetin</p>
      </div>

      {/* Navigation Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group"
            >
              <div className={cn(
                'glass border border-border/50 shadow-sm',
                'hover:border-primary/30 transition-colors',
                'p-5 rounded-xl flex items-center gap-4'
              )}>
                {/* Icon Container */}
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-foreground">{item.title}</div>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                </div>

                {/* Chevron Icon */}
                <ChevronRight className={cn(
                  'h-4 w-4 text-muted-foreground shrink-0',
                  'group-hover:translate-x-0.5 transition-transform'
                )} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Plan Info Card */}
      <Card variant="glass" className="border border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>Mevcut Plan</CardTitle>
            <span className="inline-flex items-center rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success border border-success/20">
              MVP / Beta
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground">Tüm özellikler ücretsiz olarak kullanılabilir.</p>
          <p className="text-xs text-muted-foreground italic">Fatura yönetimi yakında eklenecek.</p>
        </CardContent>
      </Card>
    </div>
  );
}
