// Opening sequence: first visit only, about 1.4 seconds, skippable. The page underneath is already usable.
// A CSS animation removes the overlay if this file fails. No progress bar: nothing is being waited for.
import gsap from 'gsap';
import { $, $$, html, EASE } from './config.js';

export function runIntro(onReveal) {
  const el = $('[data-intro]');
  if (!el || !html.classList.contains('is-intro')) { el?.remove(); onReveal(); return; }
  let revealed = false;
  const reveal = () => { if (!revealed) { revealed = true; onReveal(); } };
  const tl = gsap.timeline({ onComplete: () => { el.remove(); html.classList.remove('is-intro'); removeEventListener('keydown', skip); }, defaults: { ease: EASE.inOut } });
  function skip() { reveal(); tl.progress(1); }
  addEventListener('keydown', skip, { once: true });
  el.addEventListener('click', skip, { once: true });

  el.classList.add('run');
  const block = $('.i-block', el), r = $('.i-r', el), tick = $('.i-tick', el), letters = $$('.i-w', el);
  tl.fromTo(block, { scaleX: 0 }, { scaleX: 1, duration: 0.45 })
    .fromTo(r, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.35, ease: EASE.out }, '-=.1')
    .fromTo(tick, { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: EASE.out }, '-=.2')
    .fromTo(letters, { yPercent: 110 }, { yPercent: 0, duration: 0.4, stagger: 0.05, ease: EASE.out }, '-=.3')
    .add(reveal, '+=.02')
    .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.6 }, '<');
}
