'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { replayWelcomeTour } from '@/components/onboarding/welcome-modal';

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const shortcuts = useKeyboardShortcuts(() =>
    window.dispatchEvent(new CustomEvent('open-help-sheet'))
  );

  // Listen for custom event from command palette
  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener('open-shortcuts-help', handler);
    return () => document.removeEventListener('open-shortcuts-help', handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Klavye Kısayolları</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 mt-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50"
            >
              <span className="text-sm text-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.key.split(' ').map((k, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-muted-foreground text-xs mx-0.5">sonra</span>}
                    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
                      {k === '?' ? '?' : k.toUpperCase()}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
          İki tuşlu kısayollar: ilk tuşa basın, 500ms içinde ikinci tuşa basın.
        </div>
        <div className="mt-3 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setOpen(false);
              replayWelcomeTour();
            }}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Rehberi Tekrar Oynat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
