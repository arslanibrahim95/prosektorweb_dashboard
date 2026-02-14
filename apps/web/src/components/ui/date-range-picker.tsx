'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRange {
  from: string; // ISO date string
  to: string;
}

interface DatePreset {
  label: string;
  range: () => DateRange;
}

function startOfDay(date: Date): string {
  return date.toISOString().split('T')[0];
}

const presets: DatePreset[] = [
  {
    label: 'Son 7 gün',
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);
      return { from: startOfDay(from), to: startOfDay(to) };
    },
  },
  {
    label: 'Son 30 gün',
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      return { from: startOfDay(from), to: startOfDay(to) };
    },
  },
  {
    label: 'Bu ay',
    range: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(from), to: startOfDay(now) };
    },
  },
  {
    label: 'Son 3 ay',
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setMonth(from.getMonth() - 3);
      return { from: startOfDay(from), to: startOfDay(to) };
    },
  },
];

interface DateRangePickerProps {
  value?: DateRange | null;
  onChange: (range: DateRange | null) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleSelect = (preset: DatePreset) => {
    const range = preset.range();
    setSelectedPreset(preset.label);
    onChange(range);
  };

  const handleClear = () => {
    setSelectedPreset(null);
    onChange(null);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={cn(value && 'border-primary/50 text-primary')}>
            <Calendar className="mr-2 h-4 w-4" />
            {selectedPreset ?? 'Tarih Filtresi'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.label}
              onClick={() => handleSelect(preset)}
              className="flex items-center justify-between"
            >
              <span>{preset.label}</span>
              {selectedPreset === preset.label && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          {value && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClear} className="text-muted-foreground">
                <X className="mr-2 h-3.5 w-3.5" />
                Filtreyi Kaldır
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
