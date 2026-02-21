import React from 'react';
import { Input } from '@/components/ui/input';
import type { ComponentConfig } from '../../components-library/registry';

interface TextFieldProps {
    value: unknown;
    onChange: (value: unknown) => void;
    config: ComponentConfig['schema'][string];
}

export function TextField({ value, onChange, config }: TextFieldProps) {
    return (
        <Input
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
        />
    );
}
