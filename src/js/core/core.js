// ROVARD CORE: the studio's signature object. One sphere of vertices whose shape is computed in the vertex shader,
// so it can travel between states without swapping models:
//   seed (an idea) -> strata (thinking, layered) -> block (the logo's own square and R) -> fluid (the experience)
// No model files, no textures: geometry and reflections are procedural, so it costs about 160 KB of gzipped JS and no downloads.
import {
  BackSide, BoxGeometry, BufferAttribute, BufferGeometry, Color, ExtrudeGeometry, Group, IcosahedronGeometry, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, PerspectiveCamera, PMREMGenerator, Points, Scene, ShaderMaterial, SphereGeometry, ACESFilmicToneMapping,
  SRGBColorSpace, WebGLRenderer,
} from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

// The R from the logo file, unchanged. Coordinates are the logo's own 181 x 171 square.
const R_PATH = 'M60.24 130V40.4H96.464C102.011 40.4 106.875 41.3813 111.056 43.344C115.323 45.2213 118.651 47.952 121.04 51.536C123.429 55.0347 124.624 59.2587 124.624 64.208V65.616C124.624 71.504 123.216 76.1547 120.4 79.568C117.584 82.9813 114.256 85.2853 110.416 86.48V88.272C113.488 88.3573 116.005 89.3813 117.968 91.344C120.016 93.2213 121.04 96.08 121.04 99.92V130H110.416V101.2C110.416 98.64 109.691 96.6773 108.24 95.312C106.875 93.9467 104.784 93.264 101.968 93.264H70.992V130H60.24ZM70.992 83.536H95.44C101.328 83.536 105.851 82.128 109.008 79.312C112.251 76.4107 113.872 72.4 113.872 67.28V66.384C113.872 61.264 112.293 57.296 109.136 54.48C105.979 51.5787 101.413 50.128 95.44 50.128H70.992V83.536Z';
const UNIT = 0.0125;                        // world units per logo unit, shared by the block and the R

const SNOISE = /* glsl */`
vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return m289(((x*34.)+1.)*x);}vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=m289(i);vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 nm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=nm.x;p1*=nm.y;p2*=nm.z;p3*=nm.w;
vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;

const SHAPE = /* glsl */`
uniform float uTime; uniform vec4 uMix; /* fluid, strata, block, seed */
${SNOISE}
vec3 coreShape(vec3 n){
  float t = uTime * .22;
  float a = snoise(n * .78 + vec3(t, t * .7, -t * .5));
  float b = snoise(n * 1.5 + a * .5 - t * .5);
  vec3 fluid = n * (1. + .3 * a + .07 * b);

  float layers = 7.;
  float k = n.y * layers + .12 * a;
  float f = floor(k) + smoothstep(.18, .82, fract(k));
  float ring = .8 + .2 * sin(f * 1.9 + t * 1.6);
  vec3 strata = vec3(n.x * ring, f / layers * 1.2, n.z * ring);

  vec3 an = abs(n);
  float sup = pow(pow(an.x, 7.) + pow(an.y, 7.) + pow(an.z, 7.), -1. / 7.);
  vec3 block = n * sup * vec3(1.131, 1.069, .46);          /* the logo's 181:171 square, as a slab */

  vec3 seed = n * (.42 + .02 * a);
  return fluid * uMix.x + strata * uMix.y + block * uMix.z + seed * uMix.w;
}`;

function environment(renderer) {
  const s = new Scene();
  const room = new Mesh(new SphereGeometry(30, 16, 12), new MeshBasicMaterial({ color: new Color(0.03, 0.05, 0.16), side: BackSide }));
  s.add(room);
  const panel = (rgb, gain, w, h, x, y, z) => {
    const m = new Mesh(new BoxGeometry(w, h, 0.1), new MeshBasicMaterial({ color: new Color(rgb[0] * gain, rgb[1] * gain, rgb[2] * gain) }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  panel([1, 1, 1], 3.2, 20, 6, 0, 12, 3);              // overhead softbox
  panel([0.14, 0.34, 1], 6, 12, 20, -14, 0, 3);      // cobalt wall
  panel([0.14, 0.34, 1], 3.5, 20, 12, 0, -12, 6);    // cobalt floor bounce
  panel([0.14, 0.34, 1], 2.2, 12, 20, 14, -2, -6);   // far cobalt wall
  panel([1, 0.85, 0.22], 12, 1.4, 14, 13, 2, 7);     // signal-yellow strip
  panel([1, 1, 1], 5, 1.6, 13, 6, 0, 14);            // key strip
  panel([0.6, 0.72, 1], 4, 14, 4, -5, 7, -13);       // rim
  const pm = new PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.012).texture;
  pm.dispose();
  s.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return tex;
}

function rGeometry() {
  const shapes = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${R_PATH}"/></svg>`).paths.flatMap((p) => SVGLoader.createShapes(p));
  const g = new ExtrudeGeometry(shapes, { depth: 7, bevelEnabled: true, bevelSize: 0.7, bevelThickness: 0.9, bevelSegments: 2, curveSegments: 10 });
  g.translate(-90.5, -85.5, 0);       // the logo's own centre, so the R sits exactly where it does in the mark
  g.scale(UNIT, -UNIT, UNIT);
  const idx = g.index;                // flipping Y turns the faces inside out; put them back
  if (idx) { const a = idx.array; for (let i = 0; i < a.length; i += 3) { const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; } }
  else { const p = g.attributes.position.array, n = g.attributes.normal.array; for (let i = 0; i < p.length; i += 9) for (let j = 0; j < 3; j++) { let t = p[i + 3 + j]; p[i + 3 + j] = p[i + 6 + j]; p[i + 6 + j] = t; t = n[i + 3 + j]; n[i + 3 + j] = n[i + 6 + j]; n[i + 6 + j] = t; } }
  g.computeVertexNormals();
  return g;
}

