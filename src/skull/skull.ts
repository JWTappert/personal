import { createScene } from './scene';
import { createSkullMaterial } from './material';
import { createComposer, type GlitchInstance } from './postfx';

type Variant = 0 | 1 | 2;

function randVariant(): Variant {
  return Math.floor(Math.random() * 3) as Variant;
}

/**
 * One independent burst slot. Owns its own timing, decay, and randomization.
 * Multiple slots run in parallel so different glitch types can overlap.
 */
class BurstSlot {
  intensity = 0;
  private decayRate = 0.02;
  private nextIn: number;
  private inst: GlitchInstance;

  constructor(private readonly slotIndex: number, private readonly minGap: number, private readonly maxGap: number) {
    this.nextIn = minGap + Math.random() * (maxGap - minGap);
    this.inst = {
      variant: 0,
      intensity: 0,
      regionCenter: 0.5,
      regionHeight: 1.0,
      jitter: 0,
    };
  }

  tick(dt: number): GlitchInstance {
    this.nextIn -= dt;
    if (this.nextIn <= 0) {
      this.trigger();
    }
    this.intensity *= Math.pow(this.decayRate, dt);
    this.inst.intensity = this.intensity;
    return this.inst;
  }

  private trigger() {
    this.intensity = 0.5 + Math.random() * 0.5;
    this.inst.variant = randVariant();
    this.inst.regionCenter = 0.2 + Math.random() * 0.6;
    this.inst.regionHeight = 0.08 + Math.random() * 0.32;
    this.inst.jitter = Math.random();
    // ~30% of bursts linger, 70% are quick flashes
    this.decayRate = Math.random() < 0.3 ? 0.0005 : 0.02;
    // ~25% chance of a cluster follow-up
    const cluster = Math.random() < 0.25;
    this.nextIn = cluster
      ? 0.08 + Math.random() * 0.35
      : this.minGap + Math.random() * (this.maxGap - this.minGap);
  }
}

/**
 * Slow-drifting ambient layer: always on at low intensity, variant rotates
 * every 6-12 seconds, full-screen coverage. Adds the "signal noise" feel.
 */
class AmbientSlot {
  private variantSwapIn: number;
  private jitterDrift = 0;
  private currentVariant: Variant = randVariant();
  private inst: GlitchInstance;

  constructor() {
    this.variantSwapIn = 6 + Math.random() * 6;
    this.inst = {
      variant: this.currentVariant,
      intensity: 0.04 + Math.random() * 0.06,
      regionCenter: 0.5,
      regionHeight: 1.0,
      jitter: Math.random(),
    };
  }

  tick(dt: number): GlitchInstance {
    this.variantSwapIn -= dt;
    if (this.variantSwapIn <= 0) {
      this.currentVariant = randVariant();
      this.inst.variant = this.currentVariant;
      this.inst.intensity = 0.04 + Math.random() * 0.08;
      this.variantSwapIn = 6 + Math.random() * 6;
    }
    // Slowly drift jitter seed so the region shifts organically
    this.jitterDrift += dt * 0.3;
    this.inst.jitter = (Math.sin(this.jitterDrift) * 0.5 + 0.5);
    return this.inst;
  }
}

async function boot() {
  const canvas = document.getElementById('skull-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  if (!('WebGLRenderingContext' in window)) return;

  const noiseSeed = Math.random() * 1000;
  const { material, uniforms } = createSkullMaterial(noiseSeed);

  const scene = await createScene(canvas);
  scene.setMaterial(material);

  const composer = createComposer(scene);

  // Slot 0: ambient noise layer — always on at low intensity
  const ambient = new AmbientSlot();
  // Slots 1, 2: independent burst schedulers with different rhythms
  const burstA = new BurstSlot(1, 3, 9);
  const burstB = new BurstSlot(2, 5, 14);

  let lastFrame = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;

    uniforms.uTime.value = scene.getTime();
    scene.skull.rotation.y += 0.003;

    composer.setSlot(0, ambient.tick(dt));
    composer.setSlot(1, burstA.tick(dt));
    composer.setSlot(2, burstB.tick(dt));

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
