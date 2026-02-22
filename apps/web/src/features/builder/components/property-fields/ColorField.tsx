import React from 'react';
import { Input } from '@/components/ui/input';
import type { ComponentConfig } from '../../components-library/registry';

interface ColorFieldProps {
    value: unknown;
    onChange: (value: unknown) => void;
    config: ComponentConfig['schema'][string];
}

export function ColorField({ value, onChange }: ColorFieldProps) {
    return (
        <div className="flex gap-2">
            <Input
                type="color"
                value={typeof value === 'string' ? value : '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-10 p-1"
            />
            <Input
                value={typeof value === 'string' ? value : '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1"
            />
        </div>
    );
}
