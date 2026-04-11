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
