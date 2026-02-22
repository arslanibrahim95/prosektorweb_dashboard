/**
 * Hero Bileşeni - Website Builder
 * 
 * Hero section bileşeni - büyük başlık ve CTA içeren görsel bölüm
 */

import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface HeroProps {
    // İçerik
    title: string;
    subtitle?: string;
    backgroundImage?: string;
    backgroundVideo?: string;

    // Düzen
    textAlign: 'left' | 'center' | 'right';
    overlay?: boolean;
    overlayOpacity?: number;

    // Boşluk
    padding: {
        top: number;
        bottom: number;
    };

    // Renkler
    backgroundColor?: string;
    textColor?: string;
    titleColor?: string;
    subtitleColor?: string;

    // Buton
    buttonText?: string;
    buttonUrl?: string;
    buttonVariant: 'primary' | 'secondary' | 'outline' | 'ghost';
    buttonAlign?: 'left' | 'center' | 'right';

    // Responsive
    fullWidth?: boolean;
    minHeight?: string;
}

// ============================================================================
// Schema - Properties Panel için yapılandırma
// ============================================================================

export const heroSchema = {
    title: {
        type: 'text' as const,
        label: 'Başlık',
        required: true,
        placeholder: 'Hero başlığını girin',
    },
    subtitle: {
        type: 'textarea' as const,
        label: 'Alt Başlık',
        placeholder: 'Alt başlık metnini girin',
    },
    backgroundImage: {
        type: 'image' as const,
        label: 'Arka Plan Resmi',
    },
    backgroundColor: {
        type: 'color' as const,
        label: 'Arka Plan Rengi',
    },
    textAlign: {
        type: 'select' as const,
        label: 'Metin Hizalama',
        options: [
            { value: 'left', label: 'Sol' },
            { value: 'center', label: 'Orta' },
            { value: 'right', label: 'Sağ' },
        ],
    },
    overlay: {
        type: 'boolean' as const,
        label: 'Overlay Ekle',
    },
    overlayOpacity: {
        type: 'range' as const,
        label: 'Overlay Opaklık',
        min: 0,
        max: 100,
        step: 5,
    },
    padding: {
        type: 'spacing' as const,
        label: 'İç Boşluk',
    },
    buttonText: {
        type: 'text' as const,
        label: 'Buton Metni',
    },
    buttonUrl: {
        type: 'url' as const,
        label: 'Buton Linki',
    },
    buttonVariant: {
        type: 'select' as const,
        label: 'Buton Tipi',
        options: [
            { value: 'primary', label: 'Primary' },
            { value: 'secondary', label: 'Secondary' },
            { value: 'outline', label: 'Outline' },
            { value: 'ghost', label: 'Ghost' },
        ],
    },
    buttonAlign: {
        type: 'select' as const,
        label: 'Buton Hizalama',
        options: [
            { value: 'left', label: 'Sol' },
            { value: 'center', label: 'Orta' },
            { value: 'right', label: 'Sağ' },
        ],
    },
};

// ============================================================================
// Default Props
// ============================================================================

export const defaultHeroProps: HeroProps = {
    title: 'Hero Başlığı',
    subtitle: 'Bu bir alt başlık metnidir. Buraya açıklayıcı bir metin yazabilirsiniz.',
    textAlign: 'center',
    overlay: false,
    overlayOpacity: 50,
    padding: {
        top: 80,
        bottom: 80,
    },
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    titleColor: '#1a1a1a',
    subtitleColor: '#666666',
    buttonText: 'Hemen Başla',
    buttonUrl: '#',
    buttonVariant: 'primary',
    buttonAlign: 'center',
    fullWidth: false,
    minHeight: '60vh',
};

// ============================================================================
// Component
// ============================================================================

export function HeroComponent({
    title,
    subtitle,
    backgroundImage,
    textAlign = 'center',
    overlay = false,
    overlayOpacity = 50,
    padding = { top: 80, bottom: 80 },
    backgroundColor = '#ffffff',
    titleColor = '#1a1a1a',
    subtitleColor = '#666666',
    buttonText,
    buttonUrl = '#',
    buttonVariant = 'primary',
    buttonAlign = 'center',
    minHeight = '60vh',
}: HeroProps) {

    const textAlignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    }[textAlign];

    const buttonAlignClass = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
    }[buttonAlign];

    const buttonVariantClasses = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border-2 border-primary bg-transparent hover:bg-primary/10',
        ghost: 'hover:bg-muted',
    };

    return (
        <section
            className={`relative flex flex-col items-center ${textAlignClass}`}
            style={{
                backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                paddingTop: padding.top,
                paddingBottom: padding.bottom,
                minHeight,
            }}
        >
            {/* Overlay */}
            {overlay && (
                <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: overlayOpacity / 100 }}
                />
            )}

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4">
                <h1
                    className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
                    style={{ color: titleColor }}
                >
                    {title}
                </h1>

                {subtitle && (
                    <p
                        className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
                        style={{ color: subtitleColor }}
                    >
                        {subtitle}
                    </p>
                )}

                {buttonText && (
                    <div className={`flex ${buttonAlignClass} gap-4`}>
                        <a
                            href={buttonUrl}
                            className={`px-8 py-3 rounded-lg font-medium transition-colors ${buttonVariantClasses[buttonVariant]}`}
                        >
                            {buttonText}
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
}

// ============================================================================
// Builder Preview
// ============================================================================

export function HeroBuilderPreview({ title, subtitle, buttonText }: Partial<HeroProps>) {
    return (
        <div className="text-center p-8 bg-gradient-to-b from-gray-50 to-white rounded-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title || 'Hero Section'}</h3>
            <p className="text-sm text-gray-500 mt-1">
                {subtitle ? subtitle.slice(0, 50) + '...' : 'Alt başlık metni'}
            </p>
            {buttonText && (
                <div className="mt-4">
                    <span className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md">
                        {buttonText}
                    </span>
                </div>
            )}
        </div>
    );
}

export default HeroComponent;
