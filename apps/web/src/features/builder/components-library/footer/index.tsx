/**
 * Footer Component - Alt Bilgi Bileşeni
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FooterLink {
    label: string;
    url: string;
}

interface FooterColumn {
    title: string;
    links: FooterLink[];
}

interface FooterProps {
    logo?: string;
    logoText?: string;
    description?: string;
    columns?: FooterColumn[];
    copyright?: string;
    backgroundColor?: string;
    textColor?: string;
    className?: string;
    style?: React.CSSProperties;
}

// ============================================================================
// Component
// ============================================================================

export function FooterComponent({
    logo = '',
    logoText = 'Logo',
    description = '',
    columns = [],
    copyright = '© 2024 Tüm hakları saklıdır.',
    backgroundColor = '#1a1a2e',
    textColor = '#ffffff',
    className,
    style = {},
}: FooterProps) {
    const combinedStyle: React.CSSProperties = {
        backgroundColor,
        color: textColor,
        ...style,
    };

    return (
        <footer
            className={cn('footer-component w-full', className)}
            style={combinedStyle}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo & Description */}
                    <div className="col-span-1 md:col-span-1">
                        {logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logo} alt={logoText} className="h-8 w-auto mb-4" />
                        ) : (
                            <h3 className="text-xl font-bold mb-4">{logoText}</h3>
                        )}
                        {description && (
                            <p className="text-sm opacity-80">{description}</p>
                        )}
                    </div>

                    {/* Columns */}
                    {columns.map((column, colIndex) => (
                        <div key={colIndex}>
                            <h4 className="font-semibold mb-4">{column.title}</h4>
                            <ul className="space-y-2">
                                {column.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <a
                                            href={link.url}
                                            className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Copyright */}
                {copyright && (
                    <div className="border-t border-white/10 mt-8 pt-8">
                        <p className="text-center text-sm opacity-60">
                            {copyright}
                        </p>
                    </div>
                )}
            </div>
        </footer>
    );
}

export default FooterComponent;
