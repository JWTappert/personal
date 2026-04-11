import { describe, it, expect } from 'vitest';
import { buildAcrosticPool } from '../src/skull/puzzle-internals';

describe('buildAcrosticPool', () => {
  it('produces a pool where a sliding window of N lines has first letters spelling the word', () => {
    const word = 'NOTICED';
    const pool = buildAcrosticPool(word);

    expect(pool.length).toBeGreaterThanOrEqual(word.length);

    // Find a starting index where word.length consecutive lines spell the word
    let found = false;
    for (let i = 0; i <= pool.length - word.length; i++) {
      const initials = pool.slice(i, i + word.length)
        .map((s) => s[0]?.toUpperCase() ?? '')
        .join('');
      if (initials === word) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('returns lines that look like plausible system-status messages', () => {
    const pool = buildAcrosticPool('NOTICED');
    for (const line of pool) {
      expect(line.length).toBeGreaterThan(3);
      expect(line.length).toBeLessThan(40);
    }
  });
});
