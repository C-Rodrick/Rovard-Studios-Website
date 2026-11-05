/* ROVARD STUDIOS — The Creative Edition. No libraries. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* 1. Fit text: [data-fit] fills its container's width exactly */
  /* Words that change width are measured at their widest, so they never overflow */
  const fit = () => {
    root.classList.add('measuring');
    $$('[data-fit]').forEach(el => {
      const box = el.parentElement;
      el.style.fontSize = '100px';
      const w = el.getBoundingClientRect().width;
      if (w) el.style.fontSize = (100 * box.clientWidth / w * 0.995).toFixed(2) + 'px';
    });
    root.classList.remove('measuring');
  };
  const fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();
  const open = () => { fit(); requestAnimationFrame(() => root.classList.add('is-open')); };
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 900))]).then(open);
  fontsReady.then(fit);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fit, 120); });

  /* 2. Reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
  $$('[data-reveal], .wipe').forEach(el => io.observe(el));

  /* 3. Masthead: the current section is printed in the running head */
  const now = $('#now');
  if (now) {
    const base = now.textContent;
    const secs = $$('[data-section]');
    const so = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) now.textContent = en.target.dataset.section || base;
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => so.observe(s));
  }

  /* 4. Contents overlay */
  const toc = $('#toc'), tocBtn = $('.mast-toc');
  const setToc = on => {
    if (!toc) return;
    toc.hidden = !on;
    document.body.classList.toggle('toc-open', on);
    tocBtn.setAttribute('aria-expanded', String(on));
    if (on) $('a', toc).focus(); else tocBtn.focus({ preventScroll: true });
  };
  tocBtn && tocBtn.addEventListener('click', () => setToc(toc.hidden));
  $('.toc-close') && $('.toc-close').addEventListener('click', () => setToc(false));
  toc && $$('a', toc).forEach(a => a.addEventListener('click', () => { toc.hidden = true; document.body.classList.remove('toc-open'); tocBtn.setAttribute('aria-expanded', 'false'); }));
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && toc && !toc.hidden) setToc(false);
    if (e.key === 'Tab' && toc && !toc.hidden) {
      const f = $$('a, button', toc); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* 5. Hero: the picture inside the headline changes, and the type responds to the pointer */
  const frames = $$('.hi-frame');
  if (frames.length) {
    let cur = 0, timer;
    const fn = $('#hfn'), ft = $('#hft');
    const show = n => {
      if (n === cur) return;
      frames.forEach(f => f.classList.remove('off'));
      frames[cur].classList.replace('on', 'off');
      cur = (n + frames.length) % frames.length;
      frames[cur].classList.add('on');
      fn.textContent = String(cur + 1).padStart(2, '0');
      ft.textContent = frames[cur].dataset.title;
    };
    const play = () => { clearInterval(timer); if (!still) timer = setInterval(() => show(cur + 1), 2400); };
    const hero = $('.hero');
    const vis = new IntersectionObserver(([en]) => en.isIntersecting ? play() : clearInterval(timer));
    vis.observe(hero);
    $$('[data-w]', hero).forEach((w, i) => w.addEventListener('pointerenter', () => { show((cur + 1 + i) % frames.length); play(); }));

    if (finePointer && !still) {
      const words = $$('[data-w]', hero);
      let raf = 0, py = -1;
      hero.addEventListener('pointermove', e => { py = e.clientY; if (!raf) raf = requestAnimationFrame(field); });
      hero.addEventListener('pointerleave', () => { words.forEach(w => w.style.setProperty('--ws', '100%')); });
      function field() {
        raf = 0;
        words.forEach(w => {
          const r = w.getBoundingClientRect();
          const d = Math.abs(py - (r.top + r.height / 2)) / (r.height * 1.6);
          const k = Math.max(0, 1 - d);
          w.style.setProperty('--ws', (100 + 25 * k).toFixed(1) + '%');
        });
      }
    }
  }

  /* 6. Scroll-linked type: the band drifts, the colophon word widens */
  const band = $('[data-drift]');
  const colWord = $('.col-word');
  if (!still && (band || colWord)) {
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      if (band) {
        const r = band.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) band.style.setProperty('--dx', (-(innerHeight - r.top) * 0.45).toFixed(1) + 'px');
      }
      if (colWord) {
        const r = colWord.getBoundingClientRect();
        const k = Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height + 60)));
        colWord.style.setProperty('--cws', (62 + 63 * k).toFixed(1) + '%');
      }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  } else if (colWord) colWord.style.setProperty('--cws', '125%');

  /* 7. Peek: a floating picture follows the pointer over lists */
  const peek = $('#peek');
  if (peek && finePointer) {
    const inner = $('.peek-in', peek), cap = $('.peek-cap', peek);
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, cycle;
    const move = () => {
      x += (tx - x) * (still ? 1 : 0.18); y += (ty - y) * (still ? 1 : 0.18);
      peek.style.setProperty('--px', x.toFixed(1) + 'px'); peek.style.setProperty('--py', y.toFixed(1) + 'px');
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(move) : 0;
    };
    const setImg = src => { const im = new Image(); im.src = src; im.alt = ''; inner.replaceChildren(im); };
    $$('[data-peek]').forEach(el => {
      el.addEventListener('pointerenter', e => {
        const list = el.dataset.peek.split(',');
        let n = 0; setImg(list[0]);
        clearInterval(cycle);
        if (list.length > 1 && !still) cycle = setInterval(() => setImg(list[++n % list.length]), 900);
        cap.textContent = el.dataset.cap || '';
        x = tx = e.clientX + 24; y = ty = e.clientY + 24;
        peek.classList.add('on');
        el.closest('.arun-wrap') && el.closest('.arun-wrap').classList.add('dim');
        if (!raf) raf = requestAnimationFrame(move);
      });
      el.addEventListener('pointermove', e => {
        const w = peek.offsetWidth, h = peek.offsetHeight;
        tx = e.clientX + 24 + w > innerWidth ? e.clientX - w - 24 : e.clientX + 24;
        ty = Math.min(e.clientY + 24, innerHeight - h - 12);
        if (!raf) raf = requestAnimationFrame(move);
      });
      el.addEventListener('pointerleave', () => {
        peek.classList.remove('on'); clearInterval(cycle);
        el.closest('.arun-wrap') && el.closest('.arun-wrap').classList.remove('dim');
      });
    });
  }

  /* 8. Film loops play only while visible */
  $$('video.loop').forEach(v => {
    if (still) return;
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
    }, { threshold: 0.2 }).observe(v);
  });

  /* 9. Archive: filters and views (?d=brand opens a filter, ?v=sheet the contact sheet) */
  const body = $('.arch-body');
  if (body) {
    const items = $$('[data-cats]', body);
    const setF = f => {
      $$('.flt').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === f)));
      items.forEach(li => li.classList.toggle('is-hidden', f !== 'all' && !li.dataset.cats.split(' ').includes(f)));
      const u = new URL(location.href);
      f === 'all' ? u.searchParams.delete('d') : u.searchParams.set('d', f);
      history.replaceState(null, '', u);
    };
    const setV = v => {
      body.dataset.view = v;
      $$('.vw').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      const u = new URL(location.href);
      v === 'index' ? u.searchParams.delete('v') : u.searchParams.set('v', v);
      history.replaceState(null, '', u);
    };
    $$('.flt').forEach(b => b.addEventListener('click', () => setF(b.dataset.f)));
    $$('.vw').forEach(b => b.addEventListener('click', () => setV(b.dataset.v)));
    const q = new URLSearchParams(location.search);
    if (q.get('d') && $(`.flt[data-f="${CSS.escape(q.get('d'))}"]`)) setF(q.get('d'));
    if (q.get('v') === 'sheet') setV('sheet');
  }

  /* 10. Project brief: Formspree, same endpoint and field names as the current site */
  const form = $('#brief');
  if (form) {
    const err = $('.brief-err', form);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      err.textContent = '';
      if (form._gotcha.value) return;
      if (!form.name.value.trim() || !form.email.validity.valid || !form.email.value || !form.goals.value.trim()) {
        err.textContent = form.dataset.need;
        (!form.name.value.trim() ? form.name : !form.email.value || !form.email.validity.valid ? form.email : form.goals).focus();
        return;
      }
      const payload = {};
      new FormData(form).forEach((v, k) => { if (k === '_gotcha') return; payload[k] = payload[k] ? `${payload[k]}, ${v}` : v; });
      payload._subject = `New project inquiry from ${payload.name}${payload.company ? ' (' + payload.company + ')' : ''} — Creative Edition`;
      const btn = $('button[type="submit"]', form), label = btn.innerHTML;
      btn.disabled = true; btn.textContent = form.dataset.sending;
      try {
        const res = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(res.status);
        const ok = document.createElement('div');
        ok.className = 'brief-ok'; ok.setAttribute('role', 'status'); ok.tabIndex = -1;
        ok.innerHTML = `<h3></h3><p></p>`;
        ok.querySelector('h3').textContent = form.dataset.okTitle;
        ok.querySelector('p').textContent = form.dataset.okText;
        form.replaceWith(ok); ok.focus();
      } catch (_) {
        err.textContent = form.dataset.err;
        btn.disabled = false; btn.innerHTML = label;
      }
    });
  }

  /* 11. Year */
  $$('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));
})();
