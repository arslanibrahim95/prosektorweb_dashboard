/**
 * Text Component - Metin Bileşeni
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TextProps {
    content?: string;
    fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
    fontWeight?: 'normal' | 'medium' | 'bold';
    textColor?: string;
    align?: 'left' | 'center' | 'right' | 'justify';
    maxWidth?: string;
    className?: string;
    style?: React.CSSProperties;
}

// ============================================================================
// Font Size Map
// ============================================================================

const fontSizeMap = {
    small: '0.875rem',
    medium: '1rem',
    large: '1.25rem',
    xlarge: '1.5rem',
};

const fontWeightMap = {
    normal: '400',
    medium: '500',
    bold: '700',
};

// ============================================================================
// Component
// ============================================================================

export function TextComponent({
    content = 'Metin içeriği...',
    fontSize = 'medium',
    fontWeight = 'normal',
    textColor = '#333333',
    align = 'left',
    maxWidth = '',
    className,
    style = {},
}: TextProps) {
    const combinedStyle: React.CSSProperties = {
        fontSize: fontSizeMap[fontSize],
        fontWeight: fontWeightMap[fontWeight],
        color: textColor,
        textAlign: align,
        maxWidth: maxWidth || undefined,
        lineHeight: 1.6,
        ...style,
    };

    // Parse content for basic formatting
    const renderContent = () => {
        return content.split('\n').map((line, index) => (
            <span key={index}>
                {line}
                {index < content.split('\n').length - 1 && <br />}
            </span>
        ));
    };

    return (
        <div className={cn('text-component', className)} style={combinedStyle}>
            {renderContent()}
        </div>
    );
}

export default TextComponent;
