# Skull Idle Special Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two rare idle animations — a lurch-chomp (skull lunges at cursor and bites) and a dance-spin (full yaw rotation with y-bob) — managed by a new `idleActions.ts` module and scheduled from the existing `idle.ts`.

**Architecture:** New pure state-machine module `idleActions.ts` owns both animations as phased sequences. `idle.ts` gains two cooldown timers and triggers actions when idle. `skull.ts` applies frame overrides (position, scale, rotation, jaw) from the active action, bypassing `skullMotion`'s lerp during playback and syncing state back when the action ends.

**Tech Stack:** TypeScript, Three.js (scene transforms), Vitest (state machine tests).

---

## Important conventions for this plan

- **Dev server:** The developer runs `npm run dev` themselves — DO NOT start or stop the dev server.
- **TDD:** `idleActions.ts` is pure and testable. Use TDD for the state machines. `idle.ts` and `skull.ts` changes are integration/visual — no unit tests, verify in browser.
- **Commits:** Commit at the end of every task.
- **Branch:** All work on `master` (the rewrite is merged).
- **Stale plan code:** If line numbers in this plan don't match the actual code, read the current file and adapt. Trust the code, not the plan.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/skull/idleActions.ts` | Create | State machines for chomp + spin. Pure: `tick(dt)` returns frame overrides or null. |
| `tests/idle-actions.test.ts` | Create | Vitest tests for both actions + mutual exclusion. |
| `src/skull/skullMotion.ts` | Modify | Add `syncTo(yaw, pitch)` to teleport internal state after an action ends. |
| `src/skull/idle.ts` | Modify | Add action cooldown timers, trigger calls, suspension of look-around + talk during playback. Expose action state to skull.ts. |
| `src/skull/skull.ts` | Modify | Apply action frame overrides in the frame loop. Gate on `!reducedMotion`. Call `syncTo` on action completion. |

---

## Phase A — State Machine Module (TDD)

### Task 1: Add `syncTo` to skullMotion

**Files:**
- Modify: `src/skull/skullMotion.ts`

During an idle action, `skull.ts` writes rotation directly (bypassing the lerp). When the action ends, `skullMotion` needs its internal yaw/pitch/targets synced to the final rotation so the lerp doesn't snap back.

- [ ] **Step 1: Add `syncTo` to the `SkullMotionHandle` interface**

In `src/skull/skullMotion.ts`, add to the interface (after `triggerShake`):

```ts
  /** Teleport internal state to match an externally-imposed rotation. */
  syncTo(yaw: number, pitch: number): void;
```

- [ ] **Step 2: Implement `syncTo` in the returned object**

Inside `createSkullMotion`'s return object, add:

```ts
    syncTo(y, p) {
      yaw = y;
      pitch = p;
      yawTarget = y;
      pitchTarget = p;
    },
```

This sets both current AND target so the lerp integrator has zero error and won't drift after the sync.

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: 11/11 passing (no tests touch skullMotion; this is a type-safety check).

- [ ] **Step 5: Commit**

```bash
git add src/skull/skullMotion.ts
git commit -m "feat: add syncTo method to skullMotion for external rotation sync"
```

---

### Task 2: Create `idleActions.ts` with chomp state machine (TDD)

**Files:**
- Create: `src/skull/idleActions.ts`
- Create: `tests/idle-actions.test.ts`

- [ ] **Step 1: Write the failing tests for chomp**

