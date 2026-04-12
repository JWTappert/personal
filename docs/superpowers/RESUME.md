# Resume Point — 2026-04-11

Checkpoint after Phase 9. Written before clearing session context so a fresh
session can pick up without re-reading every commit.

## Project

Personal website rewrite: one-page interactive 3D skull built on Astro +
vanilla Three.js, deploying to Cloudflare Pages. Replacing an old Next.js site.

- **Spec:** `docs/superpowers/specs/2026-04-11-skull-site-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-11-skull-site.md` (39 tasks in 12 phases)
- **Branch:** `skull-rewrite` (62 commits ahead of `master`)
- **Working dir:** `C:\Users\tappe\Workspace\personal` (Windows, Git Bash)

## Progress

| Phase | Status | Notes |
|---|---|---|
| 0 — Scaffold | ✅ | Astro + Three + Vitest installed |
| 1 — Minimal scene | ✅ | OBJ loads, skull renders |
| 2 — Custom shader material | ✅ | ShaderMaterial with fresnel + scanlines |
| 3 — Post-FX | ✅ | Multi-slot glitch composer, deviates from plan — see below |
| 4 — Interactions | ✅ | Heavily iterated, deviates from plan — see below |
| 5 — Idle motion | ✅ | Replaced the plan's decay-twitch with an imperative `skullMotion` controller (look-around + jaw talk) when idle. See `docs/superpowers/specs/2026-04-11-skull-idle-motion-design.md` and `docs/superpowers/plans/2026-04-11-skull-idle-motion.md`. Glitch bursts unchanged. `uDecayLevel` / `vDisplace` removed from shader pipeline. |
| 6 — HUD | ✅ | `src/skull/hud.ts` + DOM/CSS in `src/pages/index.astro`. HUD color tracks skull color via `--hud-rgb` CSS variable. Always-visible (edge-reveal mechanic from the plan was iterated out). Email link in bottom-right for mobile thumb reach. |
| 7 — Puzzle (TDD) | ✅ | `puzzle-internals.ts` (acrostic pool, sequence detector, hint formatter) with 11 vitest tests. `puzzle.ts` public module. Per-corner independent message pools; BL scrolls the acrostic; BR has reactive `{state}` / `{latch}` placeholders. |
| 8 — Glitch hint flash | ✅ | `#hint-flash` overlay + `flashHint` method on HudHandle. Fires on idle burst rising edge when not unlocked. Positioned at `top: 75%` below the skull. |
| 9 — Mobile touch | ✅ | Task 31 only — touch-drag orbit replaces cursor parallax. Task 32 (sustained-touch HUD reveal) skipped because the HUD is already always-visible. Tap-to-click already worked via native `click` event. See deviations below. |
| 10 — Fallbacks | ⏭ **NEXT** | Plan tasks 33-34. WebGL fallback + prefers-reduced-motion. |
| 11 — Deploy | ⏳ | Plan tasks 35-39. Cloudflare Pages. |

## Deviations from the plan (important for later phases)

Phases 3, 4, 5, 6, 7, and 8 iterated during implementation. The plan's code
snippets for most phases no longer match the actual code. When running future
tasks, **read the current source files** rather than the plan's code blocks.
In particular, watch for two stale patterns the plan repeatedly uses:
- **`performance.now()`-scale constants (like `LINE_ROTATE_MS = 3500`) paired
  with `scene.getTime()` values** — `scene.getTime()` returns SECONDS, not
  milliseconds. Any constant labeled `_MS` that gets divided by `scene.getTime()`
  output is a latent bug. We've fixed two of these so far; watch for more.
- **Stale uniform / method references** — e.g. `uDecayLevel`, `uClickPulse`,
  `uScroll`, `composer.setGlitch(...)` — all removed during iteration.

### Post-FX system (Phase 3)

- **Multi-slot glitch composer** — `postfx.ts` has FOUR `ShaderPass` instances
  (`GLITCH_SLOT_COUNT = 4`). Public API is `setSlot(slot, inst)` /
  `getSlot(slot)` / `setUnlocked(flag)`.
- **`GlitchInstance` type** exported from `postfx.ts`:
  ```ts
  { variant: 0|1|2, intensity, regionCenter, regionHeight, jitter }
  ```
