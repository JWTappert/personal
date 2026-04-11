import { describe, it, expect } from 'vitest';
import { SequenceDetector } from '../src/skull/puzzle-internals';

describe('SequenceDetector', () => {
  const secret = ['leftEye', 'rightEye', 'jaw', 'rightEye', 'leftEye'] as const;

  it('fires unlock when the exact sequence is clicked in order', () => {
    const det = new SequenceDetector(secret);
    let fired = 0;
    det.onUnlock(() => fired++);

    for (const part of secret) det.push(part);
    expect(fired).toBe(1);
    expect(det.isUnlocked()).toBe(true);
  });

  it('does not fire on a different sequence', () => {
    const det = new SequenceDetector(secret);
    let fired = 0;
    det.onUnlock(() => fired++);

    det.push('jaw');
    det.push('jaw');
    det.push('leftEye');
    det.push('rightEye');
    det.push('leftEye');
    expect(fired).toBe(0);
    expect(det.isUnlocked()).toBe(false);
  });

  it('fires only once even if the sequence repeats', () => {
    const det = new SequenceDetector(secret);
    let fired = 0;
    det.onUnlock(() => fired++);

    for (const part of secret) det.push(part);
    for (const part of secret) det.push(part);
    expect(fired).toBe(1);
  });

  it('tolerates stray clicks before the correct sequence', () => {
    const det = new SequenceDetector(secret);
    let fired = 0;
    det.onUnlock(() => fired++);

    det.push('other');
    det.push('jaw');
    det.push('other');
    for (const part of secret) det.push(part);
    expect(fired).toBe(1);
  });
});