Create `tests/idle-actions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createIdleActions } from '../src/skull/idleActions';

describe('IdleActions — chomp', () => {
  function make() {
    return createIdleActions();
  }

  it('is not playing initially', () => {
    const actions = make();
    expect(actions.isPlaying()).toBe(false);
    expect(actions.tick(0.016)).toBeNull();
  });

  it('triggerChomp starts playing and returns frames', () => {
    const actions = make();
    const started = actions.triggerChomp(0, 0);
    expect(started).toBe(true);
    expect(actions.isPlaying()).toBe(true);
    const frame = actions.tick(0.016);
    expect(frame).not.toBeNull();
    expect(frame!.positionOffset).toBeDefined();
    expect(frame!.scaleFactor).toBeDefined();
  });

  it('chomp completes and returns null after sufficient time', () => {
    const actions = make();
    actions.triggerChomp(0, 0);
    // Advance well past max chomp duration (~2.5s)
    for (let i = 0; i < 200; i++) {
      actions.tick(0.016);
    }
    // Should have completed (200 * 16ms = 3.2s)
    expect(actions.isPlaying()).toBe(false);
    expect(actions.tick(0.016)).toBeNull();
  });

  it('chomp aim phase targets the provided cursor coordinates', () => {
    const actions = make();
    actions.triggerChomp(0.5, -0.3);
    const frame = actions.tick(0.001); // tiny dt, still in aim phase
    expect(frame).not.toBeNull();
    expect(frame!.rotation).not.toBeNull();
    // Yaw should be moving toward cursor-derived target (0.5 * 0.7 = 0.35)
    // Pitch should be moving toward cursor-derived target (0.3 * 0.3 = 0.09)
    // At t=0.001, interpolation just started — values should be small but nonzero
    expect(typeof frame!.rotation!.yaw).toBe('number');
    expect(typeof frame!.rotation!.pitch).toBe('number');
  });

  it('chomp lunge phase advances position.z and increases scale', () => {
    const actions = make();
    actions.triggerChomp(0, 0);
    // Advance past aim (~0.2s)
    for (let i = 0; i < 15; i++) actions.tick(0.016);
    // Now in lunge or chomp phase — positionOffset.z should be > 0 at some point
    let maxZ = 0;
    let maxScale = 1;
    for (let i = 0; i < 20; i++) {
      const f = actions.tick(0.016);
      if (f) {
        maxZ = Math.max(maxZ, f.positionOffset.z);
        maxScale = Math.max(maxScale, f.scaleFactor);
      }
    }
    expect(maxZ).toBeGreaterThan(0);
    expect(maxScale).toBeGreaterThan(1);
  });

  it('chomp burst produces jaw angles', () => {
    const actions = make();
    actions.triggerChomp(0, 0);
    // Advance past aim + lunge (~0.35s)
    for (let i = 0; i < 25; i++) actions.tick(0.016);
    // During chomp burst, jaw should open and close
    let sawJawOpen = false;
    let sawJawClosed = false;
    for (let i = 0; i < 60; i++) {
      const f = actions.tick(0.016);
      if (f && f.jawAngle !== null) {
        if (f.jawAngle > 0.3) sawJawOpen = true;
        if (f.jawAngle < 0.05) sawJawClosed = true;
      }
    }
    expect(sawJawOpen).toBe(true);
    expect(sawJawClosed).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `createIdleActions` not found.

- [ ] **Step 3: Implement `idleActions.ts` with the chomp state machine**

Create `src/skull/idleActions.ts`:

```ts
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
  triggerSpin(): boolean;
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

