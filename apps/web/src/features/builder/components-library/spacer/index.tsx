/**
 * Spacer Component - Boşluk Bileşeni
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SpacerProps {
    height?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

// ============================================================================
// Component
// ============================================================================

export function SpacerComponent({
    height = '32',
    className,
    style = {},
}: SpacerProps) {
    const heightValue = typeof height === 'number' ? `${height}px` : height;

    const combinedStyle: React.CSSProperties = {
        height: heightValue,
        width: '100%',
        ...style,
    };

    return (
        <div
            className={cn('spacer-component', className)}
            style={combinedStyle}
            aria-hidden="true"
        />
    );
}

export default SpacerComponent;
