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

  it('starts with progress 0 and advances on each matching click', () => {
    const det = new SequenceDetector(secret);
    expect(det.getProgress()).toBe(0);
    det.push('leftEye');
    expect(det.getProgress()).toBe(1);
    det.push('rightEye');
    expect(det.getProgress()).toBe(2);
    det.push('jaw');
    expect(det.getProgress()).toBe(3);
  });

  it('resets progress to 0 on a click that matches neither the next nor the first secret position', () => {
    const det = new SequenceDetector(secret);
    det.push('leftEye');
    det.push('rightEye');
    expect(det.getProgress()).toBe(2);
    det.push('other');
    expect(det.getProgress()).toBe(0);
  });

  it('resets progress to 1 when the wrong click happens to match secret[0]', () => {
    const det = new SequenceDetector(secret);
    det.push('leftEye');
    det.push('rightEye');
    // Next expected is 'jaw'; clicking 'leftEye' is wrong but matches secret[0]
    det.push('leftEye');
    expect(det.getProgress()).toBe(1);
  });
});
