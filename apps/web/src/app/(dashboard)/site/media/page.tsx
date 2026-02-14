import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MediaPage() {
  return (
    <div className="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Medya Kütüphanesi</h1>
        <p className="text-muted-foreground mt-1">Görseller ve dosyaları yönetin</p>
      </div>

      <Card className="glass border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">MVP Durumu</CardTitle>
          <CardDescription>
            Dashboard üzerinden medya upload/listing henüz uygulanmadı.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          Storage bucket&apos;ları: <span className="font-medium">public-media</span> (public) ve{' '}
          <span className="font-medium">private-cv</span> (private). Media yönetimini Phase-2&apos;de ekleriz.
        </CardContent>
      </Card>
    </div>
  );
}

