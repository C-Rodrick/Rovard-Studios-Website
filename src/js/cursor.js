// A context label that follows the pointer over project links. The native cursor stays. Mouse only.
import gsap from 'gsap';
import { $, FINE, L } from './config.js';

export function initCursor() {
  const tag = $('[data-cursor]');
  if (!tag || !FINE) return;
  const x = gsap.quickTo(tag, 'x', { duration: 0.25, ease: 'power3' }), y = gsap.quickTo(tag, 'y', { duration: 0.25, ease: 'power3' });
  addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const c = e.target.closest('[data-cursor-label]');
    tag.classList.toggle('on', !!c);
    if (c) tag.textContent = c.dataset.cursorLabel || L('View', 'Voir');
  }, { passive: true });
}
