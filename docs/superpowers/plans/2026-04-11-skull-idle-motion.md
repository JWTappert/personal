# Skull Idle Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 5 shader-driven "decay twitch" with an imperative `skullMotion` controller that drives autonomous look-around + jaw "talking" when the cursor is idle.

**Architecture:** A new `skullMotion.ts` owns yaw/pitch look-target state and the exponential-lerp rotation update (currently inline in `skull.ts`). It exposes `lookAt(x, y)` and `setJawOffset(r)` as the reusable imperative API. `idle.ts` is expanded to take `skullMotion` as a constructor arg and schedules random look targets + jaw talk phrases while the cursor is idle. The frame loop in `skull.ts` chooses between cursor driver and idle scheduler based on `idle.isActive()`. The now-dead `uDecayLevel` vertex twitch and `vDisplace` brightening are removed from the material and shaders.

**Tech Stack:** TypeScript, Three.js, vanilla shaders. No new dependencies.

**Reference spec:** `docs/superpowers/specs/2026-04-11-skull-idle-motion-design.md`

**Relationship to master plan:** This plan REPLACES the remaining work in Phase 5 ("Idle decay") of `docs/superpowers/plans/2026-04-11-skull-site.md`. Phase 5 Tasks 16 and 17 in the master plan are already landed (commits `1e88d3a`, `cdc4d2f`) but implement the wrong behavior. This plan supersedes them. After the final task here, the master plan resumes at **Phase 6 — HUD** (Tasks 18-20).

---

## Task 1: Create `skullMotion.ts`

**Files:**
- Create: `src/skull/skullMotion.ts`

- [ ] **Step 1: Write the new module**

Create `src/skull/skullMotion.ts` with the following contents:

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `cd "C:/Users/tappe/Workspace/personal" && npx tsc --noEmit`
Expected: PASS, no output.

- [ ] **Step 3: Commit**

```bash
git add src/skull/skullMotion.ts
git commit -m "feat: add skullMotion controller with lookAt + setJawOffset"
```

---

## Task 2: Expand `idle.ts` to drive motion

**Files:**
- Modify: `src/skull/idle.ts`

- [ ] **Step 1: Rewrite `idle.ts`**

Replace the contents of `src/skull/idle.ts` entirely with:

