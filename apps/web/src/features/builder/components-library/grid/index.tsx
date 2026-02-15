/**
 * Grid Component - Izgara Bileşeni
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GridProps {
    columns?: number;
    gap?: string;
    columnGap?: string;
    rowGap?: string;
    align?: 'stretch' | 'start' | 'center' | 'end';
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function GridComponent({
    columns = 3,
    gap = '16',
    columnGap = '16',
    rowGap = '16',
    align = 'stretch',
    className,
    style = {},
    children,
}: GridProps) {
    const combinedStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        columnGap,
        rowGap,
        alignItems: align,
        ...style,
    };

    return (
        <div
            className={cn('grid-component', className)}
            style={combinedStyle}
        >
            {children}
        </div>
    );
}

export default GridComponent;
