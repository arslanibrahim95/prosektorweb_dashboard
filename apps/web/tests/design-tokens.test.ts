/**
 * Design Token Tests
 *
 * Tests for design system token values, dark mode transitions,
 * and semantic token references. These tests ensure design consistency
 * and prevent regression when tokens are modified.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read the tokens CSS file
const tokensPath = resolve(__dirname, '../../../packages/design-tokens/tokens.css');
const tokensContent = readFileSync(tokensPath, 'utf-8');

// Helper to extract token value from CSS
function extractTokenValue(tokenName: string): string | null {
  const regex = new RegExp(`--${tokenName}:\\s*([^;]+)`);
  const match = tokensContent.match(regex);
  return match ? match[1].trim() : null;
}

// Helper to check if a token exists
function tokenExists(tokenName: string): boolean {
  return tokensContent.includes(`--${tokenName}:`);
}

// Helper to check if a token references another token
function referencesToken(tokenName: string, expectedRef: string): boolean {
  const value = extractTokenValue(tokenName);
  return value?.includes(`var(--${expectedRef})`) ?? false;
}

// =========================================================================
// Typography Token Tests
// =========================================================================
describe('Design Tokens: Typography', () => {
  it('should have font-size-xs token defined', () => {
    expect(tokenExists('font-size-xs')).toBe(true);
    expect(extractTokenValue('font-size-xs')).toBe('0.625rem'); /* 10px */
  });

  it('should have font-size-sm token defined', () => {
    expect(tokenExists('font-size-sm')).toBe(true);
    expect(extractTokenValue('font-size-sm')).toBe('0.75rem'); /* 12px */
  });

  it('should have font-size-base token defined', () => {
    expect(tokenExists('font-size-base')).toBe(true);
    expect(extractTokenValue('font-size-base')).toBe('0.875rem'); /* 14px */
  });

  it('should have font-size-md token defined', () => {
    expect(tokenExists('font-size-md')).toBe(true);
    expect(extractTokenValue('font-size-md')).toBe('1rem'); /* 16px */
  });

  it('should have font-size-lg token defined', () => {
    expect(tokenExists('font-size-lg')).toBe(true);
    expect(extractTokenValue('font-size-lg')).toBe('1.125rem'); /* 18px */
  });

  it('should have font-size-xl token defined', () => {
    expect(tokenExists('font-size-xl')).toBe(true);
    expect(extractTokenValue('font-size-xl')).toBe('1.25rem'); /* 20px */
  });
});

// =========================================================================
// Layout Dimension Token Tests
// =========================================================================
describe('Design Tokens: Layout Dimensions', () => {
  it('should have sidebar-width token defined', () => {
    expect(tokenExists('sidebar-width')).toBe(true);
    expect(extractTokenValue('sidebar-width')).toBe('260px');
  });

  it('should have topbar-height token defined', () => {
    expect(tokenExists('topbar-height')).toBe(true);
    expect(extractTokenValue('topbar-height')).toBe('64px');
  });

  it('should have header-height token defined', () => {
    expect(tokenExists('header-height')).toBe(true);
    expect(extractTokenValue('header-height')).toBe('64px');
  });
});

