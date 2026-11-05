// Scroll entrances. [data-reveal] is a quiet rise; [data-wipe] is the signature block wipe over images:
// a blue block (the logo's square) slides off and the picture is there. Nothing else animates in.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $$, DUR, EASE, STAGGER, html } from './config.js';

export function reveals() {
  gsap.set('[data-reveal]', { opacity: 0 });
  html.classList.add('fx');
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 92%', once: true,
    onEnter: (b) => gsap.fromTo(b, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: DUR.base + 0.2, ease: EASE.soft, stagger: STAGGER.items, overwrite: true, clearProps: 'transform,opacity' }),
  });
  $$('[data-wipe]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    const im = el.querySelector('img,video');
    tl.fromTo(el, { '--wipe': 1 }, { '--wipe': 0, duration: DUR.slow, ease: EASE.inOut });
    if (im) tl.fromTo(im, { scale: 1.12 }, { scale: 1, duration: DUR.epic, ease: EASE.out, clearProps: 'transform' }, 0.1);
  });
  $$('[data-drift]').forEach((el) => {
    const d = parseFloat(el.dataset.drift) || 8;
    gsap.fromTo(el, { yPercent: d }, { yPercent: -d, ease: EASE.none, scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
