/**
 * Nav Component - Navigasyon Bileşeni
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface NavLink {
    label: string;
    url: string;
}

interface NavProps {
    logo?: string;
    logoText?: string;
    links?: NavLink[];
    position?: 'static' | 'sticky' | 'fixed';
    backgroundColor?: string;
    textColor?: string;
    transparent?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

// ============================================================================
// Component
// ============================================================================

export function NavComponent({
    logo = '',
    logoText = 'Logo',
    links = [],
    position = 'sticky',
    backgroundColor = '#ffffff',
    textColor = '#333333',
    transparent = false,
    className,
    style = {},
}: NavProps) {
    const combinedStyle: React.CSSProperties = {
        position,
        top: position === 'sticky' || position === 'fixed' ? 0 : undefined,
        left: position === 'fixed' ? 0 : undefined,
        right: position === 'fixed' ? 0 : undefined,
        zIndex: position === 'fixed' || position === 'sticky' ? 40 : undefined,
        backgroundColor: transparent ? 'transparent' : backgroundColor,
        color: textColor,
        ...style,
    };

    return (
        <nav
            className={cn('nav-component w-full', className)}
            style={combinedStyle}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        {logo ? (
                            <img src={logo} alt={logoText} className="h-8 w-auto" />
                        ) : (
                            <span className="text-xl font-bold">{logoText}</span>
                        )}
                    </div>

                    {/* Links */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {links.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url}
                                    className="hover:opacity-80 transition-opacity px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Mobile menu button (placeholder) */}
                    <div className="md:hidden">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10"
                            aria-label="Menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default NavComponent;
