'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight, HelpCircle, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems, type NavItem } from '@/components/layout/sidebar';
import { replayWelcomeTour } from '@/components/onboarding/welcome-modal';

interface FlatItem {
  label: string;
  href: string;
  category: string;
  keywords: string;
  action?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

function flattenNavItems(items: NavItem[], parentLabel?: string): FlatItem[] {
  const result: FlatItem[] = [];
  for (const item of items) {
    const category = parentLabel ?? item.label;
    if (item.children) {
      result.push(...flattenNavItems(item.children, item.label));
    } else {
      result.push({
        label: item.label,
        href: item.href,
        category,
        keywords: `${item.label} ${category}`.toLowerCase(),
      });
    }
  }
  return result;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Help & action items alongside navigation
  const helpItems: FlatItem[] = useMemo(() => [
    {
      label: 'Rehberi Tekrar Oynat',
      href: '#tour',
      category: 'Yardım',
      keywords: 'rehber tur welcome tour yardım help onboarding',
      action: () => replayWelcomeTour(),
      icon: HelpCircle,
    },
    {
      label: 'Klavye Kısayolları',
      href: '#shortcuts',
      category: 'Yardım',
      keywords: 'klavye kısayol shortcut keyboard',
      action: () => document.dispatchEvent(new CustomEvent('open-shortcuts-help')),
      icon: Keyboard,
    },
  ], []);

  const allItems = useMemo(() => [...flattenNavItems(navItems), ...helpItems], [helpItems]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    return allItems.filter((item) => fuzzyMatch(query, item.keywords));
  }, [query, allItems]);

  const grouped = useMemo(() => {
    const groups: Record<string, FlatItem[]> = {};
    for (const item of filtered) {
      const category = item.category;
      if (!groups[category]) groups[category] = [];
      groups[category]!.push(item);
    }
    return groups;
  }, [filtered]);

  const flatFiltered = useMemo(() => {
    const result: FlatItem[] = [];
    for (const items of Object.values(grouped)) {
      result.push(...items);
    }
    return result;
  }, [grouped]);

  const navigate = useCallback(
    (item: FlatItem) => {
      setOpen(false);
      setQuery('');
      if (item.action) {
        item.action();
      } else {
        router.push(item.href);
      }
    },
    [router],
  );

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const handleCustomOpen = () => setOpen(true);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('open-command-palette', handleCustomOpen);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, []);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatFiltered[selectedIndex];
      if (item) navigate(item);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  let globalIndex = -1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg p-0 gap-0 overflow-hidden"
      >
        <DialogTitle className="sr-only">Komut Paleti</DialogTitle>
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sayfa veya komut ara..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 bg-transparent"
          />
        </div>
        <div
          ref={listRef}
          className="max-h-[300px] overflow-y-auto py-2"
        >
          {flatFiltered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sonuç bulunamadı
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {category}
                </div>
                {items.map((item) => {
                  globalIndex++;
                  const index = globalIndex;
                  return (
                    <button
                      key={`${item.category}-${item.label}`}
                      data-index={index}
                      type="button"
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md mx-1 transition-colors duration-100',
                        'max-w-[calc(100%-8px)]',
                        selectedIndex === index
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted/50',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {item.icon && <item.icon className={cn('h-3.5 w-3.5', selectedIndex === index ? 'text-primary' : 'text-muted-foreground')} />}
                        {item.label}
                      </span>
                      {selectedIndex === index && (
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
            <span>Gezin</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
            <span>Seç</span>
          </div>
          <div>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
            <span className="ml-1">Kapat</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
