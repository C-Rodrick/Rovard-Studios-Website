// Page transitions. Browsers with cross-document View Transitions get them from CSS (with a shared project image).
// Everyone else gets the blue block wipe. Either way, plain links keep working if this file never runs.
import gsap from 'gsap';
import { $, DUR, EASE, REDUCED, html } from './config.js';

const VT = 'onpagereveal' in window && CSS.supports('view-transition-name: a');
const KEY = 'rv-pt';

export function initTransitions() {
  const veil = $('[data-veil]');
  if (REDUCED || !veil) return;

  if (!VT && html.classList.contains('pt-in')) {
    gsap.set(veil, { display: 'block', yPercent: 0 });
    gsap.to(veil, { yPercent: -101, duration: DUR.slow, ease: EASE.inOut, delay: 0.05, onComplete: () => gsap.set(veil, { display: 'none' }) });
  }
  html.classList.remove('pt-in');
  addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(veil, { display: 'none' }); });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-no-pt')) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;

    if (VT) {
      const im = a.closest('[data-shared]')?.querySelector('img');
      if (im) im.style.viewTransitionName = 'project-image';
      return;   // the browser does the rest
    }
    e.preventDefault();
    try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode */ }
    gsap.set(veil, { display: 'block', yPercent: 101 });
    gsap.to(veil, { yPercent: 0, duration: DUR.base, ease: EASE.inOut, onComplete: () => { location.href = a.href; } });
    setTimeout(() => { location.href = a.href; }, 1200);
  });
}
