import { createScene } from './scene';
import { createSkullMaterial } from './material';
import { createComposer, type GlitchInstance } from './postfx';

type Variant = 0 | 1 | 2;

function randVariant(): Variant {
  return Math.floor(Math.random() * 3) as Variant;
}

interface BurstSlotOptions {
  /** Seconds between bursts: [min, max] */
  gap: [number, number];
  /** Burst lifetime in seconds: [min, max] */
  lifetime: [number, number];
  /** Peak intensity: [min, max] */
  peak: [number, number];
  /** If true, burst covers the full screen. If false, random vertical band. */
  fullScreen?: boolean;
}

/**
 * One independent burst slot. Owns its own timing, decay, and randomization.
 * Multiple slots run in parallel so different glitch types can overlap.
 *
 * Each burst has an explicit lifetime and envelope: fast attack (~20ms), then
 * linear decay to 0 over the rest of the lifetime.
 */
class BurstSlot {
  private age = 0;
  private lifetime = 0;
  private peak = 0;
  private nextIn: number;
  private inst: GlitchInstance;

  constructor(private readonly opts: BurstSlotOptions) {
    this.nextIn = opts.gap[0] + Math.random() * (opts.gap[1] - opts.gap[0]);
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
    const { gap, lifetime, peak, fullScreen } = this.opts;
    this.age = 0;
    this.peak = peak[0] + Math.random() * (peak[1] - peak[0]);
    this.inst.variant = randVariant();
    if (fullScreen) {
      this.inst.regionCenter = 0.5;
      this.inst.regionHeight = 1.0;
      this.inst.jitter = 0.7;  // > 0.5 disables horizontal masking in shader
    } else {
      this.inst.regionCenter = 0.2 + Math.random() * 0.6;
      this.inst.regionHeight = 0.08 + Math.random() * 0.32;
      this.inst.jitter = Math.random();
    }
    this.lifetime = lifetime[0] + Math.random() * (lifetime[1] - lifetime[0]);
    this.nextIn = gap[0] + Math.random() * (gap[1] - gap[0]);
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

  // Three burst slots with distinct personalities.
  // Slot 0: rare ambient-style burst — full-screen, longer, lower intensity,
  //         infrequent. Reads as "signal drift" rather than a glitch.
  // Slots 1, 2: regional quick flashes with different rhythms.
  const ambientBurst = new BurstSlot({
    gap: [25, 55],
    lifetime: [0.35, 0.6],
    peak: [0.15, 0.28],
    fullScreen: true,
  });
  const burstA = new BurstSlot({
    gap: [7, 16],
    lifetime: [0.1, 0.22],
    peak: [0.5, 1.0],
  });
  const burstB = new BurstSlot({
    gap: [12, 28],
    lifetime: [0.1, 0.22],
    peak: [0.5, 1.0],
  });

  let lastFrame = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;

    uniforms.uTime.value = scene.getTime();
    scene.skull.rotation.y += 0.003;

    composer.setSlot(0, ambientBurst.tick(dt));
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
