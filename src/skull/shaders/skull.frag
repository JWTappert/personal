uniform float uTime;
uniform float uNoiseSeed;
uniform float uScroll;
uniform float uRingEffect;
uniform vec3 uClickPoint;
uniform vec2 uCursor;
uniform bool uUnlocked;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplace;
varying vec3 vWorldPos;

// Palette waypoints — neon family.
vec3 paletteFor(float t) {
  vec3 cyan    = vec3(0.00, 1.00, 0.78);
  vec3 green   = vec3(0.35, 1.00, 0.10);
  vec3 amber   = vec3(1.00, 0.70, 0.00);
  vec3 magenta = vec3(1.00, 0.10, 0.80);
  float k = t * 3.0;
  if (k < 1.0)      return mix(cyan, green, k);
  else if (k < 2.0) return mix(green, amber, k - 1.0);
  else              return mix(amber, magenta, clamp(k - 2.0, 0.0, 1.0));
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // Base color: unlocked state overrides, otherwise scroll drives palette.
  vec3 base = uUnlocked ? vec3(1.0, 0.1, 0.2) : paletteFor(clamp(uScroll, 0.0, 1.0));

  // Dissolve: progressively discard fragments as scroll increases.
  float dissolveNoise = hash(vPosition.xy + uNoiseSeed + vPosition.zz * 0.7);
  if (uScroll > 0.001 && dissolveNoise < uScroll * 0.85) discard;

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
  // Driven by uRingEffect (1.0 at click, decays to 0). Uses local vPosition so
  // the ring stays anchored to the skull as it rotates.
  if (uRingEffect > 0.001) {
    float d = distance(vPosition, uClickPoint);
    float ringRadius = (1.0 - uRingEffect) * 4.0;
    float ringWidth = 0.6;
    float ring = smoothstep(ringWidth, 0.0, abs(d - ringRadius));
    brightness += ring * uRingEffect * 1.8;
  }

  gl_FragColor = vec4(base * brightness, 1.0);
}
