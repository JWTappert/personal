import type { SceneHandle } from './scene';

export interface SkullMotionHandle {
  /**
   * Set desired look direction. `x` and `y` are roughly in [-1, 1] and are
   * interpreted as the target yaw (rotation.y) and pitch (rotation.x) in
   * radians directly. Callers pre-scale as needed.
   */
  lookAt(x: number, y: number): void;
  /** Additive jaw-open offset in radians. Stored; read by skull.ts jaw composition. */
  setJawOffset(radians: number): void;
  getJawOffset(): number;
  /** Apply the current look target to the scene (lerped) this frame. */
  tick(dt: number): void;
}

/**
 * Owns the skull's look target and the exponential-lerp smoothing that drives
 * `scene.skull.rotation`. Does NOT write to `jawPivot` — jaw composition lives
 * in `skull.ts` so the scroll + click + idle contributions stay in one place.
 */
export function createSkullMotion(scene: SceneHandle): SkullMotionHandle {
  let yawTarget = 0;
  let pitchTarget = 0;
  let jawOffset = 0;
  const tau = 2.8;

  return {
    lookAt(x, y) {
      yawTarget = x;
      pitchTarget = y;
    },
    setJawOffset(radians) {
      jawOffset = radians;
    },
    getJawOffset() {
      return jawOffset;
    },
    tick(dt) {
      const rate = 1 - Math.exp(-dt / tau);
      scene.skull.rotation.y += (yawTarget - scene.skull.rotation.y) * rate;
      scene.skull.rotation.x += (pitchTarget - scene.skull.rotation.x) * rate;
    },
  };
}
