import React from 'react';
import type { ComponentConfig } from '../../components-library/registry';

import { TextField } from './TextField';
import { TextareaField } from './TextareaField';
import { NumberField } from './NumberField';
import { ColorField } from './ColorField';
import { SelectField } from './SelectField';
import { BooleanField } from './BooleanField';
import { ImageField } from './ImageField';
import { UrlField } from './UrlField';
import { RangeField } from './RangeField';
import { SpacingField } from './SpacingField';

export interface BasePropertyFieldProps {
    value: unknown;
    onChange: (value: unknown) => void;
    config: ComponentConfig['schema'][string];
}

const fieldRegistry: Record<string, React.ComponentType<BasePropertyFieldProps>> = {
    text: TextField,
    textarea: TextareaField,
    number: NumberField,
    color: ColorField,
    select: SelectField,
    boolean: BooleanField,
    image: ImageField,
    url: UrlField,
    range: RangeField,
    spacing: SpacingField,
};

export function PropertyField({ value, onChange, config }: BasePropertyFieldProps) {
    const FieldComponent = fieldRegistry[config.type];

    if (!FieldComponent) {
        // Fallback for unknown types
        return <TextField value={ value } onChange = { onChange } config = { config } />;
    }

    return <FieldComponent value={ value } onChange = { onChange } config = { config } />;
}
