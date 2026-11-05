// Header: hides on the way down, returns on the way up. Full-screen menu with focus trap, Escape and locked scroll.
import gsap from 'gsap';
import { $, $$, DUR, EASE, REDUCED, L } from './config.js';
import { lockScroll } from './scroll.js';

export function initNav() {
  const header = $('[data-header]'), btn = $('[data-menu-btn]'), panel = $('#menu');
  if (!header) return;

  let last = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    header.classList.toggle('is-solid', y > 40);
    if (!document.documentElement.classList.contains('menu-open')) header.classList.toggle('is-hidden', y > last && y > 240);
    last = y;
  }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  if (!btn || !panel) return;
  const page = [$('main'), $('footer')].filter(Boolean);
  const links = $$('a,button', panel);
  let open = false;
  const set = (v) => {
    open = v;
    document.documentElement.classList.toggle('menu-open', v);
    btn.setAttribute('aria-expanded', String(v));
    btn.setAttribute('aria-label', v ? L('Close menu', 'Fermer le menu') : L('Open menu', 'Ouvrir le menu'));
    panel.setAttribute('aria-hidden', String(!v));
    panel.inert = !v;
    page.forEach((el) => { el.inert = v; });
    lockScroll(v);
    if (v) {
      if (!REDUCED) gsap.fromTo($$('.m-link span', panel), { yPercent: 110 }, { yPercent: 0, duration: DUR.slow, ease: EASE.out, stagger: 0.05, delay: 0.25 });
      setTimeout(() => links[0] && links[0].focus({ preventScroll: true }), REDUCED ? 0 : 350);
    } else btn.focus({ preventScroll: true });
  };
  panel.inert = true;
  btn.addEventListener('click', () => set(!open));
  addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') set(false);
    if (e.key === 'Tab') {
      const items = [btn, ...links], i = items.indexOf(document.activeElement);
      const n = (i + (e.shiftKey ? -1 : 1) + items.length) % items.length;
      e.preventDefault(); items[n].focus();
    }
  });
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('pageshow', () => { if (open) set(false); });
}
