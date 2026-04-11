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
