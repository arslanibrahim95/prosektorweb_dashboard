/**
 * ProsektorWeb Design Tokens
 * 
 * Main entry point for the design tokens package.
 * Import tokens.css directly for CSS variables.
 * Use tailwind-preset.js for Tailwind configuration.
 */

// Export token values as JS constants for programmatic use
const tokens = {
    colors: {
        primary: {
            50: 'oklch(0.97 0.02 250)',
            100: 'oklch(0.93 0.04 250)',
            200: 'oklch(0.86 0.08 250)',
            300: 'oklch(0.76 0.12 250)',
            400: 'oklch(0.65 0.16 250)',
            500: 'oklch(0.55 0.20 250)',
            600: 'oklch(0.48 0.18 250)',
            700: 'oklch(0.40 0.15 250)',
            800: 'oklch(0.33 0.12 250)',
            900: 'oklch(0.27 0.09 250)',
            950: 'oklch(0.20 0.06 250)',
        },
        semantic: {
            success: 'oklch(0.62 0.17 145)',
            warning: 'oklch(0.75 0.18 85)',
            danger: 'oklch(0.58 0.24 27)',
            info: 'oklch(0.65 0.15 230)',
        },
    },
    spacing: {
        0: '0',
        px: '1px',
        0.5: '0.125rem',
        1: '0.25rem',
        1.5: '0.375rem',
        2: '0.5rem',
        2.5: '0.625rem',
        3: '0.75rem',
        3.5: '0.875rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        7: '1.75rem',
        8: '2rem',
        9: '2.25rem',
        10: '2.5rem',
        12: '3rem',
        14: '3.5rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
    },
    radii: {
        none: '0',
        sm: '0.125rem',
        default: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
    },
    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
    },
};

module.exports = { tokens };
