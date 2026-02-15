/**
 * Image Component - Resim Bileşeni
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ImageProps {
    src?: string;
    alt?: string;
    width?: string;
    height?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    caption?: string;
    link?: string;
    borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
    className?: string;
    style?: React.CSSProperties;
}

// ============================================================================
// Border Radius Map
// ============================================================================

const borderRadiusMap = {
    none: '0',
    small: '4px',
    medium: '8px',
    large: '16px',
    full: '9999px',
};

// ============================================================================
// Component
// ============================================================================

export function ImageComponent({
    src = '',
    alt = 'Image',
    width = '',
    height = '',
    objectFit = 'cover',
    caption = '',
    link = '',
    borderRadius = 'none',
    className,
    style = {},
}: ImageProps) {
    const combinedStyle: React.CSSProperties = {
        width: width || '100%',
        height: height || 'auto',
        objectFit,
        borderRadius: borderRadiusMap[borderRadius],
        display: 'block',
        ...style,
    };

    const imageContent = (
        <img
            src={src}
            alt={alt}
            style={combinedStyle}
            className={cn('image-component', className)}
        />
    );

    return (
        <figure className={cn('image-figure', className)}>
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer">
                    {imageContent}
                </a>
            ) : (
                imageContent
            )}
            {caption && (
                <figcaption className="text-center text-sm text-muted-foreground mt-2">
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}

export default ImageComponent;
