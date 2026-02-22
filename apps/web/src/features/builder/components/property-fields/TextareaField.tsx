import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { ComponentConfig } from '../../components-library/registry';

interface TextareaFieldProps {
    value: unknown;
    onChange: (value: unknown) => void;
    config: ComponentConfig['schema'][string];
}

export function TextareaField({ value, onChange, config }: TextareaFieldProps) {
    return (
        <Textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            rows={3}
        />
    );
}
