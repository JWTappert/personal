# Resume Point — 2026-04-11

Checkpoint after Phase 6. Written before clearing session context so a fresh
session can pick up without re-reading every commit.

## Project

Personal website rewrite: one-page interactive 3D skull built on Astro +
vanilla Three.js, deploying to Cloudflare Pages. Replacing an old Next.js site.

- **Spec:** `docs/superpowers/specs/2026-04-11-skull-site-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-11-skull-site.md` (39 tasks in 12 phases)
- **Branch:** `skull-rewrite` (47 commits ahead of `master`)
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
| 6 — HUD | ✅ | `src/skull/hud.ts` + DOM/CSS in `src/pages/index.astro`. Edge-proximity fade reveal with stub provider supplying corner text. HUD color tracks skull color via `--hud-rgb` CSS variable updated from click handler. Email link (`mailto:oriole-quod0p@icloud.com`) in bottom-right for mobile thumb reach. |
| 7 — Puzzle (TDD) | ⏭ **NEXT** | Acrostic + click combo. Plan tasks 21-29. Only phase with strict TDD. |
| 8 — Glitch hint flash | ⏳ | Plan task 30. |
| 9 — Mobile touch | ⏳ | Plan tasks 31-32. |
| 10 — Fallbacks | ⏳ | Plan tasks 33-34. |
| 11 — Deploy | ⏳ | Plan tasks 35-39. |

## Deviations from the plan (important for later phases)

Phases 3 and 4 iterated heavily during implementation. The plan's code snippets
for those phases no longer match the actual code. When running future tasks,
read the current source files rather than the plan's code blocks for context.

### Post-FX system (Phase 3)

- **Multi-slot glitch composer** — `postfx.ts` has 3 `ShaderPass` instances
  (`GLITCH_SLOT_COUNT = 3`), not one. Public API is `setSlot(slot, inst)` /
  `getSlot(slot)` / `setUnlocked(flag)`.
- **`GlitchInstance` type** exported from `postfx.ts`:
  ```ts
  { variant: 0|1|2, intensity, regionCenter, regionHeight, jitter }
  ```
- **Burst scheduler** in `skull.ts` uses a `BurstSlot` class with
  parameterized `BurstSlotOptions`. Three slots are configured:
  - `ambientBurst` — rare (25-55s gap), long (350-600ms), low peak (0.15-0.28), full-screen
  - `burstA` — 7-16s gap, 100-220ms, peak 0.5-1.0, regional
  - `burstB` — 12-28s gap, 100-220ms, peak 0.5-1.0, regional
- **Shader `glitch.frag`** has extra uniforms the plan didn't list:
  `uRegionCenter`, `uRegionHeight`, `uJitter`. The glitch effect is masked
  spatially (vertical band + sometimes horizontal sub-region).

### Interaction reactions (Phase 4)

The plan's interactions (cursor parallax / scroll deconstruction / click pulse)
were replaced with different behaviors based on user feedback:

- **Cursor** — Lazy eye tracking. The skull drifts to face the cursor over a
  ~2.8s time constant with a sine wobble ("distracted"). No more `rotation.y +=
  0.003` constant auto-rotate.
- **Scroll** — Hinges the jaw open/closed. `scene.jawPivot.rotation.x = scroll * 0.55`
  (max ~32°). Palette shift and dissolve from the plan's fragment shader are
  gone. `uScroll` uniform is REMOVED — do not re-add.
- **Click** — Expanding bright ring emanating from the click point
  (`uRingEffect` + `uClickPoint` uniforms, decays ~1s). Clicks also cycle
  `uBaseColor` through a neon palette (persistent, not transitional):
  `[cyan, acid green, amber, magenta, red, electric blue]`. Picks a new color
  different from current each click. Jaw clicks also add a transient bonus to
  the jaw hinge (`jawClickBonus`).
- **Jaw hinge** — `scene.ts` wraps the jaw mesh in a `jawPivot: THREE.Group`
  positioned at the bounding-box top-rear corner, so rotation around `x` hinges
  naturally. The old `jawRestPosition` is removed.
- **uClickPulse uniform** — REMOVED. Do not re-add. `skull.vert` no longer
  uses it.

### Current shader uniform list (`SkullUniforms` in `material.ts`)

```ts
uTime, uNoiseSeed,                            // standard
uClickPoint (Vector3), uRingEffect (float),   // click ring
uBaseColor (Color),                           // persistent click color
uCursor (Vector2), uUnlocked (boolean)
```

