import { describe, expect, it } from 'vitest';
import { calculateTotalPages, normalizeInboxSearch } from '@/features/inbox';

describe('inbox helpers', () => {
  it('normalizes search and enforces minimum length', () => {
    expect(normalizeInboxSearch('')).toBeUndefined();
    expect(normalizeInboxSearch('a')).toBeUndefined();
    expect(normalizeInboxSearch('  ab  ')).toBe('ab');
  });

  it('calculates total pages safely', () => {
    expect(calculateTotalPages(0, 50)).toBe(1);
    expect(calculateTotalPages(1, 50)).toBe(1);
    expect(calculateTotalPages(120, 50)).toBe(3);
    expect(calculateTotalPages(120, 0)).toBe(1);
  });
});