- **Burst scheduler** in `skull.ts` uses a `BurstSlot` class with
  parameterized `BurstSlotOptions`. Three of the four slots run burst
  scheduling; the fourth (slot 3) is dedicated to `idle.getGlitchBurst()`.
  - `ambientBurst` (slot 0) — rare (25-55s gap), long (350-600ms), low peak, full-screen
  - `burstA` (slot 1) — 7-16s gap, 100-220ms, peak 0.5-1.0, regional
  - `burstB` (slot 2) — 12-28s gap, 100-220ms, peak 0.5-1.0, regional
  - `idleGlitchInst` (slot 3) — intensity = `idle.getGlitchBurst()`; variant
    and region randomized on rising edge of burst. Also triggers `hud.flashHint`
    on the same rising edge (Phase 8).
- **Shader `glitch.frag`** has extra uniforms the plan didn't list:
  `uRegionCenter`, `uRegionHeight`, `uJitter`. The glitch effect is masked
  spatially (vertical band + sometimes horizontal sub-region).
- `postfx.ts` uses `THREE.Timer` (not `Clock`); call `timer.update()` before
  `timer.getElapsed()`.

### Interaction reactions (Phase 4)

The plan's interactions (cursor parallax / scroll deconstruction / click pulse)
were replaced with different behaviors based on user feedback:

- **Cursor** — Target is computed as cursor+wobble and fed to
  `skullMotion.lookAt(yaw, pitch)` when `!idle.isActive()`. Lazy-eye lerp lives
  inside `skullMotion.tick`. No constant auto-rotate.
- **Scroll** — Hinges the jaw open/closed. `scene.jawPivot.rotation.x` is
  composed in `skull.ts` from `scrollAngle + jawClickBonus * 0.25 +
  skullMotion.getJawOffset()`, clamped to `min(0.8, ...)`. `uScroll` uniform
  is REMOVED — do not re-add.
- **Click** — Expanding bright ring emanating from the click point
  (`uRingEffect` + `uClickPoint` uniforms, decays ~1s). Clicks also cycle
  `uBaseColor` through a neon palette (persistent, not transitional):
  `[cyan, acid green, amber, magenta, red, electric blue]`. Click handler
  ALSO updates the `--hud-rgb` CSS variable from uBaseColor RGB. After the
  puzzle is unlocked, the click handler **skips the color cycle** (early
  return on `puzzle.isUnlocked()`) because the shader forces red regardless
  of uBaseColor, and continuing to update `--hud-rgb` would desync HUD from
  skull. Jaw clicks also add a transient bonus to the jaw hinge.
- **Jaw hinge** — `scene.ts` wraps the jaw mesh in a `jawPivot: THREE.Group`
  positioned at the bounding-box top-rear corner, so rotation around `x`
  hinges naturally.
- **uClickPulse uniform** — REMOVED. Do not re-add.

### Current shader uniform list (`SkullUniforms` in `material.ts`)

```ts
uTime, uNoiseSeed,                            // standard
uClickPoint (Vector3), uRingEffect (float),   // click ring
uBaseColor (Color),                           // persistent click color
uCursor (Vector2), uUnlocked (boolean)
```

The frag shader has `vec3 base = uUnlocked ? vec3(1.0, 0.1, 0.2) : uBaseColor;`
so when `uUnlocked` is true, the skull renders hardcoded red regardless of
`uBaseColor`. The `onUnlock` callback in `skull.ts` mirrors this into
`--hud-rgb: 255 25 51` so the HUD matches.

Note: `uDecayLevel` was removed in the Phase 5 rework along with the
`vDisplace` varying and the twitch vertex displacement. Do not re-add.

### Idle motion rework (Phase 5)

- `src/skull/skullMotion.ts` owns the skull's yaw/pitch look target and
  the exponential-lerp rotation update (tau=2.8s). API:
  `lookAt(x, y)`, `setJawOffset(radians)`, `getJawOffset()`,
  `triggerShake()`, `tick(dt)`.
  Writes to `scene.skull.rotation` only — jaw composition stays in `skull.ts`.
- Internal state: `yaw` and `pitch` are the source of truth for smoothed
  orientation (NOT `scene.skull.rotation` directly). Each tick, they lerp
  toward targets and then get pushed to `scene.skull.rotation.y/x` along
  with any active shake offset. This lets the shake overlay modulate the
  final rotation without corrupting the lerp integrator.
