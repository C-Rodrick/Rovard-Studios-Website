/* ROVARD STUDIOS — V2 site behaviour. No dependencies. Everything degrades gracefully without JS. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isHome = document.body.classList.contains('home');

  /* Header shadow + sticky mobile CTA (appears after the first screen) */
  const header = $('[data-header]');
  let tick = false;
  const onScroll = () => {
    tick = false;
    const y = scrollY;
    header && header.classList.toggle('scrolled', y > 8);
    document.body.classList.toggle('past-hero', y > (isHome ? innerHeight * 0.7 : 420));
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Mobile menu */
  const btn = $('.menu-btn'), menu = $('#menu');
  if (btn && menu) {
    const set = open => {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.hidden = !open;
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
    matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) set(false); });
  }

  /* Scroll reveals: play once, start slightly before entering view */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px 8% 0px', threshold: 0 });
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add('in'));

  /* Hero: "We design [logos] for your [new business]" — words and example change together */
  const heroWe = $('.hero-we[data-rotator]');
  if (heroWe && !reduce) {
    const data = JSON.parse(heroWe.dataset.rotator);
    const items = $$('.hero-stage .stage-item');
    const verb = $('.r-verb', heroWe), thing = $('.r-thing', heroWe), fory = $('.r-for', heroWe);
    let i = 0, timer = null;
    const show = n => {
      heroWe.classList.add('swap');
      setTimeout(() => {
        const d = data[n];
        verb.textContent = d.verb; thing.textContent = d.thing; fory.textContent = d.for;
        heroWe.classList.remove('swap');
      }, 380);
      items.forEach((el, k) => el.classList.toggle('is-on', k === n));
    };
    const start = () => { stop(); timer = setInterval(() => { i = (i + 1) % data.length; show(i); }, 3800); };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };
    const hero = $('.hero');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(en => (en.isIntersecting && !document.hidden ? start() : stop())), { threshold: 0.2 }).observe(hero);
    } else start();
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    hero.addEventListener('mouseenter', stop); hero.addEventListener('mouseleave', start);
  }

  /* "We do ___ for your ___": hovering a line shows an example beside it */
  const rows = $$('.wedo-row');
  if (rows.length) {
    const panel = $$('.wp-item');
    const set = i => {
      rows.forEach(r => r.classList.toggle('is-on', r.dataset.i === String(i)));
      panel.forEach(p => p.classList.toggle('is-on', p.dataset.i === String(i)));
    };
    set(0);
    rows.forEach(r => {
      r.addEventListener('mouseenter', () => set(r.dataset.i));
      r.addEventListener('focus', () => set(r.dataset.i));
    });
  }

  /* Work filters */
  const filters = $$('[data-filter]');
  if (filters.length) {
    const cards = $$('.wcard[data-kind]');
    filters.forEach(f => f.addEventListener('click', () => {
      filters.forEach(x => { x.classList.toggle('is-on', x === f); x.setAttribute('aria-pressed', String(x === f)); });
      const k = f.dataset.filter;
      cards.forEach(c => { c.hidden = k !== 'all' && c.dataset.kind !== k; c.classList.add('in'); });
    }));
  }

  /* Project gallery lightbox (Back button closes it) */
  const lb = $('.lightbox');
  if (lb) {
    const items = $$('.g-item');
    const im = $('img', lb), count = $('.lb-count', lb), prev = $('.lb-prev', lb), next = $('.lb-next', lb), close = $('.lb-close', lb);
    let cur = 0, opener = null;
    const render = () => {
      im.src = items[cur].dataset.full; im.alt = items[cur].dataset.alt || '';
      count.textContent = `${cur + 1} / ${items.length}`;
      prev.disabled = cur === 0; next.disabled = cur === items.length - 1;
    };
    const hide = () => { lb.hidden = true; document.body.classList.remove('lb-open'); im.removeAttribute('src'); opener && opener.focus(); };
    const open = i => {
      opener = document.activeElement; cur = i; render();
      if (lb.hidden) history.pushState({ lb: 1 }, '');
      lb.hidden = false; document.body.classList.add('lb-open'); close.focus();
    };
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
      else if (e.key === 'Tab') {
        const f = [close, prev, next].filter(x => !x.disabled), a = document.activeElement, k = f.indexOf(a);
        e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  }

  /* Start a project: three short steps, deep-linkable (?need=flyer), works without JS */
  const form = $('#start-form');
  if (form) {
    const steps = $$('.step', form), crumbs = $$('.progress li', form);
    const back = $('[data-back]', form), nextBtn = $('[data-next]', form), err = $('.form-error', form);
    let cur = 0;
    const want = (new URLSearchParams(location.search).get('need') || '').split(',').filter(Boolean);
    want.forEach(v => { const c = $(`input[name="need"][value="${CSS.escape(v)}"]`, form); if (c) c.checked = true; });
    const show = (n, init) => {
      cur = n; err.textContent = '';
      steps.forEach((s, i) => s.classList.toggle('is-on', i === n));
      crumbs.forEach((c, i) => { c.classList.toggle('on', i === n); c.classList.toggle('done', i < n); });
      back.hidden = n === 0;
      form.classList.toggle('last', n === steps.length - 1);
      if (init) return;
      const lg = $('legend', steps[n]); if (lg) { lg.tabIndex = -1; lg.focus({ preventScroll: true }); }
      scrollTo({ top: Math.max(0, form.getBoundingClientRect().top + scrollY - 110), behavior: reduce ? 'auto' : 'smooth' });
    };
    const validate = n => {
      const needs = $$('input[name="need"]:checked', form).map(x => x.value);
      if (n === 0 && !needs.length) return "Pick at least one, or choose “I’m not sure”.";
      if (n === 1 && needs.includes('unsure') && !form.idea.value.trim()) return 'Tell us a little about your idea, in your own words.';
      if (n === 2) {
        if (!form.name.value.trim()) return 'Please tell us your name.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim())) return 'Please check your email address.';
      }
      return '';
    };
    nextBtn.addEventListener('click', () => { const m = validate(cur); if (m) { err.textContent = m; return; } show(cur + 1); });
    back.addEventListener('click', () => show(cur - 1));
    form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && cur < steps.length - 1) { e.preventDefault(); nextBtn.click(); } });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const m = validate(2) || validate(0); if (m) { err.textContent = m; if (validate(0)) show(0); return; }
      const sub = $('[data-submit]', form); sub.disabled = true; sub.textContent = 'Sending…';
      try {
        const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error('bad status');
        form.hidden = true; $('.form-done').hidden = false; $('.form-done h2').focus?.();
        scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      } catch (_) {
        err.innerHTML = 'Something went wrong. Please try again, or email us at <a href="mailto:hello@rovardstudios.com">hello@rovardstudios.com</a>.';
        sub.disabled = false; sub.textContent = 'Send it to us';
      }
    });
    show(0, true);
  }
})();
