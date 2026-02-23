'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SearchPaletteTrigger() {
    return (
        <Button
            variant="outline"
            className="relative max-w-md w-full hidden sm:flex items-center justify-between bg-muted/50 border-transparent hover:border-border hover:bg-muted/80 transition-all duration-200 h-9 text-muted-foreground font-normal"
            onClick={() => document.dispatchEvent(new CustomEvent('open-command-palette'))}
            aria-label="Arama komut paleti"
            aria-keyshortcuts="Control+K Meta+K"
        >
            <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>Ara...</span>
            </div>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
            </kbd>
        </Button>
    );
}