- `triggerShake()` kicks off a damped head-shake: 600ms, 2.5 full sine
  cycles, 0.35 rad peak amplitude, linear amplitude decay. Used in
  `skull.ts` as "wrong click" feedback when puzzle progress drops.
- `src/skull/idle.ts` takes `(bus, skullMotion)`. Returns `{tick, isActive,
  getGlitchBurst}`. Tracks `idleness` (0-1) that ramps up after 1s of no
  input. Runs look-around + talk schedulers when `idleness > 0.4`.
- Talk scheduler: ~20% stressed pulses (higher amp/longer duration),
  variable envelope shape exponent, mixed rest durations. All numbers live
  inline in `idle.ts` — tune there.
- Spec: `docs/superpowers/specs/2026-04-11-skull-idle-motion-design.md`
- Plan: `docs/superpowers/plans/2026-04-11-skull-idle-motion.md`

### HUD (Phase 6) and puzzle wiring (Phase 7)

- `src/skull/hud.ts` — `createHud(root, bus, provider): HudHandle` ticked
  from `skull.ts` frame loop after `composer.render()`. HUD is **always
  visible** (no opacity logic; the edge-reveal mechanic from the plan was
  dropped during iteration). `tick()` writes four corner `textContent`
  strings every frame. The BR corner is FROZEN from provider updates once
  `setUnlocked(true)` has been called, so the "well played." text sticks.
- `HudHandle` API: `tick(t)`, `setUnlocked(flag)`, `flashHint(text)`.
- `createHud` still takes `bus` as a parameter but doesn't currently read it
  (unused parameter). Don't remove without checking later phases.
- **Color tracking** — `:root { --hud-rgb: 0 255 200 }` in CSS. On each click,
  `skull.ts` writes space-separated RGB components into `--hud-rgb` from
  `uniforms.uBaseColor.value`. CSS uses `rgb(var(--hud-rgb))` and
  `rgb(var(--hud-rgb) / alpha)` throughout. **NO CSS transitions** on color/
  shadow/border — they were removed because the skull snaps instantly and
  any smoothing on the HUD side visibly lags the skull for 400ms.
- **Corner layout**: Top corners at `top: 32px`, bottom corners at
  `bottom: 32px` — mirror each other around the top/bottom bars (each bar
  is 24px tall). Bottom bar has `justify-content: flex-end` so the `email`
  link sits in the bottom-right (mobile thumb reach — per Phase 9 prep).
  Email: `mailto:oriole-quod0p@icloud.com` (Apple Hide My Email alias).

### Puzzle (Phase 7)

- `src/skull/puzzle-internals.ts` is the TDD-covered pure module. Exports:
  - `buildAcrosticPool(word)` — 12-line pool where a sliding window spells
    the word in first letters, surrounded by filler lines
  - `SequenceDetector` class — `push(target)` / `isUnlocked()` /
    `onUnlock(cb)` / `getProgress()`. Unlock check uses a buffer-based
    window match; `getProgress()` uses a parallel strict-streak counter
    (resets to 0 on any wrong click except when that click matches
    `secret[0]`, in which case it resets to 1).
  - `formatGlitchHint(sequence)` — maps click targets to glyphs:
    `leftEye='◉', rightEye='○', jaw='▼', head='△'`; unknown → `'?'`.
  - Tests: `tests/puzzle-acrostic.test.ts` (2), `tests/puzzle-sequence.test.ts` (7),
    `tests/puzzle-hint.test.ts` (2) = 11 passing tests total.
- `src/skull/puzzle.ts` is the public composition module. Signature:
  `createPuzzle(bus, idle): PuzzleHandle`. It takes an `IdleHandle` so it
  can resolve the `{state}` placeholder in the BR HUD pool.
- `PuzzleHandle` API: `getHudLines(t)`, `getGlitchHint()`, `isUnlocked()`,
  `onUnlock(cb)`.
- **Per-corner independent pools** (replaces the plan's shared acrostic
  sliding window). Each corner rotates at its own interval so the four
  corners don't realign in lockstep:
  - TL (every 4.2s): boot/init telemetry (`SYS_/CRANIUM.v2` static header
    on line 1, rotating line 2)
  - TR (every 3.1s): telemetry / coords (`42.5°N -123.8°W` header on line 1)
  - BL (every 3.5s): scrolls the 12-line `buildAcrosticPool('NOTICED')`
    output — this is where the acrostic easter egg lives
  - BR (every 2.8s): hardware/runtime pool with two reactive placeholders:
    `{state}` → `'-- IDLE --'` / `'-- ACTIVE --'` based on `idle.isActive()`
    `{latch}` → `'LATCH X/5'` showing current `detector.getProgress()`
