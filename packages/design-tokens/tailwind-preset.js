/**
 * ProsektorWeb Tailwind Preset - 2026 Edition
 * 
 * 2026 Trend Rationale:
 * - Extended color palette for vibrant, saturated designs
 * - New accent colors: coral, turquoise, violet, amber, emerald
 * - Enhanced shadows for neomorphism and glassmorphism
 * - Glow effects for premium feel
 * - Micro-interaction animations
 * 
 * Shared configuration for all apps using the design system
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
    theme: {
        extend: {
            colors: {
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                destructive: {
                    DEFAULT: 'var(--destructive)',
                    foreground: 'var(--destructive-foreground)',
                },
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                popover: {
                    DEFAULT: 'var(--popover)',
                    foreground: 'var(--popover-foreground)',
                },
                card: {
                    DEFAULT: 'var(--card)',
                    foreground: 'var(--card-foreground)',
                },
                sidebar: {
                    DEFAULT: 'var(--sidebar-background)',
                    foreground: 'var(--sidebar-foreground)',
                    primary: 'var(--sidebar-primary)',
                    'primary-foreground': 'var(--sidebar-primary-foreground)',
                    accent: 'var(--sidebar-accent)',
                    'accent-foreground': 'var(--sidebar-accent-foreground)',
                    border: 'var(--sidebar-border)',
                    ring: 'var(--sidebar-ring)',
                },
                // Semantic colors
                success: {
                    DEFAULT: 'var(--success)',
                    foreground: 'var(--success-foreground)',
                },
                warning: {
                    DEFAULT: 'var(--warning)',
                    foreground: 'var(--warning-foreground)',
                },
                danger: {
                    DEFAULT: 'var(--destructive)',
                    foreground: 'var(--destructive-foreground)',
                },
                info: {
                    DEFAULT: 'var(--info)',
                    foreground: 'var(--info-foreground)',
                },
                // 2026: New accent colors
                coral: {
                    50: 'var(--color-coral-50)',
                    100: 'var(--color-coral-100)',
                    200: 'var(--color-coral-200)',
                    300: 'var(--color-coral-300)',
                    400: 'var(--color-coral-400)',
                    500: 'var(--color-coral-500)',
                    600: 'var(--color-coral-600)',
                    700: 'var(--color-coral-700)',
                },
                turquoise: {
                    50: 'var(--color-turquoise-50)',
                    100: 'var(--color-turquoise-100)',
                    200: 'var(--color-turquoise-200)',
                    300: 'var(--color-turquoise-300)',
                    400: 'var(--color-turquoise-400)',
                    500: 'var(--color-turquoise-500)',
                    600: 'var(--color-turquoise-600)',
                    700: 'var(--color-turquoise-700)',
                },
                violet: {
                    50: 'var(--color-violet-50)',
                    100: 'var(--color-violet-100)',
                    200: 'var(--color-violet-200)',
                    300: 'var(--color-violet-300)',
                    400: 'var(--color-violet-400)',
                    500: 'var(--color-violet-500)',
                    600: 'var(--color-violet-600)',
                    700: 'var(--color-violet-700)',
                },
                amber: {
                    50: 'var(--color-amber-50)',
                    100: 'var(--color-amber-100)',
                    200: 'var(--color-amber-200)',
                    300: 'var(--color-amber-300)',
                    400: 'var(--color-amber-400)',
                    500: 'var(--color-amber-500)',
                    600: 'var(--color-amber-600)',
                    700: 'var(--color-amber-700)',
                },
                emerald: {
                    50: 'var(--color-emerald-50)',
                    100: 'var(--color-emerald-100)',
                    200: 'var(--color-emerald-200)',
                    300: 'var(--color-emerald-300)',
                    400: 'var(--color-emerald-400)',
                    500: 'var(--color-emerald-500)',
                    600: 'var(--color-emerald-600)',
                    700: 'var(--color-emerald-700)',
                },
            },
            borderRadius: {
                sm: 'calc(var(--radius) - 4px)',
                DEFAULT: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
                '2xl': 'var(--radius-2xl)',
                '3xl': 'var(--radius-3xl)',
            },
            // 2026: Extended shadows
            boxShadow: {
                'neo': '8px 8px 16px oklch(0 0 0 / 0.06), -8px -8px 16px oklch(1 0 0 / 0.5)',
                'neo-dark': '8px 8px 20px oklch(0 0 0 / 0.4), -8px -8px 20px oklch(1 0 0 / 0.03)',
                'glass': '0 8px 32px oklch(0 0 0 / 0.08)',
                'glass-strong': '0 12px 48px oklch(0 0 0 / 0.15)',
                'glow-primary': '0 0 20px oklch(0.55 0.20 250 / 0.25)',
                'glow-coral': '0 0 20px oklch(0.58 0.25 25 / 0.25)',
                'glow-turquoise': '0 0 20px oklch(0.55 0.24 180 / 0.25)',
                'glow-violet': '0 0 20px oklch(0.55 0.22 290 / 0.25)',
            },
            // 2026: Animation keyframes
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'scale-in-up': {
                    '0%': { opacity: '0', transform: 'scale(0.9) translateY(10px)' },
                    '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
                },
                'bounce-subtle': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '30%': { transform: 'scale(0.95)' },
                    '50%': { transform: 'scale(1.02)' },
                    '70%': { transform: 'scale(0.99)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 0 0 transparent' },
                    '50%': { boxShadow: '0 0 20px 2px oklch(0.55 0.20 250 / 0.3)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
                'elastic': {
                    '0%': { opacity: '0', transform: 'scale(0.9) translateY(20px)' },
                    '60%': { opacity: '1', transform: 'scale(1.02) translateY(-2px)' },
                    '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
                },
                'incoming': {
                    '0%': { opacity: '0', transform: 'translateY(20px) scale(0.96)', filter: 'blur(4px)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
                },
                'shimmer-diagonal': {
                    '0%': { backgroundPosition: '200% 200%' },
                    '100%': { backgroundPosition: '-200% -200%' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.3s var(--ease-smooth) forwards',
                'fade-in-up': 'fade-in-up 0.4s var(--ease-out-expo) forwards',
                'scale-in': 'scale-in 0.2s var(--ease-spring) forwards',
                'scale-in-up': 'scale-in-up 0.3s var(--ease-spring) forwards',
                'bounce-subtle': 'bounce-subtle 0.6s var(--ease-spring) forwards',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'elastic': 'elastic 0.8s var(--ease-spring) forwards',
                'incoming': 'incoming 0.4s var(--ease-out-expo) forwards',
            },
            // 2026: Extended spacing
            spacing: {
                'whitespace-sm': 'var(--spacing-whitespace-sm)',
                'whitespace-md': 'var(--spacing-whitespace-md)',
                'whitespace-lg': 'var(--spacing-whitespace-lg)',
                'whitespace-xl': 'var(--spacing-whitespace-xl)',
            },
            // 2026: Transition durations
            transitionDuration: {
                'micro': '100ms',
            },
            // 2026: Font sizes for fluid typography
            fontSize: {
                'fluid-sm': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
                'fluid-base': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
                'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
                'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
                'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)',
                'fluid-3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)',
                'fluid-4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
            },
        },
    },
};
