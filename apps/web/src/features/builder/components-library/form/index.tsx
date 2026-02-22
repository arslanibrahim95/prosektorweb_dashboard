/**
 * Form Component - Form Bileşeni
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FormField {
    type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio';
    name: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
}

interface FormProps {
    fields?: FormField[];
    submitLabel?: string;
    submitUrl?: string;
    method?: 'GET' | 'POST';
    className?: string;
    style?: React.CSSProperties;
}

// ============================================================================
// Component
// ============================================================================

export function FormComponent({
    fields = [],
    submitLabel = 'Gonder',
    submitUrl = '#',
    method = 'POST',
    className,
    style = {},
}: FormProps) {
    return (
        <form
            className={cn('form-component space-y-4', className)}
            style={style}
            action={submitUrl}
            method={method}
        >
            {fields.map((field, index) => (
                <div key={index} className="form-field">
                    <label
                        htmlFor={field.name}
                        className="block text-sm font-medium mb-1"
                    >
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === 'text' && (
                        <input
                            type="text"
                            id={field.name}
                            name={field.name}
                            placeholder={field.placeholder}
                            required={field.required}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    )}

                    {field.type === 'email' && (
                        <input
                            type="email"
                            id={field.name}
                            name={field.name}
                            placeholder={field.placeholder}
                            required={field.required}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    )}

                    {field.type === 'textarea' && (
                        <textarea
                            id={field.name}
                            name={field.name}
                            placeholder={field.placeholder}
                            required={field.required}
                            rows={4}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    )}

                    {field.type === 'select' && (
                        <select
                            id={field.name}
                            name={field.name}
                            required={field.required}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">{field.placeholder || 'Secin...'}</option>
                            {field.options?.map((option, optIndex) => (
                                <option key={optIndex} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    )}

                    {field.type === 'checkbox' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={field.name}
                                name={field.name}
                                required={field.required}
                                className="w-4 h-4"
                            />
                            <label htmlFor={field.name} className="text-sm">
                                {field.label}
                            </label>
                        </div>
                    )}

                    {field.type === 'radio' && field.options && (
                        <div className="space-y-2">
                            {field.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        id={`${field.name}-${optIndex}`}
                                        name={field.name}
                                        value={option.value}
                                        required={field.required}
                                        className="w-4 h-4"
                                    />
                                    <label
                                        htmlFor={`${field.name}-${optIndex}`}
                                        className="text-sm"
                                    >
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            <button
                type="submit"
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
                {submitLabel}
            </button>
        </form>
    );
}

export default FormComponent;