```ts
import type { InteractionBus } from './interactions';
import type { SkullMotionHandle } from './skullMotion';

export interface IdleHandle {
  tick(dt: number): void;
  /** True while idleness > the motion-activation threshold. */
  isActive(): boolean;
  /** 0..1 idle burst intensity for the composer glitch slot. */
  getGlitchBurst(): number;
}

const IDLE_ACTIVATION = 0.4;
const GLITCH_GATE = 0.3;

export function createIdleBehavior(
  bus: InteractionBus,
  skullMotion: SkullMotionHandle
): IdleHandle {
  let idleness = 0;

  // Glitch burst state
  let burst = 0;
  let burstCooldown = 2 + Math.random() * 2;

  // Look-around state
  let nextLookIn = 0;
  let wasActive = false;

  // Talk state
  // phase: 'silent' during inter-phrase gap, 'pulse' during an active pulse, 'rest' between pulses in a phrase
  type TalkPhase = 'silent' | 'pulse' | 'rest';
  let talkPhase: TalkPhase = 'silent';
  let talkTimer = 1.5 + Math.random() * 2.5; // initial silent delay
  let pulsesRemaining = 0;
  let pulseDuration = 0;
  let pulseAge = 0;
  let pulseAmp = 0;

  const reset = () => {
    idleness = 0;
  };
  bus.on('pointer', reset);
  bus.on('click', reset);
  bus.on('scroll', reset);
  bus.on('key', reset);

  function pickLookTarget() {
    const yaw = (Math.random() * 2 - 1) * 0.8;
    const pitch = (Math.random() * 2 - 1) * 0.35;
    skullMotion.lookAt(yaw, pitch);
  }

  function startPhrase() {
    pulsesRemaining = 3 + Math.floor(Math.random() * 5); // 3..7
    talkPhase = 'pulse';
    beginPulse();
  }

  function beginPulse() {
    pulseDuration = 0.14 + Math.random() * 0.12; // 140..260ms
    pulseAmp = 0.08 + Math.random() * 0.2;       // 0.08..0.28 rad
    pulseAge = 0;
    talkPhase = 'pulse';
  }

  function scheduleNextPhrase() {
    talkTimer = 1.5 + Math.random() * 2.5; // 1.5..4s silent gap
    talkPhase = 'silent';
  }

  return {
    tick(dt: number) {
      // idleness ramp: starts after 1s of no input, reaches 1.0 over 8s
      const idleMs = performance.now() - bus.getLastInputTime();
      if (idleMs > 1000) {
        idleness = Math.min(1, (idleMs - 1000) / 8000);
      } else {
        idleness = 0;
      }

      const active = idleness > IDLE_ACTIVATION;

      // Look-around scheduler
      if (active) {
        if (!wasActive) {
          pickLookTarget();
          nextLookIn = 2.5 + Math.random() * 3;
        } else {
          nextLookIn -= dt;
          if (nextLookIn <= 0) {
            pickLookTarget();
            nextLookIn = 2.5 + Math.random() * 3;
          }
        }
      }

      // Talk scheduler
      if (active) {
        if (talkPhase === 'silent') {
          talkTimer -= dt;
          if (talkTimer <= 0) startPhrase();
          skullMotion.setJawOffset(0);
        } else if (talkPhase === 'pulse') {
          pulseAge += dt;
          if (pulseAge >= pulseDuration) {
            pulsesRemaining -= 1;
            if (pulsesRemaining <= 0) {
              scheduleNextPhrase();
              skullMotion.setJawOffset(0);
            } else {
              talkPhase = 'rest';
              talkTimer = 0.04 + Math.random() * 0.08; // 40..120ms between pulses
              skullMotion.setJawOffset(0);
            }
          } else {
            // Half-sine envelope: 0 -> peak -> 0 over the pulse duration
            const value = pulseAmp * Math.sin((Math.PI * pulseAge) / pulseDuration);
            skullMotion.setJawOffset(value);
          }
        } else if (talkPhase === 'rest') {
          talkTimer -= dt;
          skullMotion.setJawOffset(0);
          if (talkTimer <= 0) beginPulse();
        }
      } else {
        // Not idle — silence the jaw.
        skullMotion.setJawOffset(0);
        talkPhase = 'silent';
        talkTimer = 1.5 + Math.random() * 2.5;
      }

      // Glitch burst (unchanged logic; gated on idleness instead of the removed decayLevel)
      if (idleness > GLITCH_GATE) {
        burstCooldown -= dt;
        if (burstCooldown <= 0) {
          burst = 1;
          burstCooldown = 2 + Math.random() * 2 - idleness;
        }
      }
      burst = Math.max(0, burst - dt / 0.15);

      wasActive = active;
    },
    isActive() {
      return idleness > IDLE_ACTIVATION;
    },
    getGlitchBurst() {
      return burst;
    },
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `cd "C:/Users/tappe/Workspace/personal" && npx tsc --noEmit`
Expected: Two errors from `skull.ts` that still references the old `createIdleBehavior(bus)` signature and `idle.getDecayLevel()`. These will be fixed in Task 3. Other errors (e.g., `uDecayLevel` on uniforms) should NOT appear yet since Task 4 handles that.

Note: if `npx tsc --noEmit` reports errors from files other than `skull.ts`, STOP and report back — something unexpected happened.

- [ ] **Step 3: Commit**

```bash
git add src/skull/idle.ts
git commit -m "feat: expand idle.ts to schedule look-around and jaw talk"
```

---

## Task 3: Wire `skullMotion` into `skull.ts`

**Files:**
- Modify: `src/skull/skull.ts`

This task refactors the frame loop to:
1. Instantiate `skullMotion` and pass it to `createIdleBehavior`
2. Replace the inline rotation lerp with `skullMotion.lookAt` + `skullMotion.tick`
3. Gate the cursor driver on `!idle.isActive()` so the idle scheduler owns the look target when idle
4. Add `skullMotion.getJawOffset()` into the jaw composition
5. Remove the now-stale `uDecayLevel` uniform write (Task 4 deletes the uniform itself)

- [ ] **Step 1: Add import and instantiate**

In `src/skull/skull.ts`, find the existing imports and add at the bottom of the import block:

```ts
import { createSkullMotion } from './skullMotion';
```

Find this line near the top of `boot()`:

```ts
  const bus = createInteractions(canvas, scene);
  const idle = createIdleBehavior(bus);
```

Replace with:

```ts
  const bus = createInteractions(canvas, scene);
  const skullMotion = createSkullMotion(scene);
  const idle = createIdleBehavior(bus, skullMotion);
