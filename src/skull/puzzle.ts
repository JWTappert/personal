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

const SECRET_WORD = 'NOTICED';
const SECRET_SEQUENCE = ['leftEye', 'rightEye', 'jaw', 'rightEye', 'leftEye'] as const;

// Themed per-corner message pools. Each corner rotates independently through
// its own pool at its own interval so they feel organic rather than locked to
// a single clock.
//
// BL is special: it scrolls through the acrostic pool. Watch it long enough
// and the first letters of consecutive lines spell SECRET_WORD, hidden among
// a couple of filler lines on either side.
const TL_POOL = [
  'BOOT SEQ COMPLETE',
  'KERNEL 5.18 LOADED',
  'BIOS REV 0x3F',
  'INIT STAGE 3',
  'MOD TABLE LOADED',
  'CORE 2 READY',
];
const TR_POOL = [
  'ALT 1247M',
  'T+00:14:22',
  'DRIFT 0.3°',
  'PING 14MS',
  'UPLINK 92%',
  'BEACON 3 SYNC',
];
const BR_POOL = [
  'PSU 12.08V',
  'FAN 2400RPM',
  'LOAD 47%',
  'MEM 1.2GB',
  'DISK 83%',
  'VOLT 1.05V OK',
];

// Seconds per rotation step. `t` comes from scene.getTime() (seconds).
// Intervals are mutually prime-ish so corners don't realign often.
const TL_INTERVAL_S = 4.2;
const TR_INTERVAL_S = 3.1;
const BR_INTERVAL_S = 2.8;
const BL_INTERVAL_S = 3.5;

export function createPuzzle(bus: InteractionBus): PuzzleHandle {
  const blPool = buildAcrosticPool(SECRET_WORD);
  const detector = new SequenceDetector(SECRET_SEQUENCE);
  const hint = formatGlitchHint(SECRET_SEQUENCE);

  bus.on('click', ({ skullPart }) => {
    detector.push(skullPart);
  });

  function pick(pool: readonly string[], t: number, interval: number): string {
    const step = Math.floor(t / interval);
    return pool[step % pool.length];
  }

  return {
    getHudLines(t) {
      const tlLine = pick(TL_POOL, t, TL_INTERVAL_S);
      const trLine = pick(TR_POOL, t, TR_INTERVAL_S);
      const blLine = pick(blPool, t, BL_INTERVAL_S);
      const brLine = pick(BR_POOL, t, BR_INTERVAL_S);
      return {
        tl: `SYS_/CRANIUM.v2\n${tlLine}`,
        tr: `42.5°N -123.8°W\n${trLine}`,
        bl: blLine,
        br: brLine,
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
