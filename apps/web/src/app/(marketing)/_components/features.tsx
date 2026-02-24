'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  BarChart3,
  MessageSquare,
  Zap,
  Shield,
  Globe,
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Müşteri Portalı',
    description: 'Müşterileriniz projelerini gerçek zamanlı takip edebilir, geri bildirim verebilir.',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: FolderKanban,
    title: 'Proje Yönetimi',
    description: 'Kanban panoları, görev atamaları ve ilerleme takibi ile projelerinizi kontrol altında tutun.',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    icon: Users,
    title: 'CRM Entegrasyonu',
    description: 'Müşteri ilişkilerinizi yönetin, fırsatları takip edin ve satışları artırın.',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    icon: BarChart3,
    title: 'Gelişmiş Analitik',
    description: 'Detaylı raporlar ve dashboard ile işletme performansınızı analiz edin.',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    icon: MessageSquare,
    title: 'Entegre İletişim',
    description: 'Ekip içi mesajlaşma, müşteri yorumları ve bildirimler tek yerde.',
    color: 'bg-pink-500/10 text-pink-500',
  },
  {
    icon: Zap,
    title: 'Otomasyon',
    description: 'Tekrarlayan görevleri otomatikleştirin, zaman kazanın ve hataları azaltın.',
    color: 'bg-yellow-500/10 text-yellow-500',
  },
  {
    icon: Shield,
    title: 'Güvenlik',
    description: 'SSL şifreleme, iki faktörlü kimlik doğrulama ve düzenli yedekleme.',
    color: 'bg-red-500/10 text-red-500',
  },
  {
    icon: Globe,
    title: 'Çoklu Dil Desteği',
    description: 'Türkçe, İngilizce ve daha fazla dil seçeneği ile global ölçekte çalışın.',
    color: 'bg-cyan-500/10 text-cyan-500',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Her Şey Tek Bir Platformda
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Prosektor, web ajanslarının ihtiyaç duyduğu tüm özellikleri tek bir çatı altında toplar.
            Karmaşık araçlar yerine, sade ve güçlü bir çözüm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group glass hover-lift border-0 cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              tabIndex={0}
              role="article"
              aria-label={feature.title}
            >
              <CardContent className="p-6">
                <div
                  className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
