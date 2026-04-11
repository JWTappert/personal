# Skull Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old Next.js personal site with a single-page interactive 3D skull on Astro + vanilla Three.js, deployed to Cloudflare Pages. Implements all features from `docs/superpowers/specs/2026-04-11-skull-site-design.md`.

**Architecture:** One Astro page renders a black shell with `<canvas>` and hidden HUD overlay. A single TypeScript module tree under `src/skull/` owns the Three.js scene, shaders, post-FX, interactions, idle decay, puzzle logic, and HUD sync. No SSR, no APIs, static output only.

**Tech Stack:** Astro (static), Three.js (vanilla, no r3f), TypeScript, GLSL via Vite `?raw`, Vitest for puzzle logic only, Cloudflare Pages for hosting.

---

## Important conventions for this plan

- **Dev server:** The developer runs `npm run dev` themselves — DO NOT start or stop the dev server. When a task says "verify in browser," leave a note for the developer to check at `http://localhost:4321` and continue.
- **TDD discipline:** Phase 8 (puzzle logic) uses strict TDD. All other phases use "implement then visually verify" because WebGL output can't be meaningfully unit tested.
- **Commits:** Commit at the end of every task. Small, focused commits. No batching multiple tasks into one commit.
- **Branch:** All work happens on branch `skull-rewrite`. First task creates it.
- **Package manager:** `npm`. The old project used yarn, but this is a clean rewrite; going with Astro's default.

---

## Phase 0 — Scaffold

### Task 1: Create branch and archive the old site

**Files:**
- Delete: everything except `.git/`, `.gitignore`, `public/models/skull.obj`, `README.md`, `docs/`, `.superpowers/`

- [ ] **Step 1: Create and switch to the work branch**

```bash
cd /c/Users/tappe/Workspace/personal
git checkout -b skull-rewrite
```

- [ ] **Step 2: Remove the old Next.js codebase**

```bash
git rm -r components/ lib/ pages/ global.ts theme.ts styled.d.ts tsconfig.json package.json yarn.lock
rm -rf node_modules .next
```

Leave these intact:
- `.git/`, `.gitignore`
- `public/models/skull.obj` (reused)
- `README.md` (will be updated later)
- `docs/` (holds the spec + this plan)
- `.superpowers/` (brainstorm artifacts, already git-ignored)

- [ ] **Step 3: Verify cleanup**

```bash
ls
```

Expected: only `README.md`, `docs/`, `public/`, `.gitignore`, `.superpowers/` (and `.git/`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old Next.js codebase to prep for rewrite"
```

---

### Task 2: Initialize Astro project structure

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `src/env.d.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "skull-site",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  vite: {
    assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag'],
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "*.astro"]
}
```

- [ ] **Step 4: Create `src/env.d.ts`**

```ts
/// <reference types="astro/client" />

declare module '*.glsl?raw' {
  const content: string;
  export default content;
}
declare module '*.vert?raw' {
  const content: string;
  export default content;
}
declare module '*.frag?raw' {
  const content: string;
  export default content;
}
```

- [ ] **Step 5: Create a minimal placeholder `src/pages/index.astro`** (real shell comes in Task 5)

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>skull</title>
  </head>
  <body>
    <p>bootstrapping…</p>
  </body>
</html>
```

- [ ] **Step 6: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json src/
git commit -m "feat: scaffold Astro project"
```

---

### Task 3: Install dependencies

**Files:**
- Modify: `package.json` (via `npm install`)

- [ ] **Step 1: Install runtime deps**

```bash
npm install astro three
```

- [ ] **Step 2: Install dev deps**

```bash
npm install --save-dev @types/three vitest typescript
```

- [ ] **Step 3: Verify install**

```bash
npx astro --version
```

Expected: prints a version number like `4.x.x` or `5.x.x`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install astro, three, vitest"
```

---

### Task 4: Ask developer to verify dev server runs

- [ ] **Step 1: Ask the developer to run `npm run dev` and confirm the placeholder page renders at `http://localhost:4321`**

Do not start the dev server yourself. Wait for the developer's confirmation before proceeding.

- [ ] **Step 2: If the developer reports an error, stop and surface it; do not continue until scaffold runs cleanly.**

---

## Phase 1 — Minimal scene

### Task 5: Write the real `index.astro` shell

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace the placeholder with the real shell**

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <meta name="description" content="" />
    <title>skull</title>
    <style is:global>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        height: 100%;
        width: 100%;
        background: #000;
        color: #00ffc8;
        font-family: ui-monospace, "Courier New", monospace;
        overflow: hidden;
        overscroll-behavior: none;
      }
      canvas#skull-canvas {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        display: block;
      }
      #hud {
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: 0;
        transition: opacity 180ms linear;
      }
      #hud a { pointer-events: auto; color: inherit; }
    </style>
  </head>
  <body>
    <canvas id="skull-canvas"></canvas>
    <div id="hud" aria-hidden="true"></div>
    <script>
      import '../skull/skull.ts';
    </script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: add canvas + hud shell to index.astro"
```

---

### Task 6: Create `scene.ts` with OBJ load + basic material

**Files:**
- Create: `src/skull/scene.ts`

- [ ] **Step 1: Write `scene.ts`**

```ts
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export interface SceneHandle {
  render(): void;
  resize(): void;
  skull: THREE.Group;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  getTime(): number;
  setMaterial(mat: THREE.Material): void;
}

export async function createScene(canvas: HTMLCanvasElement): Promise<SceneHandle> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.z = 12;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const skull = new THREE.Group();
  scene.add(skull);

  // Fallback material used until the real shader material lands.
  let currentMaterial: THREE.Material = new THREE.MeshBasicMaterial({
    color: 0x00ffc8,
    wireframe: true,
  });

  try {
    const loader = new OBJLoader();
    const obj = await loader.loadAsync('/models/skull.obj');
    for (const child of obj.children.slice()) {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = currentMaterial;
        mesh.userData.part =
          child === obj.children[0] ? 'jaw' : 'head';
        skull.add(mesh);
      }
    }
    skull.scale.setScalar(0.1);
  } catch (err) {
    console.warn('[scene] OBJ load failed, using icosahedron fallback', err);
    const geo = new THREE.IcosahedronGeometry(4, 1);
    const mesh = new THREE.Mesh(geo, currentMaterial);
    mesh.userData.part = 'head';
    skull.add(mesh);
  }

  const clock = new THREE.Clock();

  return {
    scene,
    camera,
    renderer,
    skull,
    render() {
      renderer.render(scene, camera);
    },
    resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    getTime() {
      return clock.getElapsedTime();
    },
    setMaterial(mat: THREE.Material) {
      currentMaterial = mat;
      skull.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = mat;
        }
      });
    },
  };
}
```

Notes for the implementing engineer:
- The OBJ has 2 children in the current file. Order may vary, so the `userData.part` assignment here is a best-effort initial label. Task 16 refines it via raycast hit position, not mesh identity.
- `skull.scale.setScalar(0.1)` assumes the existing OBJ is in a larger unit. If the skull renders too small or too large, adjust this once visually.

- [ ] **Step 2: Commit**

```bash
git add src/skull/scene.ts
git commit -m "feat: add scene.ts with OBJ loader and basic material"
```

---

### Task 7: Create `skull.ts` composition root

**Files:**
- Create: `src/skull/skull.ts`

- [ ] **Step 1: Write `skull.ts`**

```ts
import { createScene } from './scene';