function dust(count) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * 6.283, r = 1.3 + Math.random() * 1.1, q = Math.sqrt(1 - u * u);
    pos[i * 3] = q * Math.cos(a) * r; pos[i * 3 + 1] = u * r; pos[i * 3 + 2] = q * Math.sin(a) * r;
    seed[i] = Math.random();
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new BufferAttribute(seed, 1));
  const m = new ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uBurst: { value: 0 }, uAlpha: { value: 0.8 }, uPx: { value: 1 } },
    vertexShader: `uniform float uTime,uBurst,uPx;attribute float aSeed;varying float vS;void main(){vS=aSeed;vec3 p=position*(1.+uBurst*(.5+aSeed));
      float a=uTime*(.04+.05*aSeed);float c=cos(a),s=sin(a);p.xz=mat2(c,-s,s,c)*p.xz;p.y+=sin(uTime*.3+aSeed*20.)*.05;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uPx*(2.+3.*aSeed)*(5./-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform float uAlpha;varying float vS;void main(){vec2 q=abs(gl_PointCoord-.5);if(max(q.x,q.y)>.5)discard;
      vec3 c=vS>.93?vec3(1.,.85,.24):vec3(.72,.8,1.);gl_FragColor=vec4(c,uAlpha*(.35+.65*vS));}`,   /* square dust, like the logo */
  });
  return new Points(g, m);
}

const DEFAULT = { x: 0, y: 0, s: .5, rx: 0, ry: 0, fluid: 1, strata: 0, block: 0, seed: 0, r: 0, burst: 0, tint: .2, rough: .1, dust: .8 };

// Lets the browser handle input between the expensive setup steps, so loading the Core never blocks the page for long.
const breathe = () => new Promise((r) => setTimeout(r, 0));

