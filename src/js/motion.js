// Content motion: section and image reveals, subtle parallax and the process line.
// Everything is visible in the HTML. Hiding only ever happens here, after JavaScript has run,
// and only for what is still below the fold.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// GSAP versions of the CSS easing tokens.
const EASE_IN = 'expo.out'; // closest to cubic-bezier(.16, 1, .3, 1)
const SECTION_START = 'top 80%';

export function initMotion() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stairs = document.querySelector('[data-stairs]');
  if (reduced) return;

  const belowFold = (el) => el.getBoundingClientRect().top > innerHeight * 0.92;

  gsap.utils.toArray('[data-rv]').forEach((el) => {
    if (!belowFold(el)) return;
    gsap.set(el, { autoAlpha: 0, y: 24 });
    ScrollTrigger.create({
      trigger: el, start: SECTION_START, once: true,
      onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.78, ease: EASE_IN, clearProps: 'transform,opacity,visibility' }),
    });
  });

  // Portfolio items: the image opens with a mask, then its details follow. 90 ms between neighbours.
  const batchItems = gsap.utils.toArray('[data-ex]').filter(belowFold);
  batchItems.forEach((ex) => {
    const media = ex.querySelector('.ex-media, .wk-media');
    const img = media && media.querySelector('img');
    const meta = ex.querySelector('.ex-meta, .wk-meta');
    if (!media || !img) return;
    gsap.set(media, { clipPath: 'inset(0 0 99% 0)' });
    gsap.set(img, { scale: 1.04 });
    gsap.set(meta, { autoAlpha: 0, y: 12 });
  });
  ScrollTrigger.batch(batchItems, {
    start: SECTION_START, once: true,
    onEnter: (group) => group.forEach((ex, i) => {
      const media = ex.querySelector('.ex-media, .wk-media');
      const img = media && media.querySelector('img');
      const meta = ex.querySelector('.ex-meta, .wk-meta');
      const delay = i * 0.09;
      gsap.to(media, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, delay, ease: EASE_IN, clearProps: 'clipPath' });
      gsap.to(img, { scale: 1, duration: 0.8, delay, ease: EASE_IN, clearProps: 'transform' });
      gsap.to(meta, { autoAlpha: 1, y: 0, duration: 0.55, delay: delay + 0.18, ease: EASE_IN, clearProps: 'transform,opacity,visibility' });
    }),
  });

  // Parallax only on larger pointer devices, and never more than the brief's limits.
  gsap.matchMedia().add('(min-width: 861px) and (pointer: fine)', () => {
    gsap.utils.toArray('[data-px]').forEach((el) => {
      const d = parseFloat(el.dataset.px) || 0;
      gsap.fromTo(el, { y: -d / 2 }, { y: d / 2, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  if (stairs) {
    const line = stairs.querySelector('.stairs-line i');
    ScrollTrigger.create({
      trigger: stairs, start: 'top 75%', end: 'bottom 75%', scrub: true,
      onUpdate: (self) => line.style.setProperty('--p', self.progress.toFixed(3)),
    });
    line.style.setProperty('--p', '0');
  }

  // Filtering changes the height of the wall, and images landing changes nothing because they have sizes.
  addEventListener('oa:layout', () => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
}
