import React from 'react';
import { Switch } from '@/components/ui/switch';
import type { ComponentConfig } from '../../components-library/registry';

interface BooleanFieldProps {
    value: unknown;
    onChange: (value: unknown) => void;
    config: ComponentConfig['schema'][string];
}

export function BooleanField({ value, onChange }: BooleanFieldProps) {
    return (
        <Switch
            checked={!!value}
            onCheckedChange={onChange}
        />
    );
}
