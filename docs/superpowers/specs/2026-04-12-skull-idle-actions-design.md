# Skull Idle Special Actions — Design Spec

Two rare idle actions that make the skull feel more alive and less pinned in place.
Both are autoplayed (gated off under `prefers-reduced-motion`).

## Shared Rules

- **Frequency:** each action has its own independent cooldown timer, 45-90s randomized gap.
- **Mutual exclusion:** only one special action can play at a time. If one is active, the other's timer pauses.
- **Post-action cooldown:** 10s minimum after any special action ends before another can fire.
- **Idle gate:** only fire when `idle.isActive()` is true.
- **Hard takeover:** while a special action plays, the normal look-around and talk schedulers in `idle.ts` are suspended. The action fully owns `skullMotion` (yaw/pitch), jaw, `position`, and `scale`. After the action completes, idle resumes from wherever the skull ended up.
- **Reduced-motion:** both actions gated off entirely when `reducedMotion` is true.

## Action 1: Lurch-Chomp

The skull notices the cursor, lunges toward the camera, and rapid-fire chomps.

### Sequence (~1.5-2.5s total)

| Phase | Duration | What happens |
|-------|----------|-------------|
| Aim | ~200ms | `skullMotion.lookAt` snaps toward current cursor ndc (or center on touch). Fast lerp, not instant. |
| Lunge | ~150ms | `position.z` advances +2 to +3 units (toward camera). `skull.scale` punches from 0.6 to ~0.72. Sharp ease-in attack curve. |
| Chomp burst | 2-4 chomps, ~150ms each | Jaw opens to ~0.6 rad over ~40ms, snaps shut over ~110ms. Slight per-chomp randomization on amplitude and timing. |
| Hold | ~100ms | Jaw shut, skull still extended. Menacing pause. |
| Retreat | ~400ms | `position.z` and `scale` ease back to resting (0, 0.6). Slow decelerate ease-out. |

### Parameters (tunable)

- `LUNGE_Z`: 2-3 units forward (randomized per trigger)
- `LUNGE_SCALE`: 0.72 peak (from resting 0.6)
- `CHOMP_COUNT`: 2-4 (randomized per trigger)
- `CHOMP_JAW_ANGLE`: ~0.6 rad peak open
- `CHOMP_OPEN_MS`: ~40ms
- `CHOMP_CLOSE_MS`: ~110ms
- `RETREAT_MS`: ~400ms

### After retreat

Idle resumes. `skullMotion`'s internal yaw/pitch are wherever the aim phase left them. The look-around scheduler picks new targets from there naturally.

## Action 2: Dance-Spin

The skull does a playful full-rotation spin with a bobbing y-axis dance.

### Sequence (~2-3s total)

| Phase | Duration | What happens |
|-------|----------|-------------|
| Wind-up | ~200ms | `position.y` dips ~0.3 units. Anticipation coil. |
| Spin | ~1.5-2s | Full 360° yaw rotation with sin²-style velocity curve (accelerate, cruise, decelerate). During spin, `position.y` bobs with 2 full sine cycles at ~0.2 units amplitude. |
| Settle | ~300ms | `position.y` eases back to 0 with slight overshoot + correction. |

### Parameters (tunable)

- `SPIN_DURATION`: 1.5-2s (randomized per trigger)
- `SPIN_DEGREES`: 360° (full rotation, net zero)
- `BOB_AMPLITUDE`: ~0.2 units
- `BOB_CYCLES`: 2 full sine cycles over the spin duration
- `WINDUP_DIP`: ~0.3 units downward
- `SETTLE_OVERSHOOT`: small (~0.05 units)

### Notes

- No jaw motion during spin — jaw stays relaxed. Keeps it distinct from the chomp.
- Full 360° means `skullMotion`'s yaw returns to its starting value. Look-around resumes seamlessly.

## Architecture

### New module: `src/skull/idleActions.ts`

Pure state machines for both actions. Does not own scheduling — `idle.ts` decides when to trigger. The module receives the scene handle and skullMotion handle, and exposes:

```ts
interface IdleActionsHandle {
  /** Try to start a lurch-chomp. Returns false if an action is already playing. */
  triggerChomp(cursorX: number, cursorY: number): boolean;
  /** Try to start a dance-spin. Returns false if an action is already playing. */
  triggerSpin(): boolean;
  /** Advance the active action by dt seconds. Returns overrides for the frame. */
  tick(dt: number): IdleActionFrame | null;
  /** True when any special action is in progress. */
  isPlaying(): boolean;
}

interface IdleActionFrame {
  /** Yaw/pitch target to feed into skullMotion.lookAt. Null = don't override. */
  lookAt: { yaw: number; pitch: number } | null;
  /** Additive position offsets (z for lunge, y for dance). */
  positionOffset: { x: number; y: number; z: number };
  /** Scale multiplier (1.0 = no change from resting skull.scale). */
  scaleFactor: number;
  /** Jaw angle override. Null = don't override (let idle/scroll handle it). */
  jawAngle: number | null;
}
```

`tick()` returns `null` when no action is playing. When non-null, `skull.ts` applies the overrides instead of the normal idle-driven values.

### Changes to `idle.ts`

- Import and create `IdleActionsHandle`.
- Add two independent cooldown timers (45-90s random gap each).
- During `tick()`, when idle is active and no action is playing, check if either timer has elapsed. If so, trigger the corresponding action (chomp gets cursor position passed in).
- While `isPlaying()` is true, suppress look-around and talk schedulers.
- Expose `idleActions.isPlaying()` and `idleActions.tick(dt)` results to `skull.ts` via the existing `IdleHandle` interface (add methods or expand the return type).
- Post-action cooldown: after any action completes, both timers get a 10s minimum floor added.

### Changes to `skull.ts`

- In the frame loop, after `idle.tick(dt)`, check if idle actions returned a frame.
- If a frame is active: apply `positionOffset` to `scene.skull.position`, `scaleFactor` to `scene.skull.scale`, `jawAngle` to `scene.jawPivot.rotation.x`, and feed `lookAt` into `skullMotion`.
- If no frame: existing behavior unchanged.
- Gate the entire idle-actions path on `!reducedMotion`.

### Changes to `skullMotion.ts`

None expected. The actions will call `lookAt()` to aim and rely on the existing lerp. The lurch's "fast aim" is achieved by calling `lookAt` with the target and letting the tau=2.8s lerp do its thing — 200ms of lerp gets ~7% of the way there, which may be too slow. If so, we may need a `lookAtImmediate(yaw, pitch)` that bypasses the lerp, or a temporary tau override. Decide during implementation based on how the aim phase feels.
