// Creative Dimension: each study starts when it scrolls into view and stops when it leaves.
// Only one is ever running. Reduced motion or the pause control leaves a single still frame.
import { $$, REDUCED } from '../config.js';
import { isPaused, onPause } from '../prefs.js';
import { hasRealGPU } from '../core/quality.js';

const STUDIES = {
  field: () => import('./field.js'),
  specimen: () => import('./specimen.js'),
  particles: () => import('./particles.js'),
  weight: () => import('./weight.js'),
  blocks: () => import('./blocks.js'),
};

const NEEDS_GPU = new Set(['field', 'specimen']);   // without a real GPU these stay as their poster images

export function initLab() {
  const gpu = hasRealGPU();
  $$('[data-study]').forEach((el) => { if (!gpu && NEEDS_GPU.has(el.dataset.study)) el.classList.add('still'); });
  const items = $$('[data-study]').filter((el) => gpu || !NEEDS_GPU.has(el.dataset.study)).map((el) => ({ el, name: el.dataset.study, inst: null, loading: false, seen: false }));
  let current = null;
  const stopAll = () => items.forEach((i) => i.inst && i.inst.stop());
  const startOne = async (item) => {
    if (!item.inst && !item.loading) {
      item.loading = true;
      try {
        const mod = await STUDIES[item.name]();
        item.inst = await mod.default(item.el.querySelector('[data-study-stage]'), { still: REDUCED, root: item.el });
        item.el.classList.add('live');
      } catch (e) {
        item.el.classList.add('failed');   // the poster image stays
      }
      item.loading = false;
    }
    if (item.inst && current === item && !REDUCED && !isPaused()) item.inst.start();
  };
  const pick = () => {
    const seen = items.filter((i) => i.seen);
    const next = seen.sort((a, b) => Math.abs(a.el.getBoundingClientRect().top) - Math.abs(b.el.getBoundingClientRect().top))[0] || null;
    if (next === current) return;
    stopAll();
    current = next;
    if (current) startOne(current);
  };
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { const it = items.find((i) => i.el === e.target); it.seen = e.isIntersecting; });
    pick();
  }, { threshold: 0.35 });
  // The page reads first; studies start once someone is actually here (first gesture, or after a moment).
  let begun = false;
  const begin = () => { if (begun) return; begun = true; items.forEach((i) => io.observe(i.el)); };
  ['scroll', 'pointermove', 'touchstart', 'keydown'].forEach((t) => addEventListener(t, begin, { once: true, passive: true }));
  setTimeout(begin, 4000);
  onPause((p) => { if (p) stopAll(); else if (current) startOne(current); });
}
