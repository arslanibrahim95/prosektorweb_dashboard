/**
 * Component Registry - Bilesen Kayit Defteri
 * 
 * Tum kullanilabilir bileşenlerin merkezi kayit noktasi.
 */

import React from 'react';
import HeroComponent from './hero';
import TextComponent from './text';
import ImageComponent from './image';
import ContainerComponent from './container';
import GridComponent from './grid';
import SpacerComponent from './spacer';
import ButtonComponent from './button';
import GalleryComponent from './gallery';
import NavComponent from './nav';
import FooterComponent from './footer';
import FormComponent from './form';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ComponentConfig {
    name: string;
    description: string;
    category: 'hero' | 'content' | 'form' | 'navigation' | 'layout' | 'media' | 'custom';
    icon: string;
    type: string;
    defaultProps: Record<string, unknown>;
    schema: Record<string, {
        type: 'text' | 'textarea' | 'number' | 'color' | 'select' | 'boolean' | 'image' | 'url' | 'range' | 'spacing';
        label: string;
        options?: { value: string; label: string }[];
        min?: number;
        max?: number;
        step?: number;
        placeholder?: string;
    }>;
    component: React.ComponentType<Record<string, unknown>>;
    responsive?: boolean;
    themeable?: boolean;
}

function asRegistryComponent<TProps extends object>(
    component: React.ComponentType<TProps>
): React.ComponentType<Record<string, unknown>> {
    return component as unknown as React.ComponentType<Record<string, unknown>>;
}

// ============================================================================
// Component Registry
// ============================================================================

