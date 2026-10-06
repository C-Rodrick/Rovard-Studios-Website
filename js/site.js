/* ROVARD STUDIOS — V2 site behaviour.
   Motion language: Lenis eased scrolling, outQuart reveals (opacity 600ms, move 1.26s), word-by-word headline rise,
   expo.inOut menu, gentle parallax, drag carousel, expanding panels. Everything degrades gracefully without JS
   and is switched off for prefers-reduced-motion. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const isHome = body.classList.contains('home');
  const HEAD = () => (innerWidth <= 900 ? 64 : 72);

  /* ── Smooth scrolling (Lenis) ─────────────────────────────────────── */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, autoRaf: true });
  }
  const stopScroll = () => { lenis && lenis.stop(); body.classList.add('no-scroll'); };
  const startScroll = () => { lenis && lenis.start(); body.classList.remove('no-scroll'); };
  const goto = (el, off = 0) => {
    const y = el.getBoundingClientRect().top + scrollY - HEAD() - 16 + off;
    lenis ? lenis.scrollTo(y, { duration: 1.4, easing: t => 1 - Math.pow(1 - t, 4) }) : scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || a.target === '_blank') return;
    const u = new URL(a.href, location.href);
    if (u.pathname !== location.pathname || !u.hash || u.hash === '#') return;
    const t = document.getElementById(decodeURIComponent(u.hash.slice(1)));
    if (!t) return;
    e.preventDefault(); closeMenu(); goto(t); history.pushState(null, '', u.hash);
  });

  /* ── Menu (circle button → expo slide-down panel) ─────────────────── */
  const btn = $('.menu-btn'), panel = $('.menu-panel');
  function closeMenu() {
    if (!body.classList.contains('menu-open')) return;
    body.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Open menu');
    panel.setAttribute('aria-hidden', 'true'); panel.inert = true; startScroll();
  }
  if (btn && panel) {
    panel.inert = true;
    btn.addEventListener('click', () => {
      const open = !body.classList.contains('menu-open');
      if (!open) return closeMenu();
      body.classList.add('menu-open'); btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-label', 'Close menu');
      panel.setAttribute('aria-hidden', 'false'); panel.inert = false; stopScroll();
      setTimeout(() => $('a', panel) && $('a', panel).focus({ preventScroll: true }), 500);
    });
    panel.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
    addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); } });
  }

  /* ── Sticky mobile CTA ────────────────────────────────────────────── */
  let tick = false;
  const onScroll = () => { tick = false; body.classList.toggle('past-hero', scrollY > (isHome ? innerHeight * 0.8 : 420)); };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ── Headline words: split once, rise out of a mask ───────────────── */
  function splitWords(el) {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(ch => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.className = 'wi'; s.style.setProperty('--i', i++); s.textContent = part;
            w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
      });
    };
    walk(el); el.classList.add('sp');
  }
  if (!reduce) $$('[data-r="words"]').forEach(splitWords);

  /* ── Scroll reveals: play once, as the element enters ─────────────── */
  $$('[data-stagger]').forEach(g => {
    const step = Number(g.dataset.stagger) || 80;
    $$(':scope > [data-r], :scope > li, :scope > article', g).forEach((c, i) => { if (!c.dataset.r) c.dataset.r = 'up'; c.style.setProperty('--d', (i * step) / 1000 + 's'); });
  });
  $$('[data-d]').forEach(el => el.style.setProperty('--d', Number(el.dataset.d) + 's'));
  const rev = $$('[data-r]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -7% 0px', threshold: 0 });
    rev.forEach(el => (el.hasAttribute('data-intro') ? null : io.observe(el)));
    const intro = () => requestAnimationFrame(() => setTimeout(() => $$('[data-intro]').forEach(el => el.classList.add('in')), 120));
    document.fonts && document.fonts.ready ? document.fonts.ready.then(intro) : intro();
  } else rev.forEach(el => el.classList.add('in'));

  /* ── Parallax (images drift slightly against the scroll) ──────────── */
  const par = $$('[data-par]');
  if (par.length && !reduce) {
    const vis = new Set();
    const pio = new IntersectionObserver(es => es.forEach(en => (en.isIntersecting ? vis.add(en.target) : vis.delete(en.target))), { rootMargin: '200px 0px' });
    par.forEach(p => pio.observe(p));
    const upd = () => {
      const vh = innerHeight;
      vis.forEach(el => {
        const host = el.parentElement.getBoundingClientRect();
        const off = (host.top + host.height / 2 - vh / 2) * Number(el.dataset.par);
        const max = host.height * 0.04;
        el.style.transform = `translate3d(0, ${Math.max(-max, Math.min(max, -off)).toFixed(1)}px, 0)`;
      });
    };
    lenis ? lenis.on('scroll', upd) : addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd); upd();
  }

  /* ── Hero: "We design [logos] for your [new business]" ────────────── */
  const we = $('.hero-we[data-rotator]');
  if (we && !reduce) {
    const data = JSON.parse(we.dataset.rotator), v = $('.rv', we), t = $('.rt', we), f = $('.rf', we);
    let i = 0, timer = null;
    const run = () => { stop(); timer = setInterval(() => { i = (i + 1) % data.length; we.classList.add('swap'); setTimeout(() => { v.textContent = data[i].verb; t.textContent = data[i].thing; f.textContent = data[i].for; we.classList.remove('swap'); }, 420); }, 3600); };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };
    run(); document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()));
  }

  /* ── Film showcase ────────────────────────────────────────────────── */
  const film = $('.film');
  if (film) {
    const vid = $('video', film), go = $('.play', film);
    const play = () => { film.classList.add('playing'); vid.controls = true; vid.preload = 'auto'; vid.play().catch(() => { film.classList.remove('playing'); }); };
    go && go.addEventListener('click', play);
    vid.addEventListener('ended', () => film.classList.remove('playing'));
    vid.addEventListener('pause', () => { if (!vid.ended && vid.currentTime === 0) film.classList.remove('playing'); });
  }

  /* ── Horizontal carousel: drag, buttons, progress ─────────────────── */
  $$('[data-car]').forEach(car => {
    const bar = $('i', car.parentElement.querySelector('.car-bar') || document.createElement('div')) || null;
    const prev = car.parentElement.querySelector('[data-prev]'), next = car.parentElement.querySelector('[data-next]');
    const step = () => Math.min(480, car.clientWidth * 0.8) + 16;
    const sync = () => {
      const max = car.scrollWidth - car.clientWidth;
      if (bar) bar.style.transform = `scaleX(${Math.max(0.12, (car.scrollLeft + car.clientWidth) / car.scrollWidth).toFixed(3)})`;
      if (prev) prev.disabled = car.scrollLeft < 4; if (next) next.disabled = car.scrollLeft > max - 4;
    };
    prev && prev.addEventListener('click', () => car.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
    next && next.addEventListener('click', () => car.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
    car.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); sync();
    let down = false, sx = 0, sl = 0, moved = 0, v = 0, last = 0, raf = 0;
    car.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = car.scrollLeft; moved = 0; v = 0; last = e.clientX; cancelAnimationFrame(raf); });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); if (moved > 5) car.classList.add('drag'); car.scrollLeft = sl - dx; v = e.clientX - last; last = e.clientX; });
    const up = () => { if (!down) return; down = false; car.classList.remove('drag'); const glide = () => { if (Math.abs(v) < 0.4) return; car.scrollLeft -= v; v *= 0.93; raf = requestAnimationFrame(glide); }; glide(); };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    car.addEventListener('click', e => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  });

  /* ── Expanding "why" panels ───────────────────────────────────────── */
  const pans = $$('.pan');
  if (pans.length) {
    const open = p => pans.forEach(x => x.classList.toggle('open', x === p));
    open(pans[0]);
    pans.forEach(p => {
      p.addEventListener('mouseenter', () => matchMedia('(hover: hover) and (min-width: 901px)').matches && open(p));
      p.addEventListener('focus', () => open(p)); p.addEventListener('click', () => open(p));
    });
  }

  /* ── Count-ups (true numbers only) ────────────────────────────────── */
  const counts = $$('[data-count]');
  if (counts.length && !reduce) {
    counts.forEach(c => { c.textContent = '0' + (c.dataset.suffix || ''); });   // real number is in the HTML; count up from 0 only when animating
    const run = el => {
      const to = Number(el.dataset.count), suf = el.dataset.suffix || '', dur = 1600, t0 = performance.now();
      if (reduce) { el.textContent = to + suf; return; }
      const f = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(to * e) + suf; if (k < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    };
    if ('IntersectionObserver' in window) {
      const cio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); } }), { threshold: 0.6 });
      counts.forEach(c => cio.observe(c));
    } else counts.forEach(run);
  }

  /* ── Work filters ─────────────────────────────────────────────────── */
  const filters = $$('[data-filter]');
  if (filters.length) {
    const cards = $$('.wcard[data-kind]');
    filters.forEach(f => f.addEventListener('click', () => {
      filters.forEach(x => { x.classList.toggle('is-on', x === f); x.setAttribute('aria-pressed', String(x === f)); });
      const k = f.dataset.filter;
      cards.forEach(c => { c.hidden = k !== 'all' && c.dataset.kind !== k; c.classList.add('in'); });
      lenis && lenis.resize();
    }));
  }

  /* ── Project gallery lightbox (Back button closes it) ─────────────── */
  const lb = $('.lightbox');
  if (lb) {
    const items = $$('.g-item');
    const im = $('img', lb), count = $('.lb-count', lb), prev = $('.lb-prev', lb), next = $('.lb-next', lb), close = $('.lb-close', lb);
    let cur = 0, opener = null;
    const render = () => { im.src = items[cur].dataset.full; im.alt = items[cur].dataset.alt || ''; count.textContent = `${cur + 1} / ${items.length}`; prev.disabled = cur === 0; next.disabled = cur === items.length - 1; };
    const hide = () => { lb.hidden = true; startScroll(); im.removeAttribute('src'); opener && opener.focus(); };
    const open = i => { opener = document.activeElement; cur = i; render(); if (lb.hidden) history.pushState({ lb: 1 }, ''); lb.hidden = false; stopScroll(); close.focus(); };
    const shut = () => { if (history.state && history.state.lb) history.back(); else hide(); };
    items.forEach((it, i) => it.addEventListener('click', () => open(i)));
    prev.addEventListener('click', () => { if (cur > 0) { cur--; render(); } });
    next.addEventListener('click', () => { if (cur < items.length - 1) { cur++; render(); } });
    close.addEventListener('click', shut);
    lb.addEventListener('click', e => { if (e.target === lb) shut(); });
    addEventListener('popstate', () => { if (!lb.hidden) hide(); });
    addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') shut();
      else if (e.key === 'ArrowLeft' && cur > 0) { cur--; render(); }
      else if (e.key === 'ArrowRight' && cur < items.length - 1) { cur++; render(); }
      else if (e.key === 'Tab') { const f = [close, prev, next].filter(x => !x.disabled), k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    });
  }

  /* ── Start a project: one short page, deep-linkable (?need=flyer,website) ─ */
  const form = $('#start-form');
  if (form) {
    const err = $('.form-error', form);
    (new URLSearchParams(location.search).get('need') || '').split(',').filter(Boolean).forEach(v => {
      const c = $(`input[name="need"][value="${CSS.escape(v)}"]`, form); if (c) c.checked = true;
    });
    const check = () => {
      if (!form.name.value.trim()) return [form.name, 'Please tell us your name.'];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim())) return [form.email, 'Please check your email address.'];
      const needs = $$('input[name="need"]:checked', form).map(x => x.value);
      if (!needs.length) return [$('.seg', form), 'Pick at least one thing you need, or choose “I’m not sure”.'];
      if (needs.includes('unsure') && !form.idea.value.trim()) return [form.idea, 'Tell us a little about your idea, in your own words.'];
      return null;
    };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const bad = check();
      if (bad) { err.textContent = bad[1]; bad[0].focus && bad[0].focus(); return; }
      err.textContent = '';
      const sub = $('[data-submit]', form), label = sub.querySelector('span'); sub.disabled = true; label.textContent = 'Sending…';
      try {
        const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error('bad status');
        form.hidden = true; $('.form-done').hidden = false; goto($('.form-done'), -120);
      } catch (_) {
        err.innerHTML = 'Something went wrong. Please try again, or email us at <a href="mailto:hello@rovardstudios.com">hello@rovardstudios.com</a>.';
        sub.disabled = false; label.textContent = 'Send it to us';
      }
    });
  }
})();
