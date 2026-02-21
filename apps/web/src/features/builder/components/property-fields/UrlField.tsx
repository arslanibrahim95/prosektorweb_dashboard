import React from 'react';
import { Input } from '@/components/ui/input';
import type { ComponentConfig } from '../../components-library/registry';

interface UrlFieldProps {
    value: unknown;
    onChange: (value: unknown) => void;
    config: ComponentConfig['schema'][string];
}

export function UrlField({ value, onChange }: UrlFieldProps) {
    return (
        <Input
            type="url"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
        />
    );
}
