uniform float uTime;
uniform float uNoiseSeed;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPos;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