export const componentRegistry: Record<string, ComponentConfig> = {
    hero: {
        name: 'Hero Bolumu',
        description: 'Dikkat çekici giris bolumu',
        category: 'hero',
        icon: 'Square',
        type: 'hero',
        defaultProps: {
            title: 'Harika Bir Baslik',
            subtitle: 'Bu alt baslik dikkat çekici olmali',
            description: 'Musterilerinizi cezbedecek harika bir açiklama yazin.',
            backgroundImage: '',
            backgroundColor: '#1a1a2e',
            textColor: '#ffffff',
            buttonText: 'Baslayalim',
            buttonUrl: '#',
            buttonColor: '#6366f1',
            overlay: true,
            overlayOpacity: 50,
            align: 'center',
            height: 'medium',
        },
        schema: {
            title: { type: 'text', label: 'Baslik', placeholder: 'Ana baslik girin' },
            subtitle: { type: 'text', label: 'Alt Baslik', placeholder: 'Alt baslik girin' },
            description: { type: 'textarea', label: 'Açiklama', placeholder: 'Açiklama girin' },
            backgroundImage: { type: 'image', label: 'Arka Plan Resmi' },
            backgroundColor: { type: 'color', label: 'Arka Plan Rengi' },
            textColor: { type: 'color', label: 'Metin Rengi' },
            buttonText: { type: 'text', label: 'Buton Metni' },
            buttonUrl: { type: 'url', label: 'Buton Linki' },
            buttonColor: { type: 'color', label: 'Buton Rengi' },
            overlay: { type: 'boolean', label: 'Kaplamayi Etkinlestir' },
            overlayOpacity: { type: 'range', label: 'Kaplam Opakligi', min: 0, max: 100 },
            align: {
                type: 'select',
                label: 'Hizalama',
                options: [
                    { value: 'left', label: 'Sol' },
                    { value: 'center', label: 'Orta' },
                    { value: 'right', label: 'Sag' },
                ]
            },
            height: {
                type: 'select',
                label: 'Yukseklik',
                options: [
                    { value: 'small', label: 'Kucuk' },
                    { value: 'medium', label: 'Orta' },
                    { value: 'large', label: 'Buyuk' },
                    { value: 'full', label: 'Tam Ekran' },
                ]
            },
        },
        component: asRegistryComponent(HeroComponent),
        responsive: true,
        themeable: true,
    },

    text: {
        name: 'Metin Blogu',
        description: 'Duzenlenebilir metin içerigi',
        category: 'content',
        icon: 'Type',
        type: 'text',
        defaultProps: {
            content: 'Metin içeriğinizi buraya yazin...',
            fontSize: 'medium',
            fontWeight: 'normal',
            textColor: '#333333',
            align: 'left',
            maxWidth: '',
        },
        schema: {
            content: { type: 'textarea', label: 'Içerik', placeholder: 'Metin girin' },
            fontSize: {
                type: 'select',
                label: 'Yazi Boyutu',
                options: [
                    { value: 'small', label: 'Kucuk' },
                    { value: 'medium', label: 'Orta' },
                    { value: 'large', label: 'Buyuk' },
                    { value: 'xlarge', label: 'Cok Buyuk' },
                ]
            },
            fontWeight: {
                type: 'select',
                label: 'Kalinlik',
                options: [
                    { value: 'normal', label: 'Normal' },
                    { value: 'medium', label: 'Orta' },
                    { value: 'bold', label: 'Kalin' },
                ]
            },
            textColor: { type: 'color', label: 'Metin Rengi' },
            align: {
                type: 'select',
                label: 'Hizalama',
                options: [
                    { value: 'left', label: 'Sol' },
                    { value: 'center', label: 'Orta' },
                    { value: 'right', label: 'Sag' },
                    { value: 'justify', label: 'Yasla' },
                ]
            },
            maxWidth: { type: 'text', label: 'Maksimum Genislik', placeholder: 'orn: 800px' },
        },
        component: asRegistryComponent(TextComponent),
        responsive: true,
        themeable: true,
    },

    image: {
        name: 'Resim',
        description: 'Tek resim veya görsel',
        category: 'media',
        icon: 'Image',
        type: 'image',
        defaultProps: {
            src: '',
            alt: 'Resim açiklamasi',
            width: '',
            height: '',
            objectFit: 'cover',
            caption: '',
            link: '',
            borderRadius: 'none',
        },
        schema: {
            src: { type: 'image', label: 'Resim URL' },
            alt: { type: 'text', label: 'Alternatif Metin' },
            width: { type: 'text', label: 'Genislik', placeholder: 'orn: 100% veya 500px' },
            height: { type: 'text', label: 'Yukseklik', placeholder: 'orn: auto veya 300px' },
            objectFit: {
                type: 'select',
                label: 'Nesne Uyumu',
                options: [
                    { value: 'cover', label: 'Kapla' },
                    { value: 'contain', label: 'Sigidir' },
                    { value: 'fill', label: 'Doldur' },
                    { value: 'none', label: 'Ozgun' },
                ]
            },
            caption: { type: 'text', label: 'Alt Baslik' },
            link: { type: 'url', label: 'Link URL' },
            borderRadius: {
                type: 'select',
                label: 'Kose Yuvarlakligi',
                options: [
                    { value: 'none', label: 'Yok' },
                    { value: 'small', label: 'Kucuk' },
                    { value: 'medium', label: 'Orta' },
                    { value: 'large', label: 'Buyuk' },
                    { value: 'full', label: 'Tam Yuvarlak' },
                ]
            },
        },
        component: asRegistryComponent(ImageComponent),
        responsive: true,
        themeable: true,
    },

    container: {
        name: 'Konteyner',
        description: 'Içerik gruplama kabi',
        category: 'layout',
        icon: 'Square',
        type: 'container',
        defaultProps: {
            backgroundColor: 'transparent',
            padding: { top: '16', bottom: '16', left: '16', right: '16' },
            margin: { top: '0', bottom: '0', left: '0', right: '0' },
            borderRadius: 'none',
            maxWidth: '',
            minHeight: '',
        },
        schema: {
            backgroundColor: { type: 'color', label: 'Arka Plan Rengi' },
            padding: { type: 'spacing', label: 'Ic Bosluk' },
            margin: { type: 'spacing', label: 'Dis Bosluk' },
            borderRadius: {
                type: 'select',
                label: 'Kose Yuvarlakligi',
                options: [
                    { value: 'none', label: 'Yok' },
                    { value: 'small', label: 'Kucuk' },
                    { value: 'medium', label: 'Orta' },
                    { value: 'large', label: 'Buyuk' },
                ]
            },
            maxWidth: { type: 'text', label: 'Maksimum Genislik', placeholder: 'orn: 1200px' },
            minHeight: { type: 'text', label: 'Minimum Yukseklik', placeholder: 'orn: 200px' },
        },
        component: asRegistryComponent(ContainerComponent),
        responsive: true,
        themeable: true,
    },

    grid: {
        name: 'Izgara Sistemi',
        description: 'Sutunlu duzen sistemi',
        category: 'layout',
        icon: 'LayoutGrid',
        type: 'grid',
        defaultProps: {
            columns: 3,
            gap: '16',
            columnGap: '16',
            rowGap: '16',
            align: 'stretch',
        },
        schema: {
            columns: { type: 'range', label: 'Sutun Sayisi', min: 1, max: 6 },
            gap: { type: 'text', label: 'Bosluk', placeholder: 'orn: 16px' },
            columnGap: { type: 'text', label: 'Sutun Boslugu' },
            rowGap: { type: 'text', label: 'Satir Boslugu' },
            align: {
                type: 'select',
                label: 'Dikey Hizalama',
                options: [
                    { value: 'stretch', label: 'Uzat' },
                    { value: 'start', label: 'Baslangic' },
                    { value: 'center', label: 'Orta' },
                    { value: 'end', label: 'Son' },
                ]
            },
        },
        component: asRegistryComponent(GridComponent),
        responsive: true,
        themeable: false,
    },

    spacer: {
        name: 'Bosluk',
        description: 'Dikey bosluk ekleyici',
        category: 'layout',
        icon: 'MoveVertical',
        type: 'spacer',
        defaultProps: {
            height: '32',
        },
        schema: {
            height: { type: 'range', label: 'Yukseklik', min: 8, max: 200, step: 4 },
        },
        component: asRegistryComponent(SpacerComponent),
        responsive: false,
        themeable: false,
    },

    button: {
        name: 'Buton',
        description: 'Tiklanabilir buton',
        category: 'form',
        icon: 'MousePointerClick',
        type: 'button',
        defaultProps: {
            text: 'Tikla Bana',
            url: '#',
            variant: 'primary',
            size: 'medium',
            fullWidth: false,
        },
        schema: {
            text: { type: 'text', label: 'Metin' },
            url: { type: 'url', label: 'Link URL' },
            variant: {
                type: 'select',
                label: 'Varyant',
                options: [
                    { value: 'primary', label: 'Birincil' },
                    { value: 'secondary', label: 'Ikincil' },
                    { value: 'outline', label: 'Anahat' },
                    { value: 'ghost', label: 'Goegeli' },
                    { value: 'link', label: 'Baglanti' },
                ]
            },
            size: {
                type: 'select',
                label: 'Boyut',
                options: [
                    { value: 'small', label: 'Kucuk' },
                    { value: 'medium', label: 'Orta' },
                    { value: 'large', label: 'Buyuk' },
                ]
            },
            fullWidth: { type: 'boolean', label: 'Tam Genislik' },
        },
        component: asRegistryComponent(ButtonComponent),
        responsive: true,
        themeable: true,
    },

    gallery: {
        name: 'Galeri',
        description: 'Resim galerisi',
        category: 'media',
        icon: 'Images',
        type: 'gallery',
        defaultProps: {
            images: [],
            columns: 3,
            gap: '8',
            lightbox: true,
        },
        schema: {
            images: { type: 'textarea', label: 'Resimler (URL, satir basi)', placeholder: 'Her satiraya bir resim URLi' },
            columns: { type: 'range', label: 'Sutun Sayisi', min: 2, max: 6 },
            gap: { type: 'text', label: 'Bosluk' },
            lightbox: { type: 'boolean', label: 'Lightbox Etkin' },
        },
        component: asRegistryComponent(GalleryComponent),
        responsive: true,
        themeable: true,
    },

    nav: {
        name: 'Navigasyon',
        description: 'Site navigasyon menusu',
        category: 'navigation',
        icon: 'Navigation',
        type: 'nav',
        defaultProps: {
            logo: '',
            logoText: 'Logo',
            links: [
                { label: 'Ana Sayfa', url: '/' },
                { label: 'Hakkimizda', url: '/about' },
                { label: 'Iletisim', url: '/contact' },
            ],
            position: 'sticky',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            transparent: false,
        },
        schema: {
            logo: { type: 'image', label: 'Logo Resmi' },
            logoText: { type: 'text', label: 'Logo Metni' },
            backgroundColor: { type: 'color', label: 'Arka Plan Rengi' },
            textColor: { type: 'color', label: 'Metin Rengi' },
            transparent: { type: 'boolean', label: 'Seffaf Arka Plan' },
            position: {
                type: 'select',
                label: 'Pozisyon',
                options: [
                    { value: 'static', label: 'Statik' },
                    { value: 'sticky', label: 'Yapışkan' },
                    { value: 'fixed', label: 'Sabit' },
                ]
            },
        },
        component: asRegistryComponent(NavComponent),
        responsive: true,
        themeable: true,
    },

    footer: {
        name: 'Alt Bilgi',
        description: 'Site alt bilgi bolumu',
        category: 'navigation',
        icon: 'Footer',
        type: 'footer',
        defaultProps: {
            logo: '',
            logoText: 'Logo',
            description: 'Sirketiniz hakkinda kisa bir açiklama.',
            columns: [
                {
                    title: 'Hizli Linkler',
                    links: [
                        { label: 'Ana Sayfa', url: '/' },
                        { label: 'Hakkimizda', url: '/about' },
                    ]
                },
                {
                    title: 'Iletisim',
                    links: [
                        { label: 'info@example.com', url: 'mailto:info@example.com' },
                        { label: '+90 123 456 7890', url: 'tel:+901234567890' },
                    ]
                }
            ],
            copyright: '© 2024 Tum haklari saklidir.',
            backgroundColor: '#1a1a2e',
            textColor: '#ffffff',
        },
        schema: {
            logo: { type: 'image', label: 'Logo Resmi' },
            logoText: { type: 'text', label: 'Logo Metni' },
            description: { type: 'textarea', label: 'Açiklama' },
            copyright: { type: 'text', label: 'Telif Hakkı' },
            backgroundColor: { type: 'color', label: 'Arka Plan Rengi' },
            textColor: { type: 'color', label: 'Metin Rengi' },
        },
        component: asRegistryComponent(FooterComponent),
        responsive: true,
        themeable: true,
    },

    form: {
        name: 'Form',
        description: 'Iletisim formu veya anket',
        category: 'form',
        icon: 'FileInput',
        type: 'form',
        defaultProps: {
            fields: [
                { type: 'text', name: 'name', label: 'Ad Soyad', placeholder: 'Adinizi girin', required: true },
                { type: 'email', name: 'email', label: 'E-posta', placeholder: 'E-posta adresiniz', required: true },
                { type: 'textarea', name: 'message', label: 'Mesaj', placeholder: 'Mesajiniz', required: true },
            ],
            submitLabel: 'Gonder',
            submitUrl: '#',
            method: 'POST',
        },
        schema: {
            submitLabel: { type: 'text', label: 'Buton Metni' },
            submitUrl: { type: 'url', label: 'Form URL' },
            method: {
                type: 'select',
                label: 'Metot',
                options: [
                    { value: 'GET', label: 'GET' },
                    { value: 'POST', label: 'POST' },
                ]
            },
        },
        component: asRegistryComponent(FormComponent),
        responsive: true,
        themeable: true,
    },
};

