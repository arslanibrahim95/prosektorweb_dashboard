import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ComponentConfig } from '../../components-library/registry';

interface SelectFieldProps {
    value: unknown;
    onChange: (value: unknown) => void;
    config: ComponentConfig['schema'][string];
}

export function SelectField({ value, onChange, config }: SelectFieldProps) {
    return (
        <Select
            value={typeof value === 'string' ? value : ''}
            onValueChange={(nextValue) => onChange(nextValue)}
        >
            <SelectTrigger>
                <SelectValue placeholder="Seçin..." />
            </SelectTrigger>
            <SelectContent>
                {config.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
