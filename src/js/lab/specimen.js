// Study 02, Core Specimen: the same object as the homepage, on a table, with its states exposed as buttons.
import { createCore } from '../core/core.js';

const POSES = {
  fluid: { x: 0, y: 0, s: .62, rx: -.1, ry: .3, fluid: 1, strata: 0, block: 0, seed: 0, r: 0, burst: .1, tint: .16, rough: .08, dust: .7 },
  strata: { x: 0, y: 0, s: .6, rx: .25, ry: .6, fluid: 0, strata: 1, block: 0, seed: 0, r: 0, burst: .3, tint: .2, rough: .16, dust: .5 },
  block: { x: 0, y: 0, s: .56, rx: -.08, ry: -.32, fluid: 0, strata: 0, block: 1, seed: 0, r: 1, burst: 0, tint: 1, rough: .26, dust: .3 },
  seed: { x: 0, y: 0, s: .34, rx: 0, ry: 0, fluid: .1, strata: 0, block: 0, seed: .9, r: 0, burst: 1.2, tint: .05, rough: .05, dust: .9 },
};

export default async function specimen(stage, { still, root }) {
  const c = document.createElement('canvas');
  stage.appendChild(c);
  const small = innerWidth < 1024;
  const core = await createCore(c, small ? { detail: 24, dpr: 1.25, particles: 0, aa: false } : { detail: 56, dpr: 1.75, particles: 320 });
  core.jump(POSES.fluid);
  const btns = [...root.querySelectorAll('[data-pose]')];
  const set = (b) => {
    btns.forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    if (still) core.jump(POSES[b.dataset.pose]); else core.aim(POSES[b.dataset.pose]);
  };
  btns.forEach((b) => b.addEventListener('click', () => set(b)));
  const wire = root.querySelector('[data-wire]');
  if (wire) wire.addEventListener('click', () => { const on = wire.getAttribute('aria-pressed') !== 'true'; wire.setAttribute('aria-pressed', String(on)); core.setWire(on); });
  stage.addEventListener('pointermove', (e) => { const r = stage.getBoundingClientRect(); core.pointer.x = ((e.clientX - r.left) / r.width - .5) * 2.4; core.pointer.y = ((e.clientY - r.top) / r.height - .5) * 2; }, { passive: true });
  return { start() { core.setActive(true); }, stop() { core.setActive(false); } };
}
