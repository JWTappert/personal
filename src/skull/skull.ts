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
 *
 * Each burst has an explicit lifetime (quick flash or linger) and an envelope:
 * fast attack (~20ms), then linear decay to 0 over the rest of the lifetime.
 */
class BurstSlot {
  private age = 0;
  private lifetime = 0;
  private peak = 0;
  private nextIn: number;
  private inst: GlitchInstance;

  constructor(private readonly minGap: number, private readonly maxGap: number) {
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

    this.age += dt;
    if (this.age >= this.lifetime) {
      this.inst.intensity = 0;
    } else {
      const attack = 0.02;  // 20ms rise
      let envelope: number;
      if (this.age < attack) {
        envelope = this.age / attack;
      } else {
        envelope = 1 - (this.age - attack) / (this.lifetime - attack);
      }
      this.inst.intensity = this.peak * envelope;
    }
    return this.inst;
  }

  private trigger() {
    this.age = 0;
    this.peak = 0.5 + Math.random() * 0.5;
    this.inst.variant = randVariant();
    this.inst.regionCenter = 0.2 + Math.random() * 0.6;
    this.inst.regionHeight = 0.08 + Math.random() * 0.32;
    this.inst.jitter = Math.random();
    // Quick flashes only: 100-220ms total lifetime
    this.lifetime = 0.1 + Math.random() * 0.12;
    // Always a clean cooldown to the next burst — no cluster chaining
    this.nextIn = this.minGap + Math.random() * (this.maxGap - this.minGap);
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

  // Slot 0 is intentionally left at zero intensity — ambient was too
  // sustained at 6-12s variant holds. Film grain + scanline shimmer in the
  // skull material already provide a noise floor.
  // Slots 1, 2: independent burst schedulers with different rhythms
  const burstA = new BurstSlot(7, 16);
  const burstB = new BurstSlot(12, 28);

  let lastFrame = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;

    uniforms.uTime.value = scene.getTime();
    scene.skull.rotation.y += 0.003;

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
