export interface IdleActionFrame {
  /** Direct rotation to apply. Null = don't override. */
  rotation: { yaw: number; pitch: number } | null;
  /** Additive position offsets. */
  positionOffset: { x: number; y: number; z: number };
  /** Scale multiplier (1.0 = resting scale unchanged). */
  scaleFactor: number;
  /** Direct jaw angle. Null = don't override. */
  jawAngle: number | null;
}

export interface IdleActionsHandle {
  triggerChomp(cursorX: number, cursorY: number): boolean;
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
const LUNGE_SCALE = 1.2;          // peak scale multiplier over resting
const CHOMP_JAW_ANGLE = 0.6;      // peak jaw open per bite (rad)
const CHOMP_ARC_HEIGHT = 0.3;     // y-bob amplitude per bite
const CHOMP_PITCH_WOBBLE = 0.15;  // pitch nod per bite (nose-up on rise)

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
  settleStartYaw: number;
}

type ChompPhase = 'advance' | 'retreat';

interface ChompState {
  type: 'chomp';
  phase: ChompPhase;
  age: number;
  phaseDuration: number;
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

export function createIdleActions(): IdleActionsHandle {
  let state: ActionState = null;

  function tickChomp(s: ChompState, dt: number): IdleActionFrame {
    s.age += dt;
    const progress = Math.min(1, s.age / s.phaseDuration);

    // Phase transition
    if (s.age >= s.phaseDuration) {
      if (s.phase === 'advance') {
        s.phase = 'retreat';
        s.age = 0;
        s.phaseDuration = CHOMP_RETREAT_DURATION;
      } else {
        state = null; // done
      }
    }

    if (s.phase === 'advance') {
      // Aim toward cursor: completes in the first third of the advance
      const aimT = easeOut(Math.min(1, progress * 3));
      const yaw = s.targetYaw * aimT;
      const basePitch = s.targetPitch * aimT;

      // Per-chomp cycle: each bite DRIVES the skull one step forward.
      // Rise (0..0.45): skull lifts up, jaw opens — anticipation, barely advances.
      // Snap (0.45..1.0): skull lunges forward + down, jaw closes — the strike.
      const chompIndex = Math.floor(progress * s.chompCount);
      const chompPhase = (progress * s.chompCount) % 1;
      const zPerChomp = s.lungeZ / s.chompCount;
      const completedZ = chompIndex * zPerChomp;

      // Z advances mostly during the snap (second half of each bite)
      let stepZ: number;
      if (chompPhase < 0.45) {
        stepZ = 0.1 * easeIn(chompPhase / 0.45);         // 10% during rise
      } else {
        stepZ = 0.1 + 0.9 * easeOut((chompPhase - 0.45) / 0.55); // 90% during snap
      }
      const z = completedZ + zPerChomp * stepZ;

      // Scale tracks total z-progress
      const scale = 1 + (LUNGE_SCALE - 1) * (z / s.lungeZ);

      // Asymmetric y-arc: slow rise (anticipation), fast fall (strike)
      let arcY: number;
      if (chompPhase < 0.45) {
        arcY = CHOMP_ARC_HEIGHT * easeOut(chompPhase / 0.45);
      } else {
        arcY = CHOMP_ARC_HEIGHT * (1 - easeIn((chompPhase - 0.45) / 0.55));
      }

      // Pitch nod: nose lifts during rise, dips on strike
      let pitchNod: number;
      if (chompPhase < 0.45) {
        pitchNod = -CHOMP_PITCH_WOBBLE * easeOut(chompPhase / 0.45);
      } else {
        pitchNod = -CHOMP_PITCH_WOBBLE * (1 - easeIn((chompPhase - 0.45) / 0.55));
      }

      // Jaw: opens during rise, snaps shut during strike
      let jaw: number;
      if (chompPhase < 0.4) {
        jaw = CHOMP_JAW_ANGLE * easeIn(chompPhase / 0.4);
      } else if (chompPhase < 0.5) {
        jaw = CHOMP_JAW_ANGLE;
      } else {
        jaw = CHOMP_JAW_ANGLE * (1 - easeOut((chompPhase - 0.5) / 0.5));
      }
      // Deterministic per-chomp amplitude variation
      jaw *= 0.85 + 0.3 * ((Math.sin(chompIndex * 2.7 + 0.5) + 1) / 2);

      return {
        rotation: { yaw, pitch: basePitch + pitchNod },
        positionOffset: { x: 0, y: arcY, z },
        scaleFactor: scale,
        jawAngle: jaw,
      };
    }

    // Retreat: ease everything back to resting
    const t = easeOut(progress);
    return {
      rotation: { yaw: s.targetYaw * (1 - t), pitch: s.targetPitch * (1 - t) },
      positionOffset: { x: 0, y: 0, z: s.lungeZ * (1 - t) },
      scaleFactor: 1 + (LUNGE_SCALE - 1) * (1 - t),
      jawAngle: null,
    };
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
          s.settleStartYaw = s.currentYaw;
          s.phase = 'settle';
          s.age = 0;
          s.phaseDuration = SETTLE_DURATION;
          break;
        case 'settle':
          state = null;  // done
          break;
      }
    }

    switch (s.phase) {
      case 'windup': {
        const t = easeIn(progress);
        s.currentY = -WINDUP_DIP * t;
        return {
          rotation: { yaw: s.startYaw, pitch: 0 },
          positionOffset: { x: 0, y: s.currentY, z: 0 },
          scaleFactor: 1,
          jawAngle: null,
        };
      }
      case 'spin': {
        // sin² velocity curve: accelerate, cruise, decelerate
        // Integral of sin²(π*t) from 0 to t = t/2 - sin(2πt)/(4π)
        // Normalized so total integral = 0.5 → multiply by 2 to get 0..1
        const rawIntegral = progress / 2 - Math.sin(2 * Math.PI * progress) / (4 * Math.PI);
        const yawProgress = rawIntegral * 2;  // 0..1 over full spin
        s.currentYaw = s.startYaw + yawProgress * Math.PI * 2;
        // Y bob: 2 full sine cycles over the spin
        s.currentY = -WINDUP_DIP + BOB_AMPLITUDE * Math.sin(BOB_CYCLES * 2 * Math.PI * progress);
        return {
          rotation: { yaw: s.currentYaw, pitch: 0 },
          positionOffset: { x: 0, y: s.currentY, z: 0 },
          scaleFactor: 1,
          jawAngle: null,
        };
      }
      case 'settle': {
        // Re-compute progress using the settle phase's own age (handles transition frame)
        const t = Math.min(1, s.age / s.phaseDuration);
        // Damped sine for overshoot: starts at currentY, overshoots 0, settles
        const envelope = 1 - t;
        const overshoot = SETTLE_OVERSHOOT * Math.sin(Math.PI * t) * envelope;
        const settleY = s.currentY * (1 - easeOut(t)) + overshoot;
        return {
          // No rotation override during settle — skull.ts calls syncTo to return
          // smoothly to the resting look direction via skullMotion's lerp.
          rotation: null,
          positionOffset: { x: 0, y: settleY, z: 0 },
          scaleFactor: 1,
          jawAngle: null,
        };
      }
    }
    return { rotation: null, positionOffset: { x: 0, y: 0, z: 0 }, scaleFactor: 1, jawAngle: null };
  }

  return {
    triggerChomp(cursorX, cursorY) {
      if (state !== null) return false;
      state = {
        type: 'chomp',
        phase: 'advance',
        age: 0,
        phaseDuration: ADVANCE_DURATION,
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
        settleStartYaw: 0,
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
