uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uIntensity;
uniform int uVariant;
uniform vec2 uResolution;
uniform float uRegionCenter;  // 0..1, vertical center of affected band
uniform float uRegionHeight;  // 0..1, half-height of band
uniform float uJitter;        // 0..1, per-burst random seed for variation

varying vec2 vUv;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  vec4 color;

  // Region mask: 1 inside the band, 0 outside, smooth falloff.
  float dist = abs(uv.y - uRegionCenter);
  float mask = 1.0 - smoothstep(uRegionHeight * 0.6, uRegionHeight, dist);

  // Per-burst horizontal sub-region so bursts don't always span the full width
  float hLeft = uJitter * 0.4;
  float hRight = hLeft + 0.4 + uJitter * 0.3;
  float hMask = smoothstep(hLeft - 0.1, hLeft, uv.x) * (1.0 - smoothstep(hRight, hRight + 0.1, uv.x));
  // 50% of bursts ignore horizontal masking (use full width)
  if (uJitter > 0.5) hMask = 1.0;

  float effective = uIntensity * mask * hMask;

  if (uVariant == 0) {
    // RGB split
    float offset = effective * 0.010 * (1.0 + rand(vec2(uTime, uJitter)));
    float r = texture2D(tDiffuse, uv + vec2(offset, 0.0)).r;
    float g = texture2D(tDiffuse, uv).g;
    float b = texture2D(tDiffuse, uv - vec2(offset, 0.0)).b;
    color = vec4(r, g, b, 1.0);
  } else if (uVariant == 1) {
    // Datamosh blocks
    vec2 blockUv = uv;
    float blockSize = 0.04 + uJitter * 0.08;
    float block = floor(uv.y / blockSize);
    float shift = (rand(vec2(block, floor(uTime * 8.0) + uJitter * 13.0)) - 0.5) * effective * 0.12;
    blockUv.x += shift;
    color = texture2D(tDiffuse, blockUv);
  } else {
    // Scanline tear
    float tear = step(0.992 - effective * 0.02, rand(vec2(floor(uTime * 30.0) + uJitter * 7.0, floor(uv.y * 100.0))));
    vec2 torn = uv + vec2(tear * effective * 0.18, 0.0);
    color = texture2D(tDiffuse, torn);
    color.rgb += tear * effective * 0.35;
  }

  // Always: faint vignette + grain (global, no mask)
  float grain = (rand(uv + uTime) - 0.5) * 0.04;
  color.rgb += grain;
  float vignette = smoothstep(1.2, 0.4, length(uv - 0.5));
  color.rgb *= vignette;

  gl_FragColor = color;
}