type ActionState = ChompState | null;

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

    triggerSpin() {
      // Stub — implemented in Task 3
      if (state !== null) return false;
      return false;
    },

    tick(dt) {
      if (state === null) return null;
      if (state.type === 'chomp') return tickChomp(state, dt);
      return null;
    },

    isPlaying() {
      return state !== null;
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: all tests pass (6 new chomp tests + 11 existing puzzle tests).

- [ ] **Step 5: Commit**

```bash
git add src/skull/idleActions.ts tests/idle-actions.test.ts
git commit -m "feat: idleActions chomp state machine with TDD tests"
```

---

### Task 3: Add dance-spin state machine to `idleActions.ts` (TDD)

**Files:**
- Modify: `src/skull/idleActions.ts`
- Modify: `tests/idle-actions.test.ts`

- [ ] **Step 1: Write the failing tests for spin**

Append to `tests/idle-actions.test.ts`:

```ts
describe('IdleActions — spin', () => {
  function make() {
    return createIdleActions();
  }

  it('triggerSpin starts playing and returns frames', () => {
    const actions = make();
    const started = actions.triggerSpin();
    expect(started).toBe(true);
    expect(actions.isPlaying()).toBe(true);
    const frame = actions.tick(0.016);
    expect(frame).not.toBeNull();
  });

  it('spin completes after sufficient time', () => {
    const actions = make();
    actions.triggerSpin();
    // Advance well past max spin duration (~3s)
    for (let i = 0; i < 250; i++) actions.tick(0.016);
    expect(actions.isPlaying()).toBe(false);
  });

  it('spin produces y-axis bob during rotation', () => {
    const actions = make();
    actions.triggerSpin();
    // Skip wind-up (~0.2s)
    for (let i = 0; i < 15; i++) actions.tick(0.016);
    // During spin phase, y offset should vary (bobbing)
    let minY = 0, maxY = 0;
    for (let i = 0; i < 100; i++) {
      const f = actions.tick(0.016);
      if (f) {
        minY = Math.min(minY, f.positionOffset.y);
        maxY = Math.max(maxY, f.positionOffset.y);
      }
    }
    expect(maxY - minY).toBeGreaterThan(0.1);
  });

  it('spin produces a full 360° yaw rotation', () => {
    const actions = make();
    actions.triggerSpin();
    let totalYaw = 0;
    let prevYaw = 0;
    for (let i = 0; i < 250; i++) {
      const f = actions.tick(0.016);
      if (f && f.rotation) {
        const delta = f.rotation.yaw - prevYaw;
        totalYaw += delta;
        prevYaw = f.rotation.yaw;
      }
    }
    // Should have rotated approximately 2*PI (±10%)
    expect(Math.abs(totalYaw)).toBeGreaterThan(Math.PI * 2 * 0.9);
  });
});

describe('IdleActions — mutual exclusion', () => {
  it('cannot trigger spin while chomp is playing', () => {
    const actions = createIdleActions();
    actions.triggerChomp(0, 0);
    expect(actions.triggerSpin()).toBe(false);
  });

  it('cannot trigger chomp while spin is playing', () => {
    const actions = createIdleActions();
    actions.triggerSpin();
    expect(actions.triggerChomp(0, 0)).toBe(false);
  });

  it('can trigger after previous action completes', () => {
    const actions = createIdleActions();
    actions.triggerChomp(0, 0);
    // Run to completion
    for (let i = 0; i < 250; i++) actions.tick(0.016);
    expect(actions.isPlaying()).toBe(false);
    expect(actions.triggerSpin()).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify new ones fail**

```bash
npm test
```

Expected: spin + mutual exclusion tests fail (triggerSpin is a stub returning false).

- [ ] **Step 3: Implement the spin state machine**

In `src/skull/idleActions.ts`, add these types and constants near the top (after the chomp constants):

```ts
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
```

Update the `ActionState` type:

```ts
type ActionState = ChompState | SpinState | null;
```

Add a `tickSpin` function (alongside `tickChomp`):

```ts
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
        // Ease back to y=0 with overshoot
        const t = progress;
        // Damped sine for overshoot: starts at currentY, overshoots 0, settles
        const envelope = 1 - t;
        const overshoot = SETTLE_OVERSHOOT * Math.sin(Math.PI * t) * envelope;
        const settleY = s.currentY * (1 - easeOut(t)) + overshoot;
        return {
          rotation: { yaw: s.startYaw, pitch: 0 },  // back to start
          positionOffset: { x: 0, y: settleY, z: 0 },
          scaleFactor: 1,
          jawAngle: null,
        };
      }
    }
    return { rotation: null, positionOffset: { x: 0, y: 0, z: 0 }, scaleFactor: 1, jawAngle: null };
  }
```

Update `triggerSpin` to create a real SpinState:

```ts
    triggerSpin() {
      if (state !== null) return false;
      state = {
        type: 'spin',
        phase: 'windup',
        age: 0,
        phaseDuration: WINDUP_DURATION,
        spinDuration: SPIN_DURATION_MIN + Math.random() * (SPIN_DURATION_MAX - SPIN_DURATION_MIN),
        startYaw: 0,
        currentYaw: 0,
        currentY: 0,
      };
      return true;
    },
```

Update `tick` to dispatch to the right state machine:

```ts
    tick(dt) {
      if (state === null) return null;
      if (state.type === 'chomp') return tickChomp(state, dt);
      if (state.type === 'spin') return tickSpin(state, dt);
      return null;
    },
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass (6 chomp + 4 spin + 3 mutual exclusion + 11 puzzle = 24 total).

- [ ] **Step 5: Commit**

```bash
git add src/skull/idleActions.ts tests/idle-actions.test.ts
git commit -m "feat: idleActions spin state machine with TDD tests"
```

---

## Phase B — Integration

### Task 4: Wire action scheduling into `idle.ts`

