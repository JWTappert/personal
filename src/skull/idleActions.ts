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

// Chomp tuning
const AIM_DURATION = 0.2;
const LUNGE_DURATION = 0.15;
const CHOMP_OPEN_DURATION = 0.04;
const CHOMP_CLOSE_DURATION = 0.11;
const HOLD_DURATION = 0.1;
const RETREAT_DURATION = 0.4;
const LUNGE_Z_MIN = 2;
const LUNGE_Z_MAX = 3;
const LUNGE_SCALE = 1.2;  // multiplier over resting (0.6 * 1.2 = 0.72)
const CHOMP_JAW_ANGLE = 0.6;

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

type ChompPhase = 'aim' | 'lunge' | 'chomp-open' | 'chomp-close' | 'hold' | 'retreat';

interface ChompState {
  type: 'chomp';
  phase: ChompPhase;
  age: number;
  phaseDuration: number;
  targetYaw: number;
  targetPitch: number;
  lungeZ: number;
  chompsLeft: number;
  chompTotal: number;
  /** 0..1 progress through current phase */
  currentYaw: number;
  currentPitch: number;
  currentZ: number;
  currentScale: number;
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

  function advanceChompPhase(s: ChompState): void {
    switch (s.phase) {
      case 'aim':
        s.phase = 'lunge';
        s.age = 0;
        s.phaseDuration = LUNGE_DURATION;
        break;
      case 'lunge':
        s.phase = 'chomp-open';
        s.age = 0;
        s.phaseDuration = CHOMP_OPEN_DURATION * (0.8 + Math.random() * 0.4);
        break;
      case 'chomp-open':
        s.phase = 'chomp-close';
        s.age = 0;
        s.phaseDuration = CHOMP_CLOSE_DURATION * (0.8 + Math.random() * 0.4);
        break;
      case 'chomp-close':
        s.chompsLeft -= 1;
        if (s.chompsLeft > 0) {
          s.phase = 'chomp-open';
          s.age = 0;
          s.phaseDuration = CHOMP_OPEN_DURATION * (0.8 + Math.random() * 0.4);
        } else {
          s.phase = 'hold';
          s.age = 0;
          s.phaseDuration = HOLD_DURATION;
        }
        break;
      case 'hold':
        s.phase = 'retreat';
        s.age = 0;
        s.phaseDuration = RETREAT_DURATION;
        break;
      case 'retreat':
        state = null;  // done
        break;
    }
  }

  function tickChomp(s: ChompState, dt: number): IdleActionFrame {
    s.age += dt;
    const progress = Math.min(1, s.age / s.phaseDuration);

    if (s.age >= s.phaseDuration) {
      advanceChompPhase(s);
    }

    switch (s.phase) {
      case 'aim': {
        // Lerp toward target rapidly
        const t = easeOut(progress);
        s.currentYaw = s.targetYaw * t;
        s.currentPitch = s.targetPitch * t;
        return {
          rotation: { yaw: s.currentYaw, pitch: s.currentPitch },
          positionOffset: { x: 0, y: 0, z: 0 },
          scaleFactor: 1,
          jawAngle: null,
        };
      }
      case 'lunge': {
        const t = easeIn(progress);
        s.currentZ = s.lungeZ * t;
        s.currentScale = 1 + (LUNGE_SCALE - 1) * t;
        return {
          rotation: { yaw: s.currentYaw, pitch: s.currentPitch },
          positionOffset: { x: 0, y: 0, z: s.currentZ },
          scaleFactor: s.currentScale,
          jawAngle: null,
        };
      }
      case 'chomp-open': {
        const t = easeIn(progress);
        // Vary amplitude slightly per chomp (90-110% of base)
        const amp = CHOMP_JAW_ANGLE * (0.9 + Math.random() * 0.2);
        return {
          rotation: { yaw: s.currentYaw, pitch: s.currentPitch },
          positionOffset: { x: 0, y: 0, z: s.currentZ },
          scaleFactor: s.currentScale,
          jawAngle: amp * t,
        };
      }
      case 'chomp-close': {
        const t = easeOut(progress);
        return {
          rotation: { yaw: s.currentYaw, pitch: s.currentPitch },
          positionOffset: { x: 0, y: 0, z: s.currentZ },
          scaleFactor: s.currentScale,
          jawAngle: CHOMP_JAW_ANGLE * (1 - t),
        };
      }
      case 'hold':
        return {
          rotation: { yaw: s.currentYaw, pitch: s.currentPitch },
          positionOffset: { x: 0, y: 0, z: s.currentZ },
          scaleFactor: s.currentScale,
          jawAngle: 0,
        };
      case 'retreat': {
        const t = easeOut(progress);
        return {
          rotation: { yaw: s.currentYaw * (1 - t), pitch: s.currentPitch * (1 - t) },
          positionOffset: { x: 0, y: 0, z: s.currentZ * (1 - t) },
          scaleFactor: 1 + (s.currentScale - 1) * (1 - t),
          jawAngle: null,
        };
      }
    }
    // Fallback (shouldn't reach)
    return { rotation: null, positionOffset: { x: 0, y: 0, z: 0 }, scaleFactor: 1, jawAngle: null };
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
      const chompCount = 2 + Math.floor(Math.random() * 3); // 2..4
      const lungeZ = LUNGE_Z_MIN + Math.random() * (LUNGE_Z_MAX - LUNGE_Z_MIN);
      state = {
        type: 'chomp',
        phase: 'aim',
        age: 0,
        phaseDuration: AIM_DURATION,
        targetYaw: cursorX * 0.7,
        targetPitch: -cursorY * 0.3,
        lungeZ,
        chompsLeft: chompCount,
        chompTotal: chompCount,
        currentYaw: 0,
        currentPitch: 0,
        currentZ: 0,
        currentScale: 1,
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