Note: `uDecayLevel` was removed in the Phase 5 rework along with the
`vDisplace` varying and the twitch vertex displacement. Do not re-add.

### Idle motion rework (Phase 5)

- `src/skull/skullMotion.ts` owns the skull's yaw/pitch look target and
  the exponential-lerp rotation update (tau=2.8s). API:
  `lookAt(x, y)`, `setJawOffset(radians)`, `getJawOffset()`, `tick(dt)`.
  It writes to `scene.skull.rotation` only — jaw composition stays in
  `skull.ts`.
- `src/skull/idle.ts` was expanded. New signature:
  `createIdleBehavior(bus, skullMotion)`. Returns `{tick, isActive, getGlitchBurst}`
  (note: `getDecayLevel` was removed). Internally tracks `idleness` (0-1)
  and runs look-around + talk schedulers when `idleness > 0.4`.
- Talk scheduler: ~20% stressed pulses (higher amp/longer duration),
  variable envelope shape exponent, mixed rest durations (tight/comma/
  hesitation). Phrase lengths mix short interjections, normal 3-7 pulse
  sentences, and occasional ramblings. All numbers live inline in
  `idle.ts` — tune there.
- Spec: `docs/superpowers/specs/2026-04-11-skull-idle-motion-design.md`
- Plan: `docs/superpowers/plans/2026-04-11-skull-idle-motion.md`

### HUD (Phase 6)

- `src/skull/hud.ts` — `createHud(root, bus, provider)`, ticked from
  `skull.ts` frame loop after `composer.render()`. Drives root opacity
  from `bus.getCursor().edgeProximity` (falls off in the middle of the
  screen, fades in near edges). Updates corner text from the provider
  every frame (no throttle).
- `PuzzleLinesProvider` interface accepted by `createHud`. Currently
  satisfied by a stub provider in `skull.ts`. Phase 7 replaces the
  stub with the real puzzle module.
- HUD color tracks the skull color via CSS variable:
  `:root { --hud-rgb: 0 255 200 }`. On each click, `skull.ts` writes
  space-separated RGB components into this variable from
  `uniforms.uBaseColor.value`. CSS uses `rgb(var(--hud-rgb))` and
  `rgb(var(--hud-rgb) / alpha)` for color/shadow/border, with
  `transition: color 400ms linear` for smooth swaps.
- Top corners at `top: 32px`, bottom corners at `bottom: 32px` — they
  mirror each other around the top/bottom bars (each bar is 24px tall).
- Bottom bar has `justify-content: flex-end` so the email link sits
  in the bottom-right (mobile thumb reach).
- Mobile caveat: touch devices have no hover, so `edgeProximity` stays
  0 until the user taps. Phase 9 (Mobile touch) will need to handle
  this — probably: always-visible HUD on touch or reveal-on-first-tap.

### Current scene handle (`SceneHandle` in `scene.ts`)

Additions beyond the plan:
```ts
jaw: THREE.Mesh | null
head: THREE.Mesh | null
jawPivot: THREE.Group | null  // rotate this for hinge animation
```

The OBJ jaw/head identification uses bounding-box Y-center (jaw has lower Y).

## How to resume

1. Read this file first
2. Read `docs/superpowers/plans/2026-04-11-skull-site.md` for the task list (Phase 5 onward)
3. Read the current source files before adapting plan code — don't trust the
   plan's code blocks for files that have been modified by Phases 3 and 4
4. User has `npm run dev` running on `http://localhost:4321` and checks
   visually. **Do NOT start or stop the dev server** (per user's global CLAUDE.md)
5. Use subagent-driven-development pattern: dispatch implementer per task, pause
   for visual verification at checkpoints
6. Commit at end of every task with conventional commit messages

## Where we left off

Ready to start **Phase 7 — Puzzle (TDD)**. Plan Tasks 21-29 in
`docs/superpowers/plans/2026-04-11-skull-site.md`. This is the ONLY
phase that uses strict TDD — pin behavior in Vitest before coding.

The puzzle module will replace the stub `PuzzleLinesProvider` currently
wired into `skull.ts` (lines ~119-127). The real module supplies the
HUD corner lines (hiding an acrostic word) and, when the user enters
the correct click combo, calls `composer.setUnlocked(true)` and
`hud.setUnlocked(true)`.

High level: Task 21 sets up Vitest config, Task 22+ writes failing
tests for the acrostic line generator, then implementation, then the
click-combo state machine, then integration into `skull.ts`.
