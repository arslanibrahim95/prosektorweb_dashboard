'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,

} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Layout, CheckSquare, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'prosektorweb_onboarding_done';

const steps = [
  {
    icon: Sparkles,
    title: 'ProsektorWeb\'e Hoş Geldiniz!',
    description: 'Web sitenizi kolayca yönetin, iletişim formları ve iş ilanları oluşturun, teklif talepleri alın.',
    gradient: 'gradient-primary',
  },
  {
    icon: Layout,
    title: 'Sol menüden gezinin',
    description: 'Site yönetimi, modüller, gelen kutusu ve ayarlar - her şey sol menüde. Cmd+K ile hızlıca arayabilirsiniz.',
    gradient: 'gradient-info',
  },
  {
    icon: CheckSquare,
    title: 'Kurulum Checklist\'i',
    description: 'Ana sayfadaki kurulum checklist\'i sizi adım adım yönlendirecek. Modülleri açın, domain ekleyin ve sitenizi yayınlayın.',
    gradient: 'gradient-success',
  },
  {
    icon: Rocket,
    title: 'Hazırsınız!',
    description: 'Hemen başlayın. Sorularınız olduğunda ? tuşuna basarak klavye kısayollarını görebilirsiniz.',
    gradient: 'gradient-accent',
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        // Small delay for page to render first
        const timer = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">ProsektorWeb Hoş Geldiniz</DialogTitle>
        <DialogDescription className="sr-only">Başlangıç rehberi</DialogDescription>
        {/* Gradient header */}
        <div className={cn('py-10 flex flex-col items-center gap-4', step.gradient)}>
          <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <StepIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4 text-center">
          <h2 className="text-xl font-bold">{step.title}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {step.description}
          </p>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === currentStep
                    ? 'w-6 bg-primary'
                    : 'w-1.5 bg-muted',
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            {currentStep > 0 && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Geri
              </Button>
            )}
            <Button
              className={cn(
                'flex-1 gradient-primary border-0 text-white',
                currentStep === 0 && 'w-full',
              )}
              onClick={handleNext}
            >
              {isLast ? 'Başlayın!' : 'Devam'}
            </Button>
          </div>

          {currentStep === 0 && (
            <button
              onClick={handleClose}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Atla
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
