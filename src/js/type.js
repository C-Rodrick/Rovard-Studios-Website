// Kinetic type. Three moves only, kept apart on purpose:
//   [data-split="chars"]  hero lines, character rise
//   [data-split="lines"]  masked line rise, for section headlines
//   [data-read]           words go from dim to full as you scroll, for one statement per page
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { $$, DUR, EASE, STAGGER, FINE, html } from './config.js';

gsap.registerPlugin(SplitText);

export function heroType(root = document) {
  const lines = $$('[data-split="chars"]', root);
  if (!lines.length) return;
  const heading = lines[0].closest('h1');
  if (heading && !heading.hasAttribute('aria-label')) heading.setAttribute('aria-label', heading.textContent.replace(/\s+/g, ' ').trim());
  const splits = lines.map((l) => SplitText.create(l, { type: 'chars', mask: 'chars', charsClass: 'ch', aria: 'hidden' }));
  const tl = gsap.timeline();
  splits.forEach((s, i) => tl.from(s.chars, { yPercent: 115, duration: DUR.slow, ease: EASE.out, stagger: STAGGER.chars }, i * 0.1));
  const after = $$('[data-hero-after]');
  if (after.length) tl.fromTo(after, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: DUR.base, ease: EASE.soft, stagger: STAGGER.items, clearProps: 'transform,opacity' }, '-=.75');
  if (FINE) weightField(lines);
}

// The headline's weight responds to the pointer: Syne's variable axis is the whole effect.
function weightField(lines) {
  const chars = lines.flatMap((l) => $$('.ch', l));
  const hero = lines[0].closest('section');
  let pos = [], raf = 0, px = -1e4, py = -1e4;
  const measure = () => { pos = chars.map((c) => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2 + scrollY]; }); };
  const draw = () => {
    raf = 0;
    chars.forEach((c, i) => {
      const d = Math.hypot(px - pos[i][0], py + scrollY - pos[i][1]);
      const w = Math.round(640 + 160 * Math.max(0, 1 - d / 240));
      if (c._w !== w) { c._w = w; c.style.fontWeight = w; }
    });
  };
  const kick = () => { if (!raf && !html.classList.contains('motion-off')) raf = requestAnimationFrame(draw); };
  addEventListener('resize', () => { pos = []; }, { passive: true });
  hero.addEventListener('pointermove', (e) => { if (!pos.length) measure(); px = e.clientX; py = e.clientY; kick(); }, { passive: true });
  hero.addEventListener('pointerleave', () => { px = py = -1e4; kick(); });
}

export function headlines() {
  $$('[data-split="lines"]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 105, duration: DUR.slow, ease: EASE.out, stagger: STAGGER.lines,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }),
    });
  });
  $$('[data-read]').forEach((el) => {
    const s = SplitText.create(el, { type: 'words', wordsClass: 'rw' });
    gsap.fromTo(s.words, { opacity: 0.45 }, {   // never below large-text contrast, even if you stop mid-scroll
      opacity: 1, stagger: STAGGER.words, ease: EASE.none,
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: 0.4 },
    });
  });
}
