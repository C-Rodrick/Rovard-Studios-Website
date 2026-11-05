// Motion language: one place for timing, easing and stagger. CSS mirrors these in src/css/tokens.css.
export const DUR = { fast: 0.25, base: 0.6, slow: 1.1, epic: 1.5 };
export const EASE = { out: 'expo.out', inOut: 'power4.inOut', soft: 'power2.out', none: 'none' };
export const STAGGER = { chars: 0.018, words: 0.035, lines: 0.09, items: 0.07 };

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const html = document.documentElement;
export const FR = html.lang === 'fr';
export const L = (en, fr) => (FR ? fr : en);
export const media = (q) => matchMedia(q).matches;
export const REDUCED = media('(prefers-reduced-motion: reduce)');
export const FINE = media('(hover: hover) and (pointer: fine)');
export const isPhone = () => innerWidth < 760;