**Files:**
- Modify: `src/skull/idle.ts`

`idle.ts` needs to: (1) create the `IdleActionsHandle`, (2) run two cooldown timers, (3) trigger actions when timers elapse, (4) suppress look-around + talk while an action plays, (5) enforce post-action cooldown.

- [ ] **Step 1: Add the actions handle and expose it via `IdleHandle`**

In `src/skull/idle.ts`, add the import at the top:

```ts
import { createIdleActions, type IdleActionsHandle, type IdleActionFrame } from './idleActions';
```

Extend the `IdleHandle` interface:

```ts
export interface IdleHandle {
  tick(dt: number): void;
  isActive(): boolean;
  getGlitchBurst(): number;
  /** Returns the current idle action frame, or null if no action is playing. */
  getActionFrame(): IdleActionFrame | null;
  /** True when a special idle action (chomp/spin) is in progress. */
  isActionPlaying(): boolean;
}
```

- [ ] **Step 2: Add action state inside `createIdleBehavior`**

Inside the closure, after the existing state variables:

```ts
  const actions = createIdleActions();
  let chompCooldown = 45 + Math.random() * 45;  // 45-90s
  let spinCooldown = 45 + Math.random() * 45;
  let postActionCooldown = 0;
  let actionFrame: IdleActionFrame | null = null;
```

- [ ] **Step 3: Add action scheduling and suspension to `tick()`**

Inside the `tick(dt)` method, after the `const active = idleness > IDLE_ACTIVATION;` line, add:

```ts
      // Special idle action scheduling
      actionFrame = actions.tick(dt);

      if (actions.isPlaying()) {
        // Action is running — suppress look-around and talk.
        // Skip the rest of the idle schedulers below.
        wasActive = active;
        return;
      }

      // Post-action cooldown prevents back-to-back actions
      if (postActionCooldown > 0) {
        postActionCooldown -= dt;
      }

      // Try to trigger actions when idle and cooled down
      if (active && postActionCooldown <= 0) {
        chompCooldown -= dt;
        spinCooldown -= dt;
        if (chompCooldown <= 0) {
          // Need cursor position — use bus to get it
          const cursor = bus.getCursor();
          if (actions.triggerChomp(cursor.x, cursor.y)) {
            chompCooldown = 45 + Math.random() * 45;
            postActionCooldown = 10;
          }
        } else if (spinCooldown <= 0) {
          if (actions.triggerSpin()) {
            spinCooldown = 45 + Math.random() * 45;
            postActionCooldown = 10;
          }
        }
      }
```

