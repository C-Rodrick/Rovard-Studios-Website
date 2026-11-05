// The Core's one material. Written by hand rather than using MeshPhysicalMaterial so that:
//  - there is no PMREM step (that step froze the page for 2 to 3 s on first visit in earlier work);
//  - reflections come from an analytic studio (softboxes as functions), so they cost almost nothing
//    and can change with each presentation state;
//  - the brand colours can bypass tone mapping and reach the screen exactly.

export const VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const FRAG = /* glsl */ `
precision highp float;
varying vec3 vW;
varying vec3 vN;

uniform vec3 uBase;
uniform vec3 uFlatColor;   // written straight to the screen as sRGB (brand colours)
uniform float uFlat;       // 1 = output uFlatColor untouched
uniform float uMetal;
uniform float uRough;
uniform float uOpacity;
uniform float uGlass;      // 1 = smoked glass: alpha rises with fresnel
uniform float uMirror;     // 1 = this draw is the reflection in the floor
uniform float uFloorY;
uniform float uFloor;      // 1 = this draw is the polished floor
uniform float uLit;        // how much of the sculpture's lighting rig reaches this surface
uniform float uRoom;       // 1 = architecture: lit mostly by the opening at the end of the corridor
uniform vec3 uSlitP;
uniform vec3 uSlitC;

uniform vec3 uKeyD; uniform vec3 uKeyC;
uniform vec3 uFillD; uniform vec3 uFillC;
uniform vec3 uRimD; uniform vec3 uRimC;
uniform vec3 uBlueP; uniform vec3 uBlueC;
uniform vec3 uYelP; uniform vec3 uYelC;
uniform float uEnv;
uniform vec3 uEnvBlue;
uniform vec3 uFog;
uniform float uFogN;
uniform float uFogF;

const float PI = 3.14159265;

float box(vec3 r, vec3 c, vec3 u, vec3 v, float hw, float hh, float s) {
  float d = dot(r, c);
  if (d <= 0.02) return 0.0;
  float a = dot(r, u) / d;
  float b = dot(r, v) / d;
  return (1.0 - smoothstep(hw - s, hw + s, abs(a))) * (1.0 - smoothstep(hh - s, hh + s, abs(b)));
}

// A dark gallery with three light sources you could actually build: an overhead bank,
// one tall strip, and a low blue wash from the corridor.
vec3 studio(vec3 r, float rough) {
  float s = 0.015 + rough * 0.75;
  vec3 col = mix(vec3(0.0035, 0.004, 0.006), vec3(0.016, 0.019, 0.028), smoothstep(-0.6, 0.9, r.y));
  col += vec3(1.5, 1.56, 1.7) * box(r, normalize(vec3(-0.35, 0.92, 0.25)), vec3(0.97, 0.0, 0.25), vec3(0.0, -0.3, 0.95), 0.62, 0.17, s);
  col += vec3(2.3, 2.4, 2.6) * box(r, normalize(vec3(0.85, 0.12, 0.5)), vec3(-0.5, 0.0, 0.85), vec3(0.0, 1.0, 0.0), 0.035, 0.95, s);
  col += vec3(0.6, 0.64, 0.74) * box(r, normalize(vec3(-0.9, 0.05, 0.42)), vec3(0.42, 0.0, 0.9), vec3(0.0, 1.0, 0.0), 0.12, 0.7, s);
  col += uEnvBlue * exp(-pow(max(r.y + 0.12, 0.0) * 3.2, 2.0)) * smoothstep(0.35, -0.5, r.z);
  return col * uEnv;
}

float ggx(float nh, float a) {
  float a2 = a * a;
  float d = nh * nh * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d + 1e-5);
}

vec3 direct(vec3 n, vec3 v, vec3 l, vec3 c, vec3 f0, vec3 dif, float a) {
  float nl = max(dot(n, l), 0.0);
  if (nl <= 0.0) return vec3(0.0);
  vec3 h = normalize(l + v);
  float nh = max(dot(n, h), 0.0);
  float vh = max(dot(v, h), 0.0);
  vec3 f = f0 + (1.0 - f0) * pow(1.0 - vh, 5.0);
  float k = (a + 1.0); k = k * k * 0.125;
  float nv = max(dot(n, v), 0.001);
  float g = 1.0 / ((nl * (1.0 - k) + k) * (nv * (1.0 - k) + k) * 4.0);
  return (dif * (1.0 - f) / PI + f * ggx(nh, a * a) * g) * c * nl;
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec3 n = normalize(vN);
  vec3 toCam = cameraPosition - vW;
  float dist = length(toCam);
  vec3 v = toCam / dist;
  if (!gl_FrontFacing) n = -n;

  if (uFlat > 0.5) {
    float fade = uMirror > 0.5 ? 0.22 * exp(-(uFloorY - vW.y) * 1.6) : 1.0;
    gl_FragColor = vec4(uFlatColor * fade, uOpacity);
    return;
  }

  vec3 f0 = mix(vec3(0.04), uBase, uMetal);
  vec3 dif = uBase * (1.0 - uMetal);
  float a = max(uRough, 0.045);
  float nv = max(dot(n, v), 0.0);
  vec3 fr = f0 + (max(vec3(1.0 - a), f0) - f0) * pow(1.0 - nv, 5.0);

  vec3 r = reflect(-v, n);
  vec3 col = studio(r, a) * fr;
  col += dif * (studio(n, 0.9) * 0.55);

  // The key is a real lamp near the object, so flat faces get a falloff instead of one even tone.
  vec3 kl = uKeyD - vW;
  float kd = dot(kl, kl);
  col += direct(n, v, kl / sqrt(kd), uKeyC * 26.0 / kd, f0, dif, max(a, 0.16));
  col += direct(n, v, uFillD, uFillC, f0, dif, a);
  col += direct(n, v, uRimD, uRimC, f0, dif, a);
  // A grazing rim keeps the silhouette readable against the dark.
  col += uRimC * pow(1.0 - nv, 4.0) * max(dot(n, uRimD) * 0.5 + 0.5, 0.0) * 0.16;

  vec3 bl = uBlueP - vW;
  float bd = dot(bl, bl);
  col += direct(n, v, bl / sqrt(bd), uBlueC / (1.0 + bd * 0.35), f0, dif, a);
  vec3 yl = uYelP - vW;
  float yd = dot(yl, yl);
  col += direct(n, v, yl / sqrt(yd), uYelC / (1.0 + yd * 1.6), f0, dif, a);

  col *= uLit;
  if (uRoom > 0.5) {
    // The opening at the far end of the corridor rakes down the walls.
    vec3 sl = uSlitP - vW;
    float sd = length(sl);
    float pool = smoothstep(9.0, -2.5, vW.y);
    col += uBase * 16.0 * uSlitC * max(dot(n, sl / sd), 0.0) * pool / (1.0 + sd * sd * 0.012);
    col += uSlitC * pow(max(dot(n, sl / sd), 0.0), 3.0) * 0.3 * pool / (1.0 + sd * sd * 0.02);
  }

  float alpha = uOpacity;
  if (uGlass > 0.5) {
    float f = pow(1.0 - nv, 3.0);
    alpha = clamp(uOpacity + f * 0.55 + dot(col, vec3(0.3)) * 0.8, 0.0, 0.95);
    col += uBase;
  }

  if (uFloor > 0.5) {
    float f = pow(1.0 - nv, 4.0);
    alpha = mix(0.66, 0.42, f);
    // The opening's reflection, drawn along the polished floor towards the viewer.
    float streak = exp(-abs(vW.x - uSlitP.x) * 0.55) * smoothstep(14.0, -22.0, vW.z);
    col += uSlitC * streak * 0.42;
  }

  float fog = smoothstep(uFogN, uFogF, dist);
  col = mix(col, uFog, fog);

  col = aces(col);
  col = pow(col, vec3(1.0 / 2.2));

  if (uMirror > 0.5) {
    float fade = 0.8 * exp(-(uFloorY - vW.y) * 0.8);
    col *= fade;
  }

  // Dark gradients band badly on most screens. A little noise fixes it.
  col += (ign(gl_FragCoord.xy) - 0.5) / 160.0;
  gl_FragColor = vec4(col, alpha);
}`;

export const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const GLOW_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec3 uColor;
uniform float uPower;
uniform float uStretch;
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  p.y *= uStretch;
  float g = max(1.0 - length(p), 0.0);
  g = pow(g, uPower);
  gl_FragColor = vec4(uColor * g, 1.0);
}`;
