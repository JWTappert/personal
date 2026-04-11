uniform float uTime;
uniform float uNoiseSeed;
uniform vec2 uCursor;
uniform bool uUnlocked;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplace;

void main() {
  vec3 base = uUnlocked ? vec3(1.0, 0.1, 0.2) : vec3(0.0, 1.0, 0.78);

  // Fresnel rim: bright edges
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);

  // Scanline overlay — slow rolling horizontal bands
  float scan = 0.5 + 0.5 * sin(gl_FragCoord.y * 0.35 - uTime * 3.0);

  // Noise-seeded surface pattern
  float pat = fract(sin(dot(vPosition.xy + uNoiseSeed, vec2(12.9898, 78.233))) * 43758.5453);

  float brightness = fresnel * (0.6 + 0.6 * scan) + 0.08 * pat;
  brightness += vDisplace * 0.3;

  gl_FragColor = vec4(base * brightness, 1.0);
}