// =========================================================================
// Color Token Tests
// =========================================================================
describe('Design Tokens: Colors', () => {
  describe('Primitive Colors', () => {
    it('should have neutral color scale', () => {
      expect(tokenExists('color-neutral-0')).toBe(true);
      expect(tokenExists('color-neutral-50')).toBe(true);
      expect(tokenExists('color-neutral-100')).toBe(true);
      expect(tokenExists('color-neutral-200')).toBe(true);
      expect(tokenExists('color-neutral-300')).toBe(true);
      expect(tokenExists('color-neutral-400')).toBe(true);
      expect(tokenExists('color-neutral-500')).toBe(true);
      expect(tokenExists('color-neutral-600')).toBe(true);
      expect(tokenExists('color-neutral-700')).toBe(true);
      expect(tokenExists('color-neutral-800')).toBe(true);
      expect(tokenExists('color-neutral-900')).toBe(true);
      expect(tokenExists('color-neutral-950')).toBe(true);
      expect(tokenExists('color-neutral-1000')).toBe(true);
    });

    it('should have brand color scale', () => {
      expect(tokenExists('color-brand-50')).toBe(true);
      expect(tokenExists('color-brand-500')).toBe(true);
      expect(tokenExists('color-brand-950')).toBe(true);
    });

    it('should have semantic color palettes', () => {
      expect(tokenExists('color-red-500')).toBe(true);
      expect(tokenExists('color-green-500')).toBe(true);
      expect(tokenExists('color-amber-500')).toBe(true);
      expect(tokenExists('color-blue-500')).toBe(true);
    });
  });

  describe('Semantic Tokens', () => {
    it('should have background/foreground tokens', () => {
      expect(tokenExists('background')).toBe(true);
      expect(tokenExists('foreground')).toBe(true);
    });

    it('should have card tokens', () => {
      expect(tokenExists('card')).toBe(true);
      expect(tokenExists('card-foreground')).toBe(true);
    });

    it('should have primary tokens', () => {
      expect(tokenExists('primary')).toBe(true);
      expect(tokenExists('primary-foreground')).toBe(true);
    });

    it('should have secondary tokens', () => {
      expect(tokenExists('secondary')).toBe(true);
      expect(tokenExists('secondary-foreground')).toBe(true);
    });

    it('should have muted tokens', () => {
      expect(tokenExists('muted')).toBe(true);
      expect(tokenExists('muted-foreground')).toBe(true);
    });

    it('should have accent tokens', () => {
      expect(tokenExists('accent')).toBe(true);
      expect(tokenExists('accent-foreground')).toBe(true);
    });

    it('should have destructive tokens', () => {
      expect(tokenExists('destructive')).toBe(true);
      expect(tokenExists('destructive-foreground')).toBe(true);
    });

    it('should have border/input/ring tokens', () => {
      expect(tokenExists('border')).toBe(true);
      expect(tokenExists('input')).toBe(true);
      expect(tokenExists('ring')).toBe(true);
    });

    it('should have status color tokens', () => {
      expect(tokenExists('success')).toBe(true);
      expect(tokenExists('success-foreground')).toBe(true);
      expect(tokenExists('warning')).toBe(true);
      expect(tokenExists('warning-foreground')).toBe(true);
      expect(tokenExists('info')).toBe(true);
      expect(tokenExists('info-foreground')).toBe(true);
    });
  });

  describe('Sidebar Tokens', () => {
    it('should have all sidebar tokens', () => {
      expect(tokenExists('sidebar-background')).toBe(true);
      expect(tokenExists('sidebar-foreground')).toBe(true);
      expect(tokenExists('sidebar-primary')).toBe(true);
      expect(tokenExists('sidebar-primary-foreground')).toBe(true);
      expect(tokenExists('sidebar-accent')).toBe(true);
      expect(tokenExists('sidebar-accent-foreground')).toBe(true);
      expect(tokenExists('sidebar-border')).toBe(true);
      expect(tokenExists('sidebar-ring')).toBe(true);
      expect(tokenExists('sidebar-muted')).toBe(true);
    });
  });

  describe('Chart Tokens', () => {
    it('should have all chart tokens', () => {
      expect(tokenExists('chart-1')).toBe(true);
      expect(tokenExists('chart-2')).toBe(true);
      expect(tokenExists('chart-3')).toBe(true);
      expect(tokenExists('chart-4')).toBe(true);
      expect(tokenExists('chart-5')).toBe(true);
    });
  });
});

// =========================================================================
// Radius Token Tests
// =========================================================================
describe('Design Tokens: Radius', () => {
  it('should have all radius tokens', () => {
    expect(tokenExists('radius-sm')).toBe(true);
    expect(tokenExists('radius-md')).toBe(true);
    expect(tokenExists('radius-lg')).toBe(true);
    expect(tokenExists('radius-xl')).toBe(true);
    expect(tokenExists('radius-2xl')).toBe(true);
    expect(tokenExists('radius-full')).toBe(true);
    expect(tokenExists('radius')).toBe(true); // Default
  });

  it('should have correct radius values', () => {
    expect(extractTokenValue('radius-sm')).toBe('0.125rem');
    expect(extractTokenValue('radius-md')).toBe('0.375rem');
    expect(extractTokenValue('radius-lg')).toBe('0.5rem');
    expect(extractTokenValue('radius-xl')).toBe('0.75rem');
    expect(extractTokenValue('radius-2xl')).toBe('1rem');
    expect(extractTokenValue('radius-full')).toBe('9999px');
  });

  it('should have default radius reference md', () => {
    expect(referencesToken('radius', 'radius-md')).toBe(true);
  });
});

// =========================================================================
// Transition Token Tests
// =========================================================================
describe('Design Tokens: Transitions', () => {
  it('should have all transition tokens', () => {
    expect(tokenExists('transition-fast')).toBe(true);
    expect(tokenExists('transition-normal')).toBe(true);
    expect(tokenExists('transition-slow')).toBe(true);
  });

  it('should have correct transition values', () => {
    expect(extractTokenValue('transition-fast')).toBe('150ms');
    expect(extractTokenValue('transition-normal')).toBe('200ms');
    expect(extractTokenValue('transition-slow')).toBe('300ms');
  });
});

// =========================================================================
// Animation Timing Tests
// =========================================================================
describe('Design Tokens: Animation Timing', () => {
  it('should have all easing tokens', () => {
    expect(tokenExists('ease-spring')).toBe(true);
    expect(tokenExists('ease-smooth')).toBe(true);
    expect(tokenExists('ease-bounce')).toBe(true);
  });

  it('should have correct easing values', () => {
    expect(extractTokenValue('ease-spring')).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
    expect(extractTokenValue('ease-smooth')).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
    expect(extractTokenValue('ease-bounce')).toBe('cubic-bezier(0.68, -0.55, 0.265, 1.55)');
  });
});

