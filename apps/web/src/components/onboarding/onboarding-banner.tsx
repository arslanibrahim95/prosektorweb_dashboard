'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Rocket } from 'lucide-react';
import { trackOnboardingEvent } from '@/lib/onboarding-analytics';
import { cn } from '@/lib/utils';
import { openTenantOnboardingDrawer } from '@/components/onboarding/tenant-onboarding-drawer';

interface OnboardingBannerProps {
    onDismiss?: () => void;
    className?: string;
}

export function OnboardingBanner({ onDismiss, className }: OnboardingBannerProps) {
    const handleSkip = () => {
        trackOnboardingEvent('onboarding_skipped', {
            step: 'dashboard_banner',
            reason: 'user_initiated',
        });
        onDismiss?.();
    };

    return (
        <Card className={cn('border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5', className)}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                            <Rocket className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold">ProsektorWeb&apos;e Hoş Geldiniz!</h3>
                            <p className="text-sm text-muted-foreground">
                                Organizasyonunuzu oluşturarak başlayın.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSkip}
                            className="text-muted-foreground"
                        >
                            Daha Sonra
                        </Button>
                        <Button
                            size="sm"
                            onClick={openTenantOnboardingDrawer}
                            className="gradient-primary border-0 text-white"
                        >
                            Başlayalım
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default OnboardingBanner;
