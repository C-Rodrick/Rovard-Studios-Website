// Lenis + ScrollTrigger on one clock. Native scrolling on touch and for reduced motion.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { REDUCED, html } from './config.js';

gsap.registerPlugin(ScrollTrigger);
export let lenis = null;

export function initScroll() {
  if (!REDUCED) {
    lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1, anchors: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || a.target === '_blank') return;
    const u = new URL(a.href, location.href);
    if (u.pathname !== location.pathname || !u.hash || u.hash === '#') return;
    const t = document.getElementById(decodeURIComponent(u.hash.slice(1)));
    if (!t) return;
    e.preventDefault();
    scrollToEl(t);
    history.pushState(null, '', u.hash);
    t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  });
}

export function scrollToEl(el, offset = -96) {
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.2 });
  else el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
}
export const scrollTop = () => (lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }));
export const lockScroll = (on) => { html.classList.toggle('locked', on); if (lenis) { on ? lenis.stop() : lenis.start(); } };