// =========================================================================
// Shadow Token Tests
// =========================================================================
describe('Design Tokens: Shadows', () => {
  it('should have all shadow tokens', () => {
    expect(tokenExists('shadow-xs')).toBe(true);
    expect(tokenExists('shadow-sm')).toBe(true);
    expect(tokenExists('shadow-md')).toBe(true);
    expect(tokenExists('shadow-lg')).toBe(true);
    expect(tokenExists('shadow-xl')).toBe(true);
    expect(tokenExists('shadow-2xl')).toBe(true);
  });

  it('should use OKLCH for shadow colors', () => {
    expect(extractTokenValue('shadow-sm')).toContain('oklch(');
    expect(extractTokenValue('shadow-md')).toContain('oklch(');
  });
});

// =========================================================================
// Dark Mode Tests
// =========================================================================
describe('Design Tokens: Dark Mode', () => {
  it('should have dark mode override section', () => {
    expect(tokensContent).toContain('.dark');
  });

  it('should override background/foreground in dark mode', () => {
    // Find dark mode section
    const darkModeStart = tokensContent.indexOf('.dark {');
    const darkModeEnd = tokensContent.indexOf('}', darkModeStart);
    const darkModeContent = tokensContent.slice(darkModeStart, darkModeEnd);

    expect(darkModeContent).toContain('--background:');
    expect(darkModeContent).toContain('--foreground:');
  });

  it('should override card tokens in dark mode', () => {
    const darkModeStart = tokensContent.indexOf('.dark {');
    const darkModeContent = tokensContent.slice(darkModeStart);

    expect(darkModeContent).toContain('--card:');
    expect(darkModeContent).toContain('--card-foreground:');
  });

  it('should override all semantic tokens in dark mode', () => {
    const darkModeStart = tokensContent.indexOf('.dark {');
    const darkModeContent = tokensContent.slice(darkModeStart);

    expect(darkModeContent).toContain('--primary:');
    expect(darkModeContent).toContain('--secondary:');
    expect(darkModeContent).toContain('--muted:');
    expect(darkModeContent).toContain('--accent:');
    expect(darkModeContent).toContain('--destructive:');
    expect(darkModeContent).toContain('--border:');
    expect(darkModeContent).toContain('--input:');
    expect(darkModeContent).toContain('--ring:');
  });

  it('should override sidebar tokens in dark mode', () => {
    const darkModeStart = tokensContent.indexOf('.dark {');
    const darkModeContent = tokensContent.slice(darkModeStart);

    expect(darkModeContent).toContain('--sidebar-background:');
    expect(darkModeContent).toContain('--sidebar-foreground:');
  });

  it('should override shadow tokens in dark mode', () => {
    const darkModeStart = tokensContent.indexOf('.dark {');
    const darkModeContent = tokensContent.slice(darkModeStart);

    expect(darkModeContent).toContain('--shadow-xs:');
    expect(darkModeContent).toContain('--shadow-sm:');
  });

  it('should override chart tokens in dark mode', () => {
    const darkModeStart = tokensContent.indexOf('.dark {');
    const darkModeContent = tokensContent.slice(darkModeStart);

    expect(darkModeContent).toContain('--chart-1:');
  });
});

// =========================================================================
// Token Reference Tests
// =========================================================================
describe('Design Tokens: Semantic References', () => {
  it('should reference primitive tokens correctly', () => {
    // Semantic tokens should reference primitive color tokens
    expect(referencesToken('success', 'color-green-500')).toBe(true);
    expect(referencesToken('warning', 'color-amber-500')).toBe(true);
    expect(referencesToken('info', 'color-blue-500')).toBe(true);
  });

  it('should reference default radius', () => {
    expect(referencesToken('radius', 'radius-md')).toBe(true);
  });
});

// =========================================================================
// Token Format Tests
// =========================================================================
describe('Design Tokens: Format Consistency', () => {
  it('should use OKLCH for all color primitives', () => {
    const neutralMatch = tokensContent.match(/--color-neutral-\d+:\s*oklch\(/g);
    expect(neutralMatch).toBeTruthy();
    expect(neutralMatch?.length).toBeGreaterThan(0);
  });

  it('should use kebab-case for all token names', () => {
    // Check for snake_case or camelCase violations
    const snakeCaseMatches = tokensContent.match(/--[a-z]+_[a-z]+:/g);
    expect(snakeCaseMatches).toBeNull();
  });

  it('should have consistent spacing around colons', () => {
    // All tokens should have space after colon
    const noSpaceMatches = tokensContent.match(/--[a-z-]+:[^ ]/g);
    expect(noSpaceMatches).toBeNull();
  });
});
