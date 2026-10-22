/* ROVARD STUDIOS — animated version (motion layer). Runs after site.js.
   One rAF loop reads the scroll position and drives every scroll-linked effect (hero scroll-out, film zoom, type band,
   large-format circle, steps line, progress bar). Reveals use IntersectionObserver. Nothing runs for prefers-reduced-motion
   (the head script never sets html.mo then), and the mouse-only effects stay off on touch screens. */
(() => {
  'use strict';
  const root = document.documentElement;
  if (!root.classList.contains('mo')) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const FR = root.lang === 'fr';
  const L = (en, fr) => (FR ? fr : en);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Page-to-page curtain ─────────────────────────────────────────── */
  setTimeout(() => root.classList.remove('pt-in'), 1600);
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || /\.(mp4|pdf|jpe?g|png|webp|svg|zip)$/i.test(u.pathname)) return;
    if (u.pathname === location.pathname && u.search === location.search) return;   // same page (hash links are handled by site.js)
    e.preventDefault();
    try { sessionStorage.setItem('rv-pt', '1'); } catch (_) {}
    root.classList.add('pt-out');
    setTimeout(() => { location.href = u.href; }, 560);
  });
  addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('pt-out', 'pt-in'); });

  /* ── Masked image reveals ─────────────────────────────────────────── */
  const masks = $$('.pcard, .wc-media, .proj-hero, .g-item, .collage figure, .story-grid figure, .bcard img');
  masks.forEach(m => (m.tagName === 'IMG' ? m.parentElement : m).classList.add('mz'));
  $$('.car-track, .work-grid, .g-grid, .collage, .rel').forEach(g => $$('.mz', g).forEach((m, i) => m.style.setProperty('--md', (i % 4) * 0.09 + 's')));
  const mio = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const m = en.target; m.classList.add('mz-in'); mio.unobserve(m);
    setTimeout(() => m.classList.add('mz-done'), 1900);
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.mz').forEach(m => mio.observe(m));

  /* ── Scroll-linked effects ────────────────────────────────────────── */
  const prog = document.createElement('div'); prog.className = 'mo-prog'; prog.setAttribute('aria-hidden', 'true'); document.body.appendChild(prog);
  const heroIn = $('.hero-orig-in'), heroReel = $('.hero-reel');
  const pageHead = $('.ph .wrap, .proj-head .wrap');
  const zoom = $('[data-zoom]');
  const bands = $$('[data-band]');
  const lf = $('#large-format');
  const steps = $('.steps');
  // only measure what is near the screen
  const near = new Set();
  const nio = new IntersectionObserver(es => es.forEach(en => (en.isIntersecting ? near.add(en.target) : near.delete(en.target))), { rootMargin: '25% 0px' });
  [zoom, lf, steps, ...bands].forEach(el => el && nio.observe(el));

  let lastY = -1, lastH = 0, vel = 0, prevY = scrollY;
  const frame = () => {
    const y = scrollY, vh = innerHeight;
    vel += ((y - prevY) - vel) * 0.12; prevY = y;
    if (y !== lastY || vh !== lastH || Math.abs(vel) > 0.05) {
      lastY = y; lastH = vh;
      const max = document.documentElement.scrollHeight - vh;
      prog.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;

      // hero drifts up, shrinks a touch and fades as you leave it
      if (heroIn && y < vh * 1.2) {
        const p = clamp(y / (vh * 0.9));
        heroIn.style.transform = `translate3d(0, ${(y * 0.32).toFixed(1)}px, 0) scale(${(1 - p * 0.07).toFixed(4)})`;
        heroIn.style.opacity = (1 - p * 0.9).toFixed(3);
        if (heroReel) heroReel.style.setProperty('--rx', (y * 0.25).toFixed(1) + 'px');
      }
      if (pageHead && y < vh) {
        pageHead.style.transform = `translate3d(0, ${(y * 0.22).toFixed(1)}px, 0)`;
        pageHead.style.opacity = (1 - clamp(y / (vh * 0.8)) * 0.85).toFixed(3);
      }

      if (zoom && near.has(zoom)) {
        const r = zoom.getBoundingClientRect();
        const travel = r.height - vh;
        const z = travel > 0 ? clamp(-r.top / (travel * 0.8)) : clamp((vh - r.top) / vh);
        const e = 1 - Math.pow(1 - z, 3);
        zoom.style.setProperty('--z', e.toFixed(4));
      }

      bands.forEach(b => {
        if (!near.has(b)) return;
        const r = b.getBoundingClientRect();
        const p = (vh - r.top) / (vh + r.height);              // 0 as it enters, 1 as it leaves
        const dir = Number(b.dataset.band);
        b.style.transform = `translate3d(${(dir * (p - 0.5) * 40).toFixed(2)}vw, 0, 0) skewX(${clamp(-vel * 0.12, -8, 8).toFixed(2)}deg)`;
      });

      if (lf && near.has(lf)) {
        const r = lf.getBoundingClientRect();
        const p = clamp((vh - r.top) / (vh * 0.8));
        lf.style.setProperty('--k', Math.pow(1 - p, 2).toFixed(4));
      }

      if (steps && near.has(steps)) {
        const r = steps.getBoundingClientRect();
        steps.style.setProperty('--p', clamp((vh * 0.85 - r.top) / (vh * 0.5)).toFixed(3));
      }
    }
    requestAnimationFrame(frame);
  };
  if (heroReel) $$('.reel-row', heroReel).forEach((row, i) => { row.style.translate = `calc(var(--rx, 0px) * ${i ? 1 : -1}) 0`; });
  requestAnimationFrame(frame);

  /* ── Mouse only: cursor follower and magnetic buttons ─────────────── */
  if (!fine) return;
  const cur = document.createElement('div'); cur.className = 'cur'; cur.setAttribute('aria-hidden', 'true'); cur.innerHTML = '<b></b>';
  document.body.appendChild(cur);
  const label = $('b', cur);
  let mx = -100, my = -100, cx = -100, cy = -100;
  const pick = t => {
    if (t.closest('.film')) return $('.film.playing') ? null : L('Play', 'Lire');
    if (t.closest('.pcard, .wc-media, .g-item')) return L('View', 'Voir');
    if (t.closest('[data-car]')) return L('Drag', 'Glisser');
    return null;
  };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY; cur.classList.add('on');
    const t = e.target instanceof Element ? e.target : document.body;
    const word = pick(t);
    cur.classList.toggle('big', !!word);
    cur.classList.toggle('link', !word && !!t.closest('a, button, select, input, textarea, label'));
    if (word && label.textContent !== word) label.textContent = word;
  }, { passive: true });
  document.addEventListener('pointerleave', () => cur.classList.remove('on'));
  const follow = () => {
    cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
    cur.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);

  $$('.pill').forEach(p => {
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const step = () => {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      p.style.setProperty('--mx', x.toFixed(2) + 'px'); p.style.setProperty('--my', y.toFixed(2) + 'px');
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 ? requestAnimationFrame(step) : 0;
    };
    const go = () => { if (!raf) raf = requestAnimationFrame(step); };
    p.addEventListener('pointermove', e => {
      const r = p.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * 0.28; ty = (e.clientY - (r.top + r.height / 2)) * 0.4; go();
    });
    p.addEventListener('pointerleave', () => { tx = 0; ty = 0; go(); });
  });
})();
