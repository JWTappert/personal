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

  // Temporary burst-based glitch scheduler — replaced by idle.ts in Phase 5.
  // Bursts are short random spikes with randomized spatial region so each one
  // affects a different part of the screen.
  let burstIntensity = 0;
  let nextBurstIn = 2 + Math.random() * 5;
  let decayRate = 0.02;

  function triggerBurst() {
    burstIntensity = 0.5 + Math.random() * 0.5;
    // Random vertical band: center anywhere, height varies from tight (~15%)
    // to wide (~70%). Tighter bands bias toward the skull's visible area.
    const center = 0.2 + Math.random() * 0.6;
    const height = 0.08 + Math.random() * 0.32;
    const jitter = Math.random();
    composer.setRegion(center, height, jitter);
    // Decay rate randomized: some bursts are micro-flashes, some linger
    decayRate = Math.random() < 0.3 ? 0.0005 : 0.02;
    // Next burst timing: mostly 3-10s apart, occasionally a cluster follow-up
    const cluster = Math.random() < 0.25;
    nextBurstIn = cluster ? 0.08 + Math.random() * 0.35 : 3 + Math.random() * 7;
  }

  let lastFrame = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;

    uniforms.uTime.value = scene.getTime();
    scene.skull.rotation.y += 0.003;

    nextBurstIn -= dt;
    if (nextBurstIn <= 0) {
      triggerBurst();
    }
    burstIntensity *= Math.pow(decayRate, dt);

    composer.setGlitch(glitchVariant, burstIntensity);

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
