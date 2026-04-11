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
