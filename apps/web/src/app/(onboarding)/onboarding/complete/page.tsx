'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { trackOnboardingEvent } from '@/lib/onboarding-analytics';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';
import { logger } from '@/lib/logger';

const nextSteps = [
    {
        icon: '📊',
        title: 'Vibe briefinizi oluşturun',
        description: 'Site > Vibe Uretim ekraninda markanizi anlatip ilk taslagi hazirlayin',
    },
    {
        icon: '📝',
        title: 'Modülleri aktifleştirin',
        description: 'İletişim formu, teklif talebi ve iş ilanları modüllerini açın',
    },
    {
        icon: '👥',
        title: 'Ekibinizi davet edin',
        description: 'Ayarlar bölümünden ekip üyelerinizi davet edin',
    },
];

export default function CompletePage() {
    const router = useRouter();
    const auth = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(true);

    useEffect(() => {
        // Track complete page view
        trackOnboardingEvent('onboarding_complete_viewed', { step: 'complete' });

        // Refresh auth context to get the new tenant membership
        const refreshAuth = async () => {
            try {
                await auth.refreshMe();
            } catch (error) {
                logger.error('Failed to refresh auth', { error });
            } finally {
                setIsRefreshing(false);
            }
        };

        refreshAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);  // FIX: Run once on mount — auth.refreshMe is stable

    useEffect(() => {
        // If user doesn't have a tenant yet, redirect back to organization page
        if (!isRefreshing && !auth.me?.tenant) {
            router.replace('/onboarding/organization');
        }
    }, [auth.me?.tenant, isRefreshing, router]);  // FIX: Depend on .tenant specifically

    useEffect(() => {
        // Auto redirect after 5 seconds (only if tenant exists)
        if (!isRefreshing && auth.me?.tenant) {
            const timer = setTimeout(() => {
                router.push('/home');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [auth.me?.tenant, isRefreshing, router]);  // FIX: Depend on .tenant specifically

    // Show loading while refreshing
    if (isRefreshing) {
        return (
            <div className="max-w-2xl mx-auto text-center page-enter">
                {/* Progress Indicator */}
                <div className="pt-8">
                    <ProgressIndicator
                        currentStep={3}
                        totalSteps={3}
                        labels={['Hoş Geldin', 'Organizasyon', 'Tamamlandı']}
                    />
                </div>
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Tamamlanıyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto text-center page-enter">
            {/* Progress Indicator */}
            <div className="pt-8">
                <ProgressIndicator
                    currentStep={3}
                    totalSteps={3}
                    labels={['Hoş Geldin', 'Organizasyon', 'Tamamlandı']}
                />
            </div>

            {/* Success Icon */}
            <div className="mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mb-6 animate-bounce">
                    <CheckCircle2 className="w-12 h-12 text-success" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                    Harika! Her Şey Hazır 🎉
                </h1>
                <p className="text-xl text-muted-foreground">
                    Organizasyonunuz başarıyla oluşturuldu. Artık ProsektorWeb&apos;i kullanmaya başlayabilirsiniz.
                </p>
            </div>

            {/* Progress Complete */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Kurulum Tamamlandı</span>
                    <span className="text-sm font-medium text-success">100%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-success to-green-600 transition-all duration-700 ease-out" style={{ width: '100%' }} />
                </div>
            </div>

            {/* Next Steps */}
            <Card className="glass border-border/50 shadow-xl mb-8">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">Sonraki Adımlar</h3>
                    </div>
                    <div className="space-y-4">
                        {nextSteps.map((step, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                            >
                                <div className="text-3xl shrink-0">{step.icon}</div>
                                <div>
                                    <h4 className="font-medium mb-1">{step.title}</h4>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* CTA */}
            <div className="space-y-4">
                <Button
                    size="lg"
                    className="gradient-primary border-0 text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 h-12 px-8"
                    onClick={() => router.push('/home')}
                >
                    Dashboard&apos;a Git
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-muted-foreground">
                    5 saniye içinde otomatik olarak yönlendirileceksiniz...
                </p>
            </div>
        </div>
    );
}
