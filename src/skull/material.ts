import * as THREE from 'three';
import vertSrc from './shaders/skull.vert?raw';
import fragSrc from './shaders/skull.frag?raw';

export interface SkullUniforms {
  uTime: { value: number };
  uNoiseSeed: { value: number };
  uDecayLevel: { value: number };
  uScroll: { value: number };
  uClickPulse: { value: number };
  uClickPoint: { value: THREE.Vector3 };
  uRingEffect: { value: number };
  uCursor: { value: THREE.Vector2 };
  uUnlocked: { value: boolean };
}

export function createSkullMaterial(noiseSeed: number): {
  material: THREE.ShaderMaterial;
  uniforms: SkullUniforms;
} {
  const uniforms: SkullUniforms = {
    uTime: { value: 0 },
    uNoiseSeed: { value: noiseSeed },
    uDecayLevel: { value: 0 },
    uScroll: { value: 0 },
    uClickPulse: { value: 0 },
    uClickPoint: { value: new THREE.Vector3(0, 0, 0) },
    uRingEffect: { value: 0 },
    uCursor: { value: new THREE.Vector2(0, 0) },
    uUnlocked: { value: false },
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader: vertSrc,
    fragmentShader: fragSrc,
    wireframe: true,
    transparent: false,
  });

  return { material, uniforms };
}
