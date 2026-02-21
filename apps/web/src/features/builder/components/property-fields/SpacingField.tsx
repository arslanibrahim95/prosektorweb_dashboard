import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComponentConfig } from '../../components-library/registry';

interface SpacingFieldProps {
    value: unknown;
    onChange: (value: unknown) => void;
    config: ComponentConfig['schema'][string];
}

export type SpacingValue = {
    top?: number;
    bottom?: number;
};

export function asSpacingValue(value: unknown): SpacingValue {
    if (typeof value === 'object' && value !== null) {
        return value as SpacingValue;
    }
    return {};
}

export function SpacingField({ value, onChange }: SpacingFieldProps) {
    const spacingValue = asSpacingValue(value);

    return (
        <div className="grid grid-cols-2 gap-2">
            <div>
                <Label className="text-xs">Üst</Label>
                <Input
                    type="number"
                    value={spacingValue.top ?? 0}
                    onChange={(e) => onChange({ ...spacingValue, top: Number(e.target.value) })}
                />
            </div>
            <div>
                <Label className="text-xs">Alt</Label>
                <Input
                    type="number"
                    value={spacingValue.bottom ?? 0}
                    onChange={(e) => onChange({ ...spacingValue, bottom: Number(e.target.value) })}
                />
            </div>
        </div>
    );
}
