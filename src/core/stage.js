// The reusable Core component: one renderer, one scene, one state object.
// Everything outside this file only ever says "be in this state" or "interpolate towards that one".
import { AdditiveBlending, BoxGeometry, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, FrontSide, Group, Mesh, NormalBlending, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Vector3, WebGLRenderer } from 'three';
import { VERT, FRAG, GLOW_VERT, GLOW_FRAG } from './shaders.js';
import { FRAME, currentGeometry, frameGeometry, gateGeometry, paneGeometry, slabs } from './geometry.js';
import { KEYS, stateFor } from './states.js';

// Verified brand values. See docs/OBSIDIAN-AUDIT.md for where each one was read from.
const YELLOW = new Color().setStyle('#F5CC00');
const YELLOW_SRGB = new Vector3(245 / 255, 204 / 255, 0);
const BLUE_SRGB = new Vector3(22 / 255, 45 / 255, 175 / 255);
const OBSIDIAN = new Vector3(8 / 255, 10 / 255, 16 / 255);
const FLOOR_Y = -2.45;

function linear(v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }

export function createStage(canvas, { tier = 'high', still = false } = {}) {
  const high = tier === 'high';
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: still });
  renderer.setClearColor(0x080a10, 1);
  renderer.autoClear = true;

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 80);

  // The lighting rig, shared by every material.
  const rig = {
    uKeyD: { value: new Vector3(-0.5, 0.82, 0.5).normalize() }, uKeyC: { value: new Vector3() },
    uFillD: { value: new Vector3(0.7, -0.15, 0.7).normalize() }, uFillC: { value: new Vector3() },
    uRimD: { value: new Vector3(0.35, 0.3, -0.9).normalize() }, uRimC: { value: new Vector3() },
    uBlueP: { value: new Vector3() }, uBlueC: { value: new Vector3() },
    uYelP: { value: new Vector3() }, uYelC: { value: new Vector3() },
    uEnv: { value: 1 }, uEnvBlue: { value: new Vector3() },
    uFog: { value: new Vector3(linear(OBSIDIAN.x) * 1.2, linear(OBSIDIAN.y) * 1.2, linear(OBSIDIAN.z) * 1.3) },
    uFogN: { value: 13 }, uFogF: { value: 38 },
    uFloorY: { value: FLOOR_Y },
    uSlitP: { value: new Vector3(-0.9, 3.5, -23.5) }, uSlitC: { value: new Vector3() },
  };

  const mat = (o = {}, mirror = false) => new ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    transparent: !!o.transparent, depthWrite: o.depthWrite !== false, side: o.side || FrontSide,
    blending: NormalBlending,
    uniforms: {
      ...rig,
      uBase: { value: new Vector3(...(o.base || [0.02, 0.02, 0.03])) },
      uFlatColor: { value: o.flat || new Vector3() }, uFlat: { value: o.flat ? 1 : 0 },
      uMetal: { value: o.metal ?? 0 }, uRough: { value: o.rough ?? 0.5 }, uOpacity: { value: o.opacity ?? 1 },
      uGlass: { value: o.glass ? 1 : 0 }, uMirror: { value: mirror ? 1 : 0 }, uFloor: { value: o.floor ? 1 : 0 },
      uLit: { value: o.lit ?? 1 }, uRoom: { value: o.room ? 1 : 0 },
    },
  });

  // ── Materials ──
  const M = {
    obsidian: { base: [0.007, 0.008, 0.012], metal: 0.1, rough: 0.2 },
    graphite: { base: [0.03, 0.033, 0.042], metal: 0.86, rough: 0.46 },
    current: { base: [0.3, 0.32, 0.37], metal: 1, rough: 0.17 },
    gate: { base: [0.34, 0.36, 0.42], metal: 1, rough: 0.2 },
    pane: { base: [0.0012, 0.0016, 0.003], metal: 0, rough: 0.06, opacity: 0.2, glass: true, transparent: true, depthWrite: false, side: DoubleSide },
    yellow: { flat: YELLOW_SRGB },
    blue: { flat: BLUE_SRGB },
  };

  // ── The sculpture ──
  const rings = high ? 260 : 130, sides = high ? 40 : 22;
  const parts = [
    { geo: frameGeometry(), m: M.obsidian },
    { geo: gateGeometry(), m: M.gate, pos: [0.22, 0.14, 0.02], rot: [0.06, 1.0, 0.12] },
    { geo: currentGeometry(rings, sides), m: M.current },
    { geo: paneGeometry(), m: M.pane, pos: [0.12, -0.16, 0.05], rot: [0, -0.34, 0], order: 5 },
    // A chamfered graphite lip inside the opening gives the block a second, lighter edge to catch light on.
    { geo: new BoxGeometry(1.74, 0.045, FRAME.depth + 0.1), m: M.graphite, pos: [0.14, -0.49, 0] },
    { geo: new BoxGeometry(0.045, 1.72, FRAME.depth + 0.1), m: M.graphite, pos: [-0.71, 0.36, 0] },
    // The marks. Small, exact and few.
    { geo: new BoxGeometry(1.58, 0.022, 0.05), m: M.blue, pos: [0.12, -0.462, FRAME.depth / 2 + 0.03] },
    { geo: new BoxGeometry(0.14, 0.14, 0.14), m: M.yellow, pos: [0.655, 1.17, 0.36], rot: [0, 0, 0] },
    { geo: new BoxGeometry(0.018, 0.82, 0.018), m: M.yellow, pos: [-0.72, 0.42, FRAME.depth / 2 + 0.042] },
  ];

  const pivot = new Group();
  const mirrorPivot = new Group();
  for (const part of parts) {
    const add = (group, mirror) => {
      const m = new Mesh(part.geo, mat(part.m, mirror));
      if (part.pos) m.position.set(...part.pos);
      if (part.rot) m.rotation.set(...part.rot);
      if (part.order) m.renderOrder = part.order;
      group.add(m);
      return m;
    };
    add(pivot, false);
    if (high && part.m !== M.pane) add(mirrorPivot, true);
  }
  scene.add(pivot);

  const mirror = new Group();
  mirror.position.y = 2 * FLOOR_Y;
  mirror.scale.y = -1;
  mirror.add(mirrorPivot);
  if (high) scene.add(mirror);

  // ── The room ──
  const roomGeo = new BufferGeometry();
  {
    const pos = [], nor = [], idx = [];
    let base = 0;
    for (const s of slabs()) {
      const b = new BoxGeometry(s.w, s.h, s.d);
      b.translate(s.x, FLOOR_Y + s.h / 2 + s.y, s.z);
      pos.push(...b.attributes.position.array); nor.push(...b.attributes.normal.array);
      for (const i of b.index.array) idx.push(i + base);
      base += b.attributes.position.count;
      b.dispose();
    }
    roomGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    roomGeo.setAttribute('normal', new Float32BufferAttribute(nor, 3));
    roomGeo.setIndex(idx);
  }
  const room = new Mesh(roomGeo, mat({ base: [0.014, 0.016, 0.024], metal: 0, rough: 0.6, lit: 0.02, room: true }));
  scene.add(room);

  const floor = new Mesh(new PlaneGeometry(90, 90), mat({ base: [0.006, 0.007, 0.01], metal: 0, rough: 0.3, floor: true, transparent: true, lit: 0.004 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floor.renderOrder = 1;
  scene.add(floor);
  // The floor has to draw after the reflection and before the sculpture.
  mirrorPivot.traverse((o) => { o.renderOrder = 0; });
  pivot.traverse((o) => { if (o.isMesh && !o.renderOrder) o.renderOrder = 3; });
  room.renderOrder = 0;

  // The opening at the far end of the corridor.
  const slit = new Mesh(new PlaneGeometry(0.34, 15), mat({ flat: BLUE_SRGB }));
  slit.position.set(-0.9, FLOOR_Y + 7.5, -24.4);
  scene.add(slit);
  const key = new Mesh(new PlaneGeometry(0.06, 3.2), mat({ flat: YELLOW_SRGB }));
  key.position.set(7.0, FLOOR_Y + 1.6, -14.6 + 1.14);
  if (high) scene.add(key);

  const glowMat = (color, power, stretch = 1) => new ShaderMaterial({
    vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uColor: { value: color.clone() }, uPower: { value: power }, uStretch: { value: stretch } },
  });
  const blueCol = new Vector3(linear(22 / 255), linear(45 / 255), linear(175 / 255));
  const backGlow = new Mesh(new PlaneGeometry(13, 13), glowMat(blueCol, 2.3));
  backGlow.renderOrder = 2;
  scene.add(backGlow);
  const slitGlow = new Mesh(new PlaneGeometry(20, 24), glowMat(blueCol.clone().multiplyScalar(0.8), 2.6, 0.72));
  slitGlow.position.set(-0.9, FLOOR_Y + 8, -24);
  scene.add(slitGlow);

  // ── State ──
  let portrait = false;
  const current = stateFor('hero', false);
  // Offsets laid over the state by idle movement and the pointer. Never stored in the state itself.
  const live = { yaw: 0, pitch: 0, pointerX: 0, pointerY: 0, tx: 0, ty: 0, lightBoost: 0 };
  const motion = { idle: !still };

  const apply = () => {
    const s = current;
    pivot.position.set(s.cx, s.cy, s.cz);
    pivot.scale.setScalar(s.scale);
    pivot.rotation.set(s.rx + live.pitch + live.pointerY, s.ry + live.yaw + live.pointerX, s.rz);
    mirrorPivot.position.copy(pivot.position);
    mirrorPivot.scale.copy(pivot.scale);
    mirrorPivot.rotation.copy(pivot.rotation);

    camera.fov = s.fov;
    camera.position.set(s.camX, s.camY, s.camZ);
    camera.lookAt(s.lookX, s.lookY, s.lookZ);
    camera.updateProjectionMatrix();

    const boost = 1 + live.lightBoost * 0.14;
    rig.uKeyC.value.set(3.4, 3.3, 3.2).multiplyScalar(s.key);
    rig.uKeyD.value.set(s.cx - 2.3 * s.scale, s.cy + 2.9 * s.scale, s.cz + 3.2);
    rig.uFillC.value.set(0.2, 0.22, 0.32).multiplyScalar(s.fill);
    rig.uRimC.value.set(2.4, 2.7, 3.6).multiplyScalar(s.rim);
    rig.uEnv.value = s.env;
    rig.uSlitC.value.copy(blueCol).multiplyScalar(2.2 * s.arch);
    // The blue and yellow lights keep the brand hue and only change in strength.
    rig.uBlueC.value.copy(blueCol).multiplyScalar(9 * s.blue * boost);
    rig.uBlueP.value.set(s.cx - 1.1 * s.scale, s.cy - 0.9 * s.scale, s.cz + 1.6);
    rig.uEnvBlue.value.copy(blueCol).multiplyScalar(1.1 * s.blue * boost);
    rig.uYelC.value.set(YELLOW.r, YELLOW.g, YELLOW.b).multiplyScalar(3.6 * s.yellow);
    rig.uYelP.value.set(s.cx + 0.9 * s.scale, s.cy + 1.5 * s.scale, s.cz + 0.9);

    backGlow.position.set(s.cx - 0.2, s.cy - 0.1, s.cz - 2.6);
    backGlow.quaternion.copy(camera.quaternion);
    backGlow.material.uniforms.uColor.value.copy(blueCol).multiplyScalar(0.46 * s.glow);
    slitGlow.quaternion.copy(camera.quaternion);
    slitGlow.material.uniforms.uColor.value.copy(blueCol).multiplyScalar(0.62 * s.arch);
  };

  // ── Rendering ──
  let w = 0, h = 0, dpr = 1, dprCap = high ? 1.75 : 1.4;
  const resize = () => {
    const r = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : { width: innerWidth, height: innerHeight };
    w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const was = portrait;
    portrait = h > w * 1.02;
    return was !== portrait;
  };

  let running = false, raf = 0, last = 0, clock = 0, slowFrames = 0, frameCount = 0;
  const TAU_POINTER = 0.45 / 3; // 450 ms to settle: three time constants
  const frame = (now) => {
    raf = 0;
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.1) || 0.016;
    last = now;
    clock += dt;
    if (motion.idle) {
      // Roughly a 12 s cycle. It swings and returns, so the silhouette stays composed.
      live.yaw = Math.sin((clock * Math.PI * 2) / 12) * 0.2;
      live.pitch = Math.sin((clock * Math.PI * 2) / 31) * 0.035;
    }
    const k = 1 - Math.exp(-dt / TAU_POINTER);
    live.pointerX += (live.tx - live.pointerX) * k;
    live.pointerY += (live.ty - live.pointerY) * k;
    live.lightBoost += ((Math.abs(live.tx) + Math.abs(live.ty)) * 6 - live.lightBoost) * k;
    apply();
    renderer.render(scene, camera);
    // Adaptive resolution: if a device cannot hold the frame rate, render fewer pixels rather than drop frames.
    frameCount++;
    if (frameCount > 30 && dt > 0.03) slowFrames++;
    if (slowFrames > 30 && dprCap > 1) { dprCap = Math.max(1, dprCap - 0.25); slowFrames = 0; resize(); }
    raf = requestAnimationFrame(frame);
  };

  const api = {
    renderer,
    set(name) { Object.assign(current, stateFor(name, portrait)); apply(); },
    state: current,
    isPortrait: () => portrait,
    for: (name) => stateFor(name, portrait),
    keys: KEYS,
    // Pointer position in -1..1. Maximum 5 degrees each way.
    pointer(x, y) { const max = (5 * Math.PI) / 180; live.tx = x * max; live.ty = y * max * 0.8; },
    resize() { const changed = resize(); apply(); if (!running) renderer.render(scene, camera); return changed; },
    render() { apply(); renderer.render(scene, camera); },
    play() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    setIdle(v) { motion.idle = v; if (!v) { live.yaw = 0; live.pitch = 0; } },
    get running() { return running; },
    dispose() { api.pause(); renderer.dispose(); },
  };

  resize();
  apply();
  return api;
}
