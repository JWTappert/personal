export interface IdleActionFrame {
  /** Direct rotation to apply. Null = don't override. */
  rotation: { yaw: number; pitch: number } | null;
  /** Roll (Z-axis rotation). Null = don't override. */
  roll: number | null;
  /** Additive position offsets. */
  positionOffset: { x: number; y: number; z: number };
  /** Scale multiplier (1.0 = resting scale unchanged). */
  scaleFactor: number;
  /** Direct jaw angle. Null = don't override. */
  jawAngle: number | null;
}

export interface IdleActionsHandle {
  triggerChomp(cursorX: number, cursorY: number, startYaw?: number, startPitch?: number): boolean;
  triggerSpin(startYaw?: number): boolean;
  tick(dt: number): IdleActionFrame | null;
  isPlaying(): boolean;
}

// Chomp tuning — skull advances forward over ADVANCE_DURATION with
// 2-4 bite arcs, then retreats. Each bite bobs the skull up and opens
// the jaw in sync, creating a "chomping forward" motion.
const ADVANCE_DURATION = 1.2;
const CHOMP_RETREAT_DURATION = 0.4;
const LUNGE_Z_MIN = 2;
const LUNGE_Z_MAX = 3;
const LUNGE_SCALE = 1.05;         // peak scale multiplier (perspective does the rest)
const CHOMP_JAW_ANGLE = 0.6;      // peak jaw open per bite (rad)
const CHOMP_ARC_HEIGHT = 0.3;     // y-bob amplitude per bite
const CHOMP_PITCH_WOBBLE = 0.15;  // pitch nod per bite (nose-up on rise)
const CHOMP_ROLL = 0.12;          // roll amplitude per bite (rad, ~7°)
const CHOMP_X_WEAVE = 0.15;       // lateral weave amplitude per bite

// Spin tuning
const WINDUP_DURATION = 0.2;
const SPIN_DURATION_MIN = 1.5;
const SPIN_DURATION_MAX = 2.0;
const SETTLE_DURATION = 0.3;
const BOB_AMPLITUDE = 0.2;
const BOB_CYCLES = 2;
const WINDUP_DIP = 0.3;
const SETTLE_OVERSHOOT = 0.05;

type SpinPhase = 'windup' | 'spin' | 'settle';

interface SpinState {
  type: 'spin';
  phase: SpinPhase;
  age: number;
  phaseDuration: number;
  spinDuration: number;
  startYaw: number;
  currentYaw: number;
  currentY: number;
}

type ChompPhase = 'advance' | 'retreat';

interface ChompState {
  type: 'chomp';
  phase: ChompPhase;
  age: number;
  phaseDuration: number;
  startYaw: number;
  startPitch: number;
  targetYaw: number;
  targetPitch: number;
  lungeZ: number;
  chompCount: number;
}

type ActionState = ChompState | SpinState | null;

/** Decelerate ease-out: fast start, slow end. */
function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/** Accelerate ease-in: slow start, fast end. */
function easeIn(t: number): number {
  return t * t;
}

/**
 * Asymmetric envelope for per-chomp motion. During rise (0..0.45) returns
 * easeOut ramp; during snap (0.45..1) returns inverted easeIn ramp.
 * Used for z-step, y-arc, and pitch nod so the split point is defined once.
 */
const CHOMP_SPLIT = 0.45;
function chompEnvelope(chompPhase: number): number {
  if (chompPhase < CHOMP_SPLIT) {
    return easeOut(chompPhase / CHOMP_SPLIT);
  }
  return 1 - easeIn((chompPhase - CHOMP_SPLIT) / (1 - CHOMP_SPLIT));
}