```

- [ ] **Step 2: Refactor the frame loop rotation block**

Find this block inside `frame()` (the lazy-eye tracking section):

```ts
    idle.tick(dt);
    uniforms.uDecayLevel.value = idle.getDecayLevel();

    // Lazy eye tracking: the skull drifts toward facing the cursor over
    // ~2.8 seconds. A slow sine wobble adds a "distracted" feel so it never
    // perfectly centers even when the cursor holds still.
    const cursorState = bus.getCursor();
    uniforms.uCursor.value.set(cursorState.x, cursorState.y);
    const wobbleX = Math.sin(t * 0.23) * 0.14;
    const wobbleY = Math.cos(t * 0.19) * 0.07;
    const targetYaw = cursorState.x * 0.7 + wobbleX;
    const targetPitch = -cursorState.y * 0.3 + wobbleY;
    const tau = 2.8;
    const rate = 1 - Math.exp(-dt / tau);
    scene.skull.rotation.y += (targetYaw - scene.skull.rotation.y) * rate;
    scene.skull.rotation.x += (targetPitch - scene.skull.rotation.x) * rate;
    scene.skull.position.x = cursorState.x * 0.15;
```

Replace with:

```ts
    idle.tick(dt);

    // Lazy eye tracking: cursor driver feeds skullMotion with a target based
    // on cursor position plus a slow wobble. When the cursor is idle, the
    // idle scheduler (inside idle.tick) is driving skullMotion instead.
    const cursorState = bus.getCursor();
    uniforms.uCursor.value.set(cursorState.x, cursorState.y);
    if (!idle.isActive()) {
      const wobbleX = Math.sin(t * 0.23) * 0.14;
      const wobbleY = Math.cos(t * 0.19) * 0.07;
      const targetYaw = cursorState.x * 0.7 + wobbleX;
      const targetPitch = -cursorState.y * 0.3 + wobbleY;
      skullMotion.lookAt(targetYaw, targetPitch);
    }
    skullMotion.tick(dt);
    scene.skull.position.x = cursorState.x * 0.15;
```

- [ ] **Step 3: Fold the jaw offset into the jaw composition**

Find this block further down in `frame()`:

```ts
    // Scroll drives the jaw hinge directly. Max ~32 degrees open at full scroll.
    const scroll = bus.getScroll();
    // Jaw click bonus decays over ~0.6s
    jawClickBonus = Math.max(0, jawClickBonus - dt / 0.6);
    if (scene.jawPivot) {
      const scrollAngle = scroll * 0.55;
      const bonusAngle = jawClickBonus * 0.25;
      scene.jawPivot.rotation.x = Math.min(0.8, scrollAngle + bonusAngle);
    }
```

Replace with:

```ts
    // Scroll drives the jaw hinge directly. Max ~32 degrees open at full scroll.
    // The idle scheduler adds a transient "talk" offset via skullMotion.
    const scroll = bus.getScroll();
    // Jaw click bonus decays over ~0.6s
    jawClickBonus = Math.max(0, jawClickBonus - dt / 0.6);
    if (scene.jawPivot) {
      const scrollAngle = scroll * 0.55;
      const bonusAngle = jawClickBonus * 0.25;
      const talkOffset = skullMotion.getJawOffset();
      scene.jawPivot.rotation.x = Math.min(0.8, scrollAngle + bonusAngle + talkOffset);
    }
```

- [ ] **Step 4: Typecheck**

Run: `cd "C:/Users/tappe/Workspace/personal" && npx tsc --noEmit`
Expected: The two errors from Task 2 should now be gone. If `material.ts` or the shaders still reference `uDecayLevel` they will NOT cause errors yet (uniforms are plain objects until Task 4). Typecheck should PASS with no output.

- [ ] **Step 5: Commit**

```bash
git add src/skull/skull.ts
git commit -m "feat: drive skull rotation + jaw via skullMotion controller"
```

---

## Task 4: Remove the dead `uDecayLevel` shader pipeline

**Files:**
- Modify: `src/skull/material.ts`
- Modify: `src/skull/shaders/skull.vert`
- Modify: `src/skull/shaders/skull.frag`

The vertex twitch and `vDisplace` brightening are dead code after Task 3. This task deletes them.

- [ ] **Step 1: Remove `uDecayLevel` from `material.ts`**

Find `src/skull/material.ts`. Remove the `uDecayLevel` line from the `SkullUniforms` interface:

```ts
  uDecayLevel: { value: number };
```

and remove the corresponding initializer from the `uniforms` object literal in `createSkullMaterial`:

```ts
    uDecayLevel: { value: 0 },
```

No other changes to this file.

- [ ] **Step 2: Remove twitch + `vDisplace` from `skull.vert`**

Replace the contents of `src/skull/shaders/skull.vert` with:

```glsl
uniform float uTime;
uniform float uNoiseSeed;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPos;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

Note: `uTime` and `uNoiseSeed` are kept because they may be referenced elsewhere or by future phases. The noise helpers (`hash`, `noise`) are removed since nothing else in the vert shader uses them. If `uTime` or `uNoiseSeed` are also unused and the GLSL compiler complains, they can be removed — but leave them for now unless tsc/runtime rejects.

