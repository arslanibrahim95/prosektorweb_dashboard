'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, Rocket, ArrowRight } from 'lucide-react';
import { trackOnboardingEvent } from '@/lib/onboarding-analytics';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';
import { SkipOnboardingButton } from '@/components/onboarding/skip-onboarding-button';

const features = [
    {
        icon: Building2,
        title: 'Organizasyon',
        description: 'Şirketinizi oluşturun ve yönetin',
        gradient: 'gradient-primary',
    },
    {
        icon: Users,
        title: 'Ekip',
        description: 'Ekip üyelerinizi davet edin',
        gradient: 'gradient-success',
    },
    {
        icon: Rocket,
        title: 'Başlayın',
        description: 'Hemen kullanmaya başlayın',
        gradient: 'gradient-accent',
    },
];

export default function WelcomePage() {
    const router = useRouter();

    useEffect(() => {
        // Track welcome page view
        trackOnboardingEvent('onboarding_welcome_viewed', { step: 'welcome' });
    }, []);

    return (
        <div className="max-w-4xl mx-auto text-center page-enter stagger-children">
            {/* Progress Indicator */}
            <div className="pt-8">
                <ProgressIndicator
                    currentStep={1}
                    totalSteps={3}
                    labels={['Hoş Geldin', 'Organizasyon', 'Tamamlandı']}
                />
            </div>

            {/* Header */}
            <div className="mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary mb-6">
                    <Rocket className="w-10 h-10" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ProsektorWeb'e Hoş Geldiniz! 🎉
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Web sitenizi kolayca yönetin, iletişim formları ve iş ilanları oluşturun, teklif talepleri alın.
                    Hemen başlamak için birkaç basit adımı tamamlayalım.
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                {features.map((feature, index) => (
                    <Card
                        key={index}
                        className="glass border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                        <CardContent className="p-6 text-center">
                            <div
                                className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 ${feature.gradient}`}
                            >
                                <feature.icon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* CTA */}
            <div className="space-y-4">
                <Button
                    size="lg"
                    className="gradient-primary border-0 text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 h-12 px-8"
                    onClick={() => router.push('/onboarding/organization')}
                >
                    Hadi Başlayalım
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-muted-foreground">
                    Sadece 2-3 dakika sürecek
                </p>

                {/* Skip Option */}
                <div className="pt-2">
                    <SkipOnboardingButton variant="ghost" />
                </div>
            </div>

            {/* Info Cards */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Card className="glass border-border/50 text-left">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                                <span className="text-success text-lg">✓</span>
                            </div>
                            <div>
                                <h4 className="font-medium mb-1">Kolay Kurulum</h4>
                                <p className="text-sm text-muted-foreground">
                                    Adım adım rehberlik ile hızlıca başlayın
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass border-border/50 text-left">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                                <span className="text-info text-lg">🔒</span>
                            </div>
                            <div>
                                <h4 className="font-medium mb-1">Güvenli</h4>
                                <p className="text-sm text-muted-foreground">
                                    Verileriniz güvende ve şifreli
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
