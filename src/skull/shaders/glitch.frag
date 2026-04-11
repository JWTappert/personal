uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uIntensity;
uniform int uVariant;
uniform vec2 uResolution;

varying vec2 vUv;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  vec4 color;

  if (uVariant == 0) {
    // RGB split
    float offset = uIntensity * 0.008 * (1.0 + rand(vec2(uTime, 0.0)));
    float r = texture2D(tDiffuse, uv + vec2(offset, 0.0)).r;
    float g = texture2D(tDiffuse, uv).g;
    float b = texture2D(tDiffuse, uv - vec2(offset, 0.0)).b;
    color = vec4(r, g, b, 1.0);
  } else if (uVariant == 1) {
    // Datamosh blocks
    vec2 blockUv = uv;
    float blockSize = 0.08;
    float block = floor(uv.y / blockSize);
    float shift = (rand(vec2(block, floor(uTime * 8.0))) - 0.5) * uIntensity * 0.1;
    blockUv.x += shift;
    color = texture2D(tDiffuse, blockUv);
  } else {
    // Scanline tear
    float tear = step(0.995, rand(vec2(floor(uTime * 30.0), floor(uv.y * 100.0))));
    vec2 torn = uv + vec2(tear * uIntensity * 0.15, 0.0);
    color = texture2D(tDiffuse, torn);
    color.rgb += tear * uIntensity * 0.3;
  }

  // Always: faint vignette + grain
  float grain = (rand(uv + uTime) - 0.5) * 0.04;
  color.rgb += grain;
  float vignette = smoothstep(1.2, 0.4, length(uv - 0.5));
  color.rgb *= vignette;

  gl_FragColor = color;
}
