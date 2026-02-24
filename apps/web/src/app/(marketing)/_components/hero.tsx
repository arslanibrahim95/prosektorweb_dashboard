'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Yeni: AI Destekli Proje Yönetimi
          </Badge>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-foreground">
            Web Ajansınızı{' '}
            <span className="text-gradient">Geleceğe</span>{' '}
            Taşıyın
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Prosektor ile projelerinizi, müşterilerinizi ve ekibinizi tek bir platformda yönetin. 
            Daha hızlı teslimat, daha mutlu müşteriler.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="gradient-primary border-0 text-lg px-8 h-12 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              asChild
            >
              <Link href="/login">
                Ücretsiz Başla
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 h-12"
            >
              <Play className="mr-2 h-5 w-5" />
              Tanıtım Videosu
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-6">
              500+ ajansın güvendiği platform
            </p>
            <div className="flex items-center justify-center gap-8 opacity-50">
              {['Logo1', 'Logo2', 'Logo3', 'Logo4', 'Logo5'].map((logo) => (
                <div
                  key={logo}
                  className="h-8 w-24 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground"
                >
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-50" />
          <div className="relative glass-strong rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
            <div className="aspect-[16/9] bg-muted/50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  Dashboard Önizlemesi
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Canlı demo için ücretsiz hesap oluşturun
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
