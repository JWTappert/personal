# Skull idle motion — design

**Date:** 2026-04-11
**Scope:** Replace Phase 5 shader-driven idle "decay twitch" with imperative skull motion: autonomous look-around and jaw "talking" while the cursor is idle.

## Background

Phase 5 of the skull-site rewrite (`docs/superpowers/plans/2026-04-11-skull-site.md`) implemented idle behavior as a vertex shader twitch driven by `uDecayLevel`, plus glitch bursts on the composer. Visual result was "the skull is changing shapes" — not the intended subtle idleness.

This spec replaces the motion layer only. Atmospheric glitch bursts stay untouched.

## Goals

1. When the cursor is idle, the skull autonomously "looks around" — picking random points in its field and gliding toward them using the same lazy-eye lerp the cursor driver uses.
2. When idle, the jaw periodically opens and closes in natural "talking" phrases (bursts of small pulses, then silence, then more).
3. The look-around and talk behaviors are exposed as imperative functions on a reusable motion controller, so later phases (puzzle hints, event reactions) can call the same functions.
4. When cursor input resumes, control hands back cleanly. The underlying lerp smooths the switch.

## Non-goals

- No changes to glitch bursts (slot 3 idle burst logic stays as-is).
- No changes to click ring, color cycling, scroll hinge, or cursor lazy-eye tracking math.
- No HUD, puzzle, or later-phase work.

## Architecture

Two new/changed modules plus shader cleanup:

### `src/skull/skullMotion.ts` (new)

Owns the skull's look target and jaw offset state. Owns the rotation lerp that currently lives inline in `skull.ts`'s frame loop.

```ts
export interface SkullMotionHandle {
  /** Set desired look direction. Values roughly in [-1, 1]; converted to yaw/pitch internally. */
  lookAt(x: number, y: number): void;
  /** Additive jaw-open offset in radians. Read by the jaw composition in skull.ts via getJawOffset. */
  setJawOffset(radians: number): void;
  getJawOffset(): number;
  /** Apply the current look target to the scene (lerped) this frame. */
  tick(dt: number): void;
}

export function createSkullMotion(scene: SceneHandle): SkullMotionHandle;
```

Internal state:
- `yawTarget`, `pitchTarget` (radians)
- `jawOffset` (radians)
- Lerp smoothing time constant `tau = 2.8` (matches current cursor-driven behavior)

`tick(dt)` writes only to `scene.skull.rotation.y` (yaw) and `scene.skull.rotation.x` (pitch) using the existing exponential lerp formula:

```ts
const rate = 1 - Math.exp(-dt / tau);
scene.skull.rotation.y += (yawTarget - scene.skull.rotation.y) * rate;
scene.skull.rotation.x += (pitchTarget - scene.skull.rotation.x) * rate;
```

`tick(dt)` does NOT write to `jawPivot`. Jaw composition stays in `skull.ts` so the scroll + click + idle contributions remain visible in one place.

### `src/skull/idle.ts` (modified)

Signature changes from `createIdleBehavior(bus)` to `createIdleBehavior(bus, skullMotion)`. Expanded responsibilities:
- Track `idleness` (0-1) — ramps up after 1s of no input (same shape as old `decayLevel`), drops to 0 on any input event (`pointer`, `click`, `scroll`, `key`).
- Glitch burst scheduling — unchanged logic, gated on `idleness > 0.3` instead of the old `decayLevel`. `getGlitchBurst()` API unchanged.
- **New:** Look-around scheduler — when `idleness > 0.4`, picks a new look target every `[2.5, 5.5]`s (random). Target is in yaw `[-0.8, 0.8]`, pitch `[-0.35, 0.35]`. First target is picked immediately on the frame `idleness` crosses `0.4`; next target is scheduled after the random gap. Calls `skullMotion.lookAt(x, y)` on each pick.
- **New:** Talk scheduler — when `idleness > 0.4`, runs "phrases": a phrase is 3-7 jaw pulses, each pulse lasting `[140, 260]`ms with random peak amplitude in `[0.08, 0.28]` radians, followed by a silent gap of `[1.5, 4]`s before the next phrase. Each pulse uses a half-sine envelope: `amplitude * sin(pi * pulseAge / pulseDuration)`, so the jaw smoothly opens to peak and closes again within the pulse. Each frame writes the current pulse value via `skullMotion.setJawOffset(value)`. When silent (inter-pulse or inter-phrase) or not idle, writes `0`.
- **New:** `isActive(): boolean` — returns `idleness > 0.4`. `skull.ts` uses this to decide whether to let cursor drive the look target.

