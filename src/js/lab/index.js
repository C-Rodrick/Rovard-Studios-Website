// Creative Dimension: each study starts when it scrolls into view and stops when it leaves.
// Only one is ever running. Reduced motion or the pause control leaves a single still frame.
import { $$, REDUCED } from '../config.js';
import { isPaused, onPause } from '../prefs.js';

const STUDIES = {
  field: () => import('./field.js'),
  specimen: () => import('./specimen.js'),
  particles: () => import('./particles.js'),
  weight: () => import('./weight.js'),
  blocks: () => import('./blocks.js'),
};

export function initLab() {
  const items = $$('[data-study]').map((el) => ({ el, name: el.dataset.study, inst: null, loading: false, seen: false }));
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
  items.forEach((i) => io.observe(i.el));
  onPause((p) => { if (p) stopAll(); else if (current) startOne(current); });
}
