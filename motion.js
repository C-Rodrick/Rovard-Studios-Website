/* =============================================================================
   ROVARD MOTION — vanilla edition v1.0
   The vanilla port of RovardMotion.jsx. Zero dependencies. Upgrades the
   site's existing cursor, magnetic and reveal systems with spring physics,
   adds a scroll progress bar, masked word-reveals, 3D tilt, scroll-velocity
   marquee skew, hero parallax, header auto-hide and a project-coloured
   panel curtain for case-study transitions.

   Everything respects `prefers-reduced-motion` and touch devices.
   ========================================================================== */

(() => {
  'use strict';

  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerFine = window.matchMedia('(pointer: fine)').matches;
  const reduced = () => reducedQuery.matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── Styles ─────────────────────────────────────────────────────────────── */

  const STYLES = `
:root { --rm-ease-out: cubic-bezier(0.22, 1, 0.36, 1); --rm-ease-in-out: cubic-bezier(0.83, 0, 0.17, 1); }

/* Scroll progress */
.rm-progress {
  position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 9600;
  pointer-events: none;
}
.rm-progress i {
  display: block; height: 100%; transform: scaleX(0); transform-origin: 0 50%;
  background: linear-gradient(90deg, var(--blue, #162daf), var(--yellow, #f5cc00));
  will-change: transform;
}

/* Designer cursor */
.rm-cursor-dot, .rm-cursor-ring {
  position: fixed; left: 0; top: 0; pointer-events: none; border-radius: 999px;
  will-change: transform; z-index: 10001;
}
.rm-cursor-dot {
  width: 7px; height: 7px; background: #fff; mix-blend-mode: difference;
}
.rm-cursor-ring {
  width: 38px; height: 38px; border: 1.5px solid #fff; mix-blend-mode: difference;
  display: flex; align-items: center; justify-content: center;
  transition: width .35s var(--rm-ease-out), height .35s var(--rm-ease-out),
              background-color .35s var(--rm-ease-out), border-color .35s var(--rm-ease-out),
              opacity .3s ease;
  opacity: 0;
}
.rm-cursor-ring.is-visible { opacity: 1; }
.rm-cursor-ring.is-active { width: 58px; height: 58px; }
.rm-cursor-ring.is-label {
  width: auto; height: auto; padding: 12px 20px; border-color: transparent;
  background: var(--deep-blue, #162daf); mix-blend-mode: normal;
  box-shadow: 0 10px 30px rgba(10, 10, 40, .25);
}
.rm-cursor-label {
  font: 700 10px/1 'Space Grotesk', sans-serif; letter-spacing: .18em;
  text-transform: uppercase; color: #fff; white-space: nowrap;
}
.rm-cursor-dot.is-hidden, .rm-cursor-ring.is-hidden { opacity: 0; }

/* Masked word reveals */
.rm-split .rm-word-mask {
  display: inline-block; overflow: hidden; vertical-align: bottom;
  padding-bottom: .14em; margin-bottom: -.14em;
}
.rm-split .rm-word {
  display: inline-block; transform: translateY(118%);
  transition: transform .95s var(--rm-ease-out);
  will-change: transform;
}
.rm-split.rm-words-in .rm-word { transform: translateY(0); }

/* Tilt */
.rm-tilt { transform-style: preserve-3d; will-change: transform; position: relative; }
.rm-tilt::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  opacity: 0; transition: opacity .45s var(--rm-ease-out);
  background: radial-gradient(420px circle at var(--rm-gx, 50%) var(--rm-gy, 50%),
    rgba(255, 255, 255, 0.16), transparent 62%);
}
.rm-tilt:hover::after { opacity: 1; }

/* Curtain transition */
.rm-curtain {
  position: fixed; inset: 0; z-index: 6500; display: flex; pointer-events: none;
}
.rm-curtain span {
  flex: 1; transform: scaleY(0); transform-origin: bottom;
  transition: transform .42s var(--rm-ease-in-out);
  transition-delay: calc(var(--rm-i) * 55ms);
}
.rm-curtain.is-cover span { transform: scaleY(1); }
.rm-curtain.is-reveal span { transform-origin: top; transform: scaleY(0); transition-delay: calc((var(--rm-n) - 1 - var(--rm-i)) * 55ms); }

/* Header auto-hide */
.site-header { will-change: transform; }
.site-header.is-hidden { transform: translateY(-110%); }

@media (max-width: 640px) {
  .site-header { transition: background .45s, border-color .45s, height .45s var(--ease), transform .45s var(--ease); }
}

@media (prefers-reduced-motion: reduce) {
  .rm-split .rm-word { transform: none !important; transition: none !important; }
  .rm-curtain span { transition-duration: .01ms !important; }
  .rm-progress i { transition: none !important; }
}
`;

  function injectStyles() {
    if (document.getElementById('rovard-motion-styles')) return;
    const tag = document.createElement('style');
    tag.id = 'rovard-motion-styles';
    tag.textContent = STYLES;
    document.head.appendChild(tag);
  }

  /* ── Spring physics ─────────────────────────────────────────────────────── */

  function createSpringValue(initial, { stiffness = 170, damping = 22, mass = 1 } = {}) {
    let value = initial;
    let target = initial;
    let velocity = 0;
    let raf = null;
    let last = 0;
    let listener = null;

    const step = now => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      velocity += ((-stiffness * (value - target) - damping * velocity) / mass) * dt;
      value += velocity * dt;
      if (listener) listener(value);
      if (Math.abs(velocity) < 0.004 && Math.abs(target - value) < 0.004) {
        value = target; velocity = 0;
        if (listener) listener(value);
        raf = null;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    return {
      get value() { return value; },
      set(next) {
        target = next;
        if (raf == null) { last = performance.now(); raf = requestAnimationFrame(step); }
      },
      onChange(fn) { listener = fn; },
      stop() { if (raf != null) cancelAnimationFrame(raf); raf = null; },
    };
  }

  /* ── 1. Designer cursor: dot + trailing ring + contextual labels ────────── */

  function initCursor() {
    if (!pointerFine || reduced()) return;

    const dot = document.createElement('div');
    dot.className = 'rm-cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'rm-cursor-ring';
    document.body.append(dot, ring);

    const pos = { dx: -100, dy: -100, rx: -100, ry: -100 };
    let seen = false;

    const loop = () => {
      pos.rx += (pos.dx - pos.rx) * 0.16;
      pos.ry += (pos.dy - pos.ry) * 0.16;
      dot.style.transform = `translate3d(${pos.dx}px, ${pos.dy}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${pos.rx}px, ${pos.ry}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    window.addEventListener('mousemove', e => {
      pos.dx = e.clientX; pos.dy = e.clientY;
      if (!seen) { seen = true; pos.rx = pos.dx; pos.ry = pos.dy; dot.classList.remove('is-hidden'); ring.classList.add('is-visible'); }
    }, { passive: true });

    document.addEventListener('mouseleave', () => { dot.classList.add('is-hidden'); ring.classList.remove('is-visible'); });
    document.addEventListener('mouseenter', () => { if (seen) { dot.classList.remove('is-hidden'); ring.classList.add('is-visible'); } });

    window.addEventListener('mouseover', e => {
      const target = e.target;
      if (!target || !target.closest) return;
      const interactive = target.closest('a, button, [data-cursor]');
      ring.classList.toggle('is-active', !!interactive && !target.closest('[data-cursor-label]'));
      const labelled = target.closest('[data-cursor-label]');
      const label = labelled ? labelled.getAttribute('data-cursor-label') || '' : '';
      const current = ring.querySelector('.rm-cursor-label');
      if (label) {
        ring.classList.add('is-label');
        if (!current || current.textContent !== label) {
          ring.innerHTML = `<span class="rm-cursor-label">${label}</span>`;
        }
      } else {
        ring.classList.remove('is-label');
        if (current) ring.innerHTML = '';
      }
    }, { passive: true });
  }

  /* ── 2. Spring magnetic buttons (with inner counter-move) ───────────────── */

  function initMagnetic() {
    if (!pointerFine || reduced()) return;

    $$('.magnetic').forEach(el => {
      if (el.dataset.rmMagnetic) return;
      el.dataset.rmMagnetic = '1';
      const inner = el.firstElementChild;
      const x = createSpringValue(0, { stiffness: 220, damping: 18 });
      const y = createSpringValue(0, { stiffness: 220, damping: 18 });
      const ix = createSpringValue(0, { stiffness: 160, damping: 16 });
      const iy = createSpringValue(0, { stiffness: 160, damping: 16 });

      const apply = () => {
        el.style.transform = `translate3d(${x.value}px, ${y.value}px, 0)`;
        if (inner) inner.style.transform = `translate3d(${ix.value}px, ${iy.value}px, 0)`;
      };
      x.onChange(apply); y.onChange(apply); ix.onChange(apply); iy.onChange(apply);

      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const ny = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        x.set(Math.max(-1, Math.min(1, nx)) * r.width * 0.18);
        y.set(Math.max(-1, Math.min(1, ny)) * r.height * 0.22);
        ix.set(-x.value * 0.28);
        iy.set(-y.value * 0.28);
      });
      el.addEventListener('mouseleave', () => { x.set(0); y.set(0); ix.set(0); iy.set(0); });
    });
  }

  /* ── 3. Scroll progress bar ─────────────────────────────────────────────── */

  function initProgress() {
    const bar = document.createElement('div');
    bar.className = 'rm-progress';
    bar.innerHTML = '<i></i>';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    const fill = bar.firstElementChild;

    const spring = reduced() ? null : createSpringValue(0, { stiffness: 120, damping: 26 });
    if (spring) spring.onChange(v => { fill.style.transform = `scaleX(${v})`; });

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const fraction = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      if (spring) spring.set(fraction); else fill.style.transform = `scaleX(${fraction})`;
    };
    let raf = null;
    window.addEventListener('scroll', () => {
      if (raf == null) raf = requestAnimationFrame(() => { raf = null; update(); });
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ── 4. Masked word reveals for display headings ────────────────────────── */

  function splitWords(el) {
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const mask = document.createElement('span');
            mask.className = 'rm-word-mask';
            const word = document.createElement('span');
            word.className = 'rm-word';
            word.textContent = part;
            mask.appendChild(word);
            frag.appendChild(mask);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR' && !child.classList.contains('rm-word-mask')) {
          walk(child);
        }
      });
    };
    walk(el);
    $$('.rm-word', el).forEach((w, i) => { w.style.transitionDelay = `${i * 48}ms`; });
    el.classList.add('rm-split');
    el.classList.remove('reveal');
  }

  function initWordReveals() {
    const headings = $$('.display.reveal, .section-title.reveal, .cta-title.reveal');
    if (!headings.length) return;

    if (reduced()) {
      headings.forEach(h => h.classList.remove('reveal'));
      return;
    }

    headings.forEach(h => {
      if (h.dataset.rmSplit) return;
      h.dataset.rmSplit = '1';
      splitWords(h);
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('rm-words-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    headings.forEach(h => observer.observe(h));
  }

  /* ── 5. Staggered reveals inside [data-stagger] groups ──────────────────── */

  function initStaggerGroups() {
    $$('[data-stagger]').forEach(group => {
      if (group.dataset.rmStaggered) return;
      group.dataset.rmStaggered = '1';
      const step = Number(group.dataset.stagger) || 90;
      $$('.reveal', group).forEach((el, i) => {
        el.style.transitionDelay = `${i * step}ms`;
      });
    });
  }

  /* ── 6. 3D tilt cards & dynamic holographic layers ─────────────────────── */

  function initTilt() {
    if (!pointerFine || reduced()) return;

    const tiltSelector = '[data-rm-tilt], .portfolio-card, .t-card, .studio-card';

    document.addEventListener('mousemove', e => {
      const card = e.target.closest(tiltSelector);
      if (!card) return;

      const max = Number(card.dataset.rmTilt) || 8;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;

      // Portfolio cards carry a resting scale in CSS (.94, or 1.04 when active) —
      // keep it inside the tilt transform so hovering never changes their size.
      const scale = card.matches('.portfolio-card, .t-card') ? (card.classList.contains('is-active') ? 1.04 : 0.94) : 1;

      clearTimeout(card._rmTiltTimer);
      card.classList.add('rm-tilt');
      card.style.transition = 'transform .1s cubic-bezier(0.22, 1, 0.36, 1)';
      card.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(8px) scale(${scale})`;
      card.style.setProperty('--rm-gx', `${(px + 0.5) * 100}%`);
      card.style.setProperty('--rm-gy', `${(py + 0.5) * 100}%`);
    }, { passive: true });

    document.addEventListener('mouseout', e => {
      const card = e.target.closest(tiltSelector);
      if (!card) return;
      if (!e.relatedTarget || !card.contains(e.relatedTarget)) {
        // Hand the transform back to the stylesheet so .is-active scaling keeps working.
        card.style.transition = 'transform .65s cubic-bezier(0.22, 1, 0.36, 1)';
        card.style.transform = '';
        card._rmTiltTimer = setTimeout(() => { card.style.transition = ''; }, 700);
      }
    }, { passive: true });
  }

  /* ── Ambient Pro Spotlight ──────────────────────────────────────────────── */

  function initAmbientSpotlight() {
    if (!pointerFine || reduced()) return;

    const spot = document.createElement('div');
    spot.className = 'rm-ambient-spotlight';
    spot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spot);

    let sx = -300, sy = -300;
    let tx = -300, ty = -300;
    let running = false;

    const loop = () => {
      sx += (tx - sx) * 0.12;
      sy += (ty - sy) * 0.12;
      spot.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -50%)`;
      if (Math.abs(tx - sx) > 0.5 || Math.abs(ty - sy) > 0.5) {
        requestAnimationFrame(loop);
      } else {
        running = false;
      }
    };

    window.addEventListener('mousemove', e => {
      tx = e.clientX;
      ty = e.clientY;
      if (!running) {
        running = true;
        requestAnimationFrame(loop);
      }
    }, { passive: true });
  }

  /* ── 7. Scroll-velocity marquee skew ────────────────────────────────────── */

  function initMarqueeSkew() {
    const band = $('.marquee-band');
    const marquee = band ? band.querySelector('.marquee') : null;
    if (!marquee || reduced()) return;

    // The .marquee element itself is animated via CSS transform, which would
    // override any inline skew — so the skew is applied to a wrapper instead.
    const wrapper = document.createElement('div');
    wrapper.style.willChange = 'transform';
    marquee.parentNode.insertBefore(wrapper, marquee);
    wrapper.appendChild(marquee);

    let lastY = window.scrollY;
    let skew = 0;
    let running = false;

    const tick = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      const target = Math.max(-9, Math.min(9, delta * -0.35));
      skew += (target - skew) * 0.1;
      skew *= 0.92; // ease back to level when scrolling stops
      if (Math.abs(skew) > 0.05) {
        wrapper.style.transform = `skewX(${skew.toFixed(2)}deg)`;
        requestAnimationFrame(tick);
      } else {
        wrapper.style.transform = '';
        running = false;
      }
    };

    window.addEventListener('scroll', () => {
      if (!running) { running = true; requestAnimationFrame(tick); }
    }, { passive: true });
  }

  /* ── 8. Header auto-hide + hero parallax (one shared scroll loop) ───────── */

  function initScrollScenes() {
    const header = $('.site-header');
    const mobileMenu = $('.mobile-menu');
    const heroWrap = $('.hero-title-wrap');
    const heroBottom = $('.hero-bottom');
    let lastY = window.scrollY;
    let raf = null;

    const update = () => {
      raf = null;
      const y = window.scrollY;

      if (header && !reduced()) {
        const menuOpen = mobileMenu && mobileMenu.classList.contains('open');
        const goingDown = y > lastY + 2;
        const goingUp = y < lastY - 2;
        if (!menuOpen) {
          if (goingDown && y > 340) header.classList.add('is-hidden');
          else if (goingUp || y <= 340) header.classList.remove('is-hidden');
        }
      }

      if (heroWrap && !reduced() && y < window.innerHeight) {
        heroWrap.style.transform = `translate3d(0, ${(y * 0.2).toFixed(1)}px, 0)`;
        heroWrap.style.opacity = String(Math.max(1 - y / (window.innerHeight * 0.75), 0));
        if (heroBottom) heroBottom.style.transform = `translate3d(0, ${(y * 0.12).toFixed(1)}px, 0)`;
      }

      lastY = y;
    };

    window.addEventListener('scroll', () => {
      if (raf == null) raf = requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ── 9. Project-coloured panel curtain for case studies ─────────────────── */

  let curtainBusy = false;

  function curtainTo(callback, colours) {
    if (reduced() || typeof callback !== 'function') { callback(); return; }
    if (curtainBusy) return;
    curtainBusy = true;

    const c0 = (colours && colours[0]) || '#162DAF';
    const c2 = (colours && colours[2]) || '#F5CC00';
    const panels = 5;

    const root = document.createElement('div');
    root.className = 'rm-curtain';
    root.innerHTML = Array.from({ length: panels })
      .map((_, i) => `<span style="--rm-i:${i}; background: linear-gradient(180deg, ${c2}, ${c0})"></span>`)
      .join('');
    document.body.appendChild(root);

    const done = () => {
      root.remove();
      curtainBusy = false;
    };

    requestAnimationFrame(() => {
      root.classList.add('is-cover');
      window.setTimeout(() => {
        callback();
        root.classList.remove('is-cover');
        root.classList.add('is-reveal');
        window.setTimeout(done, 42 * panels + 500);
      }, 42 * panels + 460);
    });
  }

  /* ── Boot ───────────────────────────────────────────────────────────────── */

  function init() {
    injectStyles();
    initCursor();
    initMagnetic();
    initProgress();
    initWordReveals();
    initStaggerGroups();
    initTilt();
    initAmbientSpotlight();
    initMarqueeSkew();
    initScrollScenes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.RovardMotion = { curtainTo, init, reduced: reduced() };
})();
