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
  /** Current smoothed yaw (after lerp), in radians. */
  getYaw(): number;
  /** Current smoothed pitch (after lerp), in radians. */
  getPitch(): number;
  /** Start a short damped head-shake animation overlaid on the current yaw. */
  triggerShake(): void;
  /** Apply the current look target to the scene (lerped) this frame. */
  tick(dt: number): void;
}

// Shake parameters: 600ms total, 2.5 full sine cycles, ~20° peak amplitude,
// linear amplitude decay so it rings out.
const SHAKE_DURATION = 0.6;
const SHAKE_CYCLES = 2.5;
const SHAKE_AMPLITUDE = 0.35;

/**
 * Owns the skull's look target and the exponential-lerp smoothing that drives
 * `scene.skull.rotation`. Does NOT write to `jawPivot` — jaw composition lives
 * in `skull.ts` so the scroll + click + idle contributions stay in one place.
 *
 * Internal `yaw`/`pitch` are the source of truth for the smoothed orientation.
 * Each tick, they lerp toward the targets and then get pushed into
 * `scene.skull.rotation` together with any active shake offset. Keeping the
 * lerp state internal means the shake overlay can modulate the final rotation
 * without corrupting the lerp integrator.
 */
export function createSkullMotion(scene: SceneHandle): SkullMotionHandle {
  let yaw = 0;
  let pitch = 0;
  let yawTarget = 0;
  let pitchTarget = 0;
  let jawOffset = 0;
  // Shake is inactive when shakeAge >= SHAKE_DURATION. Initialized past the
  // end so nothing is shaking at startup.
  let shakeAge = SHAKE_DURATION;
  const tau = 1.2;

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
    getYaw() {
      return yaw;
    },
    getPitch() {
      return pitch;
    },
    triggerShake() {
      shakeAge = 0;
    },
    tick(dt) {
      const rate = 1 - Math.exp(-dt / tau);
      yaw += (yawTarget - yaw) * rate;
      pitch += (pitchTarget - pitch) * rate;

      let shakeOffset = 0;
      if (shakeAge < SHAKE_DURATION) {
        shakeAge += dt;
        const phase = Math.min(1, shakeAge / SHAKE_DURATION);
        const envelope = 1 - phase;
        shakeOffset =
          Math.sin(phase * Math.PI * 2 * SHAKE_CYCLES) *
          SHAKE_AMPLITUDE *
          envelope;
      }

      scene.skull.rotation.y = yaw + shakeOffset;
      scene.skull.rotation.x = pitch;
    },
  };
}
