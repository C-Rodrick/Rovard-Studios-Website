// Film player, ambient loops (off-screen = paused) and the gallery lightbox.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, REDUCED, isPhone } from './config.js';
import { isPaused, onPause } from './prefs.js';
import { lockScroll } from './scroll.js';

gsap.registerPlugin(ScrollTrigger);

export function initFilm() {
  const film = $('[data-film]');
  if (!film) return;
  const v = $('video', film), btn = $('[data-play]', film);
  btn.addEventListener('click', () => {
    film.classList.add('playing');
    v.controls = true;
    v.play().catch(() => {});
    v.focus();
  });
  new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) v.pause(); }, { threshold: 0.1 }).observe(film);
  if (!REDUCED && !isPhone()) {
    gsap.fromTo($('[data-film-frame]', film), { scale: 0.82 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: film, start: 'top 92%', end: 'top 12%', scrub: true } });
  }
}

export function initLoops() {
  const loops = $$('video[data-loop]');
  if (!loops.length || REDUCED) return;
  const seen = new Map();
  const sync = (v) => (seen.get(v) && !isPaused() ? v.play().catch(() => {}) : v.pause());
  const io = new IntersectionObserver((es) => es.forEach((e) => { seen.set(e.target, e.isIntersecting); sync(e.target); }), { threshold: 0.2 });
  loops.forEach((v) => io.observe(v));
  onPause(() => loops.forEach(sync));
}

export function initLightbox() {
  const lb = $('.lightbox');
  if (!lb) return;
  const items = $$('[data-full]'), im = $('img', lb), count = $('.lb-count', lb);
  if (!items.length) return;
  let i = 0, opener = null;
  const show = (n) => {
    i = (n + items.length) % items.length;
    im.src = items[i].dataset.full; im.alt = items[i].dataset.alt || '';
    count.textContent = `${i + 1} / ${items.length}`;
  };
  const close = () => { lb.hidden = true; lockScroll(false); opener && opener.focus({ preventScroll: true }); };
  items.forEach((b, n) => b.addEventListener('click', () => { opener = b; show(n); lb.hidden = false; lockScroll(true); $('.lb-close', lb).focus(); }));
  $('.lb-close', lb).addEventListener('click', close);
  $('.lb-prev', lb).addEventListener('click', () => show(i - 1));
  $('.lb-next', lb).addEventListener('click', () => show(i + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'Tab') { const f = $$('button', lb), k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  });
}
