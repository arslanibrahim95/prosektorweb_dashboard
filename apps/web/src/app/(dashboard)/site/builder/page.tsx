'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction } from 'lucide-react';
import Link from 'next/link';

export default function BuilderPage() {
  return (
    <div className="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sayfa Oluşturucu</h1>
        <p className="text-muted-foreground mt-1">Drag & drop sayfa tasarlayıcı</p>
      </div>

      <Card className="glass border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Construction className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Yakında Geliyor</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Drag & drop sayfa oluşturucu MVP sonrası fazda eklenecektir.
              Şimdilik sayfalarınızı Sayfalar bölümünden yönetebilirsiniz.
            </p>
            <Button asChild variant="outline">
              <Link href="/site/pages">Sayfalara Git</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
