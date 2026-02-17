/**
 * Gallery Component - Galeri Bileşeni
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface GalleryProps {
    images?: string[];
    columns?: number;
    gap?: string;
    lightbox?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

// ============================================================================
// Component
// ============================================================================

export function GalleryComponent({
    images = [],
    columns = 3,
    gap = '8',
    lightbox = true,
    className,
    style = {},
}: GalleryProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const combinedStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        ...style,
    };

    const handleImageClick = (index: number) => {
        if (lightbox) {
            setSelectedIndex(index);
            setLightboxOpen(true);
        }
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = () => {
        setSelectedIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!images || images.length === 0) {
        return (
            <div
                className={cn('gallery-empty p-8 text-center text-muted-foreground', className)}
                style={style}
            >
                <p>Galeriye resim eklemek için özellikler panelini kullanın</p>
            </div>
        );
    }

    return (
        <>
            <div
                className={cn('gallery-component', className)}
                style={combinedStyle}
            >
                {images.map((src, index) => (
                    <div
                        key={index}
                        className="gallery-item aspect-square overflow-hidden rounded-md cursor-pointer"
                        onClick={() => handleImageClick(index)}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightbox && lightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
                        onClick={closeLightbox}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Previous button */}
                    {images.length > 1 && (
                        <button
                            className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    {/* Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={images[selectedIndex]}
                        alt={`Gallery image ${selectedIndex + 1}`}
                        className="max-w-full max-h-[80vh] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Next button */}
                    {images.length > 1 && (
                        <button
                            className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}

                    {/* Counter */}
                    <div className="absolute bottom-4 text-white text-sm">
                        {selectedIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </>
    );
}

export default GalleryComponent;