Removed: `getDecayLevel()` (no longer needed since `uDecayLevel` uniform is being deleted).

### `src/skull/skull.ts` (modified)

Frame loop refactor — replaces the inline rotation lerp with `skullMotion` calls:

```ts
idle.tick(dt);                       // may imperatively call skullMotion.lookAt / setJawOffset
const cursor = bus.getCursor();

if (!idle.isActive()) {
  // Cursor driver — same wobble + target math as today
  const wobbleX = Math.sin(t * 0.23) * 0.14;
  const wobbleY = Math.cos(t * 0.19) * 0.07;
  const targetYaw = cursor.x * 0.7 + wobbleX;
  const targetPitch = -cursor.y * 0.3 + wobbleY;
  skullMotion.lookAt(targetYaw, targetPitch);
  // Cursor path does not set jaw offset — idle.tick already wrote 0 when not active
}
skullMotion.tick(dt);

// Jaw composition stays here, now includes skullMotion.getJawOffset()
const scrollAngle = bus.getScroll() * 0.55;
scene.jawPivot.rotation.x = Math.min(
  0.8,
  scrollAngle + jawClickBonus * 0.25 + skullMotion.getJawOffset()
);
```

`scene.skull.position.x = cursor.x * 0.15` stays — cursor-driven horizontal translation is independent of the look-around behavior and feels subtle enough to survive during idle.

### Shader cleanup

`uDecayLevel` becomes unused after this change. Remove:
- `uDecayLevel` from `src/skull/material.ts` `SkullUniforms` + initializer
- `uDecayLevel` uniform and the `twitch` displacement in `src/skull/shaders/skull.vert`
- `vDisplace` varying in both `.vert` and `.frag`
- `brightness += vDisplace * 0.3` in `src/skull/shaders/skull.frag`

## Control flow

```
Frame N (cursor moved recently):
  idle.tick — idleness = 0, no lookAt/setJawOffset calls
  idle.isActive() = false
  cursor driver calls skullMotion.lookAt(cursorTarget)
  skullMotion.tick lerps rotation toward cursor target
  jaw = scroll + click + 0

Frame N+K (cursor stopped):
  idleness ramps up
  After idleness > 0.4: look-around scheduler picks random target, calls skullMotion.lookAt(randomPoint)
  After idleness > 0.4: talk scheduler emits jaw pulse, calls skullMotion.setJawOffset(value)
  idle.isActive() = true, cursor driver skipped
  skullMotion.tick lerps toward random target (smooth glide)
  jaw = scroll + click + talkPulse

Frame N+K+1 (mouse moves):
  bus emits 'pointer', idle reset listener zeroes idleness
  talk scheduler sees idleness < 0.4, writes setJawOffset(0)
  Next frame: idle.isActive() = false, cursor driver takes over
  skullMotion.tick lerps from wherever it was toward the cursor target (lazy glide smooths the transition)
```

## Testing

Visual only, manual:
1. Reload the page. Sit still for ~2 seconds. Expected: skull starts glancing around to different points, lazily. Within a few seconds, jaw begins "talking" in phrases with silent gaps.
2. Move the mouse. Expected: jaw immediately goes quiet, skull smoothly glides to follow the cursor again.
3. Sit still again. Expected: idle behavior resumes.
4. Scroll while sitting still. Expected: scroll still hinges the jaw open; idle talk layers additively but doesn't feel contradictory (bonus may clip at the `0.8` cap — acceptable).

Automated tests not required for this phase (matches existing Phase 5 style).

## Files changed

- New: `src/skull/skullMotion.ts`
- Modified: `src/skull/idle.ts`
- Modified: `src/skull/skull.ts`
- Modified: `src/skull/material.ts`
- Modified: `src/skull/shaders/skull.vert`
- Modified: `src/skull/shaders/skull.frag`

## Open questions

None. All tunable numbers (idle threshold, target cadence, talk amplitude) are listed above and can be iterated visually after landing.
