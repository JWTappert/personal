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
  // Most of the time intensity is near zero; occasional short bursts spike it.
  let burstIntensity = 0;
  let nextBurstIn = 4 + Math.random() * 6;

  let lastFrame = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;

    uniforms.uTime.value = scene.getTime();
    scene.skull.rotation.y += 0.003;

    nextBurstIn -= dt;
    if (nextBurstIn <= 0) {
      burstIntensity = 0.55 + Math.random() * 0.35;
      nextBurstIn = 4 + Math.random() * 8;
    }
    // Exponential-ish decay: ~300–400ms to near-zero after a spike
    burstIntensity *= Math.pow(0.02, dt);

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
