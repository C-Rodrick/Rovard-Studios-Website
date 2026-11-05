// Decides whether a page gets the live Core, loads it without getting in the way, and directs it.
// The still images in the HTML are the fallback, so failing here costs nothing but the movement.
const SEQUENCES = {
  // The one scroll timeline for the home page: [section selector, edge, state]. Only this moves the object.
  home: [
    ['.s-hero', 'top', 'hero'],
    ['.s-hero', 'mid', 'hero'],
    ['.s-phil', 'top', 'recede'],
    ['.s-phil', 'bottom', 'recede'],
    ['.s-work', 'mid', 'rest'],
    ['.s-cap', 'above', 'rest'],
    ['.s-cap', 'top', 'capabilities'],
    ['.s-cap', 'bottom', 'capabilities'],
    ['.s-studio', 'bottom-above', 'closing'],
    ['.s-close', 'top', 'closing'],
  ],
};

function smoother(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

function canRun() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const c = navigator.connection;
  if (c && c.saveData) return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    return !!gl;
  } catch (e) { return false; }
}

function tierFor() {
  const small = innerWidth < 900;
  const weak = (navigator.deviceMemory && navigator.deviceMemory < 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
  return small || weak ? 'low' : 'high';
}

export function initStage() {
  const holder = document.querySelector('[data-stage]');
  if (!holder || !canRun()) return;
  const canvas = holder.querySelector('canvas');
  let started = false;

  const start = async () => {
    if (started) return;
    started = true;
    try {
      const { createStage } = await import('../core/stage.js');
      const stage = createStage(canvas, { tier: tierFor() });
      canvas.addEventListener('webglcontextlost', () => { document.documentElement.classList.remove('gl'); stage.pause(); });
      direct(stage, holder);
    } catch (e) {
      // The stills are already showing.
    }
  };

  // Text and imagery first. The still already shows the same composition, so there is no rush:
  // the first sign of a person (pointer, touch, scroll, key) starts the 3D, or a quiet moment does.
  const small = innerWidth < 900;
  const idle = (fn, t) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: t }) : setTimeout(fn, t));
  const wake = () => idle(start, 300);
  const load = () => {
    setTimeout(() => idle(start, 1500), small ? 6000 : 4000);
    for (const ev of ['pointerdown', 'scroll', 'keydown', 'pointermove']) addEventListener(ev, wake, { once: true, passive: true });
  };
  if (document.readyState === 'complete') load(); else addEventListener('load', load, { once: true });
}

function direct(stage, holder) {
  const name = holder.dataset.stage;
  const seq = name === 'hero' ? SEQUENCES.home : null;
  const keys = stage.keys;
  const plates = [...document.querySelectorAll('[data-plate], .plate')];

  let stops = [];
  const measure = () => {
    if (!seq) return;
    const vh = innerHeight;
    stops = seq.map(([sel, edge, state]) => {
      const el = document.querySelector(sel);
      const r = el.getBoundingClientRect();
      const top = r.top + scrollY;
      let y = top;
      if (edge === 'mid') y = top + r.height * 0.5 - vh * 0.5;
      if (edge === 'top') y = top;
      if (edge === 'bottom') y = top + r.height - vh;
      if (edge === 'above') y = top - vh;
      if (edge === 'bottom-above') y = top + r.height - vh * 1.1;
      return { y, s: stage.for(state) };
    });
    stops.sort((a, b) => a.y - b.y);
  };

  let shown = scrollY;
  const place = (y) => {
    if (!seq) return;
    let i = 0;
    while (i < stops.length - 2 && y > stops[i + 1].y) i++;
    const a = stops[i], b = stops[i + 1];
    const t = b.y > a.y ? Math.min(1, Math.max(0, (y - a.y) / (b.y - a.y))) : 1;
    const e = smoother(t);
    for (const k of keys) stage.state[k] = a.s[k] + (b.s[k] - a.s[k]) * e;
  };

  // Rendering stops whenever a plate fully covers the room, or the tab is hidden.
  const covered = () => {
    const vh = innerHeight;
    for (const p of plates) {
      const r = p.getBoundingClientRect();
      if (r.top <= -130 && r.bottom >= vh) return true;
      if (r.top > vh) break;
    }
    return false;
  };
  let wantRun = false;
  const sync = () => {
    const should = !document.hidden && !covered();
    if (should !== wantRun) {
      wantRun = should;
      if (should) stage.play(); else stage.pause();
    }
  };

  if (seq) {
    measure();
    shown = scrollY;
    place(shown);
    const tick = () => {
      // A small lag so the object feels heavy. Scrolling itself stays native and immediate.
      if (wantRun) {
        shown += (scrollY - shown) * 0.14;
        if (Math.abs(scrollY - shown) < 0.2) shown = scrollY;
        place(shown);
      } else {
        shown = scrollY;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    addEventListener('load', measure);
    new ResizeObserver(measure).observe(document.body);
  } else {
    stage.set(name);
  }

  addEventListener('scroll', sync, { passive: true });
  document.addEventListener('visibilitychange', sync);
  // Phone address bars change the height while scrolling. That should not rebuild the canvas.
  let lastW = innerWidth, lastH = innerHeight;
  addEventListener('resize', () => {
    if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 130) return;
    lastW = innerWidth; lastH = innerHeight;
    stage.resize(); measure(); if (!seq) stage.set(name); sync();
  });

  // The pointer only matters while the room is on screen, and only with a real pointer.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      if (!wantRun) return;
      stage.pointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    }, { passive: true });
    document.addEventListener('pointerleave', () => stage.pointer(0, 0));
  }

  stage.render();
  // First frame exists, so the canvas can take over from the still.
  requestAnimationFrame(() => document.documentElement.classList.add('gl'));
  sync();
}
