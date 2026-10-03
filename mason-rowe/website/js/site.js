/* MASON & ROWE — site runtime: chrome, motion, lightbox, enquiry modal.
   Self-initiated concept project by Rovard Studios. Mason & Rowe is a fictional company. */
(function () {
  var MR = (window.MR = window.MR || {});
  var d = document, root = d.documentElement, body = d.body;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js'); root.classList.remove('no-js');
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  MR.$ = $; MR.$$ = $$;
  MR.img = function (n) { return 'img/' + n + '.jpg'; };
  MR.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
  MR.ico = function (id, cls) { return '<svg class="' + (cls || 'ic') + '" aria-hidden="true"><use href="#' + id + '"/></svg>'; };

  var NAV = [
    ['Home', 'index.html', 'halden'], ['Developments', 'developments.html', 'averly'], ['Residences', 'residences.html', 'living'],
    ['Amenities', 'amenities.html', 'spa'], ['Architecture', 'architecture.html', 'd_bronze'], ['Neighborhood', 'neighborhood.html', 'city_ny'],
    ['Availability', 'availability.html', 'lobby'], ['Private Viewing', 'private-viewing.html', 'terrace'], ['About', 'about.html', 'd_stone'], ['Contact', 'contact.html', 'd_plaster']
  ];
  var page = body.getAttribute('data-page') || '';

  /* ── chrome ──────────────────────────────────────────────── */
  function buildChrome() {
    var cur = (location.pathname.split('/').pop() || 'index.html');
    var links = NAV.map(function (n, i) {
      var on = n[1] === cur || (cur === 'development.html' && n[1] === 'developments.html');
      return '<li><a href="' + n[1] + '" data-img="' + n[2] + '" style="--i:' + i + '"' + (on ? ' aria-current="page"' : '') + '><small>' + MR.pad2(i + 1) + '</small>' + n[0] + '</a></li>';
    }).join('');
    var imgs = NAV.map(function (n, i) { return '<img src="' + MR.img(n[2]) + '" alt="" loading="lazy" data-k="' + n[2] + '"' + (i === 0 ? ' class="on"' : '') + '>'; }).join('');
    var top = '<a class="skip" href="#main">Skip to content</a>' +
      '<div class="curtain" id="curtain" aria-hidden="true"><svg class="mono"><use href="#mr-mono"/></svg></div>' +
      '<header class="hdr" id="hdr"><div class="strip"><span><b>Concept project</b><span class="long"> · Mason &amp; Rowe is fictional · by Rovard Studios</span></span><a href="../../index.html#work">Rovard Studios ↗</a></div>' +
      '<div class="bar"><a class="brand" href="index.html" aria-label="Mason &amp; Rowe, home"><svg class="mono" aria-hidden="true"><use href="#mr-mono"/></svg><span class="wm">Mason <i>&amp;</i> Rowe</span></a>' +
      '<nav class="nav" aria-label="Primary"><a class="l" href="developments.html"' + (page === 'developments' ? ' aria-current="page"' : '') + '>Developments</a><a class="l" href="availability.html"' + (page === 'availability' ? ' aria-current="page"' : '') + '>Availability</a>' +
      '<a class="btn btn--sm hdr-cta" href="private-viewing.html">Private viewing</a>' +
      '<button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="menu"><span>Menu</span><i></i></button></nav></div></header>' +
      '<div class="menu" id="menu" aria-hidden="true"><ol>' + links + '</ol><aside><div class="m-img" aria-hidden="true">' + imgs + '</div>' +
      '<div class="m-foot"><div><b>Private viewings</b><a href="tel:+12125550142">+1 (212) 555-0142</a><br><a href="mailto:viewings@masonandrowe.example">viewings@masonandrowe.example</a></div>' +
      '<div><b>Offices</b>New York · Miami<br>Los Angeles · Austin<br><span style="color:var(--stone-3)">By appointment</span></div></div></aside></div>';
    var mbar = '<nav class="mbar" id="mbar" aria-label="Quick actions"><a class="i" href="tel:+12125550142" aria-label="Call">' + MR.ico('i-phone') + '</a><a href="contact.html#enquire">Enquire</a><a class="p" href="private-viewing.html">Book viewing</a></nav>';
    var ft = '<footer class="ftr"><div class="wrap"><div class="top"><div><a class="brand" href="index.html"><svg class="mono"><use href="#mr-mono"/></svg><span class="wm">Mason <i>&amp;</i> Rowe</span></a><p class="tagline">Built to be <em>inherited.</em></p></div>' +
      '<div><h5>Explore</h5><ul><li><a href="developments.html">Developments</a></li><li><a href="residences.html">Residences</a></li><li><a href="amenities.html">Amenities</a></li><li><a href="architecture.html">Architecture</a></li><li><a href="neighborhood.html">Neighborhood</a></li></ul></div>' +
      '<div><h5>Buy</h5><ul><li><a href="availability.html">Availability</a></li><li><a href="private-viewing.html">Private viewing</a></li><li><a href="contact.html#enquire">Request information</a></li><li><a href="about.html">About</a></li><li><a href="contact.html">Contact</a></li></ul></div>' +
      '<div><h5>Developments</h5><ul>' + MR.DEVS.map(function (x) { return '<li><a href="development.html?d=' + x.slug + '">' + x.name + '</a></li>'; }).join('') + '</ul></div></div>' +
      '<div class="concept"><b>Concept project</b><span>' + MR.CONCEPT_LINE + ' Nothing on this site is an offer to sell. See more of the work at <a href="../../index.html#work">Rovard Studios</a>.</span></div>' +
      '<div class="legal"><span>© 2026 Mason &amp; Rowe (fictional). Concept design by Rovard Studios.</span><span>Equal Housing Opportunity — illustrative only.</span></div></div><div class="giant" aria-hidden="true">Mason &amp; Rowe</div></footer>';
    body.insertAdjacentHTML('afterbegin', top);
    body.insertAdjacentHTML('beforeend', mbar + ft);
  }
  buildChrome();

  /* ── menu ────────────────────────────────────────────────── */
  var hdr = $('#hdr'), menu = $('#menu'), mbtn = $('#menuBtn'), menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    mbtn.setAttribute('aria-expanded', String(open));
    mbtn.firstElementChild.textContent = open ? 'Close' : 'Menu';
    body.classList.toggle('no-scroll', open);
    hdr.classList.toggle('is-solid', open ? false : window.scrollY > 60);
    hdr.classList.toggle('menu-on', open);
    if (open) { hdr.classList.remove('is-hidden'); var f = $('a', menu); setTimeout(function () { f && f.focus({ preventScroll: true }); }, 500); }
  }
  mbtn.addEventListener('click', function () { setMenu(!menuOpen); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); mbtn.focus(); } });
  $$('.menu ol a').forEach(function (a) {
    function show() { var k = a.getAttribute('data-img'); $$('.m-img img', menu).forEach(function (im) { im.classList.toggle('on', im.getAttribute('data-k') === k); }); }
    a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
  });

  /* ── header behaviour ────────────────────────────────────── */
  var lastY = 0, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (!menuOpen) {
      hdr.classList.toggle('is-solid', y > 60);
      if (y > lastY + 6 && y > 520) hdr.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 200) hdr.classList.remove('is-hidden');
    }
    root.style.setProperty('--sub-top', hdr.classList.contains('is-hidden') ? '0px' : (hdr.offsetHeight) + 'px');
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ── page transitions ────────────────────────────────────── */
  var curtain = $('#curtain');
  function leave(href) {
    try { sessionStorage.setItem('mr-nav', '1'); } catch (e) { }
    curtain.classList.remove('is-out'); curtain.classList.add('is-in');
    setTimeout(function () { location.href = href; }, reduce ? 0 : 820);
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target && a.target !== '_self') return; if (a.hasAttribute('download')) return;
    var h = a.getAttribute('href');
    if (!h || h.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/.test(h)) return;
    var u; try { u = new URL(a.href, location.href); } catch (er) { return; }
    if (u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) { if (u.hash) return; }
    e.preventDefault();
    if (menuOpen) setMenu(false);
    if (u.pathname.indexOf('/mason-rowe/website/') === -1) { curtain.classList.add('is-in'); setTimeout(function () { location.href = a.href; }, reduce ? 0 : 820); return; }
    leave(a.href);
  });
  function arrive() {
    if (!root.classList.contains('mr-enter')) return;
    setTimeout(function () {
      root.classList.remove('mr-enter'); curtain.classList.add('is-out');
      setTimeout(function () { curtain.style.transition = 'none'; curtain.classList.remove('is-out'); void curtain.offsetWidth; curtain.style.transition = ''; }, 1000);
    }, 380);
  }
  window.addEventListener('load', arrive); setTimeout(arrive, 2400);
  window.addEventListener('pageshow', function (e) { if (e.persisted) { curtain.classList.remove('is-in', 'is-out'); } });

  /* ── reveal / split / counters ───────────────────────────── */
  function splitEl(el) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            var w = d.createElement('span'); w.className = 'w'; var s = d.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++); w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(el);
    el.classList.add('split');
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var t = e.target; t.classList.add('in'); io.unobserve(t);
      if (t.hasAttribute('data-count')) countUp(t);
      if (t.hasAttribute('data-bar')) t.style.setProperty('--on', 1), $$('i', t).forEach(function (b) { b.style.width = b.getAttribute('data-w'); });
    });
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.01 }) : null;
  function countUp(el) {
    var plain = el.hasAttribute('data-plain'), to = parseFloat(el.getAttribute('data-count')), dec = (String(el.getAttribute('data-count')).split('.')[1] || '').length, pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '', t0 = null, dur = 1800;
    if (reduce) { el.textContent = pre + (plain ? String(to) : to.toLocaleString('en-US')) + suf; return; }
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = pre + (to * e).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: !plain }) + suf; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  MR.scan = function (rootEl) {
    $$('[data-split]:not(.split)', rootEl).forEach(splitEl);
    $$('[data-r],[data-mask],[data-mask-x],.split,[data-count],[data-bar]', rootEl).forEach(function (el) {
      if (el.__seen) return; el.__seen = 1;
      if (io) io.observe(el); else el.classList.add('in');
    });
  };
  MR.scan(d);

  /* ── scroll-driven statement + parallax ──────────────────── */
  var stmts = $$('[data-scrolltext]').map(function (el) {
    var words = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) { if (!p) return; if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; } var s = d.createElement('span'); s.className = 'sw'; s.textContent = p; frag.appendChild(s); words.push(s); });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(el);
    return { el: el, words: words };
  });
  var pars = $$('[data-parallax]');
  function frame() {
    var vh = window.innerHeight;
    stmts.forEach(function (s) {
      var r = s.el.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
      var p = Math.max(0, Math.min(1, (vh * 0.82 - r.top) / (r.height + vh * 0.28))), n = Math.round(p * s.words.length);
      s.words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    });
    if (!reduce) pars.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      var f = parseFloat(el.getAttribute('data-parallax')) || 0.1, dy = (r.top + r.height / 2 - vh / 2) * -f;
      el.style.transform = 'translate3d(0,' + dy.toFixed(1) + 'px,0)';
    });
  }
  var fT = false;
  window.addEventListener('scroll', function () { if (!fT) { fT = true; requestAnimationFrame(function () { frame(); fT = false; }); } }, { passive: true });
  window.addEventListener('resize', frame); frame();

  /* ── cursor ──────────────────────────────────────────────── */
  if (fine && !reduce) {
    var cur = d.createElement('div'); cur.className = 'cur'; cur.innerHTML = '<span></span>'; body.appendChild(cur); body.classList.add('has-cur');
    var cx = -100, cy = -100, tx = cx, ty = cy, lab = cur.firstChild;
    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
    (function loop() { cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22; cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)'; requestAnimationFrame(loop); })();
    d.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cursor],a,button,.cell,.day,.slot,summary,label') : null;
      var l = t && t.getAttribute && t.getAttribute('data-cursor');
      cur.classList.toggle('is-label', !!l); cur.classList.toggle('is-link', !!t && !l); if (l) lab.textContent = l;
    });
  }

  /* ── lightbox ────────────────────────────────────────────── */
  var lb, lbList = [], lbI = 0;
  function lbBuild() {
    lb = d.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Image gallery');
    lb.innerHTML = '<button class="x" aria-label="Close">' + MR.ico('i-close') + '</button><button class="pv" aria-label="Previous">' + MR.ico('i-arrow') + '</button><img alt=""><button class="nx" aria-label="Next">' + MR.ico('i-arrow') + '</button><div class="cap"></div>';
    body.appendChild(lb);
    lb.addEventListener('click', function (e) { if (e.target === lb) lbClose(); });
    $('.x', lb).addEventListener('click', lbClose); $('.pv', lb).addEventListener('click', function () { lbGo(-1); }); $('.nx', lb).addEventListener('click', function () { lbGo(1); });
    d.addEventListener('keydown', function (e) { if (!lb.classList.contains('is-open')) return; if (e.key === 'Escape') lbClose(); if (e.key === 'ArrowLeft') lbGo(-1); if (e.key === 'ArrowRight') lbGo(1); });
    var sx = 0; lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) lbGo(dx < 0 ? 1 : -1); });
  }
  function lbShow() { var im = $('img', lb); im.classList.add('is-swap'); setTimeout(function () { im.src = lbList[lbI].src; im.alt = lbList[lbI].alt || ''; im.classList.remove('is-swap'); }, 160); $('.cap', lb).textContent = (lbList[lbI].alt || '') + '  ·  ' + (lbI + 1) + ' / ' + lbList.length; }
  function lbGo(n) { lbI = (lbI + n + lbList.length) % lbList.length; lbShow(); }
  function lbClose() { lb.classList.remove('is-open'); body.classList.remove('no-scroll'); }
  MR.lightbox = function (list, i) { if (!lb) lbBuild(); lbList = list; lbI = i || 0; lb.classList.add('is-open'); body.classList.add('no-scroll'); var im = $('img', lb); im.src = lbList[lbI].src; im.alt = lbList[lbI].alt || ''; $('.cap', lb).textContent = (lbList[lbI].alt || '') + '  ·  ' + (lbI + 1) + ' / ' + lbList.length; $('.x', lb).focus(); };

  /* ── forms: validation + concept-safe submit ─────────────── */
  MR.validate = function (form) {
    var ok = true;
    $$('.field', form).forEach(function (f) {
      var i = $('input,select,textarea', f); if (!i) return; var v = (i.value || '').trim(), bad = false, msg = '';
      if (i.required && !v) { bad = true; msg = 'Please complete this field.'; }
      else if (i.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { bad = true; msg = 'Please enter a valid email address.'; }
      f.classList.toggle('err', bad); var m = $('.msg', f); if (m) m.textContent = msg; if (bad) ok = false;
    });
    var c = $('input[type=checkbox][required]', form); if (c && !c.checked) { ok = false; c.focus(); }
    return ok;
  };
  var CONCEPT_NOTE = '<p class="note" style="margin-top:22px">This is a concept project. Nothing you entered has been sent, saved or shared. In a live build this request would go to the sales advisor for the selected development.</p>';

  /* ── enquiry modal ───────────────────────────────────────── */
  var modal;
  MR.openEnquiry = function (opt) {
    opt = opt || {};
    if (!modal) {
      modal = d.createElement('div'); modal.className = 'modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'enqT');
      modal.innerHTML = '<div class="panel"><button class="x" aria-label="Close">' + MR.ico('i-close') + '</button><div id="enqBody"></div></div>';
      body.appendChild(modal);
      modal.addEventListener('click', function (e) { if (e.target === modal) closeM(); });
      $('.x', modal).addEventListener('click', closeM);
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeM(); });
    }
    function closeM() { modal.classList.remove('is-open'); body.classList.remove('no-scroll'); }
    var devs = MR.DEVS.map(function (x) { return '<option value="' + x.slug + '"' + (x.slug === opt.dev ? ' selected' : '') + '>' + x.name + ' — ' + x.city + '</option>'; }).join('');
    $('#enqBody', modal).innerHTML = '<p class="eyebrow">Request information</p><h2 class="d-m" id="enqT" style="margin:16px 0 8px">' + (opt.unit ? 'Residence <em>' + MR.esc(opt.unit) + '</em>' : 'Speak with an <em>advisor.</em>') + '</h2><p class="mute" style="margin-bottom:30px">A member of our client advisory team will reply within one business day with plans, pricing and private viewing times.</p>' +
      '<form class="form" novalidate><div class="row"><div class="field"><label for="eN">Full name</label><input id="eN" name="name" required autocomplete="name"><span class="msg"></span></div><div class="field"><label for="eE">Email</label><input id="eE" name="email" type="email" required autocomplete="email"><span class="msg"></span></div></div>' +
      '<div class="row"><div class="field"><label for="eP">Phone</label><input id="eP" name="phone" type="tel" autocomplete="tel"></div><div class="field"><label for="eD">Development</label><select id="eD" name="dev">' + devs + '</select></div></div>' +
      '<div class="field"><label for="eM">Message</label><textarea id="eM" name="msg" rows="3" placeholder="' + (opt.unit ? 'I would like details on residence ' + MR.esc(opt.unit) + '.' : 'Tell us what you are looking for.') + '"></textarea></div>' +
      '<label class="check"><input type="checkbox" required><span>I agree to be contacted about this development.</span></label>' +
      '<div style="display:flex;gap:14px;flex-wrap:wrap"><button class="btn btn--solid" type="submit">Send request ' + MR.ico('i-arrow') + '</button><a class="btn" href="private-viewing.html' + (opt.dev ? '?d=' + opt.dev : '') + '">Schedule a viewing instead</a></div></form>' +
      '<div class="success" role="status"><div class="tick">' + MR.ico('i-check') + '</div><h3 class="d-s">Thank you.</h3><p class="mute">Your request has been noted for our advisory team.</p>' + CONCEPT_NOTE + '</div>';
    var f = $('form', modal);
    f.addEventListener('submit', function (e) { e.preventDefault(); if (!MR.validate(f)) return; f.style.display = 'none'; $('.eyebrow', modal).style.display = 'none'; $('.success', modal).classList.add('on'); });
    modal.classList.add('is-open'); body.classList.add('no-scroll'); setTimeout(function () { $('input', f).focus(); }, 400);
  };
  d.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-enquire]'); if (t) { e.preventDefault(); MR.openEnquiry({ dev: t.getAttribute('data-dev') || '', unit: t.getAttribute('data-unit') || '' }); } });

  /* hero / generic helpers used by page scripts ---------------- */
  MR.sizeOf = function (tid) { return MR.typeSqft(tid); };
  MR.priceLabel = function (u) { return u.status === 'sold' ? 'Sold' : MR.usd(u.price); };
  MR.ready = function (fn) { if (d.readyState !== 'loading') fn(); else d.addEventListener('DOMContentLoaded', fn); };
  MR.getParam = function (k) { return new URLSearchParams(location.search).get(k); };
})();