async function boot() {
  const canvas = document.getElementById('skull-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.error('[skull] #skull-canvas not found');
    return;
  }

  if (!('WebGLRenderingContext' in window)) {
    console.warn('[skull] WebGL not available');
    return;
  }

  const scene = await createScene(canvas);

  function frame() {
    scene.skull.rotation.y += 0.003;
    scene.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => scene.resize());
}

boot().catch((err) => console.error('[skull] boot failed', err));
```

- [ ] **Step 2: Ask developer to reload the dev server at `http://localhost:4321`**

Expected: a slowly rotating cyan wireframe skull centered on a black background. If nothing renders, check the browser console for `[scene]` or `[skull]` errors.

- [ ] **Step 3: Commit**

```bash
git add src/skull/skull.ts
git commit -m "feat: boot skull scene with rotating wireframe"
```

---

## Phase 2 — Custom shader material

### Task 8: Write basic GLSL files

**Files:**
- Create: `src/skull/shaders/skull.vert`
- Create: `src/skull/shaders/skull.frag`

- [ ] **Step 1: Write `src/skull/shaders/skull.vert`**

```glsl
uniform float uTime;
uniform float uNoiseSeed;
uniform float uDecayLevel;
uniform float uScroll;
uniform float uClickPulse;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplace;

// Cheap 3D hash
float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;

  // Scroll deconstruction: fragments drift outward along normal
  vec3 displaced = position + normal * (uScroll * 4.0);

  // Idle decay twitch
  float twitch = noise(position * 0.3 + uTime * 0.5 + uNoiseSeed) - 0.5;
  displaced += normal * twitch * uDecayLevel * 0.6;

  // Click pulse: outward spike that decays
  displaced += normal * uClickPulse * 2.0;

  vDisplace = uScroll + uDecayLevel * 0.5 + uClickPulse;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
```

- [ ] **Step 2: Write `src/skull/shaders/skull.frag`**

```glsl
uniform float uTime;
uniform float uNoiseSeed;
uniform vec2 uCursor;
uniform bool uUnlocked;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplace;

void main() {
  vec3 base = uUnlocked ? vec3(1.0, 0.1, 0.2) : vec3(0.0, 1.0, 0.78);

  // Fresnel rim: bright edges
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);

  // Scanline overlay
  float scan = 0.5 + 0.5 * sin(gl_FragCoord.y * 1.5 + uTime * 4.0);

  // Noise-seeded surface pattern
  float pat = fract(sin(dot(vPosition.xy + uNoiseSeed, vec2(12.9898, 78.233))) * 43758.5453);

  float brightness = fresnel * (0.9 + 0.1 * scan) + 0.05 * pat;
  brightness += vDisplace * 0.3;

  gl_FragColor = vec4(base * brightness, 1.0);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/skull/shaders/
git commit -m "feat: add initial skull vertex and fragment shaders"
```

---

### Task 9: Wire `ShaderMaterial` into `scene.ts`

