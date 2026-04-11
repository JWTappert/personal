# Resume Point — 2026-04-11

Checkpoint after Phase 4. Written before clearing session context so a fresh
session can pick up without re-reading every commit.

## Project

Personal website rewrite: one-page interactive 3D skull built on Astro +
vanilla Three.js, deploying to Cloudflare Pages. Replacing an old Next.js site.

- **Spec:** `docs/superpowers/specs/2026-04-11-skull-site-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-11-skull-site.md` (39 tasks in 12 phases)
- **Branch:** `skull-rewrite` (31 commits ahead of `master`)
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
| 6 — HUD | ⏭ **NEXT** | DOM overlay with edge reveal. Plan tasks 18-20. |
| 7 — Puzzle (TDD) | ⏳ | Acrostic + click combo. Plan tasks 21-29. |
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
uTime, uNoiseSeed, uDecayLevel,  // standard
uClickPoint (Vector3), uRingEffect (float),  // click ring
uBaseColor (Color),  // persistent click color
uCursor (Vector2), uUnlocked (boolean)
```

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

Ready to start **Phase 6 — HUD**. Plan Task 18 adds DOM overlay structure
and CSS, Tasks 19-20 wire up edge-reveal and the first reveal animation.

Phase 5 (idle motion rework) is complete. The rework plan
`docs/superpowers/plans/2026-04-11-skull-idle-motion.md` is a standalone
document — resume from Phase 6 in the master plan
`docs/superpowers/plans/2026-04-11-skull-site.md`.
