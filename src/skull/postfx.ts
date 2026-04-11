import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import glitchFragSrc from './shaders/glitch.frag?raw';
import type { SceneHandle } from './scene';

/**
 * A single glitch "instance" — one independent glitching effect layered into
 * the final image. Multiple instances can be active simultaneously, each with
 * its own variant, region, intensity, and jitter seed.
 */
export interface GlitchInstance {
  variant: 0 | 1 | 2;
  intensity: number;
  /** Vertical center of affected band, 0..1 */
  regionCenter: number;
  /** Vertical half-height of band, 0..1 (1 = full screen) */
  regionHeight: number;
  /** Per-burst randomness seed, 0..1. >0.5 disables horizontal masking. */
  jitter: number;
}

export const GLITCH_SLOT_COUNT = 4;

export interface ComposerHandle {
  render(): void;
  resize(): void;
  /** Update a single glitch slot in-place. */
  setSlot(slot: number, inst: GlitchInstance): void;
  /** Read a slot's current state. */
  getSlot(slot: number): GlitchInstance;
  setUnlocked(flag: boolean): void;
}

const glitchVertSrc = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function makeGlitchPass() {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uVariant: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uRegionCenter: { value: 0.5 },
      uRegionHeight: { value: 1.0 },
      uJitter: { value: 0 },
    },
    vertexShader: glitchVertSrc,
    fragmentShader: glitchFragSrc,
  });
}

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

  const glitchPasses: ShaderPass[] = [];
  const slots: GlitchInstance[] = [];
  for (let i = 0; i < GLITCH_SLOT_COUNT; i++) {
    const pass = makeGlitchPass();
    composer.addPass(pass);
    glitchPasses.push(pass);
    slots.push({
      variant: 0,
      intensity: 0,
      regionCenter: 0.5,
      regionHeight: 1.0,
      jitter: 0,
    });
  }

  const timer = new THREE.Timer();
  let unlocked = false;

  function writeSlotToPass(slot: number) {
    const inst = slots[slot];
    const u = glitchPasses[slot].uniforms;
    u.uVariant.value = inst.variant;
    u.uIntensity.value = unlocked ? 0 : inst.intensity;
    u.uRegionCenter.value = inst.regionCenter;
    u.uRegionHeight.value = inst.regionHeight;
    u.uJitter.value = inst.jitter;
  }

  return {
    render() {
      timer.update();
      const t = timer.getElapsed();
      for (const pass of glitchPasses) pass.uniforms.uTime.value = t;
      composer.render();
    },
    resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      composer.setSize(w, h);
      bloom.setSize(w, h);
      for (const pass of glitchPasses) {
        pass.uniforms.uResolution.value.set(w, h);
      }
    },
    setSlot(slot, inst) {
      slots[slot] = { ...inst };
      writeSlotToPass(slot);
    },
    getSlot(slot) {
      return { ...slots[slot] };
    },
    setUnlocked(flag) {
      unlocked = flag;
      for (let i = 0; i < glitchPasses.length; i++) writeSlotToPass(i);
    },
  };
}
