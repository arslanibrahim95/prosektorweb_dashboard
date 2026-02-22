/**
 * Container Component - Konteyner Bileşeni
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Spacing {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
}

interface ContainerProps {
    backgroundColor?: string;
    padding?: Spacing;
    margin?: Spacing;
    borderRadius?: 'none' | 'small' | 'medium' | 'large';
    maxWidth?: string;
    minHeight?: string;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

// ============================================================================
// Border Radius Map
// ============================================================================

const borderRadiusMap = {
    none: '0',
    small: '4px',
    medium: '8px',
    large: '16px',
};

// ============================================================================
// Component
// ============================================================================

export function ContainerComponent({
    backgroundColor = 'transparent',
    padding = { top: '16', bottom: '16', left: '16', right: '16' },
    margin = { top: '0', bottom: '0', left: '0', right: '0' },
    borderRadius = 'none',
    maxWidth = '',
    minHeight = '',
    className,
    style = {},
    children,
}: ContainerProps) {
    const combinedStyle: React.CSSProperties = {
        backgroundColor,
        paddingTop: `${padding.top || 0}px`,
        paddingBottom: `${padding.bottom || 0}px`,
        paddingLeft: `${padding.left || 0}px`,
        paddingRight: `${padding.right || 0}px`,
        marginTop: `${margin.top || 0}px`,
        marginBottom: `${margin.bottom || 0}px`,
        marginLeft: `${margin.left || 0}px`,
        marginRight: `${margin.right || 0}px`,
        borderRadius: borderRadiusMap[borderRadius],
        maxWidth: maxWidth || undefined,
        minHeight: minHeight || undefined,
        ...style,
    };

    return (
        <div
            className={cn('container-component', className)}
            style={combinedStyle}
        >
            {children}
        </div>
    );
}

export default ContainerComponent;