**Files:**
- Create: `src/skull/material.ts`
- Modify: `src/skull/scene.ts` (replace basic material at boot)
- Modify: `src/skull/skull.ts` (call setMaterial after scene ready — we'll do this instead of mutating scene.ts)

- [ ] **Step 1: Create `src/skull/material.ts`**

```ts
import * as THREE from 'three';
import vertSrc from './shaders/skull.vert?raw';
import fragSrc from './shaders/skull.frag?raw';

export interface SkullUniforms {
  uTime: { value: number };
  uNoiseSeed: { value: number };
  uDecayLevel: { value: number };
  uScroll: { value: number };
  uClickPulse: { value: number };
  uCursor: { value: THREE.Vector2 };
  uUnlocked: { value: boolean };
}

export function createSkullMaterial(noiseSeed: number): {
  material: THREE.ShaderMaterial;
  uniforms: SkullUniforms;
} {
  const uniforms: SkullUniforms = {
    uTime: { value: 0 },
    uNoiseSeed: { value: noiseSeed },
    uDecayLevel: { value: 0 },
    uScroll: { value: 0 },
    uClickPulse: { value: 0 },
    uCursor: { value: new THREE.Vector2(0, 0) },
    uUnlocked: { value: false },
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader: vertSrc,
    fragmentShader: fragSrc,
    wireframe: true,
    transparent: false,
  });

  return { material, uniforms };
}
```

- [ ] **Step 2: Modify `src/skull/skull.ts` to use the shader material**

```ts
import { createScene } from './scene';
import { createSkullMaterial } from './material';

async function boot() {
  const canvas = document.getElementById('skull-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.error('[skull] #skull-canvas not found');
    return;
  }

  if (!('WebGLRenderingContext' in window)) {
    console.warn('[skull] WebGL not available');
    return;
  }

  const noiseSeed = Math.random() * 1000;
  const { material, uniforms } = createSkullMaterial(noiseSeed);

  const scene = await createScene(canvas);
  scene.setMaterial(material);

  function frame() {
    uniforms.uTime.value = scene.getTime();
    scene.skull.rotation.y += 0.003;
    scene.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => scene.resize());
}

boot().catch((err) => console.error('[skull] boot failed', err));
```

- [ ] **Step 3: Ask the developer to reload the browser**

Expected: the skull renders with a glowing cyan wireframe, brighter at the edges (fresnel rim), with subtle scanline shimmer. If the shader fails to compile, the console will show a GLSL error — fix it before proceeding.

- [ ] **Step 4: Commit**

```bash
git add src/skull/material.ts src/skull/skull.ts
git commit -m "feat: render skull with custom shader material"
```

---

### Task 10: Verify noise seed varies per refresh

- [ ] **Step 1: Ask the developer to hard-refresh the page 2–3 times and confirm the surface pattern looks subtly different each load**

No code change. If the variation is invisible, increase the `0.05 * pat` coefficient in `skull.frag` or amplify `uNoiseSeed`'s effect in `vPosition` mixing.

- [ ] **Step 2: No commit needed unless shader tweaked**

---

## Phase 3 — Post-FX

### Task 11: Write `glitch.frag`

**Files:**
- Create: `src/skull/shaders/glitch.frag`

- [ ] **Step 1: Write `glitch.frag`**

```glsl
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uIntensity;
uniform int uVariant;
uniform vec2 uResolution;

varying vec2 vUv;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  vec4 color;

  if (uVariant == 0) {
    // RGB split
    float offset = uIntensity * 0.008 * (1.0 + rand(vec2(uTime, 0.0)));
    float r = texture2D(tDiffuse, uv + vec2(offset, 0.0)).r;
    float g = texture2D(tDiffuse, uv).g;
    float b = texture2D(tDiffuse, uv - vec2(offset, 0.0)).b;
    color = vec4(r, g, b, 1.0);
  } else if (uVariant == 1) {
    // Datamosh blocks
    vec2 blockUv = uv;
    float blockSize = 0.08;
    float block = floor(uv.y / blockSize);
    float shift = (rand(vec2(block, floor(uTime * 8.0))) - 0.5) * uIntensity * 0.1;
    blockUv.x += shift;
    color = texture2D(tDiffuse, blockUv);
  } else {
    // Scanline tear
    float tear = step(0.995, rand(vec2(floor(uTime * 30.0), floor(uv.y * 100.0))));
    vec2 torn = uv + vec2(tear * uIntensity * 0.15, 0.0);
    color = texture2D(tDiffuse, torn);
    color.rgb += tear * uIntensity * 0.3;
  }

  // Always: faint vignette + grain
  float grain = (rand(uv + uTime) - 0.5) * 0.04;
  color.rgb += grain;
  float vignette = smoothstep(1.2, 0.4, length(uv - 0.5));
  color.rgb *= vignette;

  gl_FragColor = color;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/skull/shaders/glitch.frag
git commit -m "feat: add glitch post-process fragment shader"
```

---

### Task 12: Create `postfx.ts` with EffectComposer

**Files:**
- Create: `src/skull/postfx.ts`

- [ ] **Step 1: Write `postfx.ts`**

```ts
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import glitchFragSrc from './shaders/glitch.frag?raw';
import type { SceneHandle } from './scene';

export interface ComposerHandle {
  render(): void;
  resize(): void;
  setGlitch(variant: 0 | 1 | 2, intensity: number): void;
  setUnlocked(flag: boolean): void;
}

const glitchVertSrc = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function createComposer(scene: SceneHandle): ComposerHandle {
  const composer = new EffectComposer(scene.renderer);
  composer.setSize(window.innerWidth, window.innerHeight);

  composer.addPass(new RenderPass(scene.scene, scene.camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.8,  // strength
    0.6,  // radius
    0.2   // threshold
  );
  composer.addPass(bloom);

  const glitchPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uVariant: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
    },
    vertexShader: glitchVertSrc,
    fragmentShader: glitchFragSrc,
  });
  composer.addPass(glitchPass);

  const clock = new THREE.Clock();
  let unlocked = false;

  return {
    render() {
      glitchPass.uniforms.uTime.value = clock.getElapsedTime();
      composer.render();
    },
    resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      composer.setSize(w, h);
      bloom.setSize(w, h);
      glitchPass.uniforms.uResolution.value.set(w, h);
    },
    setGlitch(variant, intensity) {
      glitchPass.uniforms.uVariant.value = variant;
      // When unlocked, suppress glitch entirely
      glitchPass.uniforms.uIntensity.value = unlocked ? 0 : intensity;
    },
    setUnlocked(flag) {
      unlocked = flag;
      if (flag) glitchPass.uniforms.uIntensity.value = 0;
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/skull/postfx.ts
git commit -m "feat: add postfx composer with bloom and glitch pass"
```

---

### Task 13: Wire composer into `skull.ts`

**Files:**
- Modify: `src/skull/skull.ts`

- [ ] **Step 1: Update `skull.ts` to use the composer and pick a random glitch variant**

```ts
import { createScene } from './scene';
import { createSkullMaterial } from './material';
import { createComposer } from './postfx';

async function boot() {
  const canvas = document.getElementById('skull-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  if (!('WebGLRenderingContext' in window)) return;

  const noiseSeed = Math.random() * 1000;
  const glitchVariant = Math.floor(Math.random() * 3) as 0 | 1 | 2;

  const { material, uniforms } = createSkullMaterial(noiseSeed);

  const scene = await createScene(canvas);
  scene.setMaterial(material);

  const composer = createComposer(scene);
  composer.setGlitch(glitchVariant, 0.3);  // steady-state low intensity

  function frame() {
    uniforms.uTime.value = scene.getTime();
    scene.skull.rotation.y += 0.003;
    composer.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => {
    scene.resize();
    composer.resize();
  });
}

boot().catch((err) => console.error('[skull] boot failed', err));
```

- [ ] **Step 2: Ask developer to reload**

Expected: the skull still renders but now with bloom glow and a faint constant glitch effect (RGB split, blocks, or tear — random per reload). Hard-refresh to see variants change.

- [ ] **Step 3: Commit**

```bash
git add src/skull/skull.ts
git commit -m "feat: wire post-processing composer into skull scene"
```

---

## Phase 4 — Interactions bus

### Task 14: Create `interactions.ts` skeleton

**Files:**
- Create: `src/skull/interactions.ts`

- [ ] **Step 1: Write the bus skeleton with pointer, scroll, edge proximity**

```ts
import * as THREE from 'three';
import type { SceneHandle } from './scene';

export type SkullPart = 'leftEye' | 'rightEye' | 'jaw' | 'other';

export type InteractionEventMap = {
  pointer: { x: number; y: number };
  click: { skullPart: SkullPart };
  scroll: { delta: number; total: number };
  edge: { proximity: number };
  key: { char: string };
};

type Listener<K extends keyof InteractionEventMap> =
  (payload: InteractionEventMap[K]) => void;

export interface InteractionBus {
  on<K extends keyof InteractionEventMap>(event: K, cb: Listener<K>): void;
  off<K extends keyof InteractionEventMap>(event: K, cb: Listener<K>): void;
  getCursor(): { x: number; y: number; edgeProximity: number };
  getScroll(): number;
  getLastInputTime(): number;
}

export function createInteractions(
  canvas: HTMLCanvasElement,
  scene: SceneHandle
): InteractionBus {
  const listeners = new Map<keyof InteractionEventMap, Set<Listener<any>>>();
  let cursor = { x: 0, y: 0, edgeProximity: 0 };
  let scroll = 0;
  let lastInput = performance.now();

  function emit<K extends keyof InteractionEventMap>(
    event: K,
    payload: InteractionEventMap[K]
  ) {
    lastInput = performance.now();
    const set = listeners.get(event);
    if (!set) return;
    for (const cb of set) cb(payload);
  }

  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    cursor.x = nx;
    cursor.y = ny;

    const edgeX = 1 - Math.min(Math.abs(nx), 1);
    const edgeY = 1 - Math.min(Math.abs(ny), 1);
    const closestEdge = Math.min(edgeX, edgeY); // smaller = nearer to edge
    cursor.edgeProximity = Math.max(0, 1 - closestEdge / 0.2); // 0..1 when within 20% of edge

    emit('pointer', { x: nx, y: ny });
    emit('edge', { proximity: cursor.edgeProximity });
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY / 1000;
    scroll = Math.max(0, Math.min(1, scroll + delta));
    emit('scroll', { delta, total: scroll });
  }

  function onClick(e: PointerEvent) {
    const part = pickSkullPart(e);
    emit('click', { skullPart: part });
  }

  // Raycaster reused across clicks
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function pickSkullPart(e: PointerEvent): SkullPart {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(ndc, scene.camera);
    const hits = raycaster.intersectObjects(scene.skull.children, true);
    if (hits.length === 0) return 'other';
    const hit = hits[0];
    const part = (hit.object.userData.part as string) ?? 'head';
    if (part === 'jaw') return 'jaw';

    // Map hit position onto the head: left vs right eye region vs rest
    const local = hit.object.worldToLocal(hit.point.clone());
    // Eye region: upper half of head (y > 0 in local), abs(x) > 0.3 radius
    if (local.y > 0.1 && Math.abs(local.x) > 0.2) {
      return local.x < 0 ? 'leftEye' : 'rightEye';
    }
    return 'other';
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('click', onClick);

  return {
    on(event, cb) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    },
    off(event, cb) {
      listeners.get(event)?.delete(cb);
    },
    getCursor() {
      return { ...cursor };
    },
    getScroll() {
      return scroll;
    },
    getLastInputTime() {
      return lastInput;
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/skull/interactions.ts
git commit -m "feat: add interactions bus with pointer, scroll, edge, click"
```

---

### Task 15: Wire interactions into `skull.ts` and update uniforms

**Files:**
- Modify: `src/skull/skull.ts`

- [ ] **Step 1: Import and instantiate the bus, drive cursor + scroll uniforms**

```ts
import { createScene } from './scene';
import { createSkullMaterial } from './material';
import { createComposer } from './postfx';
import { createInteractions } from './interactions';

async function boot() {
  const canvas = document.getElementById('skull-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  if (!('WebGLRenderingContext' in window)) return;

  const noiseSeed = Math.random() * 1000;
  const glitchVariant = Math.floor(Math.random() * 3) as 0 | 1 | 2;

  const { material, uniforms } = createSkullMaterial(noiseSeed);

  const scene = await createScene(canvas);
  scene.setMaterial(material);

  const composer = createComposer(scene);
  composer.setGlitch(glitchVariant, 0.3);

  const bus = createInteractions(canvas, scene);

  // Click pulse state (decays over 1.2s)
  let clickPulse = 0;
  bus.on('click', ({ skullPart }) => {
    console.log('[click]', skullPart);
    clickPulse = 1;
  });

  function frame() {
    uniforms.uTime.value = scene.getTime();

    // Parallax (cursor magnetism)
    const { x, y } = bus.getCursor();
    uniforms.uCursor.value.set(x, y);
    scene.skull.rotation.y += 0.003;
    scene.skull.rotation.x = y * 0.1;
    scene.skull.position.x = x * 0.3;

    // Scroll deconstruction
    uniforms.uScroll.value = bus.getScroll();

    // Click pulse decay
    clickPulse = Math.max(0, clickPulse - 0.016 / 1.2);
    uniforms.uClickPulse.value = clickPulse;

    composer.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => {
    scene.resize();
    composer.resize();
  });
}

boot().catch((err) => console.error('[skull] boot failed', err));
```

- [ ] **Step 2: Ask developer to reload and verify:**
  - Moving the mouse tilts/offsets the skull subtly (parallax)
  - Scrolling wheel pulls the skull apart (fragments drift outward)
  - Clicking on the skull logs `[click] leftEye` / `rightEye` / `jaw` / `head` / `other` depending on where
  - Clicking causes a brief outward pulse of the skull surface

- [ ] **Step 3: Commit**

```bash
git add src/skull/skull.ts
git commit -m "feat: wire cursor parallax, scroll deconstruct, click pulse"
```

---

## Phase 5 — Idle decay

### Task 16: Create `idle.ts`

**Files:**
- Create: `src/skull/idle.ts`

- [ ] **Step 1: Write `idle.ts`**

```ts
import type { InteractionBus } from './interactions';

export interface IdleHandle {
  tick(dt: number): void;
  getDecayLevel(): number;
  getGlitchBurst(): number;
}

export function createIdleBehavior(bus: InteractionBus): IdleHandle {
  let decayLevel = 0;
  let burst = 0;
  let burstCooldown = 2 + Math.random() * 2;

  const reset = () => {
    decayLevel = 0;
  };
  bus.on('pointer', reset);
  bus.on('click', reset);
  bus.on('scroll', reset);
  bus.on('key', reset);

  return {
    tick(dt: number) {
      const idleMs = performance.now() - bus.getLastInputTime();

      // After 1s of no input, ramp linearly to 1.0 over 8s.
      if (idleMs > 1000) {
        const t = (idleMs - 1000) / 8000;
        decayLevel = Math.min(1, t);
      }

      // Glitch bursts only when decay > 0.3
      if (decayLevel > 0.3) {
        burstCooldown -= dt;
        if (burstCooldown <= 0) {
          burst = 1;
          burstCooldown = 2 + Math.random() * 2 - decayLevel;
        }
      }
      burst = Math.max(0, burst - dt / 0.15);
    },
    getDecayLevel() {
      return decayLevel;
    },
    getGlitchBurst() {
      return burst;
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/skull/idle.ts
git commit -m "feat: add idle decay behavior module"
```

---

### Task 17: Wire idle into `skull.ts`

**Files:**
- Modify: `src/skull/skull.ts`

- [ ] **Step 1: Instantiate idle and push decay + burst into uniforms / glitch**

Add to imports:
```ts
import { createIdleBehavior } from './idle';
```

Add after `const bus = createInteractions(canvas, scene);`:
```ts
  const idle = createIdleBehavior(bus);
```

Update `frame()` to call `idle.tick(dt)` and read values:
```ts
  let last = performance.now();
  function frame(t: number) {
    const dt = (t - last) / 1000;
    last = t;

    idle.tick(dt);

    uniforms.uTime.value = scene.getTime();
    uniforms.uDecayLevel.value = idle.getDecayLevel();

    const { x, y } = bus.getCursor();
    uniforms.uCursor.value.set(x, y);
    scene.skull.rotation.y += 0.003;
    scene.skull.rotation.x = y * 0.1;
    scene.skull.position.x = x * 0.3;

    uniforms.uScroll.value = bus.getScroll();

    clickPulse = Math.max(0, clickPulse - dt / 1.2);
    uniforms.uClickPulse.value = clickPulse;

    // Glitch intensity = steady + idle burst
    const glitch = 0.3 + idle.getGlitchBurst() * 0.8 + clickPulse * 0.5;
    composer.setGlitch(glitchVariant, glitch);

    composer.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
```

- [ ] **Step 2: Ask developer to reload and sit still for ~10 seconds**

Expected: after ~1 second of no input, the skull starts subtly twitching (decay), and periodic glitch bursts intensify over time. Moving the mouse resets everything.

- [ ] **Step 3: Commit**

```bash
git add src/skull/skull.ts
git commit -m "feat: wire idle decay and glitch bursts"
```

---

## Phase 6 — HUD

### Task 18: Add HUD DOM structure + CSS

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Add the HUD inner structure + CSS to `index.astro`**

Replace the `<div id="hud" aria-hidden="true"></div>` line with:

```astro
    <div id="hud" aria-hidden="true">
      <div class="hud-corner hud-tl" data-corner="tl"></div>
      <div class="hud-corner hud-tr" data-corner="tr"></div>
      <div class="hud-corner hud-bl" data-corner="bl"></div>
      <div class="hud-corner hud-br" data-corner="br"></div>
      <div class="hud-bar hud-top"></div>
      <div class="hud-bar hud-bottom">
        <a href="LINKEDIN_URL_TBD" target="_blank" rel="noopener">linkedin</a>
        <a href="mailto:EMAIL_TBD">email</a>
      </div>
    </div>
```

Add these rules to the `<style is:global>` block:

```css
      #hud {
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      #hud .hud-corner {
        position: absolute;
        padding: 14px 18px;
        color: #00ffc8;
        text-shadow: 0 0 6px rgba(0, 255, 200, 0.6);
        white-space: pre;
        line-height: 1.55;
      }
      #hud .hud-tl { top: 0; left: 0; text-align: left; }
      #hud .hud-tr { top: 0; right: 0; text-align: right; }
      #hud .hud-bl { bottom: 32px; left: 0; }
      #hud .hud-br { bottom: 32px; right: 0; text-align: right; }
      #hud .hud-bar {
        position: absolute;
        left: 0; right: 0;
        height: 24px;
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 0 18px;
        font-size: 10px;
        color: #00ffc8;
      }
      #hud .hud-bar.hud-top { top: 0; border-bottom: 1px solid rgba(0,255,200,0.25); }
      #hud .hud-bar.hud-bottom { bottom: 0; border-top: 1px solid rgba(0,255,200,0.25); }
      #hud.revealed { opacity: 1; }
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: add HUD DOM structure and cyberpunk styles"
```

---

### Task 19: Create `hud.ts` with edge reveal logic

**Files:**
- Create: `src/skull/hud.ts`

- [ ] **Step 1: Write `hud.ts`**

```ts
import type { InteractionBus } from './interactions';

// Provided by puzzle.ts in a later task; for now accept a minimal interface
// so HUD can be wired up before puzzle is implemented.
export interface PuzzleLinesProvider {
  getHudLines(t: number): {
    tl: string;
    tr: string;
    bl: string;
    br: string;
  };
  isUnlocked(): boolean;
}

export interface HudHandle {
  tick(t: number): void;
  setUnlocked(flag: boolean): void;
}

export function createHud(
  root: HTMLElement,
  bus: InteractionBus,
  provider: PuzzleLinesProvider
): HudHandle {
  const corners: Record<'tl' | 'tr' | 'bl' | 'br', HTMLElement> = {
    tl: root.querySelector('.hud-tl')!,
    tr: root.querySelector('.hud-tr')!,
    bl: root.querySelector('.hud-bl')!,
    br: root.querySelector('.hud-br')!,
  };

  let unlocked = false;
  let lastLinesUpdate = 0;

  return {
    tick(t: number) {
      // Opacity driven by edge proximity (smooth curve)
      const p = bus.getCursor().edgeProximity;
      const targetOpacity = Math.pow(p, 1.4);
      root.style.opacity = String(targetOpacity);
      root.classList.toggle('revealed', targetOpacity > 0.3);

      // Update lines ~3x per second
      if (t - lastLinesUpdate > 350) {
        const lines = provider.getHudLines(t);
        corners.tl.textContent = lines.tl;
        corners.tr.textContent = lines.tr;
        corners.bl.textContent = lines.bl;
        corners.br.textContent = lines.br;
        lastLinesUpdate = t;
      }
    },
    setUnlocked(flag: boolean) {
      unlocked = flag;
      if (flag) {
        corners.br.textContent = 'well played.';
      }
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/skull/hud.ts
git commit -m "feat: add HUD edge-reveal module"
```

---

### Task 20: Add a temporary stub provider and wire HUD into `skull.ts`

**Files:**
- Modify: `src/skull/skull.ts`

- [ ] **Step 1: Instantiate HUD with a stub provider (replaced by puzzle in Phase 8)**

Add to imports:
```ts
import { createHud, type PuzzleLinesProvider } from './hud';
```

Add after idle is created:
```ts
  const stubProvider: PuzzleLinesProvider = {
    getHudLines: () => ({
      tl: 'SYS_/CRANIUM.v2',
      tr: '42.5°N -123.8°W',
      bl: 'LINK_OK',
      br: '▓▒░ STANDBY',
    }),
    isUnlocked: () => false,
  };

  const hudEl = document.getElementById('hud') as HTMLElement;
  const hud = createHud(hudEl, bus, stubProvider);
```

Inside `frame()`, after `composer.render()`:
```ts
    hud.tick(t);
```

- [ ] **Step 2: Ask developer to reload and verify:**
  - HUD is invisible when the cursor is near the center
  - Moving the cursor toward any edge fades in the HUD with stub readouts
  - Moving back to center fades it out

- [ ] **Step 3: Commit**

```bash
git add src/skull/skull.ts
git commit -m "feat: wire HUD edge-reveal with stub provider"
```

---

## Phase 7 — Puzzle module (TDD)

> This is the only module with strict TDD. All other phases used implement-then-verify. Puzzle logic is pure and testable, so pin behavior in tests before coding.

### Task 21: Set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/.gitkeep`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Create an empty tests directory**

```bash
mkdir -p tests
touch tests/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts tests/
git commit -m "chore: add vitest config"
```

---

### Task 22: Write failing tests for acrostic line generator

**Files:**
- Create: `tests/puzzle-acrostic.test.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect } from 'vitest';
import { buildAcrosticPool } from '../src/skull/puzzle-internals';

describe('buildAcrosticPool', () => {
  it('produces a pool where a sliding window of N lines has first letters spelling the word', () => {
    const word = 'NOTICED';
    const pool = buildAcrosticPool(word);

    expect(pool.length).toBeGreaterThanOrEqual(word.length);

    // Find a starting index where word.length consecutive lines spell the word
    let found = false;
    for (let i = 0; i <= pool.length - word.length; i++) {
      const initials = pool.slice(i, i + word.length)
        .map((s) => s[0]?.toUpperCase() ?? '')
        .join('');
      if (initials === word) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('returns lines that look like plausible system-status messages', () => {
    const pool = buildAcrosticPool('NOTICED');
    for (const line of pool) {
      expect(line.length).toBeGreaterThan(3);
      expect(line.length).toBeLessThan(40);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run tests/puzzle-acrostic.test.ts
```

Expected: FAIL with "Cannot find module '../src/skull/puzzle-internals'" or similar.

---

### Task 23: Implement `buildAcrosticPool`

**Files:**
- Create: `src/skull/puzzle-internals.ts`

- [ ] **Step 1: Implement minimally to pass the tests**

```ts
/**
 * Build a pool of fake system-status lines where a sliding window of
 * `word.length` consecutive lines has first letters spelling `word`.
 *
 * Strategy: for each letter, pick one line from a small curated bank
 * whose first character matches. Prepend and append a handful of
 * filler lines whose first letters are NOT prefixes of the word, so
 * the acrostic only appears in one specific window.
 */

const CURATED: Record<string, string[]> = {
  A: ['ACK 0x1F', 'ALLOC 4096 OK', 'ARBITER ONLINE'],
  B: ['BOOT SEQ COMPLETE', 'BUS 0 LINK OK', 'BACKLOG FLUSHED'],
  C: ['CRC PASS', 'CHECKSUM VERIFIED', 'CORE 2 READY'],
  D: ['DMA CHANNEL OK', 'DECODE TABLE LOADED', 'DEADMAN RESET'],
  E: ['ECC SCRUB OK', 'ENTROPY POOL FULL', 'EXEC UNIT IDLE'],
  F: ['FETCH RING STABLE', 'FIRMWARE 11.4', 'FAN 1 2400 RPM'],
  G: ['GATE 3 CLOSED', 'GRID LOCK OK', 'GAIN NOMINAL'],
  H: ['HEARTBEAT 60 BPM', 'HASH TREE OK', 'HYPERVISOR LOAD'],
  I: ['INT TABLE LOADED', 'INJECT PORT OPEN', 'IRIS CALIBRATED'],
  J: ['JITTER 0.2 MS', 'JMP VECTOR OK', 'JTAG LINK UP'],
  K: ['KEY FOB DETECTED', 'KERNEL WARM', 'KRED TOKEN VALID'],
  L: ['LINK UP 1 GBPS', 'LATCH SET', 'LOG BUFFER 42%'],
  M: ['MEM BANK 3 OK', 'MUX 0 STABLE', 'MSG QUEUE DRAINED'],
  N: ['NODE 7 SYNC', 'NET ROUTE STATIC', 'NEXUS LINK HOT'],
  O: ['OSC TRIM OK', 'ORB 2 TRACKING', 'OPCODE CACHE WARM'],
  P: ['PSU 1 12.08V', 'PING 3 MS', 'PHASE LOCK OK'],
  Q: ['QUEUE DEPTH 0', 'QUARTZ STABLE', 'QUERY TABLE LOADED'],
  R: ['RAM SCRUB DONE', 'RNG SEEDED', 'RING 0 CLEAR'],
  S: ['SYS CLOCK 3.2 GHZ', 'STATUS NOMINAL', 'SCAN LINE 482'],
  T: ['TEMP 34C', 'TRACE BUFFER OK', 'TICK 0x3FA'],
  U: ['UART 0 READY', 'UPLINK STABLE', 'UUID VERIFIED'],
  V: ['VOLT 1.05V OK', 'VECTOR TABLE FIXED', 'VRM LOCK OK'],
  W: ['WDT FED', 'WRITE PROT OFF', 'WRAP COUNT 2'],
  X: ['XBAR ROUTED', 'XOR MASK OK', 'XTAL OK'],
  Y: ['Y-BUS ACK', 'YAW 0.0°', 'YIELD TICK OK'],
  Z: ['ZEROED PAGE 3', 'ZONE 1 ACTIVE', 'ZERO XING'],
};

// Lines whose first letter is deliberately outside the word to act as padding
const FILLER = ['··· IDLE ···', '>>> SYS OK', '### LINK FINE', '%%% NOP', '$$$ WAIT'];

export function buildAcrosticPool(word: string): string[] {
  const upper = word.toUpperCase();
  const pool: string[] = [];

  // A couple of filler lines at the start
  pool.push(FILLER[0], FILLER[1]);

  // One curated line per letter
  for (const ch of upper) {
    const bank = CURATED[ch];
    if (!bank) throw new Error(`No curated lines for letter: ${ch}`);
    pool.push(bank[0]);
  }

  // More filler lines at the end
  pool.push(FILLER[2], FILLER[3], FILLER[4]);

  return pool;
}
```

- [ ] **Step 2: Run tests, expect PASS**

```bash
npx vitest run tests/puzzle-acrostic.test.ts
```

Expected: both tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/skull/puzzle-internals.ts tests/puzzle-acrostic.test.ts
git commit -m "feat: acrostic pool generator with tests"
```

---

### Task 24: Write failing tests for click-sequence detector

**Files:**
- Modify: `tests/puzzle-sequence.test.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect } from 'vitest';
import { SequenceDetector } from '../src/skull/puzzle-internals';

