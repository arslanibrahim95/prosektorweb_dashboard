import React from 'react';
import { Input } from '@/components/ui/input';
import type { ComponentConfig } from '../../components-library/registry';

interface NumberFieldProps {
    value: unknown;
    onChange: (value: unknown) => void;
    config: ComponentConfig['schema'][string];
}

export function NumberField({ value, onChange }: NumberFieldProps) {
    return (
        <Input
            type="number"
            value={typeof value === 'number' ? value : 0}
            onChange={(e) => onChange(Number(e.target.value))}
        />
    );
}
