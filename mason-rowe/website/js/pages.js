/* MASON & ROWE — page controllers.
   SELF-INITIATED CONCEPT PROJECT by Rovard Studios. Forms never transmit data. */
(function () {
  const MR = window.MR, { $, $$, esc, ico } = MR;
  const P = {};
  const POS = { 'halden-house': '50% 50%', 'the-averly': '62% 50%', 'wren-canyon': '54% 50%', 'quarry-house': '58% 50%' };
  const AMEN_IMG = { spa: 'spa', pool: 'spa', fitness: 'spa', lounge: 'living_charcoal', dining: 'terrace', cinema: 'living_charcoal', wine: 'd_stone', library: 'living', terrace: 'terrace', garden: 'quarry-oak', marina: 'averly-pier', concierge: 'lobby', garage: 'halden-lobby', ev: 'd_glass', security: 'd_bronze', pets: 'd_plaster', business: 'lobby' };
  const imgTag = (n, alt, extra) => `<img src="img/${n}.jpg" alt="${esc(alt || '')}" ${extra || 'loading="lazy" decoding="async"'}>`;
  const chip = d => `<span class="chip chip--${d.statusKey === 'selling' ? 'sell' : d.statusKey}">${d.status}</span>`;
  const bedsLabel = n => n + ' bed';

  /* ── shared: availability stack + unit detail ───────────── */
  function renderStack(el, slug, opts) {
    opts = opts || {};
    const dev = MR.dev(slug), units = MR.unitsFor(slug), rows = {}, order = [];
    units.forEach(u => { if (!rows[u.row]) { rows[u.row] = []; order.push(u.row); } rows[u.row].push(u); });
    if (dev.stack.kind === 'tower') order.reverse();
    el.innerHTML = `<div class="stackgrid" role="group" aria-label="Availability by floor">${order.map(r => `<div class="srow"><b>${r.replace('Floor ', 'Fl ').replace(' terrace', '')}</b><div class="cells">${rows[r].map(u => `<button type="button" class="cell is-${u.status}" data-id="${u.id}" aria-label="${u.id}, ${MR.TYPES[u.type].name}, ${u.status}">${u.id}<small>${u.beds} bd</small></button>`).join('')}</div></div>`).join('')}</div>`;
    const apply = () => {
      $$('.cell', el).forEach(c => {
        const u = units.find(x => x.id === c.dataset.id);
        c.classList.toggle('is-dim', !!(opts.filter && !opts.filter(u)));
      });
    };
    el.addEventListener('click', e => {
      const c = e.target.closest('.cell'); if (!c) return;
      $$('.cell', el).forEach(x => x.classList.remove('is-sel')); c.classList.add('is-sel');
      opts.onSelect && opts.onSelect(units.find(x => x.id === c.dataset.id));
    });
    apply();
    return { apply, select(id) { const c = $(`.cell[data-id="${id}"]`, el); if (c) c.click(); } };
  }
  function unitDetail(el, u) {
    if (!u) { el.innerHTML = `<p class="eyebrow">Residence</p><h3 class="d-s" style="margin:14px 0 10px">Select a residence.</h3><p class="empty">Choose any home on the plan to see its layout, view and price.</p>`; return; }
    const t = MR.TYPES[u.type], dev = MR.dev(u.dev), sf = MR.typeSqft(u.type), out = MR.typeOutdoor(u.type);
    const sold = u.status === 'sold';
    el.innerHTML = `<p class="eyebrow">${esc(dev.name)} · ${esc(u.row)}</p>
      <h3 class="d-m" style="margin:14px 0 6px">${esc(u.id)} — <em>${esc(t.name)}</em></h3>
      <span class="chip chip--dark chip--${u.status === 'available' ? 'sell' : 'preview'}">${u.status.charAt(0).toUpperCase() + u.status.slice(1)}</span>
      <div class="plan">${MR.planSVG(t.plan, { mini: true, label: 'Floor plan of ' + t.name })}</div>
      <dl class="kv"><div><dt>Bedrooms</dt><dd>${u.beds}</dd></div><div><dt>Bathrooms</dt><dd>${u.baths}</dd></div><div><dt>Interior</dt><dd>${MR.sf(sf)}</dd></div>${out ? `<div><dt>Outdoor</dt><dd>${MR.sf(out)}</dd></div>` : ''}<div><dt>Aspect</dt><dd>${esc(u.view)}</dd></div><div><dt>Price</dt><dd>${sold ? 'Sold' : MR.usd(u.price)}</dd></div></dl>
      <div class="acts">${sold ? `<a class="btn btn--light" href="contact.html#enquire">Register for similar homes</a>` :
        `<button class="btn btn--light btn--solid" data-enquire data-dev="${u.dev}" data-unit="${u.id}">Request details ${ico('i-arrow')}</button><a class="btn btn--light" href="private-viewing.html?d=${u.dev}&u=${u.id}">Schedule private viewing</a>`}</div>`;
  }
  MR.renderStack = renderStack; MR.unitDetail = unitDetail;

  /* ── shared: map ─────────────────────────────────────────── */
  function renderMap(el, cityKey) {
    const H = MR.HOODS[cityKey], cats = ['All'].concat(Object.keys(MR.CATS).filter(c => H.pois.some(p => p.cat === c)));
    el.innerHTML = `<div class="mapwrap"><div class="mapbox">${MR.mapSVG(cityKey)}</div><div><div class="filters" role="group" aria-label="Filter places" style="margin-bottom:22px">${cats.map((c, i) => `<button type="button" class="fbtn" aria-pressed="${i === 0}" data-c="${c}">${c}</button>`).join('')}</div><ul class="poilist">${H.pois.map(p => `<li data-n="${p.n}" data-cat="${p.cat}" tabindex="0"><span class="n">${p.n}</span><div><b>${esc(p.name)}</b><small>${p.cat}</small></div><em>${p.min} min ${p.mode}</em></li>`).join('')}</ul><p class="note" style="margin-top:22px">Illustrative map. Places and travel times are fictional and shown for concept purposes only.</p></div></div>`;
    const pins = $$('.map-poi', el), items = $$('.poilist li', el);
    const on = n => { pins.forEach(x => x.classList.toggle('is-on', x.dataset.n === n)); items.forEach(x => x.classList.toggle('is-on', x.dataset.n === n)); };
    items.forEach(li => { li.addEventListener('mouseenter', () => on(li.dataset.n)); li.addEventListener('focus', () => on(li.dataset.n)); li.addEventListener('mouseleave', () => on('')); });
    pins.forEach(pn => { pn.addEventListener('mouseenter', () => on(pn.dataset.n)); pn.addEventListener('focus', () => on(pn.dataset.n)); pn.addEventListener('mouseleave', () => on('')); });
    $$('.fbtn', el).forEach(b => b.addEventListener('click', () => {
      $$('.fbtn', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const c = b.dataset.c;
      pins.forEach(x => x.classList.toggle('is-dim', c !== 'All' && x.dataset.cat !== c));
      items.forEach(x => x.classList.toggle('is-dim', c !== 'All' && x.dataset.cat !== c));
    }));
  }
  MR.renderMap = renderMap;

  /* ── shared: availability summary bar ────────────────────── */
  const bar3 = s => `<div class="bar3" data-bar><i class="a" data-w="${s.available / s.total * 100}%"></i><i class="r" data-w="${s.reserved / s.total * 100}%"></i><i class="s" data-w="${s.sold / s.total * 100}%"></i></div><div class="bar3-l"><span><b>${s.available}</b> available</span><span><b>${s.reserved}</b> reserved</span><span><b>${s.sold}</b> sold</span></div>`;

  /* ═════════════ HOME ═════════════ */
  P.home = function () {
    const hero = $('#hero'), slidesEl = $('.hero-slides', hero), cap = $('.hero-cap', hero), dots = $('.hero-dots', hero);
    const D = MR.DEVS; let cur = 0, timer;
    D.forEach((d, i) => { if (i === 0) return; slidesEl.insertAdjacentHTML('beforeend', `<div class="hero-slide"><img src="img/${d.img.hero}.jpg" alt="${esc(d.alt[d.img.hero])}" style="object-position:${POS[d.slug]}" loading="lazy"></div>`); });
    dots.innerHTML = D.map((d, i) => `<button type="button" class="${i === 0 ? 'is-on' : ''}" aria-label="Show ${d.name}" data-i="${i}">${MR.pad2(i + 1)}<i></i></button>`).join('');
    const slides = $$('.hero-slide', slidesEl);
    const go = i => {
      cur = (i + D.length) % D.length;
      slides.forEach((s, k) => s.classList.toggle('is-on', k === cur));
      $$('button', dots).forEach((b, k) => b.classList.toggle('is-on', k === cur));
      const d = D[cur];
      cap.innerHTML = `Now showing — <a href="development.html?d=${d.slug}">${d.name} · ${d.city} ${ico('i-arrow-ne')}</a>`;
    };
    go(0);
    dots.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; go(+b.dataset.i); restart(); });
    const restart = () => { clearInterval(timer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => go(cur + 1), 7500); };
    restart();
    document.addEventListener('visibilitychange', () => { document.hidden ? clearInterval(timer) : restart(); });

    /* featured + strip */
    const strip = $('#devStrip');
    if (strip) strip.innerHTML = D.filter(d => d.slug !== 'halden-house').map(d => `<a class="dcard" href="development.html?d=${d.slug}" data-cursor="View" style="width:min(78vw,520px)"><div class="img img--zoom" style="aspect-ratio:4/5"><img src="img/${d.img.card}.jpg" alt="${esc(d.alt[d.img.card])}" style="object-position:${POS[d.slug]}" loading="lazy"></div><div style="padding-top:20px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px"><div><h4 class="d-s">${d.name}</h4><p class="mute small" style="margin:6px 0 0">${d.area}, ${d.city}</p></div><div style="text-align:right">${chip(d)}<p class="small mute" style="margin:8px 0 0">From ${MR.usdShort(d.from)}</p></div></div></a>`).join('');
    const st = $('.strip-h', document), bar = $('#stripBar');
    if (st && bar) { const up = () => { const m = st.scrollWidth - st.clientWidth; bar.style.transform = `translateX(${m > 0 ? (st.scrollLeft / m) * 400 : 0}%)`; }; st.addEventListener('scroll', up, { passive: true }); }
    $$('[data-strip]').forEach(b => b.addEventListener('click', () => st.scrollBy({ left: (b.dataset.strip === 'next' ? 1 : -1) * st.clientWidth * 0.6, behavior: 'smooth' })));

    /* amenities */
    const keys = ['spa', 'pool', 'lounge', 'dining', 'cinema', 'terrace', 'wine', 'concierge'], list = $('#amenList'), view = $('#amenView');
    list.innerHTML = keys.map((k, i) => { const a = MR.AMENITIES[k]; return `<li class="${i === 0 ? 'is-on' : ''}" data-k="${k}"><button type="button" aria-expanded="${i === 0}">${ico(a.icon)}<h4>${a.name}</h4>${ico('i-arrow', 'go')}<p>${a.text}</p></button></li>`; }).join('');
    view.innerHTML = keys.map((k, i) => `<img src="img/${AMEN_IMG[k]}.jpg" alt="${esc(MR.AMENITIES[k].name)}" data-k="${k}" class="${i === 0 ? 'on' : ''}" loading="lazy">`).join('');
    const setA = k => { $$('li', list).forEach(l => { const o = l.dataset.k === k; l.classList.toggle('is-on', o); $('button', l).setAttribute('aria-expanded', o); }); $$('img', view).forEach(im => im.classList.toggle('on', im.dataset.k === k)); };
    $$('li', list).forEach(l => { l.addEventListener('mouseenter', () => setA(l.dataset.k)); $('button', l).addEventListener('click', () => setA(l.dataset.k)); });

    /* cities */
    const cl = $('#cityList'), cb = $('#cityBgs');
    cl.innerHTML = D.map((d, i) => `<li><a href="development.html?d=${d.slug}" data-k="${d.cityKey}"><small>${MR.pad2(i + 1)}</small><b>${d.city}</b><span>${d.name}</span></a></li>`).join('');
    cb.innerHTML = D.map((d, i) => `<img src="img/${d.img.city}.jpg" alt="" data-k="${d.cityKey}" class="${i === 0 ? 'on' : ''}" loading="lazy">`).join('');
    $$('a', cl).forEach(a => { const f = () => $$('img', cb).forEach(im => im.classList.toggle('on', im.dataset.k === a.dataset.k)); a.addEventListener('mouseenter', f); a.addEventListener('focus', f); });

    /* availability rows */
    $('#avRows').innerHTML = D.map(d => { const s = MR.summary(d.slug); return `<div class="avrow" data-r><div><h4>${d.name}</h4><small>${d.area}, ${d.city}</small></div><div><span class="chip chip--${d.statusKey === 'selling' ? 'sell' : d.statusKey}">${d.status}</span><p class="small mute" style="margin:10px 0 0">From ${MR.usdShort(d.from)} · ${d.completion}</p></div><div>${bar3(s)}</div><a class="btn btn--sm" href="availability.html?d=${d.slug}">View availability</a></div>`; }).join('');
    MR.scan(document);
  };

  /* ═════════════ DEVELOPMENTS ═════════════ */
  P.developments = function () {
    const host = $('#devList'), D = MR.DEVS;
    const draw = key => {
      host.innerHTML = D.filter(d => key === 'all' || d.cityKey === key).map((d, i) => `<article class="devrow">
        <a class="img img--zoom" data-mask data-cursor="Explore" href="development.html?d=${d.slug}"><img src="img/${d.img.hero}.jpg" alt="${esc(d.alt[d.img.hero])}" style="object-position:${POS[d.slug]}" loading="lazy"></a>
        <div class="txt" data-r><span class="num-lg">${MR.pad2(D.indexOf(d) + 1)}</span>${chip(d)}<h3 class="d-l" style="margin-top:20px">${d.name}</h3>
        <div class="meta"><span><b>${d.area}</b>, ${d.city}</span><span>${d.kind}</span></div><p class="measure">${d.tag} ${d.lead.split('. ').slice(1, 2).join('. ')}${d.lead.split('. ').length > 1 ? '.' : ''}</p>
        <dl class="facts">${d.facts.map(f => `<div><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join('')}</dl>
        <p style="margin-top:30px"><a class="btn btn--solid" href="development.html?d=${d.slug}">Explore ${d.name} ${ico('i-arrow')}</a></p></div></article>`).join('');
      MR.scan(host);
    };
    $$('.fbtn').forEach(b => b.addEventListener('click', () => { $$('.fbtn').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(b.dataset.c); }));
    draw('all');
  };

  /* ═════════════ DEVELOPMENT DETAIL ═════════════ */
  P.development = function () {
    const slug = MR.getParam('d') || 'halden-house', d = MR.dev(slug) || MR.DEVS[0];
    document.title = `${d.name}, ${d.city} — Mason & Rowe (concept)`;
    const g = d.img.gallery, units = MR.unitsFor(d.slug), sum = MR.summary(d.slug);
    $('#hero-bg').innerHTML = `<img src="img/${d.img.hero}.jpg" alt="${esc(d.alt[d.img.hero])}" style="object-position:${POS[d.slug]}" data-parallax="0.06">`;
    $('#h-eyebrow').innerHTML = `${chip(d).replace('chip--', 'chip chip--dark chip--').replace('chip chip--dark chip--sell', 'chip chip--dark')} <span style="margin-left:14px">${d.area}, ${d.region}</span>`;
    $('#h-title').innerHTML = d.name; $('#h-lead').textContent = d.tag;
    $('#h-facts').innerHTML = d.facts.map(f => `<div><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join('');
    $('#o-lead').innerHTML = d.lead; $('#o-body').textContent = d.body;
    $('#o-team').innerHTML = Object.entries(d.team).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('') + `<div><dt>Completion</dt><dd>${d.completion}</dd></div><div><dt>Typology</dt><dd>${d.kind}</dd></div>`;
    $('#o-mats').innerHTML = d.materials.map(m => `<li>${m}</li>`).join('');

    /* gallery */
    const gal = $('#gal');
    gal.innerHTML = g.slice(0, 7).map((n, i) => `<figure class="img g${i + 1}" data-mask style="margin:0" data-cursor="Enlarge" tabindex="0" role="button" aria-label="Enlarge image ${i + 1}">${imgTag(n, d.alt[n] || d.name + ' image ' + (i + 1))}</figure>`).join('');
    const lbList = g.slice(0, 7).map(n => ({ src: `img/${n}.jpg`, alt: d.alt[n] || d.name }));
    $$('figure', gal).forEach((f, i) => { f.addEventListener('click', () => MR.lightbox(lbList, i)); f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); MR.lightbox(lbList, i); } }); });

    /* residences + plans */
    $('#rcards').innerHTML = d.types.map(id => { const t = MR.TYPES[id]; const s = units.filter(u => u.type === id); const av = s.filter(u => u.status !== 'sold').length; return `<article class="rcard" data-r><div class="plan">${MR.planSVG(t.plan, { mini: true, label: t.name + ' floor plan' })}</div><div class="in"><span class="sub">${t.kind}</span><h4>${t.name}</h4><p class="mute small" style="margin:0">${t.blurb}</p><dl><div><dt>Beds</dt><dd>${t.beds}</dd></div><div><dt>Baths</dt><dd>${t.baths}</dd></div><div><dt>Sq ft</dt><dd>${MR.typeSqft(id).toLocaleString()}</dd></div></dl><div class="price"><span>${av} of ${s.length} remaining</span><span>From <b>${MR.usdShort(t.base)}</b></span></div></div></article>`; }).join('');
    const tabs = $('#planTabs'), viewer = $('#planViewer'), pinfo = $('#planInfo');
    tabs.innerHTML = d.types.map((id, i) => `<button class="tab" role="tab" aria-selected="${i === 0}" data-id="${id}">${MR.TYPES[id].name}</button>`).join('');
    const showPlan = id => {
      const t = MR.TYPES[id], sf = MR.typeSqft(id), out = MR.typeOutdoor(id);
      $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.id === id)));
      viewer.innerHTML = `<span class="tag">${t.name} · ${MR.sf(sf)}</span>${MR.planSVG(t.plan, { label: t.name + ' floor plan' })}`;
      pinfo.innerHTML = `<p class="eyebrow">${t.kind}</p><h3 class="d-m">${t.name}</h3><p class="mute">${t.sub}. ${t.blurb}</p><dl class="kv"><div><dt>Bedrooms</dt><dd>${t.beds}</dd></div><div><dt>Bathrooms</dt><dd>${t.baths}</dd></div><div><dt>Interior</dt><dd>${MR.sf(sf)}</dd></div>${out ? `<div><dt>Outdoor</dt><dd>${MR.sf(out)}</dd></div>` : ''}<div><dt>From</dt><dd>${MR.usd(t.base)}</dd></div></dl><div style="display:grid;gap:10px;margin-top:26px"><button class="btn btn--solid" data-enquire data-dev="${d.slug}">Request full plan set ${ico('i-arrow')}</button><a class="btn" href="private-viewing.html?d=${d.slug}">Schedule private viewing</a></div>`;
    };
    tabs.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) showPlan(b.dataset.id); });
    showPlan(d.types[0]);

    /* specs */
    const sp = [
      ['Structure', d.cityKey === 'la' ? 'Reinforced concrete and steel pavilions on stepped, retained terraces; 11′-0″ ceilings throughout the living wing.' : 'Reinforced concrete frame with post-tensioned slabs; 10′-6″ finished ceilings, rising to 12′-0″ in the penthouses.'],
      ['Facade & envelope', 'Triple-glazed, low-iron glass in cast-bronze frames, set in ' + d.materials[0].toLowerCase() + '. Deep reveals and shading designed to the orientation of each elevation.'],
      ['Interiors', 'Wide-plank white oak floors, hand-troweled lime plaster walls and ceilings, solid-bronze hardware and eight-foot oak doors.'],
      ['Kitchens', 'Honed travertine counters and backsplash, bronze-inlaid oak cabinetry, and a full suite of integrated appliances behind panel fronts.'],
      ['Bathrooms', 'Honed stone floors and walls, freestanding tubs in primary suites, heated floors and concealed, thermostatic fittings in bronze.'],
      ['Technology & comfort', 'Whole-home lighting and shade control, integrated audio, fiber to every residence, and quiet radiant heating and cooling with dedicated fresh-air supply.'],
      ['Sustainability', 'High-performance envelope, harvested-water irrigation, electric-ready infrastructure and a design life measured in generations, not cycles.']
    ];
    $('#specAcc').innerHTML = sp.map((s, i) => `<details${i === 0 ? ' open' : ''}><summary>${s[0]}${ico('i-plus')}</summary><div class="body">${s[1]}</div></details>`).join('');

    /* amenities */
    $('#amenGrid').innerHTML = d.amenities.map(k => { const a = MR.AMENITIES[k]; return `<div data-r>${ico(a.icon)}<h5>${a.name}</h5><p>${a.text}</p></div>`; }).join('');

    /* location */
    const H = MR.HOODS[d.cityKey];
    $('#locTitle').innerHTML = `${H.title}, <em>${d.city}.</em>`; $('#locStory').textContent = H.story;
    renderMap($('#locMap'), d.cityKey);

    /* availability */
    $('#avSum').innerHTML = bar3(sum);
    const detail = $('#avDetail'); unitDetail(detail, null);
    renderStack($('#avStack'), d.slug, { onSelect: u => { unitDetail(detail, u); } });
    $('#avLink').href = 'availability.html?d=' + d.slug;

    /* enquire */
    $('#enqDev').innerHTML = MR.DEVS.map(x => `<option value="${x.slug}"${x.slug === d.slug ? ' selected' : ''}>${x.name} — ${x.city}</option>`).join('');
    $('#pvLink').href = 'private-viewing.html?d=' + d.slug;
    bindInlineForm($('#enqForm'));

    /* subnav scrollspy */
    const links = $$('.subnav nav a'), secs = links.map(a => $(a.getAttribute('href')));
    const spy = () => { let k = 0; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < 160) k = i; }); links.forEach((a, i) => a.classList.toggle('is-on', i === k)); const on = links[k]; if (on && on.scrollIntoView && false) on.scrollIntoView(); };
    window.addEventListener('scroll', spy, { passive: true }); spy();
    MR.scan(document);
  };

  function bindInlineForm(f) {
    if (!f) return;
    f.addEventListener('submit', e => {
      e.preventDefault(); if (!MR.validate(f)) return;
      f.style.display = 'none'; const s = f.parentElement.querySelector('.success'); if (s) { s.classList.add('on'); s.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
  }

  /* ═════════════ RESIDENCES ═════════════ */
  P.residences = function () {
    const host = $('#resList'), ids = Object.keys(MR.TYPES);
    let kind = 'all', city = 'all';
    const draw = () => {
      host.innerHTML = ids.filter(id => { const t = MR.TYPES[id], dv = MR.dev(t.dev); return (kind === 'all' || t.kind === kind) && (city === 'all' || dv.cityKey === city); }).map(id => {
        const t = MR.TYPES[id], dv = MR.dev(t.dev), s = MR.unitsFor(t.dev).filter(u => u.type === id), av = s.filter(u => u.status !== 'sold').length;
        return `<article class="rcard"><div class="plan">${MR.planSVG(t.plan, { mini: true, label: t.name + ' floor plan' })}</div><div class="in"><span class="sub">${esc(dv.name)} · ${dv.city}</span><h4>${t.name}</h4><p class="mute small" style="margin:0">${t.sub}</p><dl><div><dt>Beds</dt><dd>${t.beds}</dd></div><div><dt>Baths</dt><dd>${t.baths}</dd></div><div><dt>Sq ft</dt><dd>${MR.typeSqft(id).toLocaleString()}</dd></div></dl><div class="price"><span>${av} remaining</span><span>From <b>${MR.usdShort(t.base)}</b></span></div><a class="lnk" style="margin-top:14px;align-self:flex-start" href="development.html?d=${t.dev}#plans">View plan ${ico('i-arrow')}</a></div></article>`;
      }).join('') || '<p class="mute">No residences match these filters.</p>';
      $('#resCount').textContent = host.children.length + ' residence types';
    };
    $$('[data-kind]').forEach(b => b.addEventListener('click', () => { kind = b.dataset.kind; $$('[data-kind]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); }));
    $$('[data-city]').forEach(b => b.addEventListener('click', () => { city = b.dataset.city; $$('[data-city]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); }));
    draw();
    const sch = $('#scheme'), sb = $$('[data-scheme]');
    sb.forEach(b => b.addEventListener('click', () => { sch.classList.toggle('is-b', b.dataset.scheme === 'b'); sb.forEach(x => x.setAttribute('aria-pressed', String(x === b))); $$('[data-sc]').forEach(x => x.hidden = x.dataset.sc !== b.dataset.scheme); }));
    MR.scan(document);
  };

  /* ═════════════ AMENITIES ═════════════ */
  P.amenities = function () {
    $('#amenGroups').innerHTML = MR.AMENITY_GROUPS.map((gname, gi) => {
      const items = Object.keys(MR.AMENITIES).filter(k => MR.AMENITIES[k].group === gname);
      const hero = { Wellness: 'spa', Social: 'living_charcoal', Outdoors: 'terrace', Service: 'lobby' }[gname];
      return `<section class="sec${gi % 2 ? ' sec--white' : ''}"><div class="wrap"><div class="grid" style="row-gap:48px"><div style="grid-column:${gi % 2 ? '8 / span 5' : '1 / span 5'};${gi % 2 ? 'grid-row:1' : ''}"><div class="img" data-mask style="aspect-ratio:4/5"><img src="img/${hero}.jpg" alt="${gname}" loading="lazy" data-parallax="0.04" style="height:112%"></div></div><div style="grid-column:${gi % 2 ? '1 / span 6' : '7 / span 6'};align-self:center"><p class="eyebrow" data-r>${MR.pad2(gi + 1)} / ${gname}</p><h2 class="d-l" data-split style="margin:20px 0 40px">${{ Wellness: 'Quiet, <em>restoring</em> rooms.', Social: 'Rooms for <em>company.</em>', Outdoors: 'Sky, stone <em>and green.</em>', Service: 'Service that <em>disappears.</em>' }[gname]}</h2><ul style="list-style:none;padding:0;margin:0;border-top:1px solid var(--line)">${items.map(k => { const a = MR.AMENITIES[k]; return `<li data-r style="display:grid;grid-template-columns:44px 1fr;gap:16px;padding:22px 0;border-bottom:1px solid var(--line)">${ico(a.icon).replace('class="ic"', 'class="ic" style="width:28px;height:28px;color:var(--bronze)"')}<div><h4 class="d-s" style="margin:0 0 6px">${a.name}</h4><p class="mute" style="margin:0;font-size:15.5px">${a.text}</p></div></li>`; }).join('')}</ul></div></div></div></section>`;
    }).join('');
    const keys = Object.keys(MR.AMENITIES);
    $('#matrix').innerHTML = `<thead><tr><th>Amenity</th>${MR.DEVS.map(d => `<th>${d.name}</th>`).join('')}</tr></thead><tbody>${keys.map(k => `<tr><td>${MR.AMENITIES[k].name}</td>${MR.DEVS.map(d => `<td>${d.amenities.indexOf(k) > -1 ? ico('i-check').replace('class="ic"', 'class="ic" style="width:20px;height:20px;color:var(--bronze)"') : '<span style="color:var(--stone)">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody>`;
    MR.scan(document);
  };

  /* ═════════════ ARCHITECTURE ═════════════ */
  P.architecture = function () {
    $('#section').innerHTML = MR.sectionSVG();
    MR.scan(document);
  };

  /* ═════════════ NEIGHBORHOOD ═════════════ */
  P.neighborhood = function () {
    const tabs = $('#cityTabs'), D = MR.DEVS; let key = (MR.getParam('c') || 'ny');
    tabs.innerHTML = D.map(d => `<button class="tab" role="tab" aria-selected="${d.cityKey === key}" data-k="${d.cityKey}">${d.city}</button>`).join('');
    const draw = k => {
      key = k; const H = MR.HOODS[k], d = D.filter(x => x.cityKey === k)[0];
      $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === k)));
      $('#hoodHead').innerHTML = `<p class="eyebrow">${d.city} · ${d.name}</p><h2 class="d-xl" style="margin:20px 0 26px">${H.title}<em>.</em></h2><p class="lead">${H.line}</p>`;
      $('#hoodStory').innerHTML = `<p>${H.story}</p><p><a class="lnk" href="development.html?d=${d.slug}">Explore ${d.name} ${ico('i-arrow')}</a></p>`;
      $('#hoodImg').innerHTML = `<img src="img/${d.img.city}.jpg" alt="${d.city} skyline at dusk, concept illustration" loading="lazy">`;
      const walks = H.pois.filter(p => p.mode === 'walk').length;
      $('#hoodFacts').innerHTML = `<div><dt>Places on foot</dt><dd>${walks}</dd></div><div><dt>Nearest transit</dt><dd>${Math.min.apply(null, H.pois.filter(p => p.cat === 'Transit').map(p => p.min))} min</dd></div><div><dt>Parks nearby</dt><dd>${H.pois.filter(p => p.cat === 'Parks').length}</dd></div><div><dt>Schools</dt><dd>${H.pois.filter(p => p.cat === 'Schools').length}</dd></div>`;
      renderMap($('#hoodMap'), k);
      history.replaceState(null, '', '?c=' + k);
    };
    tabs.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) draw(b.dataset.k); });
    draw(key); MR.scan(document);
  };

  /* ═════════════ AVAILABILITY ═════════════ */
  P.availability = function () {
    const D = MR.DEVS, tabs = $('#avTabs'); let slug = MR.getParam('d') || D[0].slug, st, sel = null;
    const F = { beds: 'all', status: 'all' };
    tabs.innerHTML = D.map(d => `<button class="tab" role="tab" aria-selected="${d.slug === slug}" data-s="${d.slug}">${d.name}</button>`).join('');
    const filt = u => (F.beds === 'all' || (F.beds === '4' ? u.beds >= 4 : u.beds === +F.beds)) && (F.status === 'all' || u.status === F.status);
    const draw = s => {
      slug = s; const d = MR.dev(s), sm = MR.summary(s), units = MR.unitsFor(s);
      $$('.tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.s === s)));
      $('#avHead').innerHTML = `<div><p class="eyebrow">${d.area}, ${d.city}</p><h2 class="d-l" style="margin:16px 0 0">${d.name}</h2></div><div style="min-width:min(100%,380px)">${chip(d)}<div style="margin-top:16px">${bar3(sm)}</div></div>`;
      MR.scan($('#avHead'));
      const detail = $('#avDetail'); unitDetail(detail, null);
      st = renderStack($('#avStack'), s, { filter: filt, onSelect: u => { sel = u; unitDetail(detail, u); $$('#avTable tr.row').forEach(r => r.classList.toggle('is-sel', r.dataset.id === u.id)); if (innerWidth < 1180) detail.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
      table();
      history.replaceState(null, '', '?d=' + s);
    };
    const table = () => {
      const units = MR.unitsFor(slug).filter(filt);
      $('#avTable').innerHTML = `<thead><tr><th>Residence</th><th>Type</th><th>Beds</th><th>Interior</th><th>Aspect</th><th>Price</th><th>Status</th></tr></thead><tbody>${units.map(u => `<tr class="row" data-id="${u.id}" tabindex="0"><td><b class="serif" style="font-size:20px;font-weight:400">${u.id}</b></td><td>${MR.TYPES[u.type].name}</td><td>${u.beds}</td><td>${MR.typeSqft(u.type).toLocaleString()} sq ft</td><td>${esc(u.view)}</td><td>${u.status === 'sold' ? '—' : MR.usd(u.price)}</td><td><span class="tag ${u.status}">${u.status}</span></td></tr>`).join('') || '<tr><td colspan="7" class="mute">No residences match these filters.</td></tr>'}</tbody>`;
    };
    $('#avTable').addEventListener('click', e => { const r = e.target.closest('tr.row'); if (r) st.select(r.dataset.id); });
    $('#avTable').addEventListener('keydown', e => { if (e.key === 'Enter') { const r = e.target.closest('tr.row'); if (r) st.select(r.dataset.id); } });
    tabs.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) draw(b.dataset.s); });
    $$('[data-f]').forEach(b => b.addEventListener('click', () => {
      const [k, v] = b.dataset.f.split(':'); F[k] = v;
      $$(`[data-f^="${k}:"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      st.apply(); table();
    }));
    $$('[data-view]').forEach(b => b.addEventListener('click', () => { const v = b.dataset.view; $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('#viewStack').hidden = v !== 'stack'; $('#viewList').hidden = v !== 'list'; }));
    draw(slug); MR.scan(document);
  };

  /* ═════════════ PRIVATE VIEWING ═════════════ */
  P['private-viewing'] = function () {
    const D = MR.DEVS, S = { dev: MR.getParam('d') || '', unit: MR.getParam('u') || '', date: null, time: null, mode: 'In person', step: 1 };
    const steps = $$('.step'), bars = $$('.stepper i');
    const pick = $('#devPick');
    pick.innerHTML = D.map(d => `<div class="dev-opt"><input type="radio" name="dev" id="dv-${d.slug}" value="${d.slug}"${S.dev === d.slug ? ' checked' : ''}><label for="dv-${d.slug}"><div class="img"><img src="img/${d.img.card}.jpg" alt="" style="object-position:${POS[d.slug]}" loading="lazy"></div><div><b>${d.name}</b><small>${d.area}, ${d.city}</small></div>${chip(d)}</label></div>`).join('');
    const go = n => {
      S.step = n; steps.forEach((s, i) => s.classList.toggle('on', i === n - 1)); bars.forEach((b, i) => b.classList.toggle('on', i < n));
      $('#stepLabel').textContent = n <= 3 ? `Step ${n} of 3` : 'Confirmed';
      $('#flowTop').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const err = (id, on, msg) => { const e = $(id); e.textContent = msg || ''; e.style.display = on ? 'block' : 'none'; };
    $('#to2').addEventListener('click', () => { const c = $('input[name=dev]:checked'); if (!c) { err('#err1', true, 'Please choose a development.'); return; } err('#err1', false); S.dev = c.value; renderSummary(); go(2); });
    $('#back1').addEventListener('click', () => go(1));
    $('#to3').addEventListener('click', () => { if (!S.date || !S.time) { err('#err2', true, 'Please choose a date and a time.'); return; } err('#err2', false); renderSummary(); go(3); });
    $('#back2').addEventListener('click', () => go(2));
    $$('input[name=mode]').forEach(i => i.addEventListener('change', () => { S.mode = i.value; renderSummary(); }));

    /* calendar */
    const cal = $('#calGrid'), title = $('#calTitle'), slots = $('#slots'); const today = new Date(); today.setHours(0, 0, 0, 0);
    let view = new Date(today.getFullYear(), today.getMonth(), 1);
    const fmt = d => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const hash = n => ((n * 2654435761) >>> 0) % 100;
    const times = ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM'];
    const drawCal = () => {
      title.textContent = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const first = new Date(view), start = (first.getDay() + 6) % 7, dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      const maxD = new Date(today); maxD.setDate(maxD.getDate() + 75);
      let h = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(x => `<span class="dow">${x}</span>`).join('');
      for (let i = 0; i < start; i++) h += '<span></span>';
      for (let n = 1; n <= dim; n++) {
        const dt = new Date(view.getFullYear(), view.getMonth(), n), off = dt <= today || dt > maxD || dt.getDay() === 0;
        const sel = S.date && dt.getTime() === S.date.getTime();
        h += `<button type="button" class="day${sel ? ' is-sel' : ''}${dt.getTime() === today.getTime() ? ' is-today' : ''}" data-t="${dt.getTime()}" ${off ? 'disabled' : ''} aria-label="${fmt(dt)}">${n}</button>`;
      }
      cal.innerHTML = h;
    };
    const drawSlots = () => {
      if (!S.date) { slots.innerHTML = '<p class="mute small" style="grid-column:1/-1;margin:0">Choose a date to see available times.</p>'; return; }
      const k = S.date.getTime() / 864e5;
      slots.innerHTML = times.map((t, i) => `<button type="button" class="slot${S.time === t ? ' is-sel' : ''}" data-t="${t}" ${hash(k * 7 + i * 13) < 24 ? 'disabled' : ''}>${t}</button>`).join('');
    };
    cal.addEventListener('click', e => { const b = e.target.closest('.day'); if (!b || b.disabled) return; S.date = new Date(+b.dataset.t); S.time = null; drawCal(); drawSlots(); });
    slots.addEventListener('click', e => { const b = e.target.closest('.slot'); if (!b || b.disabled) return; S.time = b.dataset.t; drawSlots(); });
    $('#calPrev').addEventListener('click', () => { const p = new Date(view.getFullYear(), view.getMonth() - 1, 1); if (p >= new Date(today.getFullYear(), today.getMonth(), 1)) { view = p; drawCal(); } });
    $('#calNext').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); drawCal(); });
    drawCal(); drawSlots();

    const renderSummary = () => {
      const d = MR.dev(S.dev); if (!d) return;
      const html = `<p class="eyebrow eyebrow--plain">Your visit</p><dl class="kv" style="margin-top:12px"><div><dt>Development</dt><dd>${d.name}</dd></div>${S.unit ? `<div><dt>Residence</dt><dd>${esc(S.unit)}</dd></div>` : ''}<div><dt>Location</dt><dd>${d.area}, ${d.city}</dd></div><div><dt>When</dt><dd>${S.date ? fmt(S.date) + (S.time ? ', ' + S.time : '') : '—'}</dd></div><div><dt>Format</dt><dd>${S.mode}</dd></div></dl>`;
      $$('.summary').forEach(s => s.innerHTML = html);
    };
    const f = $('#pvForm');
    f.addEventListener('submit', e => {
      e.preventDefault(); if (!MR.validate(f)) return;
      const d = MR.dev(S.dev), ref = 'MR-' + (d.slug.slice(0, 2) + (S.date.getMonth() + 1) + S.date.getDate() + (Math.abs(S.time.length * 17))).toUpperCase();
      $('#tkt').innerHTML = `<p class="eyebrow">Concept confirmation</p><h3 class="d-m" style="margin:16px 0 4px">${esc($('#pvName').value.split(' ')[0])}, your viewing is <em>noted.</em></h3><p class="mute" style="margin-bottom:26px">A confirmation like this would arrive by email, with the advisor’s details and arrival instructions.</p><dl class="kv"><div><dt>Reference</dt><dd>${ref}</dd></div><div><dt>Development</dt><dd>${d.name}</dd></div><div><dt>Date</dt><dd>${fmt(S.date)}</dd></div><div><dt>Time</dt><dd>${S.time}</dd></div><div><dt>Format</dt><dd>${S.mode}</dd></div><div><dt>Host</dt><dd>Hannah Whitcombe</dd></div></dl>`;
      go(4);
    });
    renderSummary(); MR.scan(document);
  };

  /* ═════════════ ABOUT ═════════════ */
  P.about = function () {
    $('#people').innerHTML = MR.PEOPLE.map(p => `<article class="person" data-r><div class="ph">${p.init}</div><h4>${p.name}</h4><small>${p.role}</small><p>${p.text}</p></article>`).join('');
    MR.scan(document);
  };

  /* ═════════════ CONTACT ═════════════ */
  P.contact = function () {
    $('#offices').innerHTML = MR.OFFICES.map(o => `<div class="office" data-r><h4>${o.city}</h4><small>${o.area}</small><p>${o.note}</p><p><a href="tel:${o.phone.replace(/[^+\d]/g, '')}">${o.phone}</a></p><p><a href="mailto:${o.email}">${o.email}</a></p></div>`).join('');
    $('#cDev').innerHTML = '<option value="">No preference</option>' + MR.DEVS.map(x => `<option value="${x.slug}">${x.name} — ${x.city}</option>`).join('');
    bindInlineForm($('#cForm'));
    MR.scan(document);
  };

  MR.ready(() => { const f = P[document.body.getAttribute('data-page')]; if (f) f(); });
})();