- [ ] **Step 3: Remove `vDisplace` brightness from `skull.frag`**

In `src/skull/shaders/skull.frag`, find and remove the line:

```glsl
varying float vDisplace;
```

And find and remove the line:

```glsl
  brightness += vDisplace * 0.3;
```

Leave everything else in the file alone.

- [ ] **Step 4: Typecheck**

Run: `cd "C:/Users/tappe/Workspace/personal" && npx tsc --noEmit`
Expected: PASS, no output. Shaders are imported as raw strings so TS won't catch GLSL issues — but `material.ts` referencing `uniforms.uDecayLevel` anywhere would be a type error. There should be no such reference after Task 3.

- [ ] **Step 5: Quick grep check**

Run: `cd "C:/Users/tappe/Workspace/personal" && grep -rn "uDecayLevel\|vDisplace" src/`
Expected: empty output. If any reference remains, fix it before committing.

- [ ] **Step 6: Commit**

```bash
git add src/skull/material.ts src/skull/shaders/skull.vert src/skull/shaders/skull.frag
git commit -m "refactor: remove dead uDecayLevel and vDisplace shader pipeline"
```

---

## Visual verification (gate before Task 5)

The developer keeps `npm run dev` running on `http://localhost:4321`. **Do NOT start or stop the dev server.**

After Task 4, ask the developer to reload the page and confirm:

1. **Idle sit-still test (~3 seconds)** — skull should start glancing around to different points lazily. Within a few more seconds, jaw should begin "talking" in phrases (several quick open-close pulses, then a silent gap, then another phrase). No visible vertex deformation.
2. **Mouse move** — jaw immediately goes quiet. Skull smoothly lerps back to following the cursor.
3. **Scroll** — jaw still hinges open based on scroll amount. Works while idle-talking (scroll overrides but idle talk adds on top, clipped to the 0.8 rad cap).
4. **Click** — click ring effect, color cycle, and jaw click bonus still work. No regressions.

If any of these fail, stop and iterate on the numbers in `idle.ts` / `skullMotion.ts` before proceeding. Task 5 is docs-only and must not run until the visual behavior is accepted.

---

## Task 5: Update master plan pointer + RESUME.md

**Files:**
- Modify: `docs/superpowers/plans/2026-04-11-skull-site.md`
- Modify: `docs/superpowers/RESUME.md`

- [ ] **Step 1: Add a superseded pointer to Phase 5 in the master plan**

In `docs/superpowers/plans/2026-04-11-skull-site.md`, find the line:

```markdown
## Phase 5 — Idle decay
```

Insert immediately after it, before Task 16:

```markdown
> **SUPERSEDED 2026-04-11:** The original "decay twitch" design below was
> replaced with an imperative skull-motion rework. See the spec
> `docs/superpowers/specs/2026-04-11-skull-idle-motion-design.md` and the
> rework plan `docs/superpowers/plans/2026-04-11-skull-idle-motion.md` for
> the current Phase 5 truth. The original Tasks 16-17 below are kept for
> historical reference only.
```

No other changes to the master plan.

- [ ] **Step 2: Update RESUME.md**

In `docs/superpowers/RESUME.md`, find the Phase 5 row in the progress table:

```markdown
| 5 — Idle decay | ⏭ **NEXT** | Plan tasks 16-17. Will wire idle twitch + glitch bursts when user is idle. `uDecayLevel` uniform already exists in material and vert shader uses it. |
```

Replace with:

```markdown
| 5 — Idle motion | ✅ | Replaced the plan's decay-twitch with an imperative `skullMotion` controller (look-around + jaw talk) when idle. See `docs/superpowers/specs/2026-04-11-skull-idle-motion-design.md` and `docs/superpowers/plans/2026-04-11-skull-idle-motion.md`. Glitch bursts unchanged. `uDecayLevel` / `vDisplace` removed from shader pipeline. |
```

Then find the "Where we left off" section at the bottom and replace its body with:

```markdown
Ready to start **Phase 6 — HUD**. Plan Task 18 adds DOM overlay structure
and CSS, Tasks 19-20 wire up edge-reveal and the first reveal animation.

Phase 5 (idle motion rework) is complete. The rework plan
`docs/superpowers/plans/2026-04-11-skull-idle-motion.md` is a standalone
document — resume from Phase 6 in the master plan
`docs/superpowers/plans/2026-04-11-skull-site.md`.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-04-11-skull-site.md docs/superpowers/RESUME.md
git commit -m "docs: mark Phase 5 idle rework complete, point to new spec/plan"
```

