'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Layout, CheckSquare, Rocket } from 'lucide-react';
import { safeLocalStorageGetItem, safeLocalStorageSetItem } from '@/lib/storage';

const STORAGE_KEY = 'prosektorweb_onboarding_done';

/** Global event name to re-trigger the welcome tour */
const REPLAY_EVENT = 'prosektorweb:replay-tour';

/* eslint-disable @typescript-eslint/no-unused-vars */
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

/**
 * Dispatch this event from anywhere to re-open the welcome tour.
 * Example: `replayWelcomeTour()`
 */
export function replayWelcomeTour() {
  window.dispatchEvent(new CustomEvent(REPLAY_EVENT));
}

export function WelcomeModal() {
  const [, setOpen] = useState(false);
  const [, setCurrentStep] = useState(0);

  const openTour = useCallback(() => {
    setCurrentStep(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    const done = safeLocalStorageGetItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => openTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [openTour]);

  // Listen for replay events (from settings, help menu, etc.)
  useEffect(() => {
    const handler = () => openTour();
    window.addEventListener(REPLAY_EVENT, handler);
    return () => window.removeEventListener(REPLAY_EVENT, handler);
  }, [openTour]);

  const handleClose = () => {
    setOpen(false);
    safeLocalStorageSetItem(STORAGE_KEY, 'true');
  };

  // TEMPORARY: Disabled for dev checks
  return null;
}