This early-returns from `tick()` while an action is playing, which skips the look-around and talk schedulers below. The existing glitch burst logic runs before this block (since it's at the end of `tick()`), so move this block to after the `const active` line and before the look-around scheduler.

Important: the glitch burst logic at the bottom of `tick()` should still run during actions (glitch bursts can overlap with a chomp/spin for dramatic effect). So the early return should be placed AFTER the idleness ramp and BEFORE the look-around scheduler, and the glitch burst block should be moved ABOVE the early return or duplicated. The simplest approach: restructure `tick()` so glitch burst logic runs unconditionally and the early return only gates look-around + talk:

```ts
    tick(dt: number) {
      // Idleness ramp (unchanged)
      const idleMs = performance.now() - bus.getLastInputTime();
      if (idleMs > 1000) {
        idleness = Math.min(1, (idleMs - 1000) / 8000);
      } else {
        idleness = 0;
      }

      const active = idleness > IDLE_ACTIVATION;

      // Glitch burst (runs during actions too)
      if (idleness > GLITCH_GATE) {
        burstCooldown -= dt;
        if (burstCooldown <= 0) {
          burst = 1;
          burstCooldown = 2 + Math.random() * 2 - idleness;
        }
      }
      burst = Math.max(0, burst - dt / 0.15);

      // Special idle action tick + scheduling
      actionFrame = actions.tick(dt);

      if (actions.isPlaying()) {
        wasActive = active;
        return;
      }

      if (postActionCooldown > 0) {
        postActionCooldown -= dt;
      }

      if (active && postActionCooldown <= 0) {
        chompCooldown -= dt;
        spinCooldown -= dt;
        if (chompCooldown <= 0) {
          const cursor = bus.getCursor();
          if (actions.triggerChomp(cursor.x, cursor.y)) {
            chompCooldown = 45 + Math.random() * 45;
            postActionCooldown = 10;
          }
        } else if (spinCooldown <= 0) {
          if (actions.triggerSpin()) {
            spinCooldown = 45 + Math.random() * 45;
            postActionCooldown = 10;
          }
        }
      }

      // Look-around scheduler (unchanged from here down)
      if (active) {
        // ... existing look-around code ...
      }

      // Talk scheduler (unchanged)
      if (active) {
        // ... existing talk code ...
      } else {
        skullMotion.setJawOffset(0);
        talkPhase = 'silent';
        talkTimer = 1.5 + Math.random() * 2.5;
      }

      wasActive = active;
    },
```

Note: the `wasActive = active;` at the end of the original tick is now duplicated — once in the early return path and once at the bottom. Make sure the original assignment at the bottom stays.

- [ ] **Step 4: Add the new methods to the return object**

```ts
    getActionFrame() {
      return actionFrame;
    },
    isActionPlaying() {
      return actions.isPlaying();
    },
```

- [ ] **Step 5: Run typecheck and tests**

```bash
npx tsc --noEmit && npm test
```

Expected: clean typecheck, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/skull/idle.ts
git commit -m "feat: wire idle action scheduling with cooldown timers and suspension"
```

---

### Task 5: Apply action frames in `skull.ts`

**Files:**
- Modify: `src/skull/skull.ts`

The frame loop needs to: (1) read the action frame from idle, (2) when active, apply position/scale/rotation/jaw overrides instead of normal idle-driven values, (3) gate on `!reducedMotion`, (4) call `skullMotion.syncTo` when an action completes.

- [ ] **Step 1: Add action frame application to the frame loop**

In `src/skull/skull.ts`, inside the `frame()` function, after the `if (!reducedMotion) idle.tick(dt);` line, add:

```ts
    // Idle special actions (chomp / spin)
    const actionFrame = !reducedMotion ? idle.getActionFrame() : null;
    let actionWasPlaying = false;
```

Move `actionWasPlaying` to the outer scope (above the `frame` function, alongside other state like `prevIdleBurst`):

```ts
  let actionWasPlaying = false;
```

Then in the frame function, after `idle.tick(dt)`:

```ts
    const actionFrame = !reducedMotion ? idle.getActionFrame() : null;
    const actionPlaying = !reducedMotion && idle.isActionPlaying();
```

Replace the current look-target + position block:

```ts
    const cursorState = bus.getCursor();
    uniforms.uCursor.value.set(cursorState.x, cursorState.y);
    if (actionPlaying && actionFrame) {
      // Action owns rotation, position, scale, and possibly jaw
      if (actionFrame.rotation) {
        scene.skull.rotation.y = actionFrame.rotation.yaw;
        scene.skull.rotation.x = actionFrame.rotation.pitch;
      }
      scene.skull.position.x = actionFrame.positionOffset.x;
      scene.skull.position.y = actionFrame.positionOffset.y;
      scene.skull.position.z = actionFrame.positionOffset.z;
      scene.skull.scale.setScalar(0.6 * actionFrame.scaleFactor);
    } else {
      // Normal behavior (existing code)
      if (bus.isDragging()) {
        const orbit = bus.getOrbit();
        skullMotion.lookAt(orbit.x, orbit.y);
      } else if (!idle.isActive()) {
        const wobbleX = reducedMotion ? 0 : Math.sin(t * 0.23) * 0.14;
        const wobbleY = reducedMotion ? 0 : Math.cos(t * 0.19) * 0.07;
        const targetYaw = cursorState.x * 0.7 + wobbleX;
        const targetPitch = -cursorState.y * 0.3 + wobbleY;
        skullMotion.lookAt(targetYaw, targetPitch);
      }
      skullMotion.tick(dt);
      scene.skull.position.x = bus.isTouch() ? 0 : cursorState.x * 0.15;
      scene.skull.position.y = 0;
      scene.skull.position.z = 0;
      scene.skull.scale.setScalar(0.6);
    }

    // Sync skullMotion when an action just finished so the lerp
    // doesn't snap the skull back to a stale internal target
    if (actionWasPlaying && !actionPlaying) {
      skullMotion.syncTo(scene.skull.rotation.y, scene.skull.rotation.x);
    }
    actionWasPlaying = actionPlaying;
```

- [ ] **Step 2: Handle jaw override during actions**

In the existing jaw hinge block, check for action jaw override:

```ts
    // Jaw click bonus decays over ~0.6s
    jawClickBonus = Math.max(0, jawClickBonus - dt / 0.6);
    if (scene.jawPivot) {
      if (actionPlaying && actionFrame && actionFrame.jawAngle !== null) {
        scene.jawPivot.rotation.x = actionFrame.jawAngle;
      } else {
        const scrollAngle = scroll * 0.55;
        const bonusAngle = jawClickBonus * 0.25;
        const talkOffset = skullMotion.getJawOffset();
        scene.jawPivot.rotation.x = Math.min(0.8, scrollAngle + bonusAngle + talkOffset);
      }
    }
```

- [ ] **Step 3: Run typecheck and tests**

```bash
npx tsc --noEmit && npm test
```

Expected: clean typecheck, all tests pass.

- [ ] **Step 4: Ask developer to test in browser**

To test quickly without waiting 45-90 seconds, temporarily change the cooldown timers in `idle.ts`:

```ts
let chompCooldown = 3 + Math.random() * 2;  // 3-5s for testing
let spinCooldown = 8 + Math.random() * 2;   // 8-10s for testing
```

Open `http://localhost:4321`, don't move the cursor, wait ~5s for a chomp and ~10s for a spin. Verify:
- Chomp: skull aims at cursor, lunges forward (z + scale), rapid jaw open-close, retreats.
- Spin: skull dips, full 360° yaw rotation with y-bobbing, settles back.
- After each action, normal idle behavior resumes smoothly (no snap).
- Desktop cursor tracking is unaffected between actions.
- Touch drag still works.
- Reduced-motion (DevTools emulation) suppresses both actions.

After verifying, **revert the test timers** back to `45 + Math.random() * 45`.

- [ ] **Step 5: Commit**

```bash
git add src/skull/skull.ts
git commit -m "feat: apply idle action frames in skull.ts frame loop"
```

---

### Task 6: Pass current yaw into spin for seamless start

**Files:**
- Modify: `src/skull/idleActions.ts`
- Modify: `src/skull/idle.ts`

The spin's `startYaw` is currently hardcoded to 0. It should start from the skull's current yaw so the spin begins from wherever the skull is looking.

- [ ] **Step 1: Update `triggerSpin` to accept the starting yaw**

In `src/skull/idleActions.ts`, change the signature:

```ts
    triggerSpin(startYaw?: number) {
      if (state !== null) return false;
      state = {
        type: 'spin',
        phase: 'windup',
        age: 0,
        phaseDuration: WINDUP_DURATION,
        spinDuration: SPIN_DURATION_MIN + Math.random() * (SPIN_DURATION_MAX - SPIN_DURATION_MIN),
        startYaw: startYaw ?? 0,
        currentYaw: startYaw ?? 0,
        currentY: 0,
      };
      return true;
    },
```

Update the `IdleActionsHandle` interface:

```ts
  triggerSpin(startYaw?: number): boolean;
```

- [ ] **Step 2: Pass the current yaw from `idle.ts`**

In `idle.ts`, in the spin trigger block:

```ts
        } else if (spinCooldown <= 0) {
          if (actions.triggerSpin(skullMotion.getYaw())) {
            spinCooldown = 45 + Math.random() * 45;
            postActionCooldown = 10;
          }
        }
```

- [ ] **Step 3: Run typecheck and tests**

```bash
npx tsc --noEmit && npm test
```

Expected: clean. Existing spin tests pass (they call `triggerSpin()` with no arg, which defaults to 0).

- [ ] **Step 4: Commit**

```bash
git add src/skull/idleActions.ts src/skull/idle.ts
git commit -m "feat: pass current yaw into spin for seamless start rotation"
```

---

### Task 7: Push to deploy

- [ ] **Step 1: Verify everything is clean**

```bash
npx tsc --noEmit && npm test && git status
```

Expected: clean typecheck, all tests pass, clean working tree.

- [ ] **Step 2: Push**

```bash
git push origin master
```

Vercel auto-deploys. Verify on the live URL after the build completes (~2 min).
