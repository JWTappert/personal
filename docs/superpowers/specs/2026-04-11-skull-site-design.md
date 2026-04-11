# Skull Site — Design Spec

**Date:** 2026-04-11
**Status:** Approved design, pending implementation plan
**Scope:** Complete rewrite of personal site at repo `personal`. Strip all existing pages, routes, and data sources. Rebuild as a single interactive art page.

---

## Goal

Replace the current Next.js personal site with a single-page interactive 3D skull, built with Astro + Three.js and deployed to Cloudflare Pages. The site is positioned as a demonstration of craft in graphics, interaction design, and generative systems — not a traditional CV. There is no blog, no about page, no routing. One URL, one experience.

## Non-goals

- No CMS, no content management, no authoring flow
- No blog, no posts, no résumé page
- No server runtime — static output only
- No user accounts, no persistence between sessions
- No analytics in v1
- No migration of existing content (Contentful data, blog posts, jobs) — the old site is abandoned, not ported

---

## Aesthetic direction

**Cyberpunk terminal.** Pitch-black background, neon wireframe skull (cyan as the base accent), scanline overlay, soft bloom. The skull lives inside an implied CRT monitor. Monospace type for any chrome. Nothing warm, nothing decorative — sparse, technical, confident.

## Experience overview

A visitor lands on the site and sees a neon wireframe skull centered in a dark viewport. Nothing else is visible. As they move their cursor, the skull subtly tracks them via parallax. If they scroll, the skull deconstructs into floating fragments, reassembling when they scroll back up. Clicking detonates the skull into particles that reform after a beat. If they sit idle, the skull begins to slowly corrode with glitch bursts — twitching vertices, scanline tears, RGB split.

If they move their cursor toward any screen edge, a thin monospace HUD fades in, showing atmospheric system-status readouts, coordinates, and discreet LinkedIn + email links. Fading away when the cursor retreats from the edge.

Hidden in the HUD and glitch frames is a three-layer easter egg: an acrostic in the rotating status lines hints that something is hidden, glitch bursts occasionally flash a click-sequence instruction, and clicking the correct skull parts in order unlocks a new visual state and a "well played." acknowledgment.

Each visit is visually distinct: the glitch style (RGB split vs datamosh vs scanline tear) and the procedural surface noise seed are randomized per session.

## Feature list

| Feature | Description |
|---|---|
| Neon wireframe skull | Reuse existing `public/models/skull.obj`, render with custom shader material |
| Cursor magnetism | Parallax response to cursor position, subtle |
| Scroll deconstruction | Scroll progress pulls skull apart into fragments; reassembles on scroll up |
| Click detonation | Click on skull → particle explosion → reform after ~1.2s |
| Idle decay | After ~4s of no input, slow corrosion begins; resets on any input |
| Edge-reveal HUD | DOM overlay with corner readouts + links, visible only when cursor nears viewport edges |
| Session variability | Glitch style and shader noise seed randomized per page load |
| Three-layer easter egg | Acrostic hook → glitch-frame instructions → click-combo trigger → unlocked state |
| Mobile parity | Drag to rotate, tap to detonate, sustained touch at edge reveals HUD, tap-hold interactions |
| Fallbacks | Primitive mesh if OBJ fails; static SVG if WebGL missing |

## The easter egg in detail

Three layers of discovery, one single unlock action.

1. **The acrostic hook.** The HUD cycles through a pool of fake system-status lines. A rotating window of N consecutive lines (where N = the length of the hidden word) has their first letters spelling the word. A curious visitor who reads enough status lines sees a pattern. Candidate word: `NOTICED` (7 letters), TBD at implementation.
2. **The glitch instructions.** During random glitch bursts, a single frame flashes a click-sequence hint using symbols like `◉ ○ ▼ ○ ◉` — where `◉` = left eye socket, `○` = right eye socket, `▼` = jaw. The burst is too fast to read at full speed, but repeated glitches over a session (or a screenshot) let a determined visitor piece it together.
3. **The click trigger.** Clicking the specified skull parts in the correct order (detected via raycaster against labeled submeshes) fires the unlock event. Wrong clicks reset the buffer.

**Unlock reveal:**
- Visual: the skull enters a secondary material state — proposal: wireframe color shifts from cyan to deep red, a subtle particle ring orbits the skull, glitch bursts stop permanently.
- Text: a single line of small monospace text fades in briefly: `well played.`
- State: `unlocked` persists for the session only. Refresh resets it.

## Architecture

### Top level

Single Astro page at `src/pages/index.astro`. Minimal static HTML shell:

