uniform float uTime;
uniform float uNoiseSeed;
uniform float uDecayLevel;
uniform float uScroll;
uniform float uClickPulse;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplace;
varying vec3 vWorldPos;

// Cheap 3D hash
float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;

  // Start with the undisplaced position; scroll no longer drives geometry —
  // the fragment shader handles scroll via palette shift + dissolve.
  vec3 displaced = position;

  // Idle decay twitch
  float twitch = noise(position * 0.3 + uTime * 0.5 + uNoiseSeed) - 0.5;
  displaced += normal * twitch * uDecayLevel * 0.6;

  // Click pulse: outward spike that decays (for head/crown clicks)
  displaced += normal * uClickPulse * 2.0;

  vDisplace = uDecayLevel * 0.5 + uClickPulse;

  vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
