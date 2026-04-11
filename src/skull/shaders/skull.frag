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

  // Scanline overlay
  float scan = 0.5 + 0.5 * sin(gl_FragCoord.y * 1.5 + uTime * 4.0);

  // Noise-seeded surface pattern
  float pat = fract(sin(dot(vPosition.xy + uNoiseSeed, vec2(12.9898, 78.233))) * 43758.5453);

  float brightness = fresnel * (0.9 + 0.1 * scan) + 0.05 * pat;
  brightness += vDisplace * 0.3;

  gl_FragColor = vec4(base * brightness, 1.0);
}
