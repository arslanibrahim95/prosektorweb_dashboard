'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Ali Yıldız',
    role: 'CEO, Pixel Agency',
    content:
      'Prosektor ile projelerimizi takip etmek çok kolaylaştı. Müşterilerimiz gerçek zamanlı ilerlemeyi görebiliyor ve bu güveni artırıyor.',
    rating: 5,
    initials: 'AY',
  },
  {
    name: 'Selin Kaya',
    role: 'Proje Yöneticisi, Creative Studio',
    content:
      'Daha önce birçok proje yönetim aracı kullandım ama Prosektor kadar ajans odaklısını görmedim. Özellikle CRM entegrasyonu harika.',
    rating: 5,
    initials: 'SK',
  },
  {
    name: 'Burak Demir',
    role: 'Kurucu, WebWorks',
    content:
      'Ekip olarak verimliliğimiz %40 arttı. Otomasyon özellikleri tekrarlayan görevlerden bizi kurtarıyor. Kesinlikle tavsiye ederim.',
    rating: 5,
    initials: 'BD',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Mutlu Müşterilerimiz
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Türkiye&apos;nin önde gelen ajansları Prosektor&apos;ü kullanıyor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="glass border-0">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, idx) => (
                    <Star
                      key={`${testimonial.name}-${idx}`}
                      className="h-4 w-4 fill-warning text-warning"
                    />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '500+', label: 'Aktif Ajans' },
            { value: '10K+', label: 'Tamamlanan Proje' },
            { value: '50K+', label: 'Mutlu Müşteri' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-gradient">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
