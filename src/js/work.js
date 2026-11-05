// Work page: Brand Universe (a spatial wall of real projects, drag or tab through it), filters and the index.
// The plain project index below it is always there, so nothing depends on the wall.
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, DUR, EASE, FINE, REDUCED, isPhone } from './config.js';

gsap.registerPlugin(Flip, ScrollTrigger);

export function initFilters() {
  const btns = $$('[data-filter]');
  if (!btns.length) return;
  const cards = $$('[data-kind]'), counts = $('[data-result-count]');
  const apply = (b) => {
    const axis = b.dataset.axis || 'kind', value = b.dataset.filter;
    btns.forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    const state = REDUCED ? null : Flip.getState(cards);
    let n = 0;
    cards.forEach((c) => { const show = value === 'all' || c.dataset[axis] === value; c.hidden = !show; if (show) n++; });
    if (counts) counts.textContent = String(n);
    if (state) Flip.from(state, { duration: DUR.base, ease: EASE.out, onEnter: (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: DUR.fast }), onComplete: () => ScrollTrigger.refresh() });
    else ScrollTrigger.refresh();
  };
  btns.forEach((b) => b.addEventListener('click', () => apply(b)));
}

export function initUniverse() {
  const root = $('[data-universe]');
  if (!root) return;
  // Touch, phones, reduced motion and no-JS all get the native horizontal scroller from CSS. See .universe in pages.css.
  if (REDUCED || isPhone() || !FINE) return;
  root.classList.add('is-live');
  const world = $('[data-world]', root), items = $$('[data-u]', root);
  let tx = 0, ty = 0, cx = 0, cy = 0, drag = null, moved = 0, visible = false, raf = 0;
  const limits = () => [Math.max(0, (world.offsetWidth - root.clientWidth) / 2), Math.max(0, (world.offsetHeight - root.clientHeight) / 2)];
  const clamp = () => { const [mx, my] = limits(); tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty)); };
  const frame = () => {
    cx += (tx - cx) * 0.09; cy += (ty - cy) * 0.09;
    world.style.transform = `translate(-50%, -50%) translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    items.forEach((el) => {
      const z = +el.dataset.z;
      el.style.transform = `translate3d(${(cx * z).toFixed(1)}px, ${(cy * z).toFixed(1)}px, 0)`;
    });
    raf = visible && (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1 || drag) ? requestAnimationFrame(frame) : 0;
  };
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(root);

  root.addEventListener('pointerdown', (e) => { drag = { x: e.clientX - tx, y: e.clientY - ty }; moved = 0; root.classList.add('grabbing'); kick(); });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    moved += Math.abs(e.movementX) + Math.abs(e.movementY);
    tx = e.clientX - drag.x; ty = e.clientY - drag.y; clamp(); kick();
  }, { passive: true });
  addEventListener('pointerup', () => { drag = null; root.classList.remove('grabbing'); });
  root.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  root.addEventListener('dragstart', (e) => e.preventDefault());
  // keyboard: tabbing to a project brings it to the centre
  root.addEventListener('focusin', (e) => {
    const a = e.target.closest('[data-u]');
    if (!a) return;
    root.scrollLeft = 0; root.scrollTop = 0;
    tx = world.offsetWidth / 2 - (a.offsetLeft + a.offsetWidth / 2); ty = world.offsetHeight / 2 - (a.offsetTop + a.offsetHeight / 2); clamp(); kick();
  });
  world.style.transform = 'translate(-50%, -50%)';
  gsap.from(items, { opacity: 0, scale: 0.9, duration: DUR.slow, ease: EASE.out, stagger: 0.04, delay: 0.25, clearProps: 'opacity,scale' });
}
