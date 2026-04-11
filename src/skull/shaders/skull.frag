uniform float uTime;
uniform float uNoiseSeed;
uniform float uRingEffect;
uniform vec3 uClickPoint;
uniform vec3 uClickColor;
uniform float uClickColorStrength;
uniform vec2 uCursor;
uniform bool uUnlocked;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplace;
varying vec3 vWorldPos;

void main() {
  // Base color: unlocked state overrides; otherwise cyan, with a transient
  // click-driven color mixed in that fades after each click.
  vec3 idleBase = vec3(0.00, 1.00, 0.78);
  vec3 base = uUnlocked ? vec3(1.0, 0.1, 0.2)
                        : mix(idleBase, uClickColor, uClickColorStrength);

  // Fresnel rim: bright edges
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);

  // Scanline overlay — slow rolling horizontal bands
  float scan = 0.5 + 0.5 * sin(gl_FragCoord.y * 0.35 - uTime * 3.0);

  // Noise-seeded surface speckle
  float pat = fract(sin(dot(vPosition.xy + uNoiseSeed, vec2(12.9898, 78.233))) * 43758.5453);

  float brightness = fresnel * (0.6 + 0.6 * scan) + 0.08 * pat;
  brightness += vDisplace * 0.3;

  // Click ring: expanding bright ring emanating from uClickPoint in local space.
  if (uRingEffect > 0.001) {
    float d = distance(vPosition, uClickPoint);
    float ringRadius = (1.0 - uRingEffect) * 4.0;
    float ringWidth = 0.6;
    float ring = smoothstep(ringWidth, 0.0, abs(d - ringRadius));
    brightness += ring * uRingEffect * 1.8;
  }

  gl_FragColor = vec4(base * brightness, 1.0);
}
