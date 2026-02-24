'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Başlangıç',
    description: 'Küçük ajanslar için ideal',
    price: '299',
    period: 'aylık',
    features: [
      '5 aktif proje',
      '10 GB depolama',
      'Temel raporlama',
      'E-posta desteği',
      '2 ekib üyesi',
    ],
    cta: 'Ücretsiz Dene',
    popular: false,
  },
  {
    name: 'Profesyonel',
    description: 'Büyüyen ajanslar için',
    price: '799',
    period: 'aylık',
    features: [
      'Sınırsız proje',
      '100 GB depolama',
      'Gelişmiş analitik',
      'Öncelikli destek',
      '10 ekip üyesi',
      'Müşteri portalı',
      'API erişimi',
    ],
    cta: 'Hemen Başla',
    popular: true,
  },
  {
    name: 'Kurumsal',
    description: 'Büyük ölçekli projeler için',
    price: 'Özel',
    period: 'fiyatlandırma',
    features: [
      'Sınırsız her şey',
      'Özel sunucu',
      '7/24 telefon desteği',
      'Sınırsız ekip üyesi',
      'Özelleştirme seçenekleri',
      'Özel eğitim',
      'SLA garantisi',
    ],
    cta: 'İletişime Geç',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Şeffaf Fiyatlandırma
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Gizli maliyet yok, sürpriz ücret yok. İhtiyacınıza uygun planı seçin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative glass ${
                plan.popular
                  ? 'border-primary/50 shadow-lg shadow-primary/10 scale-105'
                  : 'border-border/50'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary border-0">
                  En Popüler
                </Badge>
              )}
              <CardHeader className="pb-4">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {plan.price === 'Özel' ? '' : '₺'}
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                        <Check className="h-3 w-3 text-success" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-6 ${
                    plan.popular
                      ? 'gradient-primary border-0'
                      : 'variant-outline'
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href="/login">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
