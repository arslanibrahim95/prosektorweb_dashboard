import React from 'react';
import { Input } from '@/components/ui/input';
import type { ComponentConfig } from '../../components-library/registry';

interface ImageFieldProps {
    value: unknown;
    onChange: (value: unknown) => void;
    config: ComponentConfig['schema'][string];
}

export function ImageField({ value, onChange }: ImageFieldProps) {
    return (
        <div className="space-y-2">
            {typeof value === 'string' && value.length > 0 && (
                <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <Input
                type="url"
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Resim URL'i girin"
            />
        </div>
    );
}