export async function createCore(canvas, { detail = 56, dpr = 1.75, particles = 240, aa = true, keep = false, spin = 1 } = {}) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: aa, powerPreference: 'high-performance', preserveDrawingBuffer: keep });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dpr));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  await breathe();
  const scene = new Scene();
  scene.environment = environment(renderer);
  await breathe();
  const camera = new PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.z = 6;
  const uniforms = { uTime: { value: 0 }, uMix: { value: { x: 1, y: 0, z: 0, w: 0 } } };

  const mat = new MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.1, envMapIntensity: 1.25 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uniforms.uTime; sh.uniforms.uMix = uniforms.uMix;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${SHAPE}`)
      .replace('#include <beginnormal_vertex>', /* glsl */`
        vec3 sn = normalize(position);
        vec3 helper = abs(sn.y) < .99 ? vec3(0., 1., 0.) : vec3(1., 0., 0.);
        vec3 t1 = normalize(cross(helper, sn)), t2 = cross(sn, t1);
        vec3 p0 = coreShape(sn);
        vec3 p1 = coreShape(normalize(sn + t1 * .012));
        vec3 p2 = coreShape(normalize(sn + t2 * .012));
        vec3 objectNormal = normalize(cross(p1 - p0, p2 - p0));
        if (dot(objectNormal, sn) < 0. && uMix.y < .5) objectNormal = -objectNormal;`)
      .replace('#include <begin_vertex>', 'vec3 transformed = p0;');
  };
  mat.customProgramCacheKey = () => 'rovard-core';
  const mesh = new Mesh(new IcosahedronGeometry(1, detail), mat);
  await breathe();
  mesh.frustumCulled = false;

  const rMat = new MeshStandardMaterial({ color: 0xebebeb, metalness: 0.15, roughness: 0.32, envMapIntensity: 1.5, emissive: 0xebebeb, emissiveIntensity: 0.28, transparent: true });
  const r = new Mesh(rGeometry(), rMat);
  await breathe();
  r.position.z = 0.455;

  const group = new Group();
  group.add(mesh, r);
  scene.add(group);

  let pts = null;
  if (particles) { pts = dust(particles); scene.add(pts); }

  const chrome = new Color(0xc9d4ff), cobalt = new Color(0x0d1c86);   // cobalt lands on the logo's #162DAF once lit
  const state = { ...DEFAULT }, target = { ...DEFAULT };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let w = 0, h = 0, raf = 0, last = 0, time = Math.random() * 40, active = false, paused = false, slow = 0, frames = 0;
  const listeners = { degrade: [] };

  const resize = () => {
    w = canvas.clientWidth; h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (pts) pts.material.uniforms.uPx.value = renderer.getPixelRatio() * Math.max(.8, h / 760);
  };
  const apply = () => {
    const sum = Math.max(1e-3, state.fluid + state.strata + state.block + state.seed);
    uniforms.uMix.value.x = state.fluid / sum; uniforms.uMix.value.y = state.strata / sum;
    uniforms.uMix.value.z = state.block / sum; uniforms.uMix.value.w = state.seed / sum;
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z, halfW = halfH * camera.aspect;
    group.position.set(state.x * halfW, state.y * halfH, 0);
    const scale = state.s * halfH * Math.min(1, camera.aspect * 0.9);
    group.scale.setScalar(scale);
    group.rotation.set(state.rx + pointer.sy * 0.28, state.ry + pointer.sx * 0.42 + time * 0.05 * spin * (1 - state.block), 0);
    mat.color.copy(chrome).lerp(cobalt, state.tint);
    mat.roughness = state.rough;
    mat.metalness = 1 - state.tint * state.block * 0.8;            // as a block it turns from chrome into the logo's painted blue
    mat.emissive.copy(cobalt).multiplyScalar(0.35 * state.tint * state.block);
    mat.envMapIntensity = 1.25 - 0.8 * state.block;
    rMat.opacity = Math.min(1, state.r * 1.4);
    r.visible = state.r > 0.01;
    r.scale.setScalar(0.8 + state.r * 0.2);
    r.position.z = 0.455 + (1 - state.r) * 0.5;
    scene.environmentRotation.set(pointer.sy * 0.25, (time * 0.06 * spin + pointer.sx * 0.5) * (1 - state.block * 0.85), 0);
    if (pts) {
      const u = pts.material.uniforms;
      u.uTime.value = time; u.uBurst.value = state.burst; u.uAlpha.value = state.dust === undefined ? 0.8 : state.dust;
      pts.position.copy(group.position); pts.scale.setScalar(scale);
    }
    uniforms.uTime.value = time;
  };
  const render = () => { apply(); renderer.render(scene, camera); };
  const frame = (now) => {
    raf = active && !paused ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(0.1, (now - last) / 1000 || 0.016);
    last = now;
    time += dt;
    const k = 1 - Math.exp(-dt * 4.5);
    for (const key in target) state[key] += (target[key] - state[key]) * k;
    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
    pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
    render();
    // Frame-time guard: step quality down, and if it still struggles hand back to the still image.
    if (dt > 0.045) slow++;
    if (++frames === 90) {
      if (slow > 45) {
        if (renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); resize(); }
        else listeners.degrade.forEach((f) => f());
      }
      frames = 0; slow = 0;
    }
  };
  const kick = () => { if (!raf && active && !paused && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  const onResize = () => { resize(); render(); };
  const onVis = () => kick();
  addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); listeners.degrade.forEach((f) => f()); });

  resize();
  apply();
  await renderer.compileAsync(scene, camera);
  await breathe();
  render();

  return {
    state, target, pointer, render,
    jump(k) { Object.assign(state, k); Object.assign(target, k); render(); },
    aim(k) { Object.assign(target, k); },
    setActive(v) { active = v; kick(); },
    setPaused(v) { paused = v; if (!v) kick(); },
    setSpin(v) { spin = v; },
    setWire(v) { mat.wireframe = v; render(); },
    onDegrade(f) { listeners.degrade.push(f); },
    dispose() {
      active = false; cancelAnimationFrame(raf);
      removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis);
      mesh.geometry.dispose(); mat.dispose(); r.geometry.dispose(); rMat.dispose();
      if (pts) { pts.geometry.dispose(); pts.material.dispose(); }
      scene.environment.dispose(); renderer.dispose();
    },
  };
}