- Rotation intervals are mutually prime-ish (4.2 / 3.1 / 2.8 / 3.5 seconds).
- **Constants in seconds**: `LINE_ROTATE_S`, interval constants — all
  seconds-scale because `scene.getTime()` returns seconds.
- Secret: `SECRET_SEQUENCE = ['leftEye', 'rightEye', 'jaw', 'rightEye', 'leftEye']`
  (5 clicks). Progress display is `LATCH X/5`.
- `PuzzleHandle` exposes `getProgress()` in addition to the other methods —
  `skull.ts` reads it in the click handler to detect progress resets and
  trigger `skullMotion.triggerShake()` as "wrong click" feedback.
- Unlock side-effects (in `skull.ts` onUnlock callback):
  - `composer.setUnlocked(true)` — disables glitch passes
  - `hud.setUnlocked(true)` — writes sticky "well played." into BR
  - `uniforms.uUnlocked.value = true` — shader branches to red
  - `document.documentElement.style.setProperty('--hud-rgb', '255 25 51')`
    — HUD matches shader red

### Mobile touch (Phase 9)

- **`skullMotion.ts`** exposes `getYaw()` / `getPitch()` returning the internal
  smoothed orientation (NOT `scene.skull.rotation`, NOT the targets). These
  exist so the touch-drag handler can seed from the current visual position
  and avoid a snap-to-zero on every drag start.
- **`interactions.ts`** takes an optional 3rd arg
  `getCurrentLook?: () => { yaw: number; pitch: number }` (default `() => ({yaw:0, pitch:0})`).
  `skull.ts` passes `() => ({ yaw: skullMotion.getYaw(), pitch: skullMotion.getPitch() })`.
  Because of this, **`skullMotion` must be created before `bus`** in `skull.ts`
  `boot()` — the original ordering had `bus` first and was swapped.
- New bus methods: `getOrbit()`, `isDragging()`, `isTouch()`. The
  `InteractionBus` interface declares all three.
