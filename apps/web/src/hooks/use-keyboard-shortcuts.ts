'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { replayWelcomeTour } from '@/components/onboarding/welcome-modal';

interface ShortcutConfig {
  key: string;
  description: string;
  action: () => void;
}

/**
 * Two-key sequence system (e.g., "g h" for go home)
 * Single keys like "?" trigger immediately
 * Sequence timeout: 500ms
 */
export function useKeyboardShortcuts(onHelpOpen: () => void) {
  const router = useRouter();
  const pendingKeyRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const shortcuts: ShortcutConfig[] = [
    { key: '?', description: 'Kısayol yardımını aç', action: onHelpOpen },
    { key: 'g h', description: 'Ana Sayfa', action: () => router.push('/home') },
    { key: 'g i', description: 'Gelen Kutusu - Teklifler', action: () => router.push('/inbox/offers') },
    { key: 'g p', description: 'Vibe Uretim', action: () => router.push('/site/generate') },
    { key: 'g b', description: 'Sayfalar', action: () => router.push('/site/pages') },
    { key: 'g d', description: 'Domainler', action: () => router.push('/site/domains') },
    { key: 'g s', description: 'Ayarlar', action: () => router.push('/settings/users') },
    { key: 'g m', description: 'Modüller', action: () => router.push('/modules/offer') },
    { key: 'g t', description: 'Rehberi Tekrar Oynat', action: () => replayWelcomeTour() },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement).isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // Check for single-key shortcuts
      if (!pendingKeyRef.current) {
        const single = shortcuts.find((s) => s.key === key);
        if (single) {
          e.preventDefault();
          single.action();
          return;
        }

        // Start sequence
        const hasSequence = shortcuts.some((s) => s.key.startsWith(key + ' '));
        if (hasSequence) {
          pendingKeyRef.current = key;
          timerRef.current = setTimeout(() => {
            pendingKeyRef.current = null;
          }, 500);
          return;
        }
      } else {
        // Complete sequence
        const sequence = `${pendingKeyRef.current} ${key}`;
        clearTimeout(timerRef.current);
        pendingKeyRef.current = null;

        const match = shortcuts.find((s) => s.key === sequence);
        if (match) {
          e.preventDefault();
          match.action();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, onHelpOpen],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timerRef.current);
    };
  }, [handleKeyDown]);

  return shortcuts;
}
