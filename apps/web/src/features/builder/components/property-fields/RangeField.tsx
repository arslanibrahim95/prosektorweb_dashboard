import React from 'react';
import { Slider } from '@/components/ui/slider';
import type { ComponentConfig } from '../../components-library/registry';

interface RangeFieldProps {
    value: unknown;
    onChange: (value: unknown) => void;
    config: ComponentConfig['schema'][string];
}

export function RangeField({ value, onChange, config }: RangeFieldProps) {
    return (
        <div className="space-y-2">
            <Slider
                value={[typeof value === 'number' ? value : 0]}
                min={config.min || 0}
                max={config.max || 100}
                step={config.step || 1}
                onValueChange={(values: number[]) => onChange(values[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{config.min || 0}</span>
                <span>{typeof value === 'number' ? value : 0}</span>
                <span>{config.max || 100}</span>
            </div>
        </div>
    );
}