- `<html>` with black background, system-UI + monospace fonts, no visible content
- `<canvas id="skull-canvas">` filling viewport
- `<div id="hud">` DOM overlay for edge-reveal chrome, opacity 0 by default
- One `<script>` tag importing `src/skull/skull.ts` — Astro bundles it automatically via Vite into a hashed module that runs on page load

Astro is used only for the build pipeline (TypeScript, Vite HMR, asset fingerprinting, static output). No SSR data, no routing, no APIs.

**Build and deploy:** `astro build` produces static HTML + one JS bundle + `skull.obj` + shader files in `dist/`. Deploys to Cloudflare Pages.

### Modules (`src/skull/`)

Eight focused modules. Each has one job, a small public API, and clear dependencies.

#### `scene.ts` — 3D foundation

**Job:** Own the Three.js renderer, camera, scene graph, and skull mesh.

**Public API:**
```ts
createScene(canvas: HTMLCanvasElement): SceneHandle
SceneHandle = {
  render(): void
  resize(): void
  skull: THREE.Group        // contains labeled head + jaw submeshes
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  getTime(): number
}
```

**Responsibilities:** Load `skull.obj` via `OBJLoader`, build a `THREE.Group` containing head + jaw meshes with labeled `userData` (`leftEye`, `rightEye`, `jaw`, `head`) for raycasting, assign the shader material, set up perspective camera at fixed distance, handle viewport resize. No animation loop here — that's owned by the composition root.

**Dependencies:** `three`, `three/examples/jsm/loaders/OBJLoader`.

**Note on labeled submeshes:** the current OBJ has two children (head + jaw). Eye socket targeting for the puzzle is done via raycast hit position within the head bounds — left half vs right half of the head's local X axis. No mesh surgery required.

#### `shaders/` — Custom GLSL

**Job:** Hold vertex and fragment shaders as `.glsl` files. Imported via Vite's `?raw` suffix so TS stays clean.

**Files:**
- `skull.vert` — vertex displacement driven by 3D noise + idle-decay amplitude uniform
- `skull.frag` — base neon color, fresnel rim glow, scanline overlay, noise-seeded surface pattern, optional unlocked color override
- `glitch.frag` — full-screen post-process; one shader with a branch on `uGlitchVariant` uniform (0 = RGB split, 1 = datamosh blocks, 2 = scanline tear)

**Uniforms exposed to the pipeline:**
| Uniform | Type | Owner | Purpose |
|---|---|---|---|
| `uTime` | float | scene clock | animation time base |
| `uNoiseSeed` | float | session const | procedural surface variation |
| `uGlitchVariant` | int | session const | which glitch style this session uses |
| `uGlitchIntensity` | float | idle + puzzle | how hard the glitch is right now |
| `uDecayLevel` | float | idle.ts | idle decay ramp 0..1 |
| `uCursor` | vec2 | interactions.ts | normalized cursor position -1..1 |
| `uScroll` | float | interactions.ts | scroll progress 0..1 |
| `uUnlocked` | bool | puzzle.ts | post-unlock visual state |

#### `postfx.ts` — Post-processing composer

**Job:** Wrap the scene render in an `EffectComposer` pipeline: render pass → glitch pass → subtle bloom → output.

**Public API:**
```ts
createComposer(scene: SceneHandle): ComposerHandle
ComposerHandle = {
  render(): void
  setGlitch(variant: 0|1|2, intensity: number): void
  setUnlocked(bool): void
}
```

**Responsibilities:** Glitch variant is chosen once at boot (`Math.floor(Math.random() * 3)`) and stays fixed for the session. Intensity is modulated per frame by idle decay and puzzle state. Bloom is tuned low so it enhances the neon glow without blurring the wireframe.

#### `interactions.ts` — Input layer

**Job:** Translate raw DOM events into a normalized event bus the rest of the code consumes. Abstracts away desktop vs mobile.

**Public API:**
```ts
createInteractions(canvas: HTMLCanvasElement, scene: SceneHandle): InteractionBus
InteractionBus = {
  on(event, handler): void
  off(event, handler): void
  getCursor(): { x: number, y: number, edgeProximity: number }
  getScroll(): number
}
```

**Events emitted:**
| Event | Payload | Fires on |
|---|---|---|
| `pointer` | `{x, y}` normalized -1..1 | mouse move, touch drag |
| `click` | `{ skullPart: 'leftEye'\|'rightEye'\|'jaw'\|'other' }` | mouse click / tap, raycasted |
| `scroll` | `{ delta, total }` | wheel, touch scroll |
| `edge` | `{ proximity: 0..1 }` | on pointer move, derived from distance to nearest edge |
| `key` | `{ char: string }` | keyboard (reserved for future use) |

