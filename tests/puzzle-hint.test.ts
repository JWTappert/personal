import { describe, it, expect } from 'vitest';
import { formatGlitchHint } from '../src/skull/puzzle-internals';

describe('formatGlitchHint', () => {
  it('renders the click sequence as symbols', () => {
    const out = formatGlitchHint(['leftEye', 'rightEye', 'jaw', 'rightEye', 'leftEye']);
    expect(out).toBe('◉ ○ ▼ ○ ◉');
  });

  it('uses a question mark for unknown parts', () => {
    const out = formatGlitchHint(['leftEye', 'other']);
    expect(out).toBe('◉ ?');
  });
});