export function createIdleActions(): IdleActionsHandle {
  let state: ActionState = null;

  // Pre-allocated frame objects — mutated in-place to avoid GC churn at 60fps.
  const chompFrame: IdleActionFrame = {
    rotation: { yaw: 0, pitch: 0 },
    roll: null,
    positionOffset: { x: 0, y: 0, z: 0 },
    scaleFactor: 1,
    jawAngle: null,
  };
  const spinFrame: IdleActionFrame = {
    rotation: { yaw: 0, pitch: 0 },
    roll: null,
    positionOffset: { x: 0, y: 0, z: 0 },
    scaleFactor: 1,
    jawAngle: null,
  };

  function tickChomp(s: ChompState, dt: number): IdleActionFrame {
    s.age += dt;
    const progress = Math.min(1, s.age / s.phaseDuration);

    if (s.age >= s.phaseDuration) {
      if (s.phase === 'advance') {
        s.phase = 'retreat';
        s.age = 0;
        s.phaseDuration = CHOMP_RETREAT_DURATION;
      } else {
        state = null;
      }
    }

    const f = chompFrame;
    if (!f.rotation) f.rotation = { yaw: 0, pitch: 0 };

    if (s.phase === 'advance') {
      const aimT = easeOut(Math.min(1, progress * 3));
      const yaw = s.startYaw + (s.targetYaw - s.startYaw) * aimT;
      const basePitch = s.startPitch + (s.targetPitch - s.startPitch) * aimT;

      const chompIndex = Math.floor(progress * s.chompCount);
      const chompPhase = (progress * s.chompCount) % 1;
      const zPerChomp = s.lungeZ / s.chompCount;
      const env = chompEnvelope(chompPhase);

      // Z: 10% during rise, 90% during snap
      const stepZ = chompPhase < CHOMP_SPLIT
        ? 0.1 * easeIn(chompPhase / CHOMP_SPLIT)
        : 0.1 + 0.9 * easeOut((chompPhase - CHOMP_SPLIT) / (1 - CHOMP_SPLIT));
      const z = chompIndex * zPerChomp + zPerChomp * stepZ;

      // Jaw: opens during rise, snaps shut during strike
      let jaw: number;
      if (chompPhase < 0.4) {
        jaw = CHOMP_JAW_ANGLE * easeIn(chompPhase / 0.4);
      } else if (chompPhase < 0.5) {
        jaw = CHOMP_JAW_ANGLE;
      } else {
        jaw = CHOMP_JAW_ANGLE * (1 - easeOut((chompPhase - 0.5) / 0.5));
      }
      jaw *= 0.85 + 0.3 * ((Math.sin(chompIndex * 2.7 + 0.5) + 1) / 2);

      // Alternate roll and X-weave direction per chomp for a rocking lunge
      const side = chompIndex % 2 === 0 ? 1 : -1;

      f.rotation.yaw = yaw;
      f.rotation.pitch = basePitch + (-CHOMP_PITCH_WOBBLE * env);
      f.roll = side * CHOMP_ROLL * env;
      f.positionOffset.x = side * CHOMP_X_WEAVE * env;
      f.positionOffset.y = CHOMP_ARC_HEIGHT * env;
      f.positionOffset.z = z;
      f.scaleFactor = 1 + (LUNGE_SCALE - 1) * (z / s.lungeZ);
      f.jawAngle = jaw;
      return f;
    }

    // Retreat
    const t = easeOut(progress);
    f.rotation.yaw = s.targetYaw + (s.startYaw - s.targetYaw) * t;
    f.rotation.pitch = s.targetPitch + (s.startPitch - s.targetPitch) * t;
    f.roll = null;
    f.positionOffset.x = 0;
    f.positionOffset.y = 0;
    f.positionOffset.z = s.lungeZ * (1 - t);
    f.scaleFactor = 1 + (LUNGE_SCALE - 1) * (1 - t);
    f.jawAngle = null;
    return f;
  }

  function tickSpin(s: SpinState, dt: number): IdleActionFrame {
    s.age += dt;
    const progress = Math.min(1, s.age / s.phaseDuration);

    if (s.age >= s.phaseDuration) {
      switch (s.phase) {
        case 'windup':
          s.phase = 'spin';
          s.age = 0;
          s.phaseDuration = s.spinDuration;
          break;
        case 'spin':
          s.phase = 'settle';
          s.age = 0;
          s.phaseDuration = SETTLE_DURATION;
          break;
        case 'settle':
          state = null;
          break;
      }
    }

    const f = spinFrame;

    switch (s.phase) {
      case 'windup': {
        const t = easeIn(progress);
        s.currentY = -WINDUP_DIP * t;
        f.rotation = { yaw: s.startYaw, pitch: 0 };
        f.positionOffset.x = 0;
        f.positionOffset.y = s.currentY;
        f.positionOffset.z = 0;
        f.scaleFactor = 1;
        f.jawAngle = null;
        return f;
      }
      case 'spin': {
        const rawIntegral = progress / 2 - Math.sin(2 * Math.PI * progress) / (4 * Math.PI);
        const yawProgress = rawIntegral * 2;
        s.currentYaw = s.startYaw + yawProgress * Math.PI * 2;
        s.currentY = -WINDUP_DIP + BOB_AMPLITUDE * Math.sin(BOB_CYCLES * 2 * Math.PI * progress);
        f.rotation = { yaw: s.currentYaw, pitch: 0 };
        f.positionOffset.x = 0;
        f.positionOffset.y = s.currentY;
        f.positionOffset.z = 0;
        f.scaleFactor = 1;
        f.jawAngle = null;
        return f;
      }
      case 'settle': {
        const t = Math.min(1, s.age / s.phaseDuration);
        const envelope = 1 - t;
        const overshoot = SETTLE_OVERSHOOT * Math.sin(Math.PI * t) * envelope;
        const settleY = s.currentY * (1 - easeOut(t)) + overshoot;
        // No rotation override during settle — blend system fades back to skullMotion
        f.rotation = null;
        f.positionOffset.x = 0;
        f.positionOffset.y = settleY;
        f.positionOffset.z = 0;
        f.scaleFactor = 1;
        f.jawAngle = null;
        return f;
      }
    }
    f.rotation = null;
    f.positionOffset.x = 0;
    f.positionOffset.y = 0;
    f.positionOffset.z = 0;
    f.scaleFactor = 1;
    f.jawAngle = null;
    return f;
  }

  return {
    triggerChomp(cursorX, cursorY, startYaw = 0, startPitch = 0) {
      if (state !== null) return false;
      state = {
        type: 'chomp',
        phase: 'advance',
        age: 0,
        phaseDuration: ADVANCE_DURATION,
        startYaw,
        startPitch,
        targetYaw: cursorX * 0.7,
        targetPitch: -cursorY * 0.3,
        lungeZ: LUNGE_Z_MIN + Math.random() * (LUNGE_Z_MAX - LUNGE_Z_MIN),
        chompCount: 3,
      };
      return true;
    },

    triggerSpin(startYaw = 0) {
      if (state !== null) return false;
      // startYaw is the skull's current smoothed yaw at trigger time.
      // Seeding both startYaw and currentYaw from it ensures the windup
      // phase holds the correct facing angle and the spin phase accumulates
      // rotation from the right origin — no jump on first frame.
      state = {
        type: 'spin',
        phase: 'windup',
        age: 0,
        phaseDuration: WINDUP_DURATION,
        spinDuration: SPIN_DURATION_MIN + Math.random() * (SPIN_DURATION_MAX - SPIN_DURATION_MIN),
        startYaw,
        currentYaw: startYaw,
        currentY: 0,
      };
      return true;
    },

    tick(dt) {
      if (state === null) return null;
      if (state.type === 'chomp') return tickChomp(state, dt);
      if (state.type === 'spin') return tickSpin(state, dt);
      return null;
    },

    isPlaying() {
      return state !== null;
    },
  };
}
