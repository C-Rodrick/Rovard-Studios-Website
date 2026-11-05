// Capabilities list: the picture follows the row you are on. Rows are real links and carry their own text,
// so the image is a bonus, never the information.
import gsap from 'gsap';
import { $$, DUR, EASE, REDUCED } from './config.js';

export function initCapabilities() {
  const rows = $$('[data-cap]'), frames = $$('[data-cap-frame]');
  if (!rows.length || !frames.length) return;
  let cur = -1;
  const show = (i) => {
    if (i === cur) return;
    cur = i;
    rows.forEach((r, k) => r.classList.toggle('on', k === i));
    frames.forEach((f, k) => {
      if (REDUCED) { f.style.clipPath = k === i ? 'none' : 'inset(100% 0 0 0)'; return; }
      gsap.to(f, { clipPath: k === i ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)', duration: DUR.base, ease: EASE.inOut, overwrite: true });
    });
  };
  rows.forEach((r, i) => { r.addEventListener('pointerenter', () => show(i)); r.addEventListener('focusin', () => show(i)); });
  frames.forEach((f, k) => { f.style.clipPath = k === 0 ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)'; });
  show(0);
}
