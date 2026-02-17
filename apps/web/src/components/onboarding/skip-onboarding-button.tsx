'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { SkipForward, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { trackOnboardingEvent } from '@/lib/onboarding-analytics';

interface SkipOnboardingButtonProps {
    variant?: 'link' | 'outline' | 'ghost';
    className?: string;
}

export function SkipOnboardingButton({
    variant = 'link',
    className
}: SkipOnboardingButtonProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSkip = async () => {
        setIsLoading(true);

        try {
            // Track skip event
            trackOnboardingEvent('onboarding_skipped', {
                step: 'welcome',
                reason: 'user_initiated'
            });

            toast.info('Onboarding atlandı. İstediğiniz zaman organizasyon oluşturabilirsiniz.');

            // Redirect to dashboard
            router.push('/home');
        } catch (error) {
            console.error('Skip onboarding error:', error);
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={variant}
                    className={className}
                    size="sm"
                >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Şimdi atla
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Onboarding'i atlamak istediğinizden emin misiniz?
                    </DialogTitle>
                    <DialogDescription>
                        Organizasyon oluşturmadan devam edebilirsiniz, ancak platformun tüm özelliklerini kullanmak için
                        daha sonra bir organizasyon oluşturmanız gerekecektir.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <h4 className="font-medium mb-2">Neleri kaçıracaksınız:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Organizasyon yapılandırma rehberi</li>
                        <li>Platform özelliklerinin tanıtımı</li>
                        <li>Hızlı başlangıç ipuçları</li>
                    </ul>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                    >
                        İptal
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleSkip}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Yönlendiriliyor...' : 'Dashboard\'a git'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default SkipOnboardingButton;
