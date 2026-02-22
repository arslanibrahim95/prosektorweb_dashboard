import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function BillingPage() {
    return (
        <div className={cn('dashboard-page', 'dashboard-page-narrow')}>
            <div>
                <h1 className="text-2xl font-bold text-foreground">Fatura &amp; Abonelik</h1>
                <p className="text-muted-foreground mt-1">Plan ve fatura bilgilerinizi yönetin</p>
            </div>

            <Card className="glass border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">MVP Durumu</CardTitle>
                    <CardDescription>
                        Fatura ve abonelik yönetimi henüz uygulanmadı.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                    Stripe entegrasyonu, plan seçimi, fatura geçmişi ve ödeme yöntemi yönetimi Phase-2&apos;de eklenecek.
                </CardContent>
            </Card>
        </div>
    );
}
