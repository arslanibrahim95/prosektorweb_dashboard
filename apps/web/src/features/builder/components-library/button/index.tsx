/**
 * Button Component - Buton Bileşeni
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Link2 } from 'lucide-react';

interface ButtonProps {
    text?: string;
    url?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

// ============================================================================
// Variant Styles
// ============================================================================

const variantStyles = {
    primary: {
        backgroundColor: '#6366f1',
        color: '#ffffff',
        border: 'none',
    },
    secondary: {
        backgroundColor: '#64748b',
        color: '#ffffff',
        border: 'none',
    },
    outline: {
        backgroundColor: 'transparent',
        color: '#6366f1',
        border: '2px solid #6366f1',
    },
    ghost: {
        backgroundColor: 'transparent',
        color: '#333333',
        border: 'none',
    },
    link: {
        backgroundColor: 'transparent',
        color: '#6366f1',
        border: 'none',
        textDecoration: 'underline',
    },
};

const sizeStyles = {
    small: {
        padding: '8px 16px',
        fontSize: '0.875rem',
    },
    medium: {
        padding: '12px 24px',
        fontSize: '1rem',
    },
    large: {
        padding: '16px 32px',
        fontSize: '1.125rem',
    },
};

// ============================================================================
// Component
// ============================================================================

export function ButtonComponent({
    text = 'Tıkla Bana',
    url = '#',
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    className,
    style = {},
    onClick,
}: ButtonProps) {
    const combinedStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '6px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: fullWidth ? '100%' : 'auto',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
    };

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) {
            e.preventDefault();
            onClick();
        }
    };

    const buttonContent = (
        <>
            <span>{text}</span>
            {url && url !== '#' && <Link2 className="w-4 h-4" />}
        </>
    );

    return (
        <a
            href={url}
            className={cn('button-component', className)}
            style={combinedStyle}
            onClick={handleClick}
        >
            {buttonContent}
        </a>
    );
}

export default ButtonComponent;
