// Scroll entrances. [data-reveal] is a quiet rise; [data-wipe] is the signature block wipe over images:
// a blue block (the logo's square) slides off and the picture is there. Nothing else animates in.
// These use one IntersectionObserver rather than a ScrollTrigger each: nothing is measured until it is needed,
// which is most of what keeps the page responsive while it loads on a phone.
import gsap from 'gsap';
import { $$, DUR, EASE, STAGGER, html } from './config.js';

export function onceInView(els, fn, rootMargin = '0px 0px -8% 0px') {
  const io = new IntersectionObserver((entries) => {
    const seen = entries.filter((e) => e.isIntersecting).map((e) => e.target);
    seen.forEach((el) => io.unobserve(el));
    if (seen.length) fn(seen);
  }, { rootMargin });
  els.forEach((el) => io.observe(el));
}

export function reveals() {
  html.classList.add('fx');
  onceInView($$('[data-reveal]'), (batch) => {
    gsap.fromTo(batch, { opacity: 0, y: 22 }, {
      opacity: 1, y: 0, duration: DUR.base + 0.2, ease: EASE.soft, stagger: STAGGER.items,
      onStart: () => batch.forEach((el) => el.classList.add('in')), clearProps: 'transform,opacity',
    });
  });
  onceInView($$('[data-wipe]'), (batch) => batch.forEach((el) => {
    const im = el.querySelector('img,video');
    const tl = gsap.timeline({ onComplete: () => el.classList.add('in') });
    tl.fromTo(el, { '--wipe': 1 }, { '--wipe': 0, duration: DUR.slow, ease: EASE.inOut });
    if (im) tl.fromTo(im, { scale: 1.12 }, { scale: 1, duration: DUR.epic, ease: EASE.out, clearProps: 'transform' }, 0.1);
  }), '0px 0px -10% 0px');
}