// ============================================================================
// Helper Functions
// ============================================================================

export const categoryLabels: Record<string, string> = {
    hero: 'Hero Bolumleri',
    content: 'Icerik',
    media: 'Medya',
    layout: 'Duzen',
    form: 'Formlar',
    navigation: 'Navigasyon',
    custom: 'Ozel',
};

export function getComponentsByCategory(category: string): ComponentConfig[] {
    return Object.values(componentRegistry)
        .filter((config) => config.category === category);
}

export function getCategories(): { id: string; name: string; icon: string }[] {
    return [
        { id: 'hero', name: 'Hero Bolumleri', icon: '🎯' },
        { id: 'content', name: 'Icerik', icon: '📝' },
        { id: 'media', name: 'Medya', icon: '🖼️' },
        { id: 'layout', name: 'Duzen', icon: '🔲' },
        { id: 'form', name: 'Formlar', icon: '📋' },
        { id: 'navigation', name: 'Navigasyon', icon: '🔗' },
        { id: 'custom', name: 'Ozel', icon: '✨' },
    ];
}

export function getDefaultProps(type: string): Record<string, unknown> {
    return componentRegistry[type]?.defaultProps || {};
}

export function isValidComponentType(type: string): boolean {
    return type in componentRegistry;
}

export default componentRegistry;
