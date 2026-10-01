/* =============================================================================
   ROVARD IMMERSIVE — Advanced 3D & Animation Layer v2.0
   Adds: Aurora floating orbs | Card 3D tilt physics | Button ripple ink |
         Animated stat counters | Section parallax depth | CTA liquid mesh |
         Hero text shimmer | Section-entry perspective warp | Holographic gloss
   Zero dependencies. GPU-accelerated. Respects prefers-reduced-motion.
   ========================================================================== */

(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

  /* Inject immersive styles */
  const styleEl = document.createElement('style');
  styleEl.id = 'rv-immersive-styles';
  styleEl.textContent = `
.rv-orb-layer { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.rv-orb { position: absolute; border-radius: 50%; will-change: transform; opacity: 0; animation: rvOrbDrift var(--rv-dur, 22s) var(--rv-delay, 0s) ease-in-out infinite alternate; }
@keyframes rvOrbDrift {
  0%   { transform: translate(0, 0) scale(1); opacity: var(--rv-opacity-low); }
  33%  { transform: translate(var(--rv-dx1, 80px), var(--rv-dy1, -50px)) scale(1.08); }
  66%  { transform: translate(var(--rv-dx2, -60px), var(--rv-dy2, 40px)) scale(0.94); }
  100% { transform: translate(var(--rv-dx3, 30px), var(--rv-dy3, -20px)) scale(1.04); opacity: var(--rv-opacity-hi); }
}
@media (prefers-reduced-motion: reduce) { .rv-orb { animation: none !important; opacity: 0.06 !important; } }
.rv-ripple-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; border-radius: inherit; z-index: 0; }
.rv-ripple {
  position: absolute; width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.35); transform: translate(-50%,-50%) scale(0);
  animation: rvRipple 0.7s cubic-bezier(0.22,1,0.36,1) forwards; pointer-events: none;
}
@keyframes rvRipple { to { transform: translate(-50%,-50%) scale(var(--rv-ripple-size, 40)); opacity: 0; } }
.rv-warp { transform-origin: center 80%; will-change: transform, opacity; transition: transform .75s cubic-bezier(0.22,1,0.36,1), opacity .6s cubic-bezier(0.22,1,0.36,1); }
.rv-warp:not(.rv-warp-in) { transform: perspective(900px) rotateX(5deg) translateY(40px); opacity: 0; }
.rv-warp.rv-warp-in { transform: perspective(900px) rotateX(0deg) translateY(0); opacity: 1; }
@media (prefers-reduced-motion: reduce) { .rv-warp:not(.rv-warp-in) { transform: none; opacity: 0; } .rv-warp.rv-warp-in { transform: none; } }
.cta { position: relative; overflow: hidden; }
.rv-cta-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; opacity: 0.45; }
.cta-inner { position: relative; z-index: 1; }
.hero-title .line { position: relative; display: block; }
.rv-shimmer-overlay {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(105deg, transparent 40%, rgba(245,204,0,0.15) 50%, rgba(22,45,175,0.10) 60%, transparent 70%);
  background-size: 250% 100%; opacity: 0; border-radius: 4px; transition: opacity 0.3s ease;
  mix-blend-mode: screen; animation: rvShimmerIdle 5s ease-in-out infinite;
}
@keyframes rvShimmerIdle {
  0%   { background-position: 200% center; opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { background-position: -60% center; opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { .rv-shimmer-overlay { display: none; } }
.rv-pulse-ring {
  position: absolute; inset: -6px; border-radius: inherit;
  border: 1.5px solid var(--yellow, #f5cc00); opacity: 0; pointer-events: none;
  animation: rvPulseRing 2.4s cubic-bezier(0.22,1,0.36,1) infinite; animation-play-state: paused;
}
.primary-button:hover .rv-pulse-ring, .header-cta:hover .rv-pulse-ring, .round-link:hover .rv-pulse-ring { animation-play-state: running; }
@keyframes rvPulseRing { 0% { opacity: 0.7; transform: scale(1); } 100% { opacity: 0; transform: scale(1.25); } }
.service { position: relative; overflow: hidden; }
.service::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--yellow, #f5cc00); transform: scaleY(0); transform-origin: bottom;
  transition: transform 0.45s cubic-bezier(0.22,1,0.36,1);
}
.service:hover::before { transform: scaleY(1); }
  `;
  document.head.appendChild(styleEl);

  /* 1. AURORA FLOATING ORBS */
  function initAuroraOrbs() {
    if (isMobile && window.innerWidth < 768) return;
    const layer = document.createElement('div');
    layer.className = 'rv-orb-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    const isDark = () => document.documentElement.dataset.theme === 'dark';
    const defs = [
      { cl:'rgba(22,45,175,0.18)',   cd:'rgba(154,174,255,0.12)', w:700, h:550, x:15, y:10, dur:28, delay:0,   dx1:120, dy1:-80, dx2:-60, dy2:60,  dx3:40,  dy3:-30, opL:0.6, opH:1 },
      { cl:'rgba(216,169,1,0.12)',   cd:'rgba(245,204,0,0.10)',   w:500, h:400, x:75, y:20, dur:22, delay:-8,  dx1:-100,dy1:70,  dx2:80,  dy2:-50, dx3:-30, dy3:20,  opL:0.5, opH:0.9 },
      { cl:'rgba(0,9,133,0.14)',     cd:'rgba(92,126,255,0.12)',  w:600, h:500, x:50, y:55, dur:32, delay:-14, dx1:60,  dy1:80,  dx2:-80, dy2:-40, dx3:50,  dy3:60,  opL:0.4, opH:0.8 },
      { cl:'rgba(22,45,175,0.10)',   cd:'rgba(154,174,255,0.08)', w:400, h:350, x:85, y:70, dur:18, delay:-5,  dx1:-70, dy1:-60, dx2:50,  dy2:80,  dx3:-20, dy3:30,  opL:0.5, opH:1 },
      { cl:'rgba(216,169,1,0.08)',   cd:'rgba(245,204,0,0.07)',   w:350, h:300, x:5,  y:75, dur:25, delay:-18, dx1:90,  dy1:40,  dx2:-40, dy2:-70, dx3:60,  dy3:20,  opL:0.4, opH:0.9 },
    ];
    const orbs = defs.map(d => {
      const el = document.createElement('div');
      el.className = 'rv-orb';
      el.style.cssText = `width:${d.w}px;height:${d.h}px;left:calc(${d.x}% - ${d.w/2}px);top:calc(${d.y}% - ${d.h/2}px);background:radial-gradient(closest-side, ${isDark()?d.cd:d.cl}, transparent);--rv-dur:${d.dur}s;--rv-delay:${d.delay}s;--rv-dx1:${d.dx1}px;--rv-dy1:${d.dy1}px;--rv-dx2:${d.dx2}px;--rv-dy2:${d.dy2}px;--rv-dx3:${d.dx3}px;--rv-dy3:${d.dy3}px;--rv-opacity-low:${d.opL};--rv-opacity-hi:${d.opH};`;
      layer.appendChild(el);
      return { el, d };
    });
    new MutationObserver(() => {
      const dark = isDark();
      orbs.forEach(({ el, d }) => { el.style.background = `radial-gradient(closest-side, ${dark ? d.cd : d.cl}, transparent)`; });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (!reduced) {
      window.addEventListener('scroll', () => {
        orbs.forEach(({ el, d }) => {
          el.style.transform = `translateY(${window.scrollY * 0.04 * (d.dur / 30)}px)`;
        });
      }, { passive: true });
    }
  }

  /* 3. BUTTON RIPPLE INK */
  function initRipple() {
    ['.primary-button', '.header-cta', '.round-link', '.theme-toggle', '.sound-toggle'].forEach(sel => {
      $$(sel).forEach(btn => {
        if (btn.dataset.rvRipple) return;
        btn.dataset.rvRipple = '1';
        if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
        const cont = document.createElement('div');
        cont.className = 'rv-ripple-container';
        btn.appendChild(cont);
        const ring = document.createElement('div');
        ring.className = 'rv-pulse-ring';
        btn.appendChild(ring);
        btn.addEventListener('pointerdown', e => {
          const r = btn.getBoundingClientRect();
          const rip = document.createElement('span');
          rip.className = 'rv-ripple';
          rip.style.left = (e.clientX - r.left) + 'px';
          rip.style.top = (e.clientY - r.top) + 'px';
          rip.style.setProperty('--rv-ripple-size', Math.ceil(Math.max(r.width, r.height) / 3));
          cont.appendChild(rip);
          rip.addEventListener('animationend', () => rip.remove(), { once: true });
        });
      });
    });
  }

  /* 4. ANIMATED STAT COUNTERS */
  function initCounters() {
    $$('[data-rv-count]').forEach(el => {
      const target = parseFloat(el.dataset.rvCount);
      const suffix = el.dataset.rvSuffix || '';
      const duration = parseInt(el.dataset.rvDuration || '1800');
      let started = false;
      const obs = new IntersectionObserver(en => {
        if (en[0].isIntersecting && !started) {
          started = true; obs.disconnect();
          if (reduced) { el.textContent = target + suffix; return; }
          const t0 = performance.now();
          const isInt = Number.isInteger(target);
          const step = now => {
            const t = Math.min((now - t0) / duration, 1);
            const v = target * (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
            el.textContent = (isInt ? Math.round(v) : v.toFixed(1)) + suffix;
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      }, { threshold: 0.5 });
      obs.observe(el);
    });
  }

  /* 5. SECTION WARP REVEAL */
  function initWarpReveals() {
    if (reduced) return;
    $$('.rv-warp').forEach(el => {
      const obs = new IntersectionObserver(en => {
        if (en[0].isIntersecting) { el.classList.add('rv-warp-in'); obs.disconnect(); }
      }, { threshold: 0, rootMargin: '0px 0px 12% 0px' });
      obs.observe(el);
    });
  }

  /* 6. CTA LIQUID MESH */
  function initCtaMesh() {
    const cta = $('.cta');
    if (!cta) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'rv-cta-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    cta.insertBefore(canvas, cta.firstChild);
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, t = 0, animId = null, vis = false;
    const resize = () => { const r = cta.getBoundingClientRect(); w = canvas.width = r.width; h = canvas.height = r.height; };
    window.addEventListener('resize', resize, { passive: true });
    resize();
    new IntersectionObserver(en => {
      vis = en[0].isIntersecting;
      if (vis && !animId) animId = requestAnimationFrame(render);
    }, { threshold: 0.05 }).observe(canvas);
    function render() {
      if (!vis) { animId = null; return; }
      t += reduced ? 0.003 : 0.008;
      ctx.clearRect(0, 0, w, h);
      [
        { x: w*(0.25+Math.sin(t*0.7)*0.15), y: h*(0.35+Math.cos(t*0.5)*0.2), r: w*0.45, c: 'rgba(22,45,175,0.22)' },
        { x: w*(0.72+Math.cos(t*0.6)*0.12), y: h*(0.55+Math.sin(t*0.4)*0.18), r: w*0.38, c: 'rgba(0,9,133,0.18)' },
        { x: w*(0.5+Math.sin(t*0.4+1)*0.18), y: h*(0.20+Math.cos(t*0.3)*0.12), r: w*0.30, c: 'rgba(216,169,1,0.14)' },
      ].forEach(b => {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, b.c); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
      });
      animId = requestAnimationFrame(render);
    }
  }

  /* 7. HERO SHIMMER OVERLAY */
  function initHeroShimmer() {
    if (reduced) return;
    $$('.hero-title .line').forEach((line, i) => {
      const s = document.createElement('span');
      s.className = 'rv-shimmer-overlay';
      s.setAttribute('aria-hidden', 'true');
      s.style.animationDelay = (i * 1.8) + 's';
      line.appendChild(s);
    });
  }

  /* 8. STATEMENT PARALLAX DEPTH */
  function initStatementParallax() {
    if (reduced || isMobile) return;
    const stmt = $('.statement');
    if (!stmt) return;
    const cont = $('.statement-content', stmt);
    const meta = $('.section-meta', stmt);
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const r = stmt.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight + r.height)));
        if (cont) cont.style.transform = `translateY(${(p - 0.5) * -50}px)`;
        if (meta) meta.style.transform = `translateY(${(p - 0.5) * -30}px)`;
      });
    }, { passive: true });
  }

  /* 10. STAGGER REVEALS */
  function initStaggerReveals() {
    const sl = $('.service-list');
    if (sl) {
      const svcs = $$('.service', sl);
      new IntersectionObserver(en => {
        if (en[0].isIntersecting) {
          svcs.forEach((s, i) => { s.style.transitionDelay = (i * 70) + 'ms'; s.classList.add('in-view'); });
        }
      }, { threshold: 0.1 }).observe(sl);
    }
    $$('.principle').forEach((p, i) => {
      p.style.cssText += `opacity:0;transform:translateX(-12px);transition:opacity 0.6s ease ${i*90}ms,transform 0.6s cubic-bezier(0.22,1,0.36,1) ${i*90}ms;`;
    });
    const sc = $('.studio-card');
    if (sc) {
      new IntersectionObserver(en => {
        if (en[0].isIntersecting) {
          $$('.principle').forEach(p => { p.style.opacity = '1'; p.style.transform = 'translateX(0)'; });
        }
      }, { threshold: 0.2 }).observe(sc);
    }
  }

  /* 12. FLOATING HERO PARTICLES */
  function initHeroParticles() {
    if (reduced || isMobile) return;
    const hero = $('.hero');
    if (!hero) return;
    const chars = ['✦', '·', '○', '+', '◆', '✧'];
    document.head.appendChild(Object.assign(document.createElement('style'), {
      textContent: `@keyframes rvPDrift{0%{opacity:0;transform:translate(0,0) rotate(0deg)}15%{opacity:.55}85%{opacity:.35}100%{opacity:0;transform:translate(var(--pdx),var(--pdy)) rotate(180deg)}}`
    }));
    for (let i = 0; i < 12; i++) {
      const el = document.createElement('span');
      el.setAttribute('aria-hidden', 'true');
      el.textContent = chars[Math.floor(Math.random() * chars.length)];
      const size = 0.55 + Math.random() * 0.7;
      const dur = 6 + Math.random() * 10;
      const delay = Math.random() * -14;
      el.style.cssText = `position:absolute;left:${5+Math.random()*90}%;top:${10+Math.random()*80}%;font-size:${size}rem;color:var(--yellow,#f5cc00);opacity:0;pointer-events:none;z-index:2;animation:rvPDrift ${dur}s ${delay}s ease-in-out infinite;--pdx:${(Math.random()-.5)*40}px;--pdy:${-40-Math.random()*60}px;font-style:normal;font-weight:300;`;
      hero.appendChild(el);
    }
  }

  /* 13. PROCESS SVG RING */
  function initProcessRing() {
    const vis = $('#processVisual');
    if (!vis || reduced) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('width', '80%'); svg.setAttribute('height', '80%');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);';
    const bg = document.createElementNS(ns, 'circle');
    Object.entries({ cx: '100', cy: '100', r: '80', fill: 'none', stroke: 'rgba(255,255,255,0.15)', 'stroke-width': '1' }).forEach(([k, v]) => bg.setAttribute(k, v));
    const circ = 2 * Math.PI * 80;
    const prog = document.createElementNS(ns, 'circle');
    ['cx','cy','r','fill','stroke','stroke-width','stroke-linecap','stroke-dasharray','stroke-dashoffset'].forEach(a => {
      const vals = { cx:'100', cy:'100', r:'80', fill:'none', stroke:'#F5CC00', 'stroke-width':'2', 'stroke-linecap':'round', 'stroke-dasharray':circ, 'stroke-dashoffset':circ };
      prog.setAttribute(a, vals[a]);
    });
    prog.style.cssText = 'transform-origin:center;transform:rotate(-90deg);transition:stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1);';
    svg.appendChild(bg); svg.appendChild(prog); vis.appendChild(svg);
    const numEl = $('#processNumber');
    if (numEl) {
      const update = () => { const s = parseInt(numEl.textContent)||1; prog.style.strokeDashoffset = circ*(1-s/5); };
      new MutationObserver(update).observe(numEl, { childList:true, subtree:true, characterData:true });
      update();
    }
  }

  /* 14. FOOTER BEAM */
  function initFooterBeam() {
    if (reduced) return;
    const footer = $('.site-footer');
    if (!footer) return;
    document.head.appendChild(Object.assign(document.createElement('style'), {
      textContent: '@keyframes rvFBeam{0%{left:-60%}100%{left:120%}}'
    }));
    const beam = document.createElement('div');
    beam.setAttribute('aria-hidden', 'true');
    beam.style.cssText = 'position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(245,204,0,0.04),transparent);pointer-events:none;z-index:0;animation:rvFBeam 8s ease-in-out infinite;';
    footer.style.position = 'relative';
    footer.style.overflow = 'hidden';
    footer.appendChild(beam);
  }

  /* INIT */
  function init() {
    initAuroraOrbs();
    initRipple();
    initCounters();
    initWarpReveals();
    initCtaMesh();
    initHeroShimmer();
    initStatementParallax();
    initStaggerReveals();
    initHeroParticles();
    initProcessRing();
    initFooterBeam();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
