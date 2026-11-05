// Entry point. Each module owns one job; anything heavy (Three.js, the lab) is a dynamic import.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, REDUCED, html } from './config.js';
import { initPrefs } from './prefs.js';
import { initScroll, scrollTop } from './scroll.js';
import { initNav } from './nav.js';
import { initTransitions } from './transitions.js';
import { runIntro } from './intro.js';
import { heroType, headlines } from './type.js';
import { reveals } from './reveals.js';
import { initCursor } from './cursor.js';
import { initFilm, initLoops, initLightbox } from './media.js';
import { initForm } from './form.js';
import { initFilters, initUniverse } from './work.js';
import { initCapabilities } from './capabilities.js';

gsap.config({ nullTargetWarn: false });
ScrollTrigger.config({ ignoreMobileResize: true });
const isHome = document.body.classList.contains('home');

html.classList.add('ready');
initPrefs();
initNav();
initForm();
initFilm();
initLoops();
initLightbox();
initFilters();
initUniverse();
initCapabilities();
$$('[data-to-top]').forEach((b) => b.addEventListener('click', () => { scrollTop(); $('.logo')?.focus({ preventScroll: true }); }));

if (REDUCED) {
  // Reduced motion: no scroll-linked movement, no opening sequence. The Core stays a still image.
  html.classList.remove('is-intro');
  $('[data-intro]')?.remove();
} else {
  initScroll();
  initTransitions();
  initCursor();
  const start = () => {
    heroType();
    headlines();
    reveals();
    if (isHome) import('./home.js').then((m) => m.initHome());
  };
  const fonts = document.fonts?.ready || Promise.resolve();
  Promise.race([fonts, new Promise((r) => setTimeout(r, 800))]).then(() => runIntro(start));
}
if ($('[data-lab]')) import('./lab/index.js').then((m) => m.initLab());
