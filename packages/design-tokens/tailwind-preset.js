/**
 * ProsektorWeb Tailwind Preset
 * 
 * Shared configuration for all apps using the design system
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
    theme: {
        extend: {
            colors: {
                // Semantic colors using CSS variables
                success: {
                    DEFAULT: 'var(--color-success)',
                    foreground: 'var(--color-success-foreground)',
                    muted: 'var(--color-success-muted)',
                },
                warning: {
                    DEFAULT: 'var(--color-warning)',
                    foreground: 'var(--color-warning-foreground)',
                    muted: 'var(--color-warning-muted)',
                },
                danger: {
                    DEFAULT: 'var(--color-danger)',
                    foreground: 'var(--color-danger-foreground)',
                    muted: 'var(--color-danger-muted)',
                },
                info: {
                    DEFAULT: 'var(--color-info)',
                    foreground: 'var(--color-info-foreground)',
                    muted: 'var(--color-info-muted)',
                },
            },
            spacing: {
                '0.5': 'var(--space-0-5)',
                '1': 'var(--space-1)',
                '1.5': 'var(--space-1-5)',
                '2': 'var(--space-2)',
                '2.5': 'var(--space-2-5)',
                '3': 'var(--space-3)',
                '3.5': 'var(--space-3-5)',
                '4': 'var(--space-4)',
                '5': 'var(--space-5)',
                '6': 'var(--space-6)',
                '7': 'var(--space-7)',
                '8': 'var(--space-8)',
                '9': 'var(--space-9)',
                '10': 'var(--space-10)',
                '12': 'var(--space-12)',
                '14': 'var(--space-14)',
                '16': 'var(--space-16)',
                '20': 'var(--space-20)',
                '24': 'var(--space-24)',
            },
            fontSize: {
                'xs': ['var(--font-size-xs)', { lineHeight: 'var(--line-height-normal)' }],
                'sm': ['var(--font-size-sm)', { lineHeight: 'var(--line-height-normal)' }],
                'base': ['var(--font-size-base)', { lineHeight: 'var(--line-height-normal)' }],
                'lg': ['var(--font-size-lg)', { lineHeight: 'var(--line-height-snug)' }],
                'xl': ['var(--font-size-xl)', { lineHeight: 'var(--line-height-snug)' }],
                '2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-tight)' }],
                '3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-tight)' }],
                '4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)' }],
            },
            borderRadius: {
                'none': 'var(--radius-none)',
                'sm': 'var(--radius-sm)',
                'DEFAULT': 'var(--radius-default)',
                'md': 'var(--radius-md)',
                'lg': 'var(--radius-lg)',
                'xl': 'var(--radius-xl)',
                '2xl': 'var(--radius-2xl)',
                '3xl': 'var(--radius-3xl)',
                'full': 'var(--radius-full)',
            },
            boxShadow: {
                'xs': 'var(--shadow-xs)',
                'sm': 'var(--shadow-sm)',
                'DEFAULT': 'var(--shadow-md)',
                'md': 'var(--shadow-md)',
                'lg': 'var(--shadow-lg)',
                'xl': 'var(--shadow-xl)',
                '2xl': 'var(--shadow-2xl)',
                'inner': 'var(--shadow-inner)',
            },
            zIndex: {
                'dropdown': 'var(--z-dropdown)',
                'sticky': 'var(--z-sticky)',
                'fixed': 'var(--z-fixed)',
                'modal-backdrop': 'var(--z-modal-backdrop)',
                'modal': 'var(--z-modal)',
                'popover': 'var(--z-popover)',
                'tooltip': 'var(--z-tooltip)',
            },
            transitionDuration: {
                'fast': 'var(--transition-fast)',
                'normal': 'var(--transition-normal)',
                'slow': 'var(--transition-slow)',
            },
            transitionTimingFunction: {
                'default': 'var(--ease-default)',
                'in': 'var(--ease-in)',
                'out': 'var(--ease-out)',
                'in-out': 'var(--ease-in-out)',
            },
            animation: {
                'fade-in': 'fadeIn var(--transition-normal) var(--ease-out)',
                'fade-out': 'fadeOut var(--transition-normal) var(--ease-in)',
                'slide-in-right': 'slideInRight var(--transition-normal) var(--ease-out)',
                'slide-out-right': 'slideOutRight var(--transition-normal) var(--ease-in)',
                'scale-in': 'scaleIn var(--transition-fast) var(--ease-out)',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                slideOutRight: {
                    '0%': { transform: 'translateX(0)', opacity: '1' },
                    '100%': { transform: 'translateX(100%)', opacity: '0' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
        },
    },
};
