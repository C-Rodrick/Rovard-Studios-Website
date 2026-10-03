/* ==========================================================================
   VITA HOUSE — case study behaviour + data-driven sections
   ========================================================================== */
(function () {
  'use strict';
  const $ = VH.$, $$ = VH.$$, ic = VH.icon;
  VH.shell({ header: false, footer: false });
  VH.hydrate();

  const CHAPTERS = ['The Challenge', 'Audience', 'Brand Strategy', 'Visual Identity', 'UX Strategy', 'Information Architecture', 'Design System', 'Website', 'Appointment Experience', 'Patient Dashboard', 'Mobile Experience', 'Final Brand Ecosystem'];
  const nn = i => String(i + 1).padStart(2, '0');
  const mk = (w, o) => VH.mark(o).replace('<svg ', `<svg style="width:${w};height:auto" `);

  /* ---------- colour maths (live contrast values) ---------- */
  const lum = h => { h = h.replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4)); return .2126 * r + .7152 * g + .0722 * b; };
  const cr = (a, b) => { const A = lum(a), B = lum(b), [hi, lo] = A > B ? [A, B] : [B, A]; return (hi + .05) / (lo + .05); };
  window.CS = { lum, cr, mk, nn };

  /* ---------- frames (live, scaled iframes) ---------- */
  const openHref = src => { const [base, hash = ''] = src.split('#'); const [path, q = ''] = base.split('?'); const ps = q.split('&').filter(x => x && !/^(static|embed)=/.test(x)); return path + (ps.length ? '?' + ps.join('&') : '') + (hash ? '#' + hash : ''); };
  CS.frame = o => {
    const k = o.kind || 'browser';
    return `<figure class="frame ${k}" data-src="${o.src}" data-w="${o.w}" data-h="${o.h}" data-url="${o.url || 'vitahouse.example'}" data-title="${VH.esc(o.title || 'Live preview')}" ${o.overlay ? 'data-overlay="1"' : ''}></figure>` +
      (o.cap ? `<figcaption class="frame-cap"><b>${o.cap}</b>${o.sub ? `<span>${o.sub}</span>` : ''}${o.open !== false ? `<a href="${openHref(o.src)}" target="_blank" rel="noopener">Open live ↗</a>` : ''}</figcaption>` : '');
  };
  function buildFrames(root = document) {
    $$('.frame[data-src]:not([data-built])', root).forEach(f => {
      f.dataset.built = 1;
      const phone = f.classList.contains('phone');
      const vp = `<div class="vp"><iframe src="${f.dataset.src}" loading="lazy" title="${f.dataset.title || 'Live preview'}" tabindex="-1" aria-hidden="true" scrolling="no"></iframe></div>`;
      f.innerHTML = phone ? vp : `<div class="chrome"><i></i><i></i><i></i><span>${f.dataset.url}</span></div>${vp}`;
      if (f.dataset.overlay) f.querySelector('.vp').insertAdjacentHTML('beforeend', '<div class="tz-over"></div>');
    });
    fit();
  }
  function fit() {
    $$('.frame[data-built]').forEach(f => {
      const vp = f.querySelector('.vp'), ifr = f.querySelector('iframe'), w = +f.dataset.w, h = +f.dataset.h, cw = vp.clientWidth;
      if (!cw) return;
      const s = cw / w; ifr.style.width = w + 'px'; ifr.style.height = h + 'px'; ifr.style.transform = `scale(${s})`; vp.style.height = (h * s) + 'px';
    });
  }
  CS.buildFrames = buildFrames;
  window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(document.body);

  /* ---------- table of contents ---------- */
  $('#tocGrid').innerHTML = CHAPTERS.map((t, i) => `<a href="#c${nn(i)}"><b>${nn(i)}</b><span>${t}</span></a>`).join('');
  $('#toc').addEventListener('click', () => {
    VH.modal(`<h3 style="font-size:1.8rem;margin-bottom:1rem">Chapters</h3><div style="display:grid">${CHAPTERS.map((t, i) => `<a href="#c${nn(i)}" data-close style="display:flex;gap:1rem;align-items:baseline;padding:.8rem .25rem;border-top:1px solid var(--line);text-decoration:none"><span style="font:300 1.5rem var(--font-display);color:var(--clay-600);width:2.4rem">${nn(i)}</span><span style="font-weight:600">${t}</span></a>`).join('')}</div><div class="actions"><button class="btn btn-secondary" type="button" data-close>Close</button></div>`);
  });

  /* ---------- progress + current chapter ---------- */
  const prog = $('#prog'), cur = $('#curCh'), chs = $$('.ch');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight; prog.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
    let c = null; chs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) c = s; });
    cur.textContent = c ? c.dataset.title : 'Case study';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- marks ---------- */
  $('#heroMark').innerHTML = mk('2.2rem');
  $('#coldLogo') && ($('#coldLogo').innerHTML = VH.logo({ href: '', size: '1.2rem' }));
  $('#posMark') && ($('#posMark').innerHTML = mk('.95rem', { arch: '#fff', head: '#fff' }));

  /* ---------- 01 goals ---------- */
  const goals = [['shield', 'Trust', 'Credible, clear and consistent. Every screen shows who, what and what happens next.'], ['heart', 'Warmth', 'Colour, language and imagery that feel welcoming, never clinical.'], ['checklist', 'Professionalism', 'Rigorous information design, accurate details and respect for privacy.'], ['access', 'Accessibility', 'WCAG 2.2 AA as a baseline: contrast, target size, keyboard and screen readers.'], ['leaf', 'Care', 'Small kindnesses in the details: reassurance, plain words, no dead ends.'], ['sparkle', 'Modernity', 'Fast, mobile-first and delightful, as good as the best digital products.']];
  $('#goals').innerHTML = goals.map(([i, t, d]) => `<div class="goal reveal"><span class="icon-chip">${ic(i, 'icon-lg')}</span><h4>${t}</h4><p>${d}</p></div>`).join('');

  /* ---------- 02 personas ---------- */
  const familyArt = () => `<svg viewBox="0 0 200 240" role="img" aria-label="Illustration of a parent and child"><path d="M0 240V100a100 100 0 0 1 200 0v140z" fill="#C9D7C0"/><g transform="translate(-6 20) scale(.95)">${VH.person({ skin: 's2', hair: 'black', style: 'bun', cloth: '#4D6F54', outfit: 'knit' })}</g><g transform="translate(104 118) scale(.62)">${VH.person({ skin: 's3', hair: 'black', style: 'curly', cloth: '#E8BC5E', outfit: 'knit' })}</g></svg>`;
  const personas = [
    { name: 'Maya', meta: '29 · Product designer · Austin', art: VH.portrait({ skin: 's3', hair: 'brown', style: 'long', cloth: '#C4714C', outfit: 'knit', bg: 'blush', alt: 'Illustration of Maya' }), q: 'I will book it the second I can do it from my phone.', goal: 'A regular check-up without losing half a day.', pain: ['Phone trees and vague wait times', 'Filling in the same form twice', 'Not knowing who she will see'], need: ['Evening and weekend times', 'Booking in minutes on mobile', 'Reminders and a single dashboard'] },
    { name: 'The Alvarez-Brooks family', meta: 'Two adults, two children · Denver', art: familyArt(), q: 'One calendar for four people would change our Sundays.', goal: 'Everyone cared for by one team, with less admin.', pain: ['A different portal for each person', 'School forms at the last minute', 'Repeating the same history'], need: ['Household membership and calendar', 'Back-to-back appointments', 'Forms completed in advance'] },
    { name: 'Daniel', meta: '47 · Operations lead · Brooklyn', art: VH.portrait({ skin: 's2', hair: 'black', style: 'short', glasses: true, cloth: '#3F5C47', outfit: 'knit', bg: 'sage', alt: 'Illustration of Daniel' }), q: 'I want to understand the numbers, not just be told they are fine.', goal: 'A proactive, preventive relationship with one clinician.', pain: ['Rushed ten-minute visits', 'Results with no explanation', 'Hunting for old records'], need: ['Longer visits and clear summaries', 'Results with plain-language notes', 'All documents in one place'] }
  ];
  $('#personas').innerHTML = personas.map((p, i) => `<article class="panel persona reveal" style="transition-delay:${i * 80}ms"><div class="head"><div class="pic">${p.art.replace('<svg ', '<svg style="border-radius:var(--arch);display:block;width:100%" ')}</div><div><h3>${p.name}</h3><span class="muted small">${p.meta}</span></div></div>
    <p class="quote">“${p.q}”</p>
    <dl><div><dt>Goal</dt><dd>${p.goal}</dd></div><div><dt>Frustrations</dt><dd><ul>${p.pain.map(x => `<li>${x}</li>`).join('')}</ul></dd></div><div><dt>Vita House gives them</dt><dd><ul>${p.need.map(x => `<li>${x}</li>`).join('')}</ul></dd></div></dl></article>`).join('');

  /* ---------- 03 pillars ---------- */
  const pillars = [['Warm', 'heart', 'Soft neutrals, rounded forms and golden accents.', 'Greet people like we are glad to see them.'], ['Intelligent', 'sparkle', 'Clear hierarchy. Information shown with context.', 'Explain the “why” in plain words.'], ['Human', 'users', 'Real people, real moments, real time.', 'Write as one person to another.'], ['Calm', 'leaf', 'Generous whitespace, slow easing, one action per screen.', 'Never alarm. Be reassuring and specific.'], ['Professional', 'shield', 'Precise grids, accurate details, strong accessibility.', 'Be accurate and respect privacy.'], ['Contemporary', 'phone2', 'Mobile-first components and fresh, restrained interaction.', 'Short, direct and current. No clichés.']];
  $('#pillars').innerHTML = pillars.map(([t, i, d, v], k) => `<article class="pillar reveal" style="transition-delay:${(k % 3) * 70}ms"><div class="top"><span class="icon-chip ${['', 'clay', 'honey'][k % 3]}">${ic(i, 'icon-lg')}</span><span class="num-badge" aria-hidden="true">${k + 1}</span></div><h4>${t}</h4><p class="muted small" style="color:var(--text-2)">${d}</p><div class="rule"><b>Voice:</b> ${v}</div></article>`).join('');

  /* ---------- single-chapter render mode (used for portfolio images) ---------- */
  const only = VH.params.get('only');
  if (only) {
    document.body.classList.add('only');
    $$('.cs-bar, .cs-hero, .cs-hero + section, .ch, .cs-foot').forEach(s => { if (s.id !== 'c' + only && !(['cover', 'uicover'].includes(only) && s.classList.contains('cs-hero'))) s.style.display = 'none'; });
  }

    /* ======================= 04 VISUAL IDENTITY ======================= */
  const A = VH.archPath, SP = VH.sprig;
  $('#logoStage').innerHTML = `<div class="grid-bg"></div><div class="big-mark">${mk('100%', { guides: true })}</div>
    <span class="ann" style="left:5%;top:12%">Arch · the house, the doorway</span><span class="ann" style="right:5%;top:40%">Sun · warmth, life</span><span class="ann" style="left:5%;bottom:12%">V · Vita, open arms, a shoot</span>`;
  const sym = inner => `<span class="sym"><svg viewBox="0 0 64 72" width="34" height="38" aria-hidden="true">${inner}</svg></span>`;
  $('#concept3').innerHTML = [
    [sym('<path d="M6 72V32a26 26 0 0 1 52 0v40z" fill="#3F5C47"/>'), 'A doorway and a house', 'The arch is the shape of arrival and welcome. It is also the base unit of the whole graphic system.'],
    [sym('<path d="M19 40 32 62 45 40" fill="none" stroke="#3F5C47" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'), 'Vita: arms open, a shoot rising', 'A V for Vita. Read it as two open arms, as a person arriving, or as a seedling just breaking the soil.'],
    [sym('<circle cx="32" cy="36" r="13" fill="#E8BC5E"/>'), 'A point of warmth', 'The sun, a patient, a lamp left on. A single honey dot is the only colour accent in the symbol.']
  ].map(([s, t, d]) => `<div class="row-c">${s}<div><h4 style="font-size:1.0625rem">${t}</h4><p class="muted small" style="margin-top:.2rem;color:var(--text-2)">${d}</p></div></div>`).join('');

  const word = (sz, extra = '') => `<span class="logo" style="font-size:${sz};${extra}"><span class="logo-word">Vita <i>House</i></span></span>`;
  $('#lockups').innerHTML = [
    ['Horizontal · primary', VH.logo({ href: '', size: '2rem' })],
    ['Stacked', `<div style="display:grid;justify-items:center;gap:.7rem">${mk('3.4rem')}${word('1.9rem')}</div>`],
    ['Symbol', mk('5rem')],
    ['Wordmark', word('2.6rem')]
  ].map(([l, h], i) => `<div class="tile t-oat reveal" style="transition-delay:${i * 60}ms">${h}<span class="lbl">${l}</span></div>`).join('');

  $('#logoBgs').innerHTML = [
    ['t-linen', 'Full colour on Linen', VH.logo({ href: '', size: '1.9rem' })],
    ['t-moss', 'Reversed on Moss', VH.logo({ href: '', size: '1.9rem', dark: true })],
    ['t-sage', 'Mono on Sage', VH.logo({ href: '', size: '1.9rem', mono: true }), 'color:var(--moss-900)'],
    ['t-honey', 'Mono on Honey', VH.logo({ href: '', size: '1.9rem', mono: true }), 'color:var(--moss-900)'],
    ['t-ink', 'Mono on Ink', VH.logo({ href: '', size: '1.9rem', mono: true }), 'color:var(--oat)'],
    ['t-clay', 'Mono on Clay', VH.logo({ href: '', size: '1.9rem', mono: true }), 'color:#fff']
  ].map(([c, l, h, st], i) => `<div class="tile ${c} reveal" style="${st || ''};transition-delay:${(i % 3) * 60}ms">${h}<span class="lbl">${l}</span></div>`).join('');

  $('#clearSpace').innerHTML = `<div class="box">${VH.logo({ href: '', size: '1.9rem' })}<b class="xl" style="top:.55rem;left:50%;translate:-50% 0">x</b><b class="xl" style="bottom:.55rem;left:50%;translate:-50% 0">x</b><b class="xl" style="left:.8rem;top:50%;translate:0 -50%">x</b><b class="xl" style="right:.8rem;top:50%;translate:0 -50%">x</b></div>`;
  $('#minSizes').innerHTML = [['Digital', mk('20px'), '20px symbol', VH.logo({ href: '', size: '.8rem' }), '96px lockup'], ['Print', mk('6mm'), '6mm symbol', VH.logo({ href: '', size: '.8rem' }), '28mm lockup']].map(([n, s, sl, l, ll]) => `<div><span class="eyebrow plain" style="margin-bottom:.8rem">${n}</span><div style="display:flex;gap:2.5rem;align-items:flex-end;flex-wrap:wrap"><div style="display:grid;gap:.5rem;justify-items:start">${s}<small class="muted">${sl}</small></div><div style="display:grid;gap:.5rem;justify-items:start">${l}<small class="muted">${ll}</small></div></div></div>`).join('');
  $('#misuse').innerHTML = [
    ['Don\'t stretch or squash', `<div style="transform:scale(1.7,.8)">${mk('3.4rem')}</div>`],
    ['Don\'t recolour', mk('3.4rem', { arch: '#1E5AA8', head: '#C7D7EE' })],
    ['Don\'t add effects', `<div style="filter:drop-shadow(5px 7px 3px rgba(0,0,0,.55)) drop-shadow(0 0 0 #000)">${mk('3.4rem')}</div>`],
    ['Don\'t rotate or crowd', `<div style="transform:rotate(-24deg)">${mk('3.4rem')}</div>`]
  ].map(([l, h], i) => `<div class="tile t-oat misuse reveal" style="transition-delay:${i * 60}ms">${h}<span class="x">${ic('x')}</span><span class="lbl">${l}</span></div>`).join('');

  /* colour */
  const sw = [
    ['Linen', '#F6F1E7', 'Page background', '#232622', 'big'], ['Moss 700', '#3F5C47', 'Primary actions, links', '#FFFFFF'], ['Ink', '#232622', 'Text and headlines', '#FBF8F2'],
    ['Oat', '#FBF8F2', 'Cards, inputs, raised surfaces', '#232622'], ['Sage 200', '#C9D7C0', 'Soft green fields', '#232622'], ['Sage 400', '#8DA886', 'Illustration only', '#232622', '', 'graphic'], ['Moss 900', '#20352A', 'Dark surfaces, footer', '#FBF8F2'],
    ['Clay 500', '#C4714C', 'Illustration only. Use Clay 600 for text', '#232622', '', 'graphic'], ['Honey 400', '#E8BC5E', 'Highlights, sun', '#20352A'], ['Blush 200', '#F0D3C4', 'Warm fields', '#232622'], ['Sand 200', '#E3D8C3', 'Borders and dividers', '#232622']
  ];
  $('#swatches').innerHTML = sw.map(([n, h, r, t, big, gr], i) => `<div class="sw ${big ? 'big' : ''} reveal" style="transition-delay:${(i % 4) * 50}ms"><div class="chip-c" style="background:${h};color:${t}">${n}</div><div class="inf"><code>${h}</code><span>${r}</span><span>${gr ? 'Graphic use, not for text' : (t === '#232622' ? 'Ink' : t === '#FFFFFF' ? 'White' : t === '#FBF8F2' ? 'Oat' : 'Moss 900') + ' on this: <b>' + CS.cr(h, t).toFixed(1) + ':1</b>'}</span></div></div>`).join('');
  $('#rampG').innerHTML = ['#EEF2E8', '#E0E8D7', '#C9D7C0', '#8DA886', '#4D6F54', '#3F5C47', '#2F4A39', '#20352A'].map(c => `<i style="background:${c}" title="${c}"></i>`).join('');
  $('#rampW').innerHTML = ['#F7E6DC', '#F0D3C4', '#D98E6B', '#C4714C', '#A8532F', '#94472B', '#E8BC5E', '#8A5F12'].map(c => `<i style="background:${c}" title="${c}"></i>`).join('');

  const pairs = [['Ink', '#232622', 'Linen', '#F6F1E7', 'Body text'], ['Ink 2', '#454A44', 'Linen', '#F6F1E7', 'Secondary text'], ['Ink 3', '#5C6259', 'Oat', '#FBF8F2', 'Captions and helper text'], ['White', '#FFFFFF', 'Moss 700', '#3F5C47', 'Primary buttons'], ['Moss 700', '#3F5C47', 'Linen', '#F6F1E7', 'Links and accents'], ['Clay 600', '#A8532F', 'Oat', '#FBF8F2', 'Accent text'], ['Honey 400', '#E8BC5E', 'Moss 900', '#20352A', 'Highlights on dark'], ['Ink', '#232622', 'Honey 400', '#E8BC5E', 'Text on honey'], ['Brick', '#B03A2E', 'Oat', '#FBF8F2', 'Error messages'], ['Sage 400', '#8DA886', 'Linen', '#F6F1E7', 'Decorative only, never text']];
  const grade = r => r >= 7 ? ['aaa', 'AAA'] : r >= 4.5 ? ['aa', 'AA'] : r >= 3 ? ['ui', 'Large text / UI'] : ['na', 'Decorative only'];
  $('#contrast').insertAdjacentHTML('beforeend', pairs.map(([fn, f, bn, b, u]) => { const r = CS.cr(f, b), [g, gl] = grade(r); return `<tr><td><div class="pair"><span class="sample" style="background:${b};color:${f}">Aa</span>${fn} on ${bn}</div></td><td>${u}</td><td class="ratio">${r.toFixed(2)}:1</td><td><span class="grade ${g}">${gl}</span></td></tr>`; }).join(''));
  const gl = 'AaBbCcDdEeFfGgHh0123456789&?!';
  $('#glyphsA').innerHTML = [...gl].map(c => `<span>${c}</span>`).join(''); $('#glyphsB').innerHTML = [...gl].map(c => `<span>${c}</span>`).join('');
  $('#typeScale').innerHTML = [
    ['Display XL', 'Healthcare that feels like coming home', 'Fraunces 340 · 80/82', 'font:340 clamp(1.6rem,4.8vw,3.6rem)/1.05 var(--font-display);letter-spacing:-.028em'],
    ['Heading 1', 'Meet the clinicians behind the door', 'Fraunces 340 · 52/54', 'font:340 clamp(1.5rem,3.4vw,2.6rem)/1.1 var(--font-display);letter-spacing:-.02em'],
    ['Heading 2', 'Everything you need, under one roof', 'Fraunces 340 · 40/44', 'font:340 2rem/1.15 var(--font-display)'],
    ['Heading 3', 'Primary care, annual wellness exams', 'Fraunces 380 · 28/32', 'font:380 1.5rem/1.2 var(--font-display)'],
    ['Body large', 'A clinician who knows you: your history, your goals, your week.', 'Figtree 400 · 21/32', 'font:400 1.3rem/1.55 var(--font-ui)'],
    ['Body', 'Choose the closest match. You can change it later and nothing is saved until you confirm.', 'Figtree 400 · 17/28', 'font:400 1.0625rem/1.62 var(--font-ui)'],
    ['Label', 'Mobile phone', 'Figtree 600 · 15/20', 'font:600 .9375rem/1.3 var(--font-ui)'],
    ['Eyebrow', 'Primary care · Prevention', 'Figtree 700 · 13 · +14%', 'font:700 .8125rem/1 var(--font-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--moss-700)']
  ].map(([n, t, s, st]) => `<div class="type-row"><span class="nm">${n}</span><span style="${st}">${t}</span><span class="sz">${s}</span></div>`).join('');

  /* photography direction (illustrated studies) */
  const P_ = o => VH.person(o);
  const scenes = {
    talk: `<svg viewBox="0 0 400 300" role="img" aria-label="Illustrated study: a clinician and a patient in conversation by a window"><rect width="400" height="300" fill="#E0E8D7"/><path d="${A(250, 30, 120, 270)}" fill="#F6EBC4"/><path d="${A(266, 46, 88, 254)}" fill="#FBF3DB"/><rect y="236" width="400" height="64" fill="#E3D8C3"/>
      <g transform="translate(30 62) scale(.98)">${P_({ skin: 's5', hair: 'black', style: 'curly', cloth: '#3F5C47', outfit: 'coat', steth: true })}</g><g transform="translate(180 82) scale(.9)">${P_({ skin: 's2', hair: 'chestnut', style: 'short', cloth: '#C4714C', outfit: 'knit' })}</g></svg>`,
    family: `<svg viewBox="0 0 400 300" role="img" aria-label="Illustrated study: a family of three"><rect width="400" height="300" fill="#F2DDA6"/><circle cx="330" cy="70" r="40" fill="#F8EBC4"/>
      <g transform="translate(24 76) scale(.86)">${P_({ skin: 's3', hair: 'black', style: 'long', cloth: '#4D6F54', outfit: 'knit' })}</g><g transform="translate(176 68) scale(.9)">${P_({ skin: 's4', hair: 'black', style: 'short', cloth: '#E8BC5E', outfit: 'knit', glasses: true })}</g><g transform="translate(236 150) scale(.58)">${P_({ skin: 's3', hair: 'black', style: 'curly', cloth: '#C4714C', outfit: 'knit' })}</g></svg>`,
    space: `<svg viewBox="0 0 400 300" role="img" aria-label="Illustrated study: a calm waiting space with a window, a plant and a chair"><rect width="400" height="300" fill="#F0D3C4"/><path d="${A(120, 24, 170, 270)}" fill="#F6EBC4"/><path d="${A(138, 42, 134, 252)}" fill="#FDF6E2"/><path d="M205 170V42M138 170h134" stroke="#E8BC5E" stroke-width="3" opacity=".5"/><rect y="238" width="400" height="62" fill="#E3D8C3"/>
      <path d="M44 240v-62q0-34 34-34h44q34 0 34 34v62z" fill="#4D6F54"/><rect x="64" y="196" width="94" height="34" rx="14" fill="#3F5C47"/><path d="M300 240l8-46h44l8 46z" fill="#C4714C"/><g transform="translate(330 196) scale(1.15)">${SP('#4D6F54', '#8DA886')}</g></svg>`,
    detail: `<svg viewBox="0 0 400 300" role="img" aria-label="Illustrated study: a notebook, a mug and a sprig on a table"><rect width="400" height="300" fill="#F7E6DC"/><rect x="44" y="40" width="170" height="220" rx="10" fill="#FBF8F2" transform="rotate(-7 130 150)"/><g transform="rotate(-7 130 150)" stroke="#E3D8C3" stroke-width="3" stroke-linecap="round"><path d="M68 90h122M68 116h122M68 142h92"/></g>
      <circle cx="296" cy="166" r="58" fill="#E8BC5E"/><circle cx="296" cy="166" r="44" fill="#8A5F12" opacity=".85"/><path d="M350 150a24 24 0 0 1 0 40" fill="none" stroke="#E8BC5E" stroke-width="12" stroke-linecap="round"/><g transform="translate(236 250) rotate(18) scale(.8)">${SP('#4D6F54', '#8DA886')}</g></svg>`,
    video: `<svg viewBox="0 0 400 300" role="img" aria-label="Illustrated study: a video visit on a laptop at home"><rect width="400" height="300" fill="#C9D7C0"/><rect y="226" width="400" height="74" fill="#B6C7B0"/><rect x="82" y="46" width="236" height="154" rx="14" fill="#232622"/><rect x="92" y="56" width="216" height="134" rx="8" fill="#F0D3C4"/>
      <svg x="92" y="56" width="216" height="134" viewBox="30 60 140 90" overflow="hidden"><g>${P_({ skin: 's4', hair: 'black', style: 'bun', cloth: '#3F5C47', outfit: 'coat', steth: true })}</g></svg><path d="M54 202h292l-18 24H72z" fill="#3a3f3a"/><g transform="translate(350 232) scale(.7)">${SP('#4D6F54', '#8DA886')}</g></svg>`
  };
  const pf = (inner, cls, tag, title, text, overlay) => `<div class="reveal"><div class="photo-frame ${cls}">${inner}${overlay ? '<div class="rule3"></div>' : ''}<span class="tag">${tag}</span></div><div class="frame-cap"><b>${title}</b><span>${text}</span></div></div>`;
  $('#photoFrames').className = 'cols c4'; $('#photoFrames').innerHTML =
    pf(VH.portrait({ ...VH.prov('okafor').look, alt: 'Illustrated study of a clinician portrait' }), '', 'Arch crop', 'Portrait', 'Close, warm and unposed. Portraits are cropped into the brand arch.').replace('class="reveal"', 'class="reveal span-r2"') +
    pf(scenes.talk, 'wide', 'Eye level · window light', 'Conversation', 'Two people, side by side, with room to breathe. Subjects sit on the thirds.', true) +
    pf(scenes.family, 'wide', 'Candid · together', 'Family', 'Real relationships. People touching, laughing, mid-moment.') +
    pf(scenes.space, 'wide', 'Natural texture', 'Space', 'Timber, linen and plants, with light from a window, never clinical overheads.') +
    pf(scenes.detail, 'wide', 'Detail', 'Detail', 'Small moments: a mug, a notebook, a sprig. Warm, tactile and human.') +
    pf(scenes.video, 'wide', 'Home & virtual', 'Video visit', 'The screen is a window, not a barrier. Keep faces large and framing close.') +
    `<div class="panel reveal" style="align-self:start"><h4>Colour grade</h4><p>Lifted, warm shadows. Creamy highlights. Natural greens. Skin tones always protected.</p><div class="grade-strip" id="gradeStrip" style="margin-top:1rem"></div></div>`;
  $('#photoRules').innerHTML = [['sun', 'Natural window light', 'Soft, directional daylight. No flat fluorescent looks.'], ['user', 'Eye-level framing', 'Camera at the subject\'s eye line, never above the patient.'], ['message', 'Candid conversation', 'Real exchanges instead of posed handshakes.'], ['palette', 'Warm, lifted grade', 'Shadows lifted, highlights creamy, greens held natural.'], ['home', 'Real, textured spaces', 'Timber, linen, plants and books over sterile white.'], ['users', 'Everyone belongs', 'Ages, bodies, abilities and cultures reflected with dignity.']].map(([i, t, d], k) => `<div class="panel reveal" style="display:grid;grid-template-columns:auto 1fr;gap:1rem"><span class="icon-chip ${['', 'clay', 'honey'][k % 3]}">${ic(i, 'icon-lg')}</span><div><h4>${t}</h4><p>${d}</p></div></div>`).join('');
  $('#gradeStrip').innerHTML = ['#2E3029', '#6F8F6A', '#B8956A', '#E3C9A0', '#FBF3E3'].map(c => `<i style="background:${c}" title="${c}"></i>`).join('');
  const li = (n, t) => `<li>${ic(n)}<span>${t}</span></li>`;
  $('#photoDo').innerHTML = [li('check', 'Show real moments of care'), li('check', 'Use daylight and warm tones'), li('check', 'Crop portraits into arches'), li('check', 'Include diverse people')].join('');
  $('#photoDont').innerHTML = [li('x', 'Stock-photo smiles and handshakes'), li('x', 'Cold blue or sterile white rooms'), li('x', 'Stethoscopes held as props'), li('x', 'Showing symptoms or distress')].join('');

  /* graphic system */
  const gfx = [
    ['Doorways', 'Arches are always flat at the base and never rotated. Nest them to create depth.', '#E0E8D7', `<path d="${A(60, 70, 130, 230)}" fill="#C9D7C0"/><path d="${A(150, 30, 130, 270)}" fill="#3F5C47"/><path d="${A(172, 62, 86, 238)}" fill="#F2DDA6"/><path d="${A(250, 100, 90, 200)}" fill="#F0D3C4"/>`],
    ['Sprigs', 'Sprigs always grow upward, in pairs or odd groups, and are drawn in two greens.', '#F7E6DC', `<g transform="translate(110 260) scale(1.5)">${SP('#4D6F54', '#8DA886')}</g><g transform="translate(220 260) scale(1.1)">${SP('#3F5C47', '#A9BFA0')}</g><g transform="translate(300 260) scale(.8)">${SP('#4D6F54', '#8DA886')}</g>`],
    ['Sunrise arcs', 'Concentric half-circles add calm and a sense of light. Honey is always the innermost.', '#F8EBC4', `${VH.sunArcs(200, 220, 160, ['#D98E6B', '#E8BC5E', '#F2DDA6', '#FBF3DB'])}<rect y="220" width="400" height="60" fill="#F0D3C4" opacity=".6"/>`],
    ['Arch pattern', 'A repeating arch tile for packaging, tissue and wallpaper. Tone on tone, never loud.', '#20352A', `<defs><pattern id="ap" width="60" height="70" patternUnits="userSpaceOnUse"><path d="M10 70V32a20 20 0 0 1 40 0v38" fill="none" stroke="#3F5C47" stroke-width="3"/><path d="M20 70V34a10 10 0 0 1 20 0v36" fill="#2F4A39"/></pattern></defs><rect width="400" height="280" fill="url(#ap)"/>`],
    ['Soft fields', 'Organic blobs hold type or imagery. Always at least two palette colours, always soft.', '#FBF8F2', `<path d="M40 150c0-60 60-100 120-90s100 50 80 110-90 80-150 60-50-40-50-80z" fill="#C9D7C0"/><path d="M200 70c40-30 110-20 130 30s-20 110-80 120-90-30-80-80c0-30 10-50 30-70z" fill="#F0D3C4" opacity=".9"/><circle cx="300" cy="90" r="34" fill="#E8BC5E"/>`],
    ['Dot field', 'A quiet dot texture for maps and backgrounds, only in Sage on Sage.', '#E0E8D7', `<defs><pattern id="dp" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="2.4" fill="#8DA886"/></pattern></defs><rect width="400" height="280" fill="url(#dp)" opacity=".8"/><g transform="translate(180 120)"><path d="M6 72V32a26 26 0 0 1 52 0v40z" fill="#3F5C47"/><circle cx="32" cy="27" r="8" fill="#E8BC5E"/></g>`]
  ];
  $('#gfx').innerHTML = gfx.map(([n, d, bg, svg], i) => `<div class="reveal" style="transition-delay:${(i % 3) * 60}ms"><div class="gfx" style="background:${bg}"><svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${svg}</svg></div><div class="frame-cap"><b>${n}</b><span>${d}</span></div></div>`).join('');

  /* icons */
  let g = ''; for (let i = 0; i <= 24; i++) g += `<path d="M${i} 0V24M0 ${i}H24" stroke="#E3D8C3" stroke-width=".05"/>`;
  $('#iconSpec').innerHTML = `<svg viewBox="-1 -1 26 26" role="img" aria-label="Icon construction grid showing the stethoscope icon">${g}<rect x="2" y="2" width="20" height="20" fill="none" stroke="#C4714C" stroke-width=".12" stroke-dasharray=".5 .4"/><circle cx="12" cy="12" r="10" fill="none" stroke="#C4714C" stroke-width=".1" stroke-dasharray=".4 .4"/><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="#8DA886" stroke-width=".1"/><g fill="none" stroke="#232622" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${VH.icons.stethoscope}</g></svg>`;
  $('#iconGrid').innerHTML = Object.keys(VH.icons).filter(k => !['shield2', 'phone2', 'monitor'].includes(k)).map(k => `<div class="ic-cell">${ic(k)}<span>${k.replace('-', ' ')}</span></div>`).join('');

    /* ======================= 05 UX STRATEGY ======================= */
  const principles = [
    ['Clarity before cleverness', 'Every screen answers three questions: where am I, what can I do, what happens next.', 'Step titles, a persistent “Your visit” summary and plain-language buttons.'],
    ['One primary action', 'A single clear call to action per screen. Everything else is quieter.', '“Continue” is the only filled button in the booking flow.'],
    ['Plain language', 'Everyday words and short sentences. No codes, no acronyms.', '“What would you like to book?” instead of “Select appointment type”.'],
    ['Reassure at every step', 'Say what is safe, free or reversible before people decide.', '“Free to change or cancel up to 24 hours before.”'],
    ['Accessible by default', 'Contrast, targets, keyboard and screen readers are designed in, not bolted on.', '44px targets, visible focus, error summaries, text-size settings.'],
    ['Calm motion', 'Slow, soft easing that confirms an action rather than performing for attention.', 'Fades and 8px lifts. Reduced motion is respected everywhere.']
  ];
  $('#principles').innerHTML = principles.map(([t, d, p], i) => `<article class="panel principle reveal" style="transition-delay:${(i % 3) * 60}ms"><span class="n">${String(i + 1).padStart(2, '0')}</span><h4>${t}</h4><p>${d}</p><p class="tiny" style="color:var(--moss-800)"><b>In practice:</b> ${p}</p></article>`).join('');

  const stages = ['Discover', 'Choose', 'Book', 'Prepare', 'Visit', 'Follow up'];
  const doing = ['Searches for a clinic that fits her week', 'Compares clinicians, locations and insurance', 'Picks a service and time, enters details', 'Receives reminders, completes forms', 'Arrives, or joins by video', 'Reads her summary, messages the team'];
  const pains = ['Cold, confusing websites', 'No visible availability or prices', 'Long forms and unclear errors', 'Paper forms. What do I bring?', 'Waiting rooms and rushed visits', 'Results with no explanation'];
  const opps = ['A warm, clear home page with “Book a visit” always visible', 'Real availability and plain pricing up front', 'Six calm steps, inline help and kind error messages', 'A checklist and reminders in the dashboard', 'Phone check-in and unhurried appointments', 'Plain-language summaries, messaging and documents'];
  const emo = [58, 48, 30, 62, 72, 82];
  const pts = emo.map((v, i) => [(i + .5) / 6 * 600, 120 - 14 - v / 100 * 92]);
  let d = `M0 ${pts[0][1]}L${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += `C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`; } d += `L600 ${pts[5][1]}`;
  $('#journey').innerHTML = `<div class="grid-j">
    <div class="cell rh stage" style="background:var(--moss-900)"></div>${stages.map((s, i) => `<div class="cell stage"><span class="num-badge">${i + 1}</span>${s}</div>`).join('')}
    <div class="cell rh">Doing</div>${doing.map(x => `<div class="cell">${x}</div>`).join('')}
    <div class="cell rh">Feeling</div><div class="cell curve" style="position:relative"><svg viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="#3F5C47" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>${pts.map(([x, y], i) => `<i style="position:absolute;left:${x / 6}%;top:${y / 120 * 100}%;width:.9rem;height:.9rem;margin:-.45rem 0 0 -.45rem;border-radius:50%;background:${emo[i] < 40 ? 'var(--clay-500)' : 'var(--moss-700)'};border:2.5px solid var(--oat)"></i>`).join('')}<span class="tiny muted" style="position:absolute;left:.6rem;top:.4rem">Positive</span><span class="tiny muted" style="position:absolute;left:.6rem;bottom:.4rem">Frustrated</span></div>
    <div class="cell rh">Pain points</div>${pains.map(x => `<div class="cell pain-c">${x}</div>`).join('')}
    <div class="cell rh" style="background:var(--sage-100);color:var(--moss-800)">Vita House response</div>${opps.map(x => `<div class="cell opp">${x}</div>`).join('')}</div>`;

  $('#wcag').innerHTML = [
    ['Contrast', 'All text pairings reach at least 4.5:1; large text and UI components at least 3:1.'],
    ['Target size', 'Interactive elements are at least 44 × 44px, with generous spacing.'],
    ['Keyboard', 'Every flow works without a mouse, with a 3px focus ring that is always visible.'],
    ['Screen readers', 'Landmarks, labelled fields, and live regions that announce step changes and errors.'],
    ['Errors', 'Inline messages plus a summary that links to each field. Never colour alone.'],
    ['Text and motion', 'Text can scale to 200%, and a reduced-motion switch lives in the dashboard.'],
    ['Plain language', 'Short sentences, everyday words and no unexplained abbreviations.']
  ].map(([t, d]) => `<li>${ic('check-circle')}<div><b>${t}</b><span>${d}</span></div></li>`).join('');

  /* ======================= 06 INFORMATION ARCHITECTURE ======================= */
  const flowSteps = [['Choose service', 'Nine services with durations and formats. Pre-selected when arriving from a service page.'], ['Choose provider', '“Any available provider” or a specific clinician, with their next opening shown.'], ['Choose location', 'Video, or one of the houses that clinician works at, with distance.'], ['Date & time', 'A week strip with counts, then morning, afternoon and evening times.'], ['Your details', 'A plain form with inline validation, insurance and consent.'], ['Confirmed', 'Summary, calendar file, prep checklist and a link to the dashboard.']];
  $('#flow').innerHTML = flowSteps.map(([t, d], i) => `<div class="flow-step"><span class="num-badge">${i + 1}</span><h4>${t}</h4><p>${d}</p></div>`).join('');
  $('#flowBranch').innerHTML = `<span></span>
    <div class="branch alt" style="grid-column:2"><b>Waitlist</b>Clinicians not accepting new patients stay visible but disabled, with a reason.</div>
    <div class="branch alt" style="grid-column:3"><b>Video only when valid</b>The video option appears only for services that support it.</div>
    <div class="branch err" style="grid-column:4"><b>Empty or conflict</b>Full day: offer the next opening. Closed Sunday: switch to video. Slot just taken: three alternatives.</div>
    <div class="branch err" style="grid-column:5"><b>Validation</b>Inline messages and a summary that links to each field.</div>
    <div class="branch ok" style="grid-column:6"><b>Saved</b>Appears in the dashboard immediately, with reschedule and cancel.</div>`;
  $('#er').style.gridTemplateColumns = '1fr auto 1fr auto 1fr auto 1fr';
  $('#er').innerHTML = [['Service', 'name · duration', 'format · price note'], 'offered by', ['Provider', 'languages · focus', 'accepting new patients'], 'works at', ['Location', 'hours · amenities', 'address · phone'], 'booked as', ['Appointment', 'service + provider', 'location · date · status']].map(x => Array.isArray(x) ? `<div class="ent"><b>${x[0]}</b><span>${x[1]}</span><span>${x[2]}</span></div>` : `<div class="rel">${x} →</div>`).join('');

  /* ======================= 07 DESIGN SYSTEM ======================= */
  $('#spacing').innerHTML = [4, 8, 12, 16, 24, 32, 48, 64].map(n => `<div class="s"><i style="width:${n}px;height:${n}px"></i>${n}</div>`).join('');
  $('#radius').innerHTML = [['10', '10px'], ['16', '16px'], ['24', '24px'], ['32', '32px'], ['pill', '999px'], ['arch', '999px 999px 24px 24px']].map(([n, r]) => `<div class="r"><i style="border-radius:${r}"></i>${n}</div>`).join('');
  $('#dsAv').innerHTML = VH.portrait({ ...VH.prov('vasquez').look, shape: 'circle', alt: '' });
  $('#dsStepper').innerHTML = ['Service', 'Provider', 'Location', 'Date & time', 'Your details', 'Confirmed'].map((n, i) => `<li class="${i < 3 ? 'done' : i === 3 ? 'current' : ''}"><button type="button" tabindex="-1" ${i === 3 ? 'aria-current="step"' : ''}><span class="bar"></span><span class="lbl"><span class="n">Step ${i + 1}</span>${n}</span></button></li>`).join('');
  const nowD = new Date(); const dl = [12, 7, 10, 12, 9, 5, 0];
  $('#dsDays').innerHTML = dl.map((n, i) => { const dt = VH.fmt.plus(nowD, i + 1); return `<label class="day-tile ${n ? '' : 'none'}"><input type="radio" name="dsd" ${i === 0 ? 'checked' : ''} tabindex="-1"><span><span class="dow">${VH.fmt.date(dt, { weekday: 'short' })}</span><span class="dn">${dt.getDate()}</span><span class="av">${n ? n + ' times' : 'Full'}</span></span></label>`; }).join('');
  $('#dsSlots').innerHTML = ['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:30 AM', '11:00 AM'].map((t, i) => `<label class="slot"><input type="radio" name="dst" ${i === 3 ? 'checked' : ''} tabindex="-1"><span>${t}</span></label>`).join('');
  $('#dsEmpty').innerHTML = `${VH.emptyArt('calendar')}<h4>No upcoming visits</h4><p>Book a visit whenever you are ready. Most people finish in about three minutes.</p><button class="btn btn-primary btn-sm" type="button" tabindex="-1">Book a visit</button>`;
  $('#dsCards').innerHTML = VH.cards.service(VH.svc('mental'), 0) + VH.cards.provider(VH.prov('okafor'), 1) +
    `<div class="reveal"><div class="mini-dash" style="box-shadow:var(--shadow-1);height:100%;align-content:start"><div class="row-card"><div class="date-tile"><div><b>5</b><span>Oct</span></div></div><div style="flex:1"><b>Primary care</b><div class="muted small">9:30 AM · Dr. Okafor</div></div></div><span class="badge badge-ok" style="width:fit-content"><span class="dot"></span>Confirmed</span><div class="row"><button class="btn btn-secondary btn-sm" type="button" tabindex="-1">Reschedule</button><button class="btn btn-soft btn-sm" type="button" tabindex="-1">Details</button></div><p class="tiny muted">Appointment card</p></div></div>` +
    VH.cards.location(VH.locations[0], 3);
  VH.hydrate();

    /* ======================= 08 WEBSITE ======================= */
  const F = CS.frame;
  const wrapF = o => `<div>${F(o)}</div>`;
  $('#homeFrames').innerHTML = F({ src: 'site/index.html?static=1', w: 1440, h: 900, title: 'Vita House home page, hero', cap: 'Home · hero', sub: 'A promise, a primary action and a human face.' }) +
    `<div class="frames f2" style="gap:1rem">${[['#services', 'Services', 'Six clear cards under one roof.'], ['#how', 'How it works', 'Four calm steps.'], ['#membership', 'Membership', 'Pricing visible, no tricks.'], ['#locations', 'Locations', 'A dot-map of six houses.']].map(([h, t, s]) => wrapF({ src: 'site/index.html?static=1' + h, w: 1440, h: 800, title: 'Vita House home page, ' + t, cap: t, sub: s, open: false })).join('')}</div>`;
  $('#anatomy').innerHTML = [['Hero', 'A promise, one primary action and a human face.'], ['Healthcare proposition', 'Three ideas that explain the difference at a glance.'], ['Services', 'Six services as clear, tappable cards.'], ['How it works', 'Four calm steps from “I should get that checked” to done.'], ['Featured providers', 'Real availability and arch portraits that humanise the team.'], ['Membership', 'Three plans with visible pricing.'], ['Patient experience', 'A preview of the dashboard that follows the visit.'], ['Testimonials', 'Short stories from fictional patients.'], ['Locations', 'A dot-map of six houses with plain hours.'], ['Appointment CTA', 'One door, one button.']].map(([t, d], i) => `<li><span class="num-badge" style="background:var(--honey-400);color:var(--moss-900)">${i + 1}</span><div><b>${t}</b><span>${d}</span></div></li>`).join('');
  const pages = [['Services', 'services.html', 'services', 'Service cards, two ways to visit and a “help me choose” guide.'], ['Providers', 'providers.html', 'providers', 'Search, filters and a considerate empty state.'], ['Provider detail', 'provider.html?id=okafor', 'providers/okafor', 'Bio, services, locations and live availability.'], ['Membership', 'membership.html', 'membership', 'Three plans, a comparison table and FAQs.'], ['Locations', 'locations.html', 'locations', 'Six houses with hours, amenities and a dot-map.'], ['Resources', 'resources.html', 'resources', 'Filterable guides with an accessible reading dialog.'], ['About', 'about.html', 'about', 'The idea, values, accessibility and a concept note.'], ['Contact', 'contact.html', 'contact', 'A validated form, ways to reach us and FAQs.'], ['Book appointment', 'book.html', 'book', 'The six-step booking flow, covered in the next chapter.']];
  $('#pageFrames').innerHTML = pages.map(([t, f, u, s]) => wrapF({ src: 'site/' + f + (f.includes('?') ? '&' : '?') + 'static=1', w: 1440, h: 900, url: 'vitahouse.example/' + u, title: 'Vita House ' + t + ' page', cap: t, sub: s })).join('');
  $('#resp').innerHTML = [wrapF({ src: 'site/index.html?static=1', w: 1440, h: 900, title: 'Home at desktop width', cap: 'Desktop · 1440px', open: false }), wrapF({ src: 'site/index.html?static=1', w: 820, h: 1100, url: 'vitahouse.example', title: 'Home at tablet width', cap: 'Tablet · 820px', open: false }), wrapF({ kind: 'phone', src: 'site/index.html?static=1', w: 390, h: 844, title: 'Home at phone width', cap: 'Phone · 390px', open: false })].join('');

  /* ======================= 09 APPOINTMENT EXPERIENCE ======================= */
  const bp = 'embed=1&static=1&force=1&service=primary&provider=okafor&location=austin&date=%2B3&time=09:30';
  const bookSteps = [
    ['1 · Choose service', 'Nine services as large, tappable cards with duration and format.', 'embed=1&static=1&step=1'],
    ['2 · Choose provider', '“Any available provider” first, then clinicians with their next opening.', 'embed=1&static=1&service=primary&step=2'],
    ['3 · Choose location', 'Video or a nearby house, with distance and amenities.', 'embed=1&static=1&service=primary&provider=okafor&step=3'],
    ['4 · Date & time', 'A week strip with counts, and times grouped by part of day.', bp + '&step=4'],
    ['5 · Your details', 'A plain form with inline validation, insurance and consent.', bp + '&autofill=1&step=5'],
    ['6 · Confirmed', 'A ticket-style summary, calendar file and preparation checklist.', bp + '&step=6']
  ];
  $('#bookSteps').innerHTML = bookSteps.map(([t, s, q]) => wrapF({ src: 'site/book.html?' + q, w: 1280, h: 880, url: 'vitahouse.example/book', title: 'Booking step ' + t, cap: t, sub: s })).join('');
  const tag = (k, label, icon) => `<span class="state-tag ${k}">${ic(icon)} ${label}</span>`;
  $('#bookStates').innerHTML = [
    [tag('err', 'Error', 'alert-circle'), 'Validation errors', 'An error summary links to each field. Every message says how to fix it.', 'embed=1&static=1&state=errors&step=5'],
    [tag('empty', 'Empty', 'calendar'), 'Closed on Sundays', 'The empty state explains why and offers a video visit or the next opening.', 'embed=1&static=1&service=primary&provider=okafor&location=austin&state=empty&step=4'],
    [tag('warn', 'Conflict', 'clock'), 'That time was just taken', 'Someone booked it first. Three close alternatives are one tap away.', bp + '&state=taken&step=4'],
    [tag('warn', 'Waitlist', 'user'), 'Provider not accepting', 'Kept visible but disabled, with a clear reason, and “any provider” as the easy path.', 'embed=1&static=1&service=family&step=2']
  ].map(([tg, t, s, q]) => `<div>${tg}${F({ src: 'site/book.html?' + q, w: 1280, h: 880, url: 'vitahouse.example/book', title: t, cap: t, sub: s })}</div>`).join('');

  /* ======================= 10 PATIENT DASHBOARD ======================= */
  const pq = 'embed=1&static=1';
  $('#dashHero').innerHTML = F({ src: `site/portal.html?${pq}#/`, w: 1440, h: 920, url: 'app.vitahouse.example', title: 'Dashboard overview', cap: 'Overview', sub: 'The next appointment, preparation, messages, documents and membership.' });
  $('#dashNotes').innerHTML = [['The next appointment comes first', 'With the one action that matters: check in, or join the video visit.'], ['Prepare for your visit', 'A short checklist with progress, so nobody arrives unprepared.'], ['Messages and documents at a glance', 'Unread items are marked with a dot and the words “Unread”.'], ['Membership and care-plan reminders', 'Benefits and gentle prompts. Never alarms.']].map(([t, d], i) => `<li><span class="num-badge">${i + 1}</span><div><b>${t}</b><span>${d}</span></div></li>`).join('');
  $('#dashFrames').innerHTML = [['appointments', 'Appointments', 'Upcoming, past and cancelled, with reschedule and cancel.'], ['care-team', 'Care team', 'Primary provider, bio, languages and how to reach them.'], ['messages', 'Messages', 'A two-pane inbox with replies, typing and failure handling.'], ['documents', 'Documents', 'Summaries, results and forms, with accessible uploads.'], ['membership', 'Membership', 'Plan, benefits used, billing and a membership card.'], ['settings', 'Profile & settings', 'Details, notifications, text size and reduced motion.']].map(([h, t, s]) => wrapF({ src: `site/portal.html?${pq}#/${h}`, w: 1440, h: 900, url: 'app.vitahouse.example/' + h, title: 'Dashboard ' + t, cap: t, sub: s })).join('');
  $('#dashStates').innerHTML = [
    [tag('empty', 'Empty', 'user'), 'New patient overview', 'A welcome, a getting-started checklist and a clear first step.', `site/portal.html?${pq}&state=new#/`],
    [tag('empty', 'Empty', 'calendar'), 'No appointments yet', 'Explains what will appear here and offers the one action to take.', `site/portal.html?${pq}&state=new#/appointments`],
    [tag('err', 'Error', 'alert-circle'), 'Message failed to send', 'The draft is kept, the problem is explained and Retry is one tap away.', `site/portal.html?${pq}&state=msgerror#/messages/m1`]
  ].map(([tg, t, s, src]) => `<div>${tg}${F({ src, w: 1440, h: 900, url: 'app.vitahouse.example', title: t, cap: t, sub: s })}</div>`).join('');

  /* ======================= 11 MOBILE ======================= */
  const phone = (src, t, s) => wrapF({ kind: 'phone', src, w: 390, h: 844, title: t, cap: t, sub: s });
  $('#mBook').innerHTML = [['embed=1&static=1&step=1', 'Choose service', 'One column, large cards, sticky Continue.'], ['embed=1&static=1&service=primary&step=2', 'Choose provider', 'Avatars, languages and next openings.'], [bp + '&step=4', 'Pick a time', 'Swipe the week; times in three-up grid.'], [bp + '&step=6', 'Confirmed', 'Ticket, calendar and checklist.']].map(([q, t, s]) => phone('site/book.html?' + q, t, s)).join('');
  $('#mDash').innerHTML = [[`#/`, 'Home', 'Next visit, quick actions and tab bar.'], [`#/appointments`, 'Visits', 'Large cards with Reschedule and Details.'], [`#/messages/m1`, 'Messages', 'One pane at a time with a back button.'], [`#/&sheet=more`, 'More', 'A bottom sheet for secondary places.']].map(([h, t, s]) => phone(h.includes('&sheet') ? `site/portal.html?${pq}&sheet=more` : `site/portal.html?${pq}${h}`, t, s)).join('');
  $('#mPrinciples').innerHTML = [['phone2', 'Thumb zone', 'Primary actions sit in the lower third, within easy reach.'], ['menu', 'Bottom tab bar', 'Five labelled destinations, always visible.'], ['arrow-right', 'Sticky actions', 'Back and Continue stay pinned while the form scrolls.'], ['calendar', 'Swipeable dates', 'The week strip scrolls horizontally with snap points.'], ['layers', 'Bottom sheets', 'Secondary navigation opens as a sheet, not a new page.'], ['type', 'Readable by default', '17px text, 44px targets and respect for system text size.']].map(([i, t, d]) => `<article class="panel dk reveal"><span class="icon-chip dark">${ic(i, 'icon-lg')}</span><h4 style="margin-top:.9rem">${t}</h4><p>${d}</p></article>`).join('');
  $('#tzWrap').innerHTML = F({ kind: 'phone', src: 'site/book.html?' + bp + '&step=4', w: 390, h: 844, title: 'Thumb zone map', overlay: true, open: false });

  /* ======================= 12 ECOSYSTEM ======================= */
  const word2 = (sz, col) => `<span class="logo" style="font-size:${sz};color:${col}"><span class="logo-word">Vita <i style="color:inherit">House</i></span></span>`;
  const eco = [];
  eco.push(`<div class="s5" style="background:var(--blush-200);min-height:23rem"><div style="position:relative;width:100%;height:16rem"><div class="mc sage" style="position:absolute;left:3%;top:10%;transform:rotate(-7deg)"><span class="arc"></span><small style="font:700 .6rem var(--font-ui);letter-spacing:.14em">MEMBER BENEFITS</small><div style="font-size:.6875rem;line-height:1.5;max-width:70%">Unlimited virtual visits<br>Annual wellness exam<br>Same-day messaging</div></div><div class="mc moss" style="position:absolute;right:3%;top:30%;transform:rotate(5deg)"><span class="arc"></span><div class="row between" style="flex-wrap:nowrap">${mk('1.9rem', { arch: 'var(--sage-200)', head: 'var(--honey-400)' })}<small style="font:700 .6rem var(--font-ui);letter-spacing:.14em">EVERYDAY</small></div><div><div style="font:400 1.3rem var(--font-display)">Maya Bennett</div><small style="font:600 .625rem var(--font-ui);letter-spacing:.12em;opacity:.7">VH-2026-04412</small></div></div></div><span class="lab">Membership cards</span></div>`);
  eco.push(`<div class="s4" style="background:var(--sage-200);min-height:23rem"><div class="sign">${mk('3.2rem', { arch: 'var(--oat)', head: 'var(--honey-400)' })}<div style="font:380 1.4rem/1.15 var(--font-display)">Come on in.</div><small style="font:600 .625rem var(--font-ui);letter-spacing:.12em;opacity:.8">MON–FRI 7:30 – 7:00<br>SAT 9:00 – 2:00</small></div><span class="lab">Door sign</span></div>`);
  eco.push(`<div class="s3" style="background:var(--linen);border:1px solid var(--line);min-height:23rem"><div style="display:grid;gap:1.25rem;justify-items:center"><div class="appicon" style="background:var(--moss-700)">${mk('2.8rem', { arch: 'var(--sage-200)', head: 'var(--honey-400)' })}</div><div class="appicon" style="background:var(--honey-400)">${mk('2.8rem', { arch: 'var(--moss-900)', head: 'var(--moss-900)' })}</div><div class="appicon" style="border-radius:50%;background:var(--sage-200)">${mk('2.8rem')}</div></div><span class="lab">App &amp; social icons</span></div>`);
  eco.push(`<div class="s4" style="background:var(--sand-200)"><div style="display:grid;gap:1.1rem;justify-items:center"><div class="bizcard f" style="transform:rotate(-3deg)"><div class="row" style="flex-wrap:nowrap;gap:.5rem">${mk('1.5rem')}<span class="logo" style="font-size:1rem"><span class="logo-word">Vita <i>House</i></span></span></div><div><div style="font:400 1rem var(--font-display)">Dr. Amara Okafor</div><div style="font-size:.625rem;color:var(--ink-3)">Primary care · East Austin<br>(512) 555-0142</div></div></div><div class="bizcard b" style="transform:rotate(2deg)">${mk('2.4rem', { arch: 'var(--sage-200)', head: 'var(--honey-400)' })}</div></div><span class="lab">Business cards</span></div>`);
  eco.push(`<div class="s4" style="background:var(--oat);border:1px solid var(--line)"><div style="position:relative"><div class="paper"><div class="row" style="flex-wrap:nowrap;gap:.4rem">${mk('1.2rem')}<span class="logo" style="font-size:.8rem"><span class="logo-word">Vita <i>House</i></span></span></div><br><i style="width:40%"></i><br><i></i><i></i><i style="width:92%"></i><i></i><i style="width:70%"></i><br><i></i><i style="width:85%"></i><i style="width:55%"></i><div style="margin-top:auto;height:2rem"></div></div><div style="position:absolute;right:-26%;bottom:-6%;width:62%;aspect-ratio:1.9;background:var(--sand-100);border-radius:4px;box-shadow:0 14px 24px -12px rgba(35,38,34,.4);display:grid;place-items:center;transform:rotate(6deg)"><div style="position:absolute;inset:0;clip-path:polygon(0 0,100% 0,50% 58%);background:var(--sand-200)"></div>${mk('1.1rem')}</div></div><span class="lab">Letterhead &amp; envelope</span></div>`);
  eco.push(`<div class="s4" style="background:var(--honey-400)"><div class="tote"><span class="strap"></span><div class="bag">${mk('3.2rem')}<span class="logo" style="font-size:1.1rem"><span class="logo-word">Vita <i>House</i></span></span></div></div><span class="lab" style="color:var(--moss-900)">Welcome tote</span></div>`);
  eco.push(`<div class="s6" style="background:var(--moss-900);min-height:22rem;color:var(--oat)"><div class="row" style="flex-wrap:nowrap;gap:1.1rem;width:100%;justify-content:center"><div class="social" style="background:var(--sage-200);color:var(--moss-900);width:30%"><small>Vita House</small><b>Small changes, <em>kindly done.</em></b></div><div class="social" style="background:var(--honey-400);color:var(--moss-900);width:30%"><svg viewBox="0 0 200 100" style="position:absolute;bottom:0;left:0;width:100%" aria-hidden="true">${VH.sunArcs(100, 100, 90, ['#D98E6B', '#F0D3C4', '#FBF3DB'])}</svg><small style="position:relative">Sunday reset</small><b style="position:relative">A gentler start to the week.</b></div><div class="social" style="background:var(--moss-700);color:var(--oat);width:30%"><small>Open door</small><b>Your door is <em style="color:var(--honey-400)">open.</em></b><svg viewBox="-60 -110 120 110" style="width:34%;margin-top:-.3rem" aria-hidden="true"><g>${VH.sprig('#C9D7C0', '#8DA886')}</g></svg></div></div><span class="lab" style="color:var(--sage-200)">Social posts</span></div>`);
  eco.push(`<div class="s3" style="background:var(--blush-100);min-height:22rem"><div class="sms"><small class="muted" style="font-weight:700;letter-spacing:.08em;font-size:.625rem">VITA HOUSE · TEXT</small><div class="b">Hi Maya, a reminder of your visit with Dr. Okafor tomorrow at 9:30 AM at East Austin. Reply C to confirm or R to reschedule.</div><div class="b" style="justify-self:end;background:var(--moss-700);color:#fff;border-radius:16px 16px 4px 16px;max-width:30%;text-align:center">C</div><div class="b">Wonderful, you're all set. See you soon.</div></div><span class="lab">Appointment reminder</span></div>`);
  eco.push(`<div class="s3" style="background:var(--linen);border:1px solid var(--line);min-height:22rem"><div style="width:min(100%,12rem);aspect-ratio:.72;background:var(--sage-200);border-radius:999px 999px 8px 8px;display:grid;align-content:end;justify-items:center;gap:.6rem;padding:1rem 1rem 1.4rem;position:relative;overflow:hidden;box-shadow:0 24px 40px -18px rgba(35,38,34,.4)"><svg viewBox="0 0 200 120" style="position:absolute;top:18%;left:0;width:100%" aria-hidden="true">${VH.sunArcs(100, 110, 80, ['#D98E6B', '#E8BC5E', '#F2DDA6', '#FBF3DB'])}</svg><div style="font:380 1.15rem/1.15 var(--font-display);text-align:center;position:relative;color:var(--moss-900)">Take a breath.<br><em>We'll be right with you.</em></div></div><span class="lab">Waiting-room poster</span></div>`);
  eco.push(`<div class="s12" style="background:var(--ink);min-height:25rem"><div class="row" style="flex-wrap:nowrap;gap:clamp(.8rem,3vw,2.5rem);justify-content:center;width:100%"><div class="shelter" style="background:var(--sage-200)"><div>${mk('2rem')}</div><div style="font:340 1.6rem/1.05 var(--font-display);letter-spacing:-.02em;color:var(--moss-900)">Healthcare that feels like <em style="color:var(--moss-700)">coming home.</em></div><div class="row" style="flex-wrap:nowrap;font-size:.6875rem;font-weight:700;color:var(--moss-900)"><span style="background:var(--moss-700);color:#fff;padding:.4rem .7rem;border-radius:99px">Book a visit</span>vitahouse.example</div></div><div class="shelter" style="background:var(--honey-400)"><div>${mk('2rem', { arch: 'var(--moss-900)', head: 'var(--moss-900)' })}</div><svg viewBox="0 0 200 110" style="width:100%" aria-hidden="true">${VH.sunArcs(100, 105, 90, ['#C4714C', '#F0D3C4', '#FBF3DB'])}</svg><div style="font:340 1.5rem/1.05 var(--font-display);color:var(--moss-900)">Evenings and weekends, <em>too.</em></div></div><div class="shelter" style="background:var(--moss-800);color:var(--oat)"><div>${mk('2rem', { arch: 'var(--sage-200)', head: 'var(--honey-400)' })}</div><div style="font:340 1.6rem/1.05 var(--font-display);letter-spacing:-.02em">One house for the <em style="color:var(--honey-400)">whole family.</em></div><div class="row" style="flex-wrap:nowrap;font-size:.6875rem;font-weight:700"><span style="background:var(--honey-400);color:var(--moss-900);padding:.4rem .7rem;border-radius:99px">Join Whole House</span></div></div></div><span class="lab" style="color:#AFC0AA">Out-of-home posters</span></div>`);
  $('#eco').innerHTML = eco.join('');


  /* anchors for sub-sections + optional layout dump (used to cut portfolio gallery images) */
  $$('.sub-h').forEach(h => { const k = $('.k', h); if (k) h.id = 'sh-' + k.textContent.trim(); });
  if (only === 'cover' || only === 'uicover') { document.body.classList.add('only-cover'); $$('.ch, .cs-foot').forEach(s => s.style.display = 'none'); const b = $('.cs-bar'); if (b) b.style.display = 'none'; }
  if (only === 'uicover') {
    const sub = $('.cs-hero .sub'); if (sub) sub.textContent = 'A live website, six-step booking flow and patient dashboard for a fictional preventative-care company.';
    const dd = $$('.cs-hero .meta-grid dd')[2]; if (dd) dd.textContent = 'UX/UI Design · Website Design · Digital Product Design';
    const ctas = $('.cs-hero .row'); if (ctas) ctas.style.display = 'none';
  }
  if (only === 'brandcover') {
    const bc = $('#brandCover'); bc.hidden = false;
    $$('.cs-bar, .cs-hero, .cs-hero + section, .ch, .cs-foot').forEach(s => s.style.display = 'none');
    $('#bcLogo').innerHTML = VH.logo({ href: '', size: '5.6rem' });
    $('#bcScene').innerHTML = VH.heroScene();
    $('#bcPal').innerHTML = [['Linen', '#F6F1E7'], ['Sage', '#C9D7C0'], ['Moss', '#3F5C47'], ['Ink', '#232622'], ['Clay', '#C4714C'], ['Honey', '#E8BC5E']].map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('');
  }
  if (VH.params.has('rects')) {
    setTimeout(() => {
      const r = {}; $$('[id], .cs-hero').forEach(e => { const b = e.getBoundingClientRect(); r[e.id || e.className.split(' ')[0]] = [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)]; });
      const s = document.createElement('script'); s.type = 'application/json'; s.id = 'rects'; s.textContent = JSON.stringify(r); document.body.appendChild(s);
    }, 2500);
  }

  /*CH-JS-NEXT*/

  buildFrames();
  VH.reveal();
  document.fonts && document.fonts.ready.then(fit);
})();