- Touch state in the `createInteractions` closure:
  - `orbit = { x, y }` — current yaw/pitch target driven by drag
  - `hadTouchInput` — one-way latch flipped on the first touch `pointerdown`,
    never reset (intentionally — `isTouch()` reflects "this session has had
    touch", not realtime device capability). On hybrid devices the cursor
    `position.x` parallax stays disabled after the first touch.
  - `dragging` flag, `dragStartClientX/Y/Yaw/Pitch` anchors
- Drag math uses **anchored deltas** — `orbit.x = dragStartYaw + dx * SENSITIVITY`,
  not incremental. Tuning constants are at module top:
  ```ts
  TOUCH_YAW_SENSITIVITY = 2.0    // full canvas-width drag → 2 rad
  TOUCH_PITCH_SENSITIVITY = 1.5  // full canvas-height drag → 1.5 rad
  TOUCH_PITCH_CLAMP = 0.6        // ~±34° pitch limit, yaw unbounded
  ```
- `onPointerMove` has an early-return touch-drag branch at the top so it does
  NOT also fall through to the cursor ndc + `emit('pointer')` path during a
  drag — that would feed a stale ndc into the lazy-eye target and fight the
  orbit override.
- `onPointerUp` is wired to both `pointerup` AND `pointercancel` so OS-level
  interruptions (notification shade, multitask gesture) can't leave `dragging`
  stuck `true`.
- **`skull.ts` frame loop** branches:
  ```ts
  if (bus.isDragging()) {
    skullMotion.lookAt(orbit.x, orbit.y);
  } else if (!idle.isActive()) {
    // existing cursor lazy-eye + wobble path, unchanged
  }
  // (else: idle scheduler is driving skullMotion, leave alone)
  scene.skull.position.x = bus.isTouch() ? 0 : cursorState.x * 0.15;
  ```
- **Known gap:** `wheel` doesn't fire on touch, so the scroll-driven jaw
  hinge is dead on mobile. Not addressed in Phase 9 — would require a custom
  two-finger or pinch gesture and was out of scope for parity.
- **Idle behavior on touch:** `idle.isActive()` ramps active after ~1s with
  no input, so the look-around + talk scheduler runs immediately on page
  load on a phone. The `-- IDLE --` HUD line therefore shows almost
  permanently. Considered acceptable.

### Glitch hint flash (Phase 8)

- `<div id="hint-flash">` overlay at `top: 75%` (below the skull) with
  `mix-blend-mode: screen` and `rgb(var(--hud-rgb))` color (tracks skull).
- `.flash` CSS class runs a 120ms keyframe animation (`opacity 0→0.9→0`).
- `hud.flashHint(text)` sets `textContent`, removes `.flash`, forces reflow
  via `void flashEl.offsetWidth`, then re-adds `.flash` so repeat calls
  restart the animation.
- Triggered from `skull.ts` frame loop inside the existing `prevIdleBurst
  <= 0 && idleBurst > 0` rising-edge block, gated on `!puzzle.isUnlocked()`.
  Call: `hud.flashHint(puzzle.getGlitchHint())`.
- The flash is a subtle hint: it fires only during idle glitch bursts
  (which themselves only happen after ~3s of no input), so the player has
  to sit still to see it.

### Current scene handle (`SceneHandle` in `scene.ts`)

Additions beyond the plan:
```ts
jaw: THREE.Mesh | null
head: THREE.Mesh | null
jawPivot: THREE.Group | null  // rotate this for hinge animation
```

The OBJ jaw/head identification uses bounding-box Y-center (jaw has lower Y).

`scene.ts` uses `THREE.Timer` (not `Clock`); `getTime()` calls
`timer.update()` before returning `timer.getElapsed()`.

## How to resume

1. Read this file first
2. Read `docs/superpowers/plans/2026-04-11-skull-site.md` for the task list
   (Phase 10 onward)
3. **Read current source files before adapting plan code** — the plan's code
   blocks for Phases 3-9 are mostly stale. Trust the code, not the plan.
4. User has `npm run dev` running on `http://localhost:4321` and checks
   visually. **Do NOT start or stop the dev server** (per user's global CLAUDE.md)
5. Use subagent-driven-development pattern: dispatch implementer per task,
   pause for visual verification at checkpoints
6. Commit at end of every task with conventional commit messages

## Where we left off

Ready to start **Phase 10 — Fallbacks**. Plan Tasks 33-34 in
`docs/superpowers/plans/2026-04-11-skull-site.md`.

### What Phase 10 needs to deliver

Per the plan:
- **Task 33** — WebGL-not-available static fallback. Add a `<div id="nogl">`
  in `index.astro` and have `skull.ts` show it (and hide the canvas) when
  `'WebGLRenderingContext' in window` is false. Currently `skull.ts` just
  silently `return`s on missing WebGL — anyone without WebGL sees a black
  page with no explanation.
- **Task 34** — OBJ load failure fallback. Already implemented in
  `scene.ts` (try/catch with an icosahedron stand-in). Plan says: rename
  `public/models/skull.obj` temporarily, reload, confirm the icosahedron
  appears, then rename back. **No code change** — just a manual
  verification step the user has to perform.

The plan doesn't have an explicit `prefers-reduced-motion` task, but it
would be reasonable to add: gate the burst scheduler and the idle scheduler
behind `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and
show only the static skull. Worth raising before starting Phase 10.

### Gotchas to watch for in Phase 10

- `skull.ts:106` is the current early return: `if (!('WebGLRenderingContext' in window)) return;`.
  Replace with the show-fallback / hide-canvas branch from the plan.
- The plan's `<div id="nogl">` has a duplicated `display:none` style — the
  comment in the plan says it's intentional (CSS sets none, JS overrides
  to flex). Verify this still works as written or simplify.
- For Task 34, **do the rename test on a saved working tree** — don't
  forget to rename back. A `git status` after restoration is wise.

### Commits so far on `skull-rewrite` (62 ahead of master)

Roughly: scaffold → scene → material → postfx iteration → interactions
iteration → idle motion rework → HUD → puzzle TDD → per-corner pools →
sync fixes → Timer migration → hint flash → reactive BR polish → shake on
puzzle reset → touch-drag orbit → tuning constants rename → this
checkpoint. `git log --oneline master..HEAD` for the full picture.
