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
