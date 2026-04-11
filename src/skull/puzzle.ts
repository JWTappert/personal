import type { InteractionBus } from './interactions';
import {
  buildAcrosticPool,
  SequenceDetector,
  formatGlitchHint,
} from './puzzle-internals';

export interface PuzzleHandle {
  getHudLines(t: number): { tl: string; tr: string; bl: string; br: string };
  getGlitchHint(): string;
  isUnlocked(): boolean;
  onUnlock(cb: () => void): void;
}

// Implementation constants — safe to tweak
const SECRET_WORD = 'NOTICED';
const SECRET_SEQUENCE = ['leftEye', 'rightEye', 'jaw', 'rightEye', 'leftEye'] as const;
/** Seconds between line-window advances. `t` from scene.getTime() is in seconds. */
const LINE_ROTATE_S = 3.5;

export function createPuzzle(bus: InteractionBus): PuzzleHandle {
  const pool = buildAcrosticPool(SECRET_WORD);
  const detector = new SequenceDetector(SECRET_SEQUENCE);
  const hint = formatGlitchHint(SECRET_SEQUENCE);

  bus.on('click', ({ skullPart }) => {
    detector.push(skullPart);
  });

  function currentWindow(t: number): string[] {
    const step = Math.floor(t / LINE_ROTATE_S);
    const start = step % Math.max(1, pool.length - 4);
    return pool.slice(start, start + 4);
  }

  return {
    getHudLines(t) {
      const [a, b, c, d] = currentWindow(t);
      return {
        tl: `SYS_/CRANIUM.v2\n${a ?? ''}`,
        tr: `42.5°N -123.8°W\n${b ?? ''}`,
        bl: c ?? '',
        br: d ?? '',
      };
    },
    getGlitchHint() {
      return hint;
    },
    isUnlocked() {
      return detector.isUnlocked();
    },
    onUnlock(cb) {
      detector.onUnlock(cb);
    },
  };
}
