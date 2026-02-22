'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { trackOnboardingEvent } from '@/lib/onboarding-analytics';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';
import { CreateOrganizationForm } from '@/components/organization/create-organization-form';

export default function OrganizationPage() {
    const router = useRouter();

    useEffect(() => {
        // Track organization page view
        trackOnboardingEvent('onboarding_organization_viewed', { step: 'organization' });
    }, []);

    const handleSuccess = () => {
        router.push('/onboarding/complete');
    };

    const handleCancel = () => {
        router.push('/onboarding/welcome');
    };

    return (
        <div className="max-w-xl mx-auto page-enter">
            {/* Progress Indicator */}
            <div className="pt-8">
                <ProgressIndicator
                    currentStep={2}
                    totalSteps={3}
                    labels={['Hoş Geldin', 'Organizasyon', 'Tamamlandı']}
                />
            </div>

            {/* Main Card */}
            <Card className="glass border-border/50 shadow-xl">
                <CardHeader>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl">Organizasyonunuzu Oluşturun</CardTitle>
                    <CardDescription className="text-base">
                        Ekibinizin çalışacağı organizasyonu tanımlayın. Bu isim tüm ekip üyeleriniz tarafından görülecektir.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateOrganizationForm onSuccess={handleSuccess} onCancel={handleCancel} showCancel />
                </CardContent>
            </Card>

            {/* Help Section */}
            <div className="mt-6 text-center">
                <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                    onClick={() => toast.info('Organizasyon, ekibinizin birlikte çalışacağı çalışma alanıdır. Şirket adınızı veya proje adınızı kullanabilirsiniz.')}
                >
                    <span>❓</span>
                    Organizasyon nedir?
                </button>
            </div>
        </div>
    );
}