describe('SequenceDetector', () => {
  const secret = ['leftEye', 'rightEye', 'jaw', 'rightEye', 'leftEye'] as const;

  it('fires unlock when the exact sequence is clicked in order', () => {
    const det = new SequenceDetector(secret);
    let fired = 0;
    det.onUnlock(() => fired++);

    for (const part of secret) det.push(part);
    expect(fired).toBe(1);
    expect(det.isUnlocked()).toBe(true);
  });

  it('does not fire on a different sequence', () => {
    const det = new SequenceDetector(secret);
    let fired = 0;
    det.onUnlock(() => fired++);

    det.push('jaw');
    det.push('jaw');
    det.push('leftEye');
    det.push('rightEye');
    det.push('leftEye');
    expect(fired).toBe(0);
    expect(det.isUnlocked()).toBe(false);
  });

  it('fires only once even if the sequence repeats', () => {
    const det = new SequenceDetector(secret);
    let fired = 0;
    det.onUnlock(() => fired++);

    for (const part of secret) det.push(part);
    for (const part of secret) det.push(part);
    expect(fired).toBe(1);
  });

  it('tolerates stray clicks before the correct sequence', () => {
    const det = new SequenceDetector(secret);
    let fired = 0;
    det.onUnlock(() => fired++);

    det.push('other');
    det.push('jaw');
    det.push('other');
    for (const part of secret) det.push(part);
    expect(fired).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run tests/puzzle-sequence.test.ts
```

Expected: FAIL with "SequenceDetector is not a constructor" or "export not found".

---

### Task 25: Implement `SequenceDetector`

**Files:**
- Modify: `src/skull/puzzle-internals.ts`

- [ ] **Step 1: Append the class to `puzzle-internals.ts`**

```ts
export type ClickTarget = 'leftEye' | 'rightEye' | 'jaw' | 'head' | 'other';

export class SequenceDetector {
  private buffer: string[] = [];
  private unlocked = false;
  private callbacks: Array<() => void> = [];

  constructor(private readonly secret: readonly string[]) {}

  push(target: string): void {
    if (this.unlocked) return;
    this.buffer.push(target);
    if (this.buffer.length > this.secret.length) {
      this.buffer.shift();
    }
    if (this.buffer.length === this.secret.length) {
      let matches = true;
      for (let i = 0; i < this.secret.length; i++) {
        if (this.buffer[i] !== this.secret[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        this.unlocked = true;
        for (const cb of this.callbacks) cb();
      }
    }
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  onUnlock(cb: () => void): void {
    this.callbacks.push(cb);
  }
}
```

- [ ] **Step 2: Run tests, expect PASS**

```bash
npx vitest run tests/puzzle-sequence.test.ts
```

Expected: all four tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/skull/puzzle-internals.ts tests/puzzle-sequence.test.ts
git commit -m "feat: click sequence detector with tests"
```

---

### Task 26: Write failing test for glitch hint formatting

**Files:**
- Create: `tests/puzzle-hint.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from 'vitest';
import { formatGlitchHint } from '../src/skull/puzzle-internals';

describe('formatGlitchHint', () => {
  it('renders the click sequence as symbols', () => {
    const out = formatGlitchHint(['leftEye', 'rightEye', 'jaw', 'rightEye', 'leftEye']);
    expect(out).toBe('◉ ○ ▼ ○ ◉');
  });

  it('uses a question mark for unknown parts', () => {
    const out = formatGlitchHint(['leftEye', 'other']);
    expect(out).toBe('◉ ?');
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npx vitest run tests/puzzle-hint.test.ts
```

---

### Task 27: Implement `formatGlitchHint`

**Files:**
- Modify: `src/skull/puzzle-internals.ts`

- [ ] **Step 1: Append**

```ts
const HINT_SYMBOLS: Record<string, string> = {
  leftEye: '◉',
  rightEye: '○',
  jaw: '▼',
  head: '△',
};

export function formatGlitchHint(sequence: readonly string[]): string {
  return sequence.map((s) => HINT_SYMBOLS[s] ?? '?').join(' ');
}
```

- [ ] **Step 2: Run tests, expect PASS**

```bash
npx vitest run tests/puzzle-hint.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/skull/puzzle-internals.ts tests/puzzle-hint.test.ts
git commit -m "feat: glitch hint symbol formatter with tests"
```

---

### Task 28: Create `puzzle.ts` public module

**Files:**
- Create: `src/skull/puzzle.ts`

- [ ] **Step 1: Write the public module that composes the internals**

```ts
import type { InteractionBus } from './interactions';
import {
  buildAcrosticPool,
  SequenceDetector,
  formatGlitchHint,
} from './puzzle-internals';

export interface PuzzleHandle {
  getHudLines(t: number): { tl: string; tr: string; bl: string; br: string };
  getGlitchHint(): string;
  isUnlocked(): boolean;
  onUnlock(cb: () => void): void;
}

// Implementation constants — safe to tweak
const SECRET_WORD = 'NOTICED';
const SECRET_SEQUENCE = ['leftEye', 'rightEye', 'jaw', 'rightEye', 'leftEye'] as const;
const LINE_ROTATE_MS = 3500;

export function createPuzzle(bus: InteractionBus): PuzzleHandle {
  const pool = buildAcrosticPool(SECRET_WORD);
  const detector = new SequenceDetector(SECRET_SEQUENCE);
  const hint = formatGlitchHint(SECRET_SEQUENCE);

  bus.on('click', ({ skullPart }) => {
    detector.push(skullPart);
  });

  function currentWindow(t: number): string[] {
    const step = Math.floor(t / LINE_ROTATE_MS);
    const start = step % Math.max(1, pool.length - 4);
    return pool.slice(start, start + 4);
  }

  return {
    getHudLines(t) {
      const [a, b, c, d] = currentWindow(t);
      return {
        tl: `SYS_/CRANIUM.v2\n${a ?? ''}`,
        tr: `42.5°N -123.8°W\n${b ?? ''}`,
        bl: c ?? '',
        br: d ?? '',
      };
    },
    getGlitchHint() {
      return hint;
    },
    isUnlocked() {
      return detector.isUnlocked();
    },
    onUnlock(cb) {
      detector.onUnlock(cb);
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/skull/puzzle.ts
git commit -m "feat: puzzle public module composing internals"
```

---

### Task 29: Wire puzzle into `skull.ts` replacing the HUD stub

**Files:**
- Modify: `src/skull/skull.ts`

- [ ] **Step 1: Replace the stub provider with real puzzle**

Remove the `stubProvider` object. Add:
```ts
import { createPuzzle } from './puzzle';
```

Create and wire:
```ts
  const puzzle = createPuzzle(bus);
  const hudEl = document.getElementById('hud') as HTMLElement;
  const hud = createHud(hudEl, bus, puzzle);

  puzzle.onUnlock(() => {
    console.log('[puzzle] UNLOCKED');
    composer.setUnlocked(true);
    hud.setUnlocked(true);
    uniforms.uUnlocked.value = true;
  });
```

- [ ] **Step 2: Ask developer to reload and verify:**
  - HUD readouts rotate every ~3.5 seconds
  - Clicking `leftEye → rightEye → jaw → rightEye → leftEye` triggers `[puzzle] UNLOCKED`, skull color shifts from cyan to red, glitch disappears, and `br` corner shows `well played.`

- [ ] **Step 3: Commit**

```bash
git add src/skull/skull.ts
git commit -m "feat: wire puzzle logic into composition root"
```

---

## Phase 8 — Glitch-frame hint flash

### Task 30: Add an occasional glitch frame that flashes the hint symbols

**Files:**
- Modify: `src/pages/index.astro` (add one more overlay element)
- Modify: `src/skull/hud.ts` (flash helper)
- Modify: `src/skull/skull.ts` (trigger on idle burst)

- [ ] **Step 1: Add a hint flash element to `index.astro`**

Inside the `<div id="hud">`, add as the last child:
```astro
      <div id="hint-flash"></div>
```

Add to the style block:
```css
      #hint-flash {
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        font-size: 44px;
        letter-spacing: 0.3em;
        color: #00ffc8;
        text-shadow: 0 0 14px #00ffc8, 0 0 30px #00ffc8;
        opacity: 0;
        pointer-events: none;
        mix-blend-mode: screen;
      }
      #hint-flash.flash { animation: hint-flash 120ms linear; }
      @keyframes hint-flash {
        0%, 100% { opacity: 0; }
        50% { opacity: 0.9; }
      }
```

- [ ] **Step 2: Add a `flashHint(text)` method to `hud.ts`**

Inside `createHud`, resolve the element once and expose the method in the return:

```ts
  const flashEl = document.getElementById('hint-flash')!;

  return {
    tick(t: number) { /* ... existing ... */ },
    setUnlocked(flag: boolean) { /* ... existing ... */ },
    flashHint(text: string) {
      if (unlocked) return;
      flashEl.textContent = text;
      flashEl.classList.remove('flash');
      // Force reflow so re-adding the class restarts the animation
      void flashEl.offsetWidth;
      flashEl.classList.add('flash');
    },
  };
```

Update the `HudHandle` interface to include `flashHint(text: string): void;`.

- [ ] **Step 3: In `skull.ts`, trigger `flashHint` on idle bursts using the puzzle hint**

Replace the previous frame burst handling with:
```ts
  let lastBurst = 0;
  // ... inside frame() ...
  const burstNow = idle.getGlitchBurst();
  if (burstNow > 0.9 && lastBurst <= 0.9 && !puzzle.isUnlocked()) {
    hud.flashHint(puzzle.getGlitchHint());
  }
  lastBurst = burstNow;
```

- [ ] **Step 4: Ask developer to sit idle for ~15 seconds and confirm a brief flash of `◉ ○ ▼ ○ ◉` appears**

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/skull/hud.ts src/skull/skull.ts
git commit -m "feat: flash puzzle hint symbols during idle bursts"
```

---

## Phase 9 — Mobile touch parity

### Task 31: Add touch-drag orbit that replaces cursor parallax on touch devices

**Files:**
- Modify: `src/skull/interactions.ts`
- Modify: `src/skull/skull.ts`

- [ ] **Step 1: Add orbit state to the bus**

In `interactions.ts`, add inside `createInteractions`:

```ts
  const orbit = { x: 0, y: 0 };
  let dragging = false;
  let dragStart = { x: 0, y: 0, ox: 0, oy: 0 };
  let isTouch = false;

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'touch') {
      isTouch = true;
      dragging = true;
      dragStart = { x: e.clientX, y: e.clientY, ox: orbit.x, oy: orbit.y };
    }
  }
  function onPointerDrag(e: PointerEvent) {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - dragStart.x) / rect.width;
    const dy = (e.clientY - dragStart.y) / rect.height;
    orbit.x = dragStart.ox + dx * 3;
    orbit.y = dragStart.oy + dy * 3;
  }
  function onPointerUp() {
    dragging = false;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerDrag);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
```

Add to the returned interface/object:
```ts
    getOrbit(): { x: number; y: number };
    isTouch(): boolean;
```

And inside the return:
```ts
    getOrbit() { return { ...orbit }; },
    isTouch() { return isTouch; },
```

Update the `InteractionBus` interface at the top of the file to declare both methods.

- [ ] **Step 2: In `skull.ts`, prefer orbit on touch, parallax on desktop**

Replace the parallax block with:
```ts
    if (bus.isTouch()) {
      const orbit = bus.getOrbit();
      scene.skull.rotation.y = orbit.x + scene.getTime() * 0.3;
      scene.skull.rotation.x = orbit.y * 0.6;
      scene.skull.position.x = 0;
      uniforms.uCursor.value.set(0, 0);
    } else {
      const { x, y } = bus.getCursor();
      uniforms.uCursor.value.set(x, y);
      scene.skull.rotation.y += 0.003;
      scene.skull.rotation.x = y * 0.1;
      scene.skull.position.x = x * 0.3;
    }
```

- [ ] **Step 3: Ask developer to open the page on a phone or enable Chrome's touch emulation**

Verify: drag rotates the skull freely; the skull no longer auto-rotates on touch (only the small time-based slow spin). Desktop experience is unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/skull/interactions.ts src/skull/skull.ts
git commit -m "feat: touch-drag orbit replaces cursor parallax on mobile"
```

---

### Task 32: Touch HUD reveal via sustained-touch-at-edge

**Files:**
- Modify: `src/skull/interactions.ts`

- [ ] **Step 1: Add sustained-edge-touch detection**

In the pointer down handler, if the touch location is within 20% of a viewport edge, start a 200ms timer. If still touching at the edge when the timer fires, set `cursor.edgeProximity = 1` and emit `edge`. Clear the timer and reset on `pointerup` or `pointermove` that leaves the edge zone.

Add to `createInteractions`:
```ts
  let edgeTimer: number | null = null;
  function clearEdgeTimer() {
    if (edgeTimer !== null) {
      clearTimeout(edgeTimer);
      edgeTimer = null;
    }
  }
  function isAtEdge(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    return nx < 0.12 || nx > 0.88 || ny < 0.12 || ny > 0.88;
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    if (isAtEdge(e)) {
      edgeTimer = window.setTimeout(() => {
        cursor.edgeProximity = 1;
        emit('edge', { proximity: 1 });
      }, 200);
    }
  });
  canvas.addEventListener('pointerup', () => {
    clearEdgeTimer();
    if (isTouch) {
      cursor.edgeProximity = 0;
      emit('edge', { proximity: 0 });
    }
  });
```

- [ ] **Step 2: Ask developer to test with touch emulation and verify sustained-touch at a screen corner reveals the HUD**

- [ ] **Step 3: Commit**

```bash
git add src/skull/interactions.ts
git commit -m "feat: mobile sustained-touch-at-edge reveals HUD"
```

---

## Phase 10 — Fallbacks

### Task 33: Add a WebGL-not-available static fallback

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/skull/skull.ts`

- [ ] **Step 1: Add a hidden SVG fallback to `index.astro`**

Before the closing `</body>`:
```astro
    <div id="nogl" style="display:none; position:fixed; inset:0; background:#000; color:#00ffc8; font-family:ui-monospace,monospace; display:none; align-items:center; justify-content:center; font-size:18px;">
      webgl required.
    </div>
```

Note: the duplicated `display:none` is intentional — first sets it, second is overridden by JS when WebGL is missing.

- [ ] **Step 2: In `skull.ts`, when WebGL is missing, show the fallback instead of returning silently**

Replace:
```ts
  if (!('WebGLRenderingContext' in window)) return;
```

With:
```ts
  if (!('WebGLRenderingContext' in window)) {
    const nogl = document.getElementById('nogl');
    if (nogl) (nogl as HTMLElement).style.display = 'flex';
    (canvas as HTMLElement).style.display = 'none';
    return;
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro src/skull/skull.ts
git commit -m "feat: graceful fallback when WebGL unavailable"
```

---

### Task 34: OBJ load failure is already handled in scene.ts

- [ ] **Step 1: Re-read Task 6 — the OBJ load is already wrapped in try/catch with an icosahedron fallback**

No code change. Verify the fallback path by temporarily renaming `public/models/skull.obj` to `skull.obj.bak`, reloading, seeing a glowing icosahedron, then renaming it back.

- [ ] **Step 2: Ask developer to perform the rename test and confirm, then restore the file**

---

## Phase 11 — Deploy

### Task 35: Add README and Cloudflare Pages config

**Files:**
- Modify: `README.md`
- Create: `public/_headers` (optional, for caching)

- [ ] **Step 1: Rewrite `README.md`**

```md
# skull

Interactive 3D skull. One page, one experience.

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:4321.

## Build

```bash
npm run build
```

Static output lands in `dist/`.

## Deploy

Configured for Cloudflare Pages. Build command: `npm run build`. Output directory: `dist`.
```

- [ ] **Step 2: Create `public/_headers` for sensible caching**

```
/*
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

- [ ] **Step 3: Commit**

```bash
git add README.md public/_headers
git commit -m "docs: add README and cache headers for Cloudflare Pages"
```

---

### Task 36: Run full build, verify bundle sizes

- [ ] **Step 1: Run the production build**

```bash
npm run build
```

Expected: `dist/` is created, no errors, final JS bundle is somewhere in the 400–900 KB range (Three.js is heavy; this is fine).

- [ ] **Step 2: Eyeball `dist/` contents to confirm only HTML, JS, CSS, the skull OBJ, and shader files are present**

```bash
ls dist/
```

- [ ] **Step 3: No commit unless a fix was made**

---

### Task 37: Run the full puzzle test suite

- [ ] **Step 1: Run all tests**

```bash
npm run test
```

Expected: all tests in `tests/puzzle-acrostic.test.ts`, `tests/puzzle-sequence.test.ts`, `tests/puzzle-hint.test.ts` pass. No hanging tests.

- [ ] **Step 2: No commit unless fix applied**

---

### Task 38: Manual QA checklist

Ask the developer to run through each item and report any failures.

- [ ] **Desktop Chrome:** skull renders, parallax works, scroll deconstructs, click pulses, idle decay ramps, glitch variant stable for the session, HUD reveals at edges, puzzle sequence unlocks visual state + "well played."
- [ ] **Desktop Safari:** same checklist
- [ ] **Desktop Firefox:** same checklist
- [ ] **iOS Safari:** touch drag orbits, tap triggers click/pulse, sustained-touch-at-edge reveals HUD
- [ ] **Android Chrome:** same touch checklist
- [ ] **Hard refresh 3 times:** verify glitch variant and noise seed change
- [ ] **Disable WebGL** (about:config in Firefox or DevTools render flag): verify `webgl required.` fallback shows
- [ ] **Rename skull.obj temporarily:** verify icosahedron fallback renders

---

### Task 39: Push branch and open PR

- [ ] **Step 1: Push the branch**

```bash
git push -u origin skull-rewrite
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "skull site rewrite" --body "$(cat <<'EOF'
## Summary
- Complete rewrite of the personal site as a single interactive 3D skull
- Astro + Three.js (vanilla), deployed to Cloudflare Pages
- Custom shaders, post-FX glitch, idle decay, cursor parallax, scroll deconstruction, click pulse
- Hidden three-layer easter egg with unlock state

## Test plan
- [ ] desktop browsers render cleanly
- [ ] mobile touch substitutes work
- [ ] puzzle unlock flips visual state
- [ ] WebGL fallback shows on unsupported browsers

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review checklist for the plan

- Spec coverage: all eight spec modules have tasks (scene, shaders, postfx, interactions, idle, puzzle, hud, skull composition root).
- Features: parallax (Task 15), scroll deconstruction (Task 15), click pulse (Task 15), idle decay (Tasks 16-17), edge HUD reveal (Tasks 18-20), puzzle (Tasks 21-29), glitch hint flash (Task 30), mobile touch (Tasks 31-32), fallbacks (Tasks 33-34), deploy (Tasks 35-39).
- Placeholders: `LINKEDIN_URL_TBD` and `EMAIL_TBD` in `index.astro` are real placeholders that the developer fills in — acceptable per spec.
- Type consistency: `SkullPart` in `interactions.ts` and `ClickTarget` in `puzzle-internals.ts` are compatible (both include leftEye/rightEye/jaw/head/other); the detector takes a plain string array so the mismatch in type name doesn't matter at runtime.
- TDD discipline: applied only to puzzle (Phase 7) per spec; other phases use implement-then-verify which matches the spec's testing section.
