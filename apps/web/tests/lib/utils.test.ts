import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  describe('basic merging', () => {
    it('merges simple classes', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles single input', () => {
      expect(cn('foo')).toBe('foo')
    })

    it('handles empty input', () => {
      expect(cn()).toBe('')
    })

    it('handles empty strings', () => {
      expect(cn('', 'foo', '')).toBe('foo')
    })
  })

  describe('tailwind conflict resolution', () => {
    it('resolves padding conflicts - last wins', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
      expect(cn('p-2', 'p-4')).toBe('p-4')
    })

    it('resolves margin conflicts', () => {
      expect(cn('m-4', 'm-2')).toBe('m-2')
    })

    it('resolves color conflicts', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })

    it('resolves text size conflicts', () => {
      expect(cn('text-sm', 'text-lg')).toBe('text-lg')
    })

    it('keeps non-conflicting classes', () => {
      expect(cn('p-4', 'text-red-500', 'bg-white')).toBe('p-4 text-red-500 bg-white')
    })
  })

  describe('conditional inputs (object syntax)', () => {
    it('includes classes when condition is true', () => {
      expect(cn('base', { active: true, disabled: false }))
        .toBe('base active')
    })

    it('excludes classes when condition is false', () => {
      expect(cn('base', { active: false, disabled: false }))
        .toBe('base')
    })

    it('handles multiple conditional classes', () => {
      expect(cn('btn', {
        'bg-red-500': true,
        'text-white': true,
        'opacity-50': false
      })).toBe('btn bg-red-500 text-white')
    })

    it('handles nested objects', () => {
      expect(cn({ a: true, b: false, c: true }))
        .toBe('a c')
    })
  })

  describe('array inputs', () => {
    it('handles arrays of classes', () => {
      expect(cn(['foo', 'bar'], 'baz'))
        .toBe('foo bar baz')
    })

    it('flattens nested arrays', () => {
      expect(cn([['foo'], ['bar', 'baz']]))
        .toBe('foo bar baz')
    })

    it('handles arrays with conditional objects', () => {
      expect(cn(['base', { active: true }]))
        .toBe('base active')
    })
  })

  describe('edge cases', () => {
    it('filters out null values', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar')
    })

    it('filters out undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    })

    it('filters out false values', () => {
      expect(cn('foo', false, 'bar')).toBe('foo bar')
    })

    it('filters out 0 values', () => {
      expect(cn('foo', 0, 'bar')).toBe('foo bar')
    })

    it('handles mixed input types', () => {
      expect(cn('base', null, ['active'], { disabled: false }, undefined))
        .toBe('base active')
    })

    it('handles duplicate classes', () => {
      // clsx doesn't deduplicate non-conflicting classes
      expect(cn('foo', 'bar', 'foo')).toBe('foo bar foo')
    })

    it('handles className prop override pattern', () => {
      const base = 'px-4 py-2 bg-blue-500 text-white rounded'
      const override = 'px-6 bg-red-500'
      // tailwind-merge keeps order but resolves conflicts
      const result = cn(base, override)
      expect(result).toContain('px-6')
      expect(result).toContain('bg-red-500')
      expect(result).toContain('py-2')
      expect(result).toContain('text-white')
      expect(result).toContain('rounded')
    })
  })

  describe('real-world patterns', () => {
    it('handles button variant pattern', () => {
      const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium'
      const variant = 'bg-primary text-primary-foreground hover:bg-primary/90'
      const className = 'px-4 py-2'

      expect(cn(base, variant, className))
        .toContain('px-4')
    })

    it('handles conditional active state', () => {
      const isActive = true
      expect(cn('nav-item', isActive && 'bg-accent', isActive && 'text-accent-foreground'))
        .toBe('nav-item bg-accent text-accent-foreground')
    })

    it('handles conditional with object syntax', () => {
      const props = { error: true, disabled: false }
      expect(cn('input', {
        'border-red-500': props.error,
        'opacity-50': props.disabled,
        'ring-2': props.error
      })).toBe('input border-red-500 ring-2')
    })
  })
})