**Mobile substitutes:**
- Pointer-drag on the canvas → camera orbit (replaces cursor magnetism)
- Single tap → click (with raycast)
- Sustained touch-at-edge (200ms+) → edge proximity (replaces cursor-at-edge)

#### `idle.ts` — Ambient decay behavior

**Job:** Track user idleness and ramp up a decay level that drives corrosion and periodic glitch bursts.

**Public API:**
```ts
createIdleBehavior(bus: InteractionBus): IdleHandle
IdleHandle = {
  tick(dt: number): void
  getDecayLevel(): number
  getGlitchBurst(): number  // 0..1, spikes during bursts
}
```

**Behavior curve:**
- On any input event, `decayLevel` drops to 0 over 200ms
- After 1s of no input, decay begins ramping linearly to 1.0 over 8s
- At decay > 0.3, periodic glitch bursts fire (spike `getGlitchBurst()` for ~150ms every 2–4s, randomized)
- At decay > 0.7, bursts get more frequent and intense

#### `puzzle.ts` — Easter egg logic

**Job:** Own the three-layer secret: acrostic generation, click-combo detection, unlock state.

**Public API:**
```ts
createPuzzle(bus: InteractionBus): PuzzleHandle
PuzzleHandle = {
  getHudLines(t: number): string[]       // current 4 HUD corner readouts
  getGlitchHint(): string                // symbol sequence for glitch-frame flash
  isUnlocked(): boolean
  onUnlock(cb: () => void): void
}
```

**Internals:**
- Maintains a pool of ~12 fake status lines. A rotating sub-window of N consecutive lines (N = length of the hidden word) has first letters spelling the word. The rotation is slow enough that a patient visitor will see the full spelling — approximately one line swap every 3–4 seconds.
- Hidden word: TBD at implementation, candidate `NOTICED` (7 letters). Implementation can choose the actual word; the spec only requires it be a real word ≤8 chars.
- Subscribes to `click` events; maintains a ring buffer of the last 5 click targets. On every new click, compares the buffer to the secret sequence. On match, fires `onUnlock()` once and locks `isUnlocked() = true` for the session.
- `getGlitchHint()` returns the symbol string (e.g., `◉ ○ ▼`) corresponding to the secret click sequence.

#### `hud.ts` — DOM overlay chrome

**Job:** Render the edge-reveal HUD using DOM + CSS, not Three.js text. Reads state, writes DOM.

**Public API:**
```ts
createHud(root: HTMLElement, bus: InteractionBus, puzzle: PuzzleHandle): HudHandle
HudHandle = {
  tick(t: number): void
  setUnlocked(bool): void
}
```

**DOM structure (hardcoded in `index.astro`):**
```html
<div id="hud" aria-hidden="true">
  <div class="hud-corner hud-tl"></div>
  <div class="hud-corner hud-tr"></div>
  <div class="hud-corner hud-bl"></div>
  <div class="hud-corner hud-br"></div>
  <div class="hud-bar hud-top"></div>
  <div class="hud-bar hud-bottom"></div>
</div>
```

**Responsibilities:**
- Each tick, read `bus.getCursor().edgeProximity` → set `#hud` opacity (0 at center, 1 at edge, with a smooth curve)
- Read `puzzle.getHudLines(t)` → write corner readouts. Lines include LinkedIn + email links (as real `<a>` tags), coordinates, fake system readouts, rotating status lines
- On `setUnlocked(true)`: swap one corner readout to `well played.`, elevate link visibility, stop the rotation

**Link placeholders:** LinkedIn URL and email are TBD — marked as constants at the top of `hud.ts` for easy replacement during implementation.

#### `skull.ts` — Composition root

**Job:** The only file the Astro island imports. Wire everything together, own the animation loop.

**Flow:**
```ts
const canvas = document.getElementById('skull-canvas') as HTMLCanvasElement
const hudEl  = document.getElementById('hud') as HTMLElement

const scene   = createScene(canvas)
const composer = createComposer(scene)
const bus     = createInteractions(canvas, scene)
const idle    = createIdleBehavior(bus)
const puzzle  = createPuzzle(bus)
const hud     = createHud(hudEl, bus, puzzle)

puzzle.onUnlock(() => {
  composer.setUnlocked(true)
  hud.setUnlocked(true)
})

let last = performance.now()
function frame(t: number) {
  const dt = (t - last) / 1000; last = t
  idle.tick(dt)
  updateUniforms(scene, composer, bus, idle, puzzle, t)
  composer.render()
  hud.tick(t)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

window.addEventListener('resize', () => scene.resize())
```

