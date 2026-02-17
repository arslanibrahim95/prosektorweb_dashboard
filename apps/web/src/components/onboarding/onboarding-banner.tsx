'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, ArrowRight, X, Rocket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trackOnboardingEvent } from '@/lib/onboarding-analytics';
import { cn } from '@/lib/utils';

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;

interface OnboardingBannerProps {
    onDismiss?: () => void;
    className?: string;
}

export function OnboardingBanner({ onDismiss, className }: OnboardingBannerProps) {
    const router = useRouter();
    const auth = useAuth();
    const [orgName, setOrgName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = orgName.trim();
        if (!trimmedName || trimmedName.length < MIN_NAME_LENGTH) {
            toast.error(`Lütfen geçerli bir organizasyon adı girin (en az ${MIN_NAME_LENGTH} karakter)`);
            return;
        }

        if (trimmedName.length > MAX_NAME_LENGTH) {
            toast.error(`Organizasyon adı en fazla ${MAX_NAME_LENGTH} karakter olabilir`);
            return;
        }

        if (!auth.accessToken) {
            toast.error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
            router.replace('/login');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/onboarding/tenant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.accessToken}`,
                },
                body: JSON.stringify({ name: trimmedName }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create organization');
            }

            toast.success('Organizasyon başarıyla oluşturuldu!');

            trackOnboardingEvent('onboarding_organization_created', {
                step: 'dashboard_banner',
                organizationName: trimmedName,
            });

            await auth.refreshMe();
            router.refresh();

        } catch (error: unknown) {
            console.error('Onboarding error:', error);

            trackOnboardingEvent('onboarding_organization_failed', {
                step: 'dashboard_banner',
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            if (error instanceof Error) {
                toast.error(error.message || 'Bir hata oluştu');
            } else {
                toast.error('Bir hata oluştu');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        trackOnboardingEvent('onboarding_skipped', {
            step: 'dashboard_banner',
            reason: 'user_initiated',
        });
        onDismiss?.();
    };

    if (isExpanded) {
        return (
            <Card className={cn('border-primary/20 bg-primary/5', className)}>
                <CardContent className="p-4">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Organizasyonunuzu Oluşturun</h3>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex gap-3">
                            <Input
                                placeholder="Örn: Acme Inc."
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                autoFocus
                                className="flex-1"
                                maxLength={MAX_NAME_LENGTH}
                                disabled={loading}
                            />
                            <Button
                                type="submit"
                                className="gradient-primary border-0 text-white shrink-0"
                                disabled={loading || orgName.trim().length < MIN_NAME_LENGTH}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Oluştur
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Bu isim panellerde ve faturalarda görünecek.{' '}
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="text-primary hover:underline"
                            >
                                Daha sonra yapacağım
                            </button>
                        </p>
                    </form>
                </CardContent>
            </Card>
        );
    }

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
                            onClick={() => setIsExpanded(true)}
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
