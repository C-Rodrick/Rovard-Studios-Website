// Homepage story. Scroll position picks the Core's next pose; the Core eases towards it on its own clock,
// so jumping around the page can never leave it in a broken state.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, DUR, EASE, FINE, html, isPhone } from './config.js';
import { isPaused, onPause } from './prefs.js';

gsap.registerPlugin(ScrollTrigger);

const P = {
  //              x      y      s    rx    ry   fluid strata block seed  r  burst tint rough dust
  hero:      { x: .5, y: .1, s: .52, rx: -.1, ry: .3, fluid: 1, strata: 0, block: 0, seed: 0, r: 0, burst: 0, tint: .16, rough: .08, dust: .8 },
  heroEnd:   { x: 0, y: -.05, s: .46, rx: .15, ry: .9, fluid: .85, strata: 0, block: .15, seed: 0, r: 0, burst: .3, tint: .3, rough: .1, dust: .6 },
  statement: { x: -.62, y: -.08, s: .36, rx: .25, ry: 1.8, fluid: .55, strata: 0, block: .45, seed: 0, r: 0, burst: .1, tint: .45, rough: .14, dust: .5 },
  idea:      { x: .44, y: 0, s: .17, rx: 0, ry: 0, fluid: .1, strata: 0, block: 0, seed: .9, r: 0, burst: 1.2, tint: .05, rough: .05, dust: .9 },
  thinking:  { x: .44, y: 0, s: .44, rx: .25, ry: .6, fluid: 0, strata: 1, block: 0, seed: 0, r: 0, burst: .4, tint: .2, rough: .16, dust: .5 },
  design:    { x: .44, y: 0, s: .42, rx: -.08, ry: -.32, fluid: 0, strata: 0, block: 1, seed: 0, r: 1, burst: 0, tint: 1, rough: .26, dust: .3 },
  experience: { x: .44, y: 0, s: .52, rx: .1, ry: .45, fluid: .55, strata: 0, block: .45, seed: 0, r: 0, burst: 1.6, tint: .3, rough: .08, dust: .95 },
  cta:       { x: .52, y: 0, s: .46, rx: -.06, ry: -.34, fluid: 0, strata: 0, block: 1, seed: 0, r: 1, burst: 0, tint: 1, rough: .22, dust: 0 },
};
const PHONE = {
  hero: { x: 0, y: .46, s: .5 }, heroEnd: { x: 0, y: .9, s: .4 }, statement: { x: .9, y: .9, s: .3 },
  cta: { x: .1, y: -.62, s: .42 },
};
const pose = (k) => (isPhone() && PHONE[k] ? { ...P[k], ...PHONE[k] } : P[k]);
const lerpPose = (a, b, t) => { const o = {}; for (const k in a) o[k] = a[k] + (b[k] - a[k]) * t; return o; };

function chain(keys, t) {
  const n = keys.length - 1, f = Math.min(n - 1e-4, Math.max(0, t) * n), i = Math.floor(f), u = f - i;
  const s = u * u * (3 - 2 * u);
  return lerpPose(pose(keys[i]), pose(keys[i + 1]), s);
}

async function bootCore() {
  const canvas = $('[data-core-canvas]');
  if (!canvas) return null;
  const { createCore, coreQuality } = await import('./core/core.js');
  const q = coreQuality();
  if (!q) return null;
  const keep = /[?&]core=poster/.test(location.search);
  const core = await createCore(canvas, { ...q, keep });
  core.jump(pose('hero'));
  return core;
}

export function initHome() {
  processFallback();
  const zones = $$('[data-core-zone]');
  let core = null;
  const visible = new Set();
  const syncActive = () => {
    const on = visible.size > 0;
    html.classList.toggle('core-on', on && !!core);
    if (core) core.setActive(on);
  };
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    syncActive();
  }, { rootMargin: '10% 0px' });
  zones.forEach((z) => io.observe(z));

  // the stage colour behind the closing section
  const cta = $('[data-stage="yellow"]');
  if (cta) new IntersectionObserver(([e]) => html.classList.toggle('stage-yellow', e.isIntersecting), { rootMargin: '0px 0px 2% 0px' }).observe(cta);

  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
  const start = () => bootCore().then((c) => {
    if (!c) return;
    core = c;
    window.__rovardCore = c;
    core.setPaused(isPaused());
    onPause((v) => { core.setPaused(v); core.render(); });
    core.onDegrade(() => { html.classList.remove('core-live'); html.classList.add('core-dead'); core.setActive(false); core.dispose(); core = null; });
    html.classList.add('core-live');
    gsap.fromTo('[data-core-canvas]', { opacity: 0 }, { opacity: 1, duration: DUR.slow, ease: EASE.soft });
    syncActive();
    wire(c);
    ScrollTrigger.refresh();
  }).catch(() => { /* keep the still image */ });
  idle(start, { timeout: 2000 });
}

function wire(core) {
  const hero = $('[data-sec="hero"]'), st = $('[data-sec="statement"]'), proc = $('[data-sec="process"]'), cta = $('[data-stage="yellow"]');
  if (hero && st) {
    ScrollTrigger.create({ trigger: hero, start: 'top top', endTrigger: st, end: 'bottom top', onUpdate: (s) => core.aim(chain(['hero', 'heroEnd', 'statement', 'statement'], s.progress)), onEnter: () => core.aim(pose('hero')), onEnterBack: () => core.aim(pose('statement')) });
  }
  if (proc && !isPhone()) processPin(proc, core);
  if (cta) ScrollTrigger.create({ trigger: cta, start: 'top 90%', end: 'bottom top', onToggle: (s) => { if (s.isActive) core.aim(pose('cta')); } });
  if (FINE) addEventListener('pointermove', (e) => { core.pointer.x = (e.clientX / innerWidth - 0.5) * 2; core.pointer.y = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  const pinTop = $('[data-sec="hero"]');
  if (pinTop && scrollY < innerHeight / 2) core.jump(pose('hero'));
}

// Desktop with a live Core: the four stages share one pinned frame and the object morphs between them.
function processPin(sec, core) {
  const stages = $$('[data-stage-item]', sec), keys = ['idea', 'thinking', 'design', 'experience'], dots = $$('[data-stage-dot]', sec);
  sec.classList.add('is-pinned');
  let cur = -1;
  const show = (i) => {
    if (i === cur) return;
    stages.forEach((s, k) => {
      gsap.to(s, { autoAlpha: k === i ? 1 : 0, y: k === i ? 0 : (k < i ? -28 : 28), duration: DUR.base, ease: EASE.out, overwrite: true });
    });
    dots.forEach((d, k) => { d.classList.toggle('on', k <= i); });
    cur = i;
  };
  gsap.set(stages, { autoAlpha: 0, y: 28 });
  show(0);
  ScrollTrigger.create({
    trigger: sec, pin: $('[data-process-frame]', sec), start: 'top top', end: () => `+=${innerHeight * 2.1}`, anticipatePin: 1,
    onUpdate: (s) => {
      const t = s.progress;
      core.aim(chain(keys, t));
      show(Math.min(stages.length - 1, Math.floor(t * stages.length)));
    },
    onEnter: () => core.aim(pose('idea')), onEnterBack: () => core.aim(pose('experience')),
  });
}

// No live Core (reduced data, weak GPU, phone): the stages stack and each shows a still of the same object.
function processFallback() {
  $$('[data-stage-item] img').forEach((im) => { im.loading = 'lazy'; });
}
