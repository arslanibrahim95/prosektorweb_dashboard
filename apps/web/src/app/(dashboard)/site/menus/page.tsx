import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MenusPage() {
    return (
        <div className="dashboard-page">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Menüler</h1>
                <p className="text-muted-foreground mt-1">Site navigasyonunu yönetin</p>
            </div>

            <Card className="glass border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">MVP Durumu</CardTitle>
                    <CardDescription>
                        Menü yönetimi henüz uygulanmadı.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                    Drag-and-drop menü düzenleyici, header/footer menü konumları ve alt menü desteği Phase-2&apos;de eklenecek.
                </CardContent>
            </Card>
        </div>
    );
}