`updateUniforms()` is a small local function that reads from each module and writes to `scene.skull.material.uniforms` + composer uniforms. Single point of contact between interaction state and GPU state.

## Data flow

**Session state (set once at boot):**
- `glitchVariant: 0|1|2` — random per session, fed to `uGlitchVariant`
- `noiseSeed: number` — random per session, fed to `uNoiseSeed`
- `puzzleWord: string` — hardcoded at build time, baked into acrostic generation

**Live state (updated each frame):**
- `idleLevel` — owned by `idle.ts`
- `cursor` — owned by `interactions.ts`
- `scroll` — owned by `interactions.ts`
- `clickBuffer` — owned by `puzzle.ts`
- `unlocked` — owned by `puzzle.ts`

**No shared mutable state across modules.** Each module owns its slice, exposes read-only accessors, and `skull.ts` is the only place that reads from all of them to update uniforms.

**Event flow:**
```
DOM events
  → interactions.ts (normalized event bus)
      → idle.ts    (listens for any input; owns idleLevel)
      → puzzle.ts  (listens for clicks; owns unlocked)
      → hud.ts     (reads edge proximity; reads puzzle lines)
  → skull.ts frame loop (reads all of the above)
      → shader uniforms
          → GPU
              → pixels
```

## Error handling

Two failure modes are worth handling; everything else is best-effort.

1. **OBJ load failure** — if `skull.obj` doesn't load, fall back to rendering `IcosahedronGeometry` with the same shader material. Silent fallback, console warning. A glowing neon icosahedron is on-brand.
2. **WebGL not available** — check `!window.WebGLRenderingContext && !window.WebGL2RenderingContext` at boot. If absent, hide the canvas, show a static SVG skull placeholder, strip the HUD overlay. ~1% of visitors.

No try/catch around the animation loop. If a frame throws, the loop dies, the error lands in console. Better than silently spinning a black screen.

## Performance budget

- Target 60fps on a 2020-era MacBook Air; 30fps on a mid-tier Android phone
- Device pixel ratio capped at `Math.min(window.devicePixelRatio, 2)`
- Post-FX composer renders at half resolution where possible (glitch + bloom)
- OBJ triangle count is the vertex shader bottleneck; if `skull.obj` is >50k tris, decimate at build time (one-time)
- Animation loop runs every frame regardless of visibility (`requestAnimationFrame` pauses in background tabs automatically)

## Testing

- **No unit tests for scene/shader code.** Testing WebGL output is all pain, no payoff. Visual correctness is verified by looking at the page.
- **Unit tests for `puzzle.ts`.** This is the one module with real logic worth pinning:
  - Acrostic generator produces a line set whose first letters spell the target word in rotation
  - Click sequence detector fires `onUnlock` on correct sequence only
  - Wrong clicks reset the ring buffer
  - `unlocked` flips once, stays true
  - Test runner: Vitest, runs in Node with no DOM needed
- **Manual QA checklist** (lives in implementation plan, not here): desktop Chrome/Safari/Firefox, mobile iOS Safari, mobile Android Chrome, verify each interaction, verify the puzzle chain end-to-end, verify the edge-reveal HUD shows/hides correctly, verify graceful mobile touch substitutes.

## Tech stack and deployment

| Layer | Choice |
|---|---|
| Framework | Astro (latest stable), static output only |
| 3D library | Three.js, vanilla (no r3f, no React) |
| Language | TypeScript |
| Shaders | GLSL in `.glsl` files, imported via Vite `?raw` |
| Post-processing | Three.js `EffectComposer` + custom shader pass |
| Styling | Plain CSS (no styled-components, no Ant, no Tailwind) |
| Hosting | Cloudflare Pages |
| Repo strategy | New branch off `master`, clean rewrite; old files deleted as part of the work; nothing migrated |

## Out of scope

- Any blog or content pages (the old blog is not migrated)
- Analytics, A/B testing, SEO meta beyond basic title + description
- Social share images / Open Graph
- Dark/light mode toggle — the site is always dark
- Accessibility beyond `aria-hidden="true"` on the decorative HUD and semantic `<a>` tags for the two real links (LinkedIn, email). A WebGL skull is inherently not screen-reader-friendly; that's accepted.
- A second page of any kind
- Persistence of the unlocked state across sessions

## Open items for implementation

- Exact hidden word for the acrostic (suggestion: `NOTICED`, up to implementer)
- Exact click sequence for the puzzle (suggestion: `leftEye → rightEye → jaw → rightEye → leftEye`, 5 clicks)
- LinkedIn URL and email address (user-provided at implementation time)
- Whether to replace the existing `skull.obj` later — tracked as a follow-up, not blocking first ship
