/* Northstar Capital — marketing site behaviour: shared header/footer, reveal, demos, page inits */
(function () {
  document.documentElement.classList.add('js');
  var D = NS.data, F = NS.fmt, C = NS.charts;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var usd = function (n, o) { return F.usd(n, o); };
  var I = function (n, c) { return NS.icon(n, c); };
  var page = document.body.dataset.page || '';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs = new URLSearchParams(location.search);

  /* ------------------------------------------------------------ toast */
  function toast(msg, icon) {
    var host = $('.ns-toast-host'); if (!host) { host = document.createElement('div'); host.className = 'ns-toast-host'; host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    var t = document.createElement('div'); t.className = 'ns-toast'; t.setAttribute('role', 'status'); t.innerHTML = I(icon || 'info') + '<span>' + esc(msg) + '</span>'; host.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 220); }, 3400);
  }

  /* ------------------------------------------------------------ header + footer */
  var NAV = [['solutions', 'Solutions', 'solutions.html'], ['features', 'Features', 'features.html'], ['pricing', 'Pricing', 'pricing.html'], ['resources', 'Resources', 'resources.html'], ['about', 'About', 'about.html'], ['contact', 'Contact', 'contact.html']];
  function header() {
    var cur = function (id) { return page === id ? ' aria-current="page"' : ''; };
    return '<a class="skip" href="#main">Skip to content</a><header class="nav" id="nav"><div class="w"><a class="nav__logo" href="index.html" aria-label="Northstar Capital — home"><svg viewBox="0 0 195.6 36" role="img" aria-label="Northstar Capital"><use href="#ns-logo"/></svg></a>' +
      '<nav class="nav__links" aria-label="Primary">' + NAV.map(function (n) { return '<a href="' + n[2] + '"' + cur(n[0]) + '>' + n[1] + '</a>'; }).join('') + '</nav>' +
      '<div class="nav__cta"><a class="ns-btn ns-btn--ghost hide-m" href="sign-in.html"' + cur('signin') + '>Sign in</a><a class="ns-btn ns-btn--primary" href="sign-in.html?mode=signup">Start free</a><button class="nav__burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="menu">' + I('menu') + '</button></div></div></header>' +
      '<div class="menu" id="menu"><nav aria-label="Mobile">' + NAV.map(function (n) { return '<a class="l" href="' + n[2] + '">' + n[1] + I('arrow-right') + '</a>'; }).join('') + '</nav><div class="btns"><a class="ns-btn ns-btn--outline ns-btn--lg" href="sign-in.html">Sign in</a><a class="ns-btn ns-btn--primary ns-btn--lg" href="sign-in.html?mode=signup">Start free</a></div></div>';
  }
  function footer() {
    function col(t, items) { return '<div><h4>' + t + '</h4><ul>' + items.map(function (i) { return '<li><a href="' + i[1] + '"' + (i[2] ? ' data-concept="' + i[2] + '"' : '') + '>' + i[0] + '</a></li>'; }).join('') + '</ul></div>'; }
    return '<footer class="foot" data-theme="dark"><div class="w"><div class="foot__top"><div class="foot__brand"><svg viewBox="0 0 195.6 36" role="img" aria-label="Northstar Capital"><use href="#ns-logo"/></svg><p>Financial clarity for the businesses that keep America running.</p></div>' +
      col('Product', [['Features', 'features.html'], ['Solutions', 'solutions.html'], ['Pricing', 'pricing.html'], ['Sign in', 'sign-in.html'], ['Live demo', '../app/index.html']]) +
      col('Resources', [['Guides & articles', 'resources.html'], ['Cash-flow template', 'resources.html#templates'], ['Help center', '#', 'The help center is not part of this prototype.'], ['Status', '#', 'Status page is not part of this prototype.']]) +
      col('Company', [['About', 'about.html'], ['Careers', 'about.html#careers'], ['Contact', 'contact.html'], ['Press', 'contact.html']]) +
      col('Legal', [['Terms', '#', 'Legal pages are not part of this prototype.'], ['Privacy', '#', 'Legal pages are not part of this prototype.'], ['Security', 'features.html#security'], ['Licenses', '#', 'Legal pages are not part of this prototype.']]) + '</div>' +
      '<div class="foot__legal"><p><b>Northstar Capital is a financial technology company, not a bank.</b> Payments and deposit services shown in this concept are illustrative.</p><p><b>Concept project.</b> Northstar Capital is a fictional brand created by Rovard Studios as a self-initiated branding and product-design concept. It is not an operating company and offers no financial services. All names, data, testimonials and figures are invented for portfolio purposes.</p></div>' +
      '<div class="foot__bar"><span>© 2026 Northstar Capital (fictional). Designed by Rovard Studios.</span><a class="concept-chip" href="../../index.html#work">Back to Rovard Studios</a></div>' +
      '<div style="margin-top:40px;color:var(--text);opacity:.07;pointer-events:none" aria-hidden="true"><svg viewBox="0 0 142.6 28" style="width:100%;height:auto;display:block"><use href="#ns-word"/></svg></div></div></footer>';
  }
  var hh = $('#site-header'); if (hh) hh.outerHTML = header();
  var ff = $('#site-footer'); if (ff) ff.outerHTML = footer();

  var nav = $('#nav');
  function stuck() {
    if (!nav) return; nav.classList.toggle('is-stuck', window.scrollY > 8);
    // flip the header to the dark theme while it floats over a dark section
    var under = document.elementsFromPoint(window.innerWidth / 2, 40).filter(function (e) { return !nav.contains(e) && e !== document.documentElement && e !== document.body; })[0];
    nav.setAttribute('data-theme', under && under.closest('[data-theme="dark"]') ? 'dark' : 'light');
  }
  window.addEventListener('scroll', stuck, { passive: true }); stuck();
  var burger = $('#burger'), menu = $('#menu');
  if (burger) burger.addEventListener('click', function () {
    var on = !menu.classList.contains('on'); menu.classList.toggle('on', on); burger.setAttribute('aria-expanded', on); burger.innerHTML = I(on ? 'x' : 'menu'); document.body.style.overflow = on ? 'hidden' : '';
  });
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-concept]'); if (c) { e.preventDefault(); toast(c.dataset.concept === '' || c.dataset.concept === 'true' ? 'Concept prototype — this destination isn’t part of the design scope.' : c.dataset.concept, 'info'); }
  });

  /* reveal on scroll */
  var showAll = qs.get('reveal') === 'all' || reduce;
  if (showAll || !('IntersectionObserver' in window)) $$('.rv').forEach(function (e) { e.classList.add('in'); });
  else { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .08 }); $$('.rv').forEach(function (e) { io.observe(e); }); }

  /* ------------------------------------------------------------ data binding */
  var P = D.period(-29, 0), Pp = D.period(-59, -30), cushion = D.totalCash / (P.expenses || 1);
  var overdueSum = D.overdueInv.reduce(function (s, v) { return s + v.amount; }, 0);
  var whole = Math.floor(D.totalCash), cents = String(Math.round((D.totalCash - whole) * 100)).padStart(2, '0');
  var nextPay = D.tx.filter(function (t) { return t.cat === 'Payroll' && t.off > 0; })[0];
  var cashDelta = (D.totalCash - D.cash30) / D.cash30 * 100;
  var V = { cashWhole: '$' + whole.toLocaleString('en-US'), cashCents: '.' + cents, cashDelta: F.pct(cashDelta, 1), overdue: usd(overdueSum), overdueN: String(D.overdueInv.length), cushion: cushion.toFixed(1), top: Math.round(D.topCust.list[0].share * 100) + '%', topName: D.topCust.list[0].name,
    low: usd(D.baseFc.low.y), lowDate: F.date(D.baseFc.low.x || D.at(D.baseFc.low.off), 'md'), payroll: usd(nextPay ? -nextPay.amount : 0), payrollIn: nextPay ? nextPay.off + ' days' : '—', revenue: usd(P.revenue), expenses: usd(P.expenses), net: usd(P.net), margin: Math.round(P.net / P.revenue * 100) + '%', days: D.avgDays.toFixed(0), accounts: String(D.accounts.length), openN: String(D.openInv.length), openSum: usd(D.openInv.reduce(function (s, v) { return s + v.amount; }, 0)), revDelta: F.pct((P.revenue - Pp.revenue) / Pp.revenue * 100, 1) };
  $$('[data-bind]').forEach(function (el) { var v = V[el.dataset.bind]; if (v != null) el.textContent = v; });
  $$('[data-date]').forEach(function (el) { el.textContent = F.date(D.at(+el.dataset.date), el.dataset.fmt || 'mdy'); });

  /* ------------------------------------------------------------ shared widgets */
  function forecastWidget(opts) {
    var active = [], chart, scen = D.SCENARIOS, el = $(opts.chart), sum = $(opts.sum), chips = $(opts.chips), horizon = opts.days || 90;
    chips.innerHTML = Object.keys(scen).map(function (k) { return '<button class="ns-chip" data-s="' + k + '" aria-pressed="false">' + I(k === 'late' ? 'clock' : k === 'hire' ? 'user' : 'box') + esc(scen[k].label) + '</button>'; }).join('');
    function render() {
      var f = active.length ? D.forecast(active) : D.baseFc, base = D.baseFc;
      function seg(sr) { return D.cashSeries.filter(function (p) { return p.off >= -30 && p.off <= 0; }).concat(sr.series.filter(function (p) { return p.off > 0 && p.off <= horizon; })); }
      var main = seg(f), bs = seg(base), series = [{ label: active.length ? 'With changes' : 'Projected balance', color: 'var(--c1)', area: true, data: main, forecastFrom: 30 }];
      if (active.length) series.push({ label: 'Baseline', color: 'var(--text-3)', data: bs, forecastFrom: 30, width: 1.5 });
      var low = main.filter(function (p) { return p.off > 0; }).reduce(function (m, p) { return p.y < m.y ? p : m; }, { y: Infinity }), end = main[main.length - 1];
      var cfg = { height: opts.height || 320, label: 'Projected cash balance', today: D.TODAY, curve: 'linear', series: series, markers: [{ x: low.x, y: low.y, label: 'Lowest · ' + usd(low.y, { compact: true }), dy: 22, color: 'var(--text)' }] };
      if (chart) chart.update(cfg); else chart = C.line(el, cfg);
      sum.innerHTML = '<div><small>Lowest balance</small><b>' + usd(low.y) + '</b><span>' + F.date(low.x, 'wd') + '</span></div><div><small>Balance in ' + horizon + ' days</small><b>' + usd(end.y) + '</b><span>' + (end.y >= D.totalCash ? '+' : '−') + usd(Math.abs(end.y - D.totalCash)) + ' from today</span></div><div><small>Cash cushion</small><b>' + (low.y / (P.expenses || 1)).toFixed(1) + ' months</b><span>of expenses, at the lowest point</span></div>';
    }
    render();
    chips.addEventListener('click', function (e) { var b = e.target.closest('[data-s]'); if (!b) return; var k = b.dataset.s, i = active.indexOf(k); if (i > -1) active.splice(i, 1); else active.push(k); b.setAttribute('aria-pressed', active.indexOf(k) > -1); render(); });
  }

  /* generative covers for articles (brand graphic language) */
  var PAL = [['#0B0D12', '#2B5BFF', '#F6F5F1'], ['#EFEDE7', '#0B0D12', '#2B5BFF'], ['#2B5BFF', '#F6F5F1', '#0B0D12'], ['#E6E9EE', '#0B0D12', '#2B5BFF'], ['#141821', '#F6F5F1', '#6A8AFF'], ['#F6F5F1', '#2B5BFF', '#0B0D12']];
  function cover(i) {
    var p = PAL[i % PAL.length], bg = p[0], a = p[1], b = p[2], t = i % 6, s = '<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="250" fill="' + bg + '"/>';
    if (t === 0) { for (var k = 0; k < 11; k++) { var h = 40 + ((k * 53 + i * 31) % 130); s += '<path d="M' + (28 + k * 32) + ' 250V' + (250 - h + 6) + 'q0-6 6-6h14q6 0 6 6V250z" fill="' + (k === 7 ? a : b) + '" opacity="' + (k === 7 ? 1 : .22) + '"/>'; } }
    else if (t === 1) { for (var r = 0; r < 6; r++) s += '<circle cx="300" cy="60" r="' + (30 + r * 34) + '" fill="none" stroke="' + (r === 2 ? a : b) + '" stroke-opacity="' + (r === 2 ? 1 : .18) + '" stroke-width="' + (r === 2 ? 14 : 1.5) + '"/>'; }
    else if (t === 2) { for (var y = 0; y < 5; y++) for (var x = 0; x < 9; x++) { var on = (x === 5 && y === 2); s += '<path d="M' + (20 + x * 42) + ' ' + (30 + y * 42) + 'v30h30z" fill="' + (on ? b : bg === '#2B5BFF' ? '#fff' : a) + '" opacity="' + (on ? 1 : .22) + '"/>'; } }
    else if (t === 3) { for (var g = 1; g < 6; g++) s += '<line x1="0" x2="400" y1="' + g * 42 + '" y2="' + g * 42 + '" stroke="' + b + '" stroke-opacity=".1"/>'; s += '<path d="M0 200 L60 180 L110 190 L170 140 L230 150 L290 90 L350 60 L400 40" fill="none" stroke="' + a + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="350" cy="60" r="9" fill="' + a + '" stroke="' + bg + '" stroke-width="4"/>'; }
    else if (t === 4) { for (var q = 0; q < 5; q++) { var w = 60 + ((q * 71 + i * 17) % 190); s += '<rect x="30" y="' + (34 + q * 38) + '" width="' + w + '" height="24" rx="3" fill="' + (q === 1 ? b : a) + '" opacity="' + (q === 1 ? 1 : .24) + '"/>'; } }
    else { for (var d = 0; d < 7; d++) for (var e = 0; e < 12; e++) s += '<circle cx="' + (34 + e * 30) + '" cy="' + (38 + d * 30) + '" r="2" fill="' + b + '" opacity=".28"/>'; s += '<path d="M64 218 V70 L226 218 V70" fill="none" stroke="' + a + '" stroke-width="22" stroke-linejoin="miter"/>'; }
    return s + '</svg>';
  }
  window.NSCover = cover;

  /* ------------------------------------------------------------ page inits */
  var pages = {};

  pages.home = function () {
    var s = D.cashSeries.filter(function (p) { return p.off >= -60 && p.off <= 45; }), i0 = s.findIndex(function (p) { return p.off === 0; });
    C.line($('#hero-chart'), { height: 230, label: 'Cash on hand with forecast', today: D.TODAY, curve: 'linear', series: [{ label: 'Cash on hand', color: 'var(--c1)', area: true, data: s, forecastFrom: i0 }] });
    forecastWidget({ chart: '#cf-chart', sum: '#cf-sum', chips: '#cf-chips', height: 340 });

    // product demonstration — tabs with autoplay
    var demo = $('#demo'), tabs = $$('.demo__tab', demo), panels = $$('.demo__panel', demo), cur = 0, auto = !reduce;
    function show(n, user) {
      cur = n; tabs.forEach(function (t, i) { t.setAttribute('aria-selected', i === n); }); panels.forEach(function (p, i) { p.classList.toggle('on', i === n); p.setAttribute('aria-hidden', i !== n); });
      if (user) { auto = false; demo.classList.add('is-paused'); }
      var bar = $('i', tabs[n]); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    }
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { show(i, true); }); t.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { show((cur + 1) % tabs.length, true); tabs[cur].focus(); e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { show((cur + tabs.length - 1) % tabs.length, true); tabs[cur].focus(); e.preventDefault(); } }); });
    tabs.forEach(function (t, i) { $('i', t).addEventListener('animationend', function () { if (auto && tabs[i].getAttribute('aria-selected') === 'true') show((i + 1) % tabs.length); }); });
    if (!auto) demo.classList.add('is-paused');
    // panel 1: chart
    var ds = D.cashSeries.filter(function (p) { return p.off >= -30 && p.off <= 45; });
    C.line($('#demo-chart'), { height: 250, label: 'Cash forecast', today: D.TODAY, curve: 'linear', series: [{ label: 'Cash on hand', color: 'var(--c1)', area: true, data: ds, forecastFrom: ds.findIndex(function (p) { return p.off === 0; }) }] });
    // panel 2: invoices
    var list = D.overdueInv.slice().sort(function (a, b) { return b.daysLate - a.daysLate; }).slice(0, 3).concat(D.openInv.filter(function (v) { return v.status === 'sent'; }).slice(0, 1));
    $('#demo-inv').innerHTML = list.map(function (v) {
      var late = v.status === 'overdue';
      return '<div class="row-i"><span class="ns-avatar ns-avatar--sq" style="--s:38px">' + esc(v.customer.name.split(' ').slice(0, 2).map(function (w) { return w[0]; }).join('')) + '</span><div><b>' + esc(v.customer.name) + '</b><small>' + v.id + ' · ' + (late ? v.daysLate + ' days overdue' : 'Due ' + F.date(v.dueT, 'md')) + '</small></div><span class="amt hide-sm">' + usd(v.amount, { cents: true }) + '</span>' + (late ? '<button class="ns-btn ns-btn--outline ns-btn--sm" data-rem>' + I('send') + 'Remind</button>' : '<span class="ns-badge ns-badge--accent">Sent</span>') + '</div>';
    }).join('');
    $$('[data-rem]', demo).forEach(function (b) { b.addEventListener('click', function () { b.outerHTML = '<span class="ns-badge ns-badge--pos">Reminder sent</span>'; toast('Reminder sent — a polite nudge with a pay link.', 'send'); }); });
    // panel 3: insights
    $('#demo-ins').innerHTML = D.insights.slice(0, 3).map(function (n) { return '<div class="ins ins--' + n.tone + '"><div class="ic">' + I(n.icon) + '</div><div><b>' + esc(n.title) + '</b><p>' + esc(n.body) + '</p></div></div>'; }).join('');
    // pricing preview toggle
    pricingToggle();
  };

  function pricingToggle() {
    var seg = $('#billing'); if (!seg) return; var annual = true;
    function set(a) {
      annual = a; $$('#billing button').forEach(function (b) { b.setAttribute('aria-pressed', (b.dataset.b === 'a') === a); });
      $$('[data-m]').forEach(function (e) { e.textContent = a ? e.dataset.a : e.dataset.m; });
      $$('[data-note]').forEach(function (e) { e.textContent = a ? e.dataset.na : e.dataset.nm; });
    }
    seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) set(b.dataset.b === 'a'); }); set(true);
  }

  pages.pricing = function () {
    pricingToggle();
    var rows = [
      ['Cash flow', null], ['Connected accounts', '1', '10', 'Unlimited'], ['Cash-flow forecast', '30 days', '90 days', '12 months'], ['Scenario planning', 0, 1, 1], ['Low-balance alerts', 0, 1, 1],
      ['Invoicing', null], ['Invoices per month', '5', 'Unlimited', 'Unlimited'], ['Online card & ACH payments', 1, 1, 1], ['Automatic reminders', 0, 1, 1], ['Recurring invoices', 0, 1, 1], ['Custom branding', 0, 1, 1],
      ['Reporting', null], ['P&L, cash flow & aging reports', 'Basic', 1, 1], ['Scheduled reports', 0, 1, 1], ['CSV & PDF export', 1, 1, 1], ['Accountant access', 0, 1, 1],
      ['Security & team', null], ['Seats', '1', '3', '10'], ['Two-factor & passkeys', 1, 1, 1], ['Payment approvals', 0, 0, 1], ['Custom roles & audit log', 0, 0, 1], ['API & webhooks', 0, 0, 1],
      ['Support', null], ['Help center & email', 1, 1, 1], ['Priority chat support', 0, 1, 1], ['Dedicated onboarding', 0, 0, 1]
    ];
    function cell(v) { return typeof v === 'string' ? v : v ? I('check') : '<span class="no">—</span>'; }
    $('#cmp-body').innerHTML = rows.map(function (r) { return r[1] === null ? '<tr class="grp"><td colspan="4">' + r[0] + '</td></tr>' : '<tr><td>' + r[0] + '</td><td>' + cell(r[1]) + '</td><td>' + cell(r[2]) + '</td><td>' + cell(r[3]) + '</td></tr>'; }).join('');
    $$('.faq details').forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) $$('.faq details').forEach(function (o) { if (o !== d) o.open = false; }); }); });
  };

  pages.solutions = function () {
    C.stack($('#v-channels'), { label: 'Revenue by channel', segments: D.INCOME.map(function (k, i) { return { label: k, value: P.byInc[k], color: 'var(--c' + (i + 1) + ')' }; }) });
    var ap = $('#v-approve'); if (ap) $$('button', ap).forEach(function (b) { b.addEventListener('click', function () { var ok = b.dataset.a === 'y'; ap.innerHTML = '<div style="display:flex;gap:10px;align-items:center;color:' + (ok ? 'var(--pos)' : 'var(--text-2)') + ';font-weight:500">' + I(ok ? 'check' : 'x') + (ok ? 'Approved — payment scheduled for tomorrow' : 'Declined — Sam has been notified') + '</div>'; toast(ok ? 'Approved. Payment scheduled.' : 'Request declined.', ok ? 'check' : 'x'); }); });
  };

  pages.features = function () {
    forecastWidget({ chart: '#f-chart', sum: '#f-sum', chips: '#f-chips', height: 300 });
    C.line($('#f-spark'), { height: 120, hideY: true, right: 8, xTicks: 3, label: 'Forecast preview', curve: 'monotone', endDot: false, series: [{ label: 'Cash', color: 'var(--c1)', area: true, data: D.cashSeries.filter(function (p) { return p.off >= 0 && p.off <= 60; }) }] });
    // scrollspy
    var links = $$('.sub-nav a'), secs = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
    function spy() { var y = window.scrollY + 160, cur = 0; secs.forEach(function (s, i) { if (s.offsetTop <= y) cur = i; }); links.forEach(function (a, i) { a.classList.toggle('on', i === cur); }); }
    window.addEventListener('scroll', spy, { passive: true }); spy();
  };

  pages.resources = function () {
    var A = [
      ['Cash flow', 'The 13-week cash-flow forecast, explained', 'A practical walkthrough of the one spreadsheet every owner should have — and how to stop maintaining it by hand.', 9, 'Sep 24'],
      ['Invoicing', 'Net 15 or Net 30? How payment terms change your cash', 'Two weeks sounds small. Here is what it does to your balance, your forecast and your stress.', 6, 'Sep 18'],
      ['Taxes', 'A founder’s guide to quarterly estimated taxes', 'What to set aside, when to pay, and a simple system that keeps April from becoming a crisis.', 8, 'Sep 11'],
      ['Hiring', 'Your first hire: what it really costs each month', 'Salary is the smallest line. Payroll taxes, benefits, tools and ramp time make up the rest.', 7, 'Sep 4'],
      ['Reporting', 'How to read a profit & loss statement in five minutes', 'Four numbers, two ratios and one question to ask every month.', 5, 'Aug 28'],
      ['Invoicing', 'Late invoice? The three-email sequence that works', 'Tone, timing and the one sentence that gets replies without damaging the relationship.', 4, 'Aug 21'],
      ['Cash flow', 'Seasonal business? Plan cash like a pro', 'How roasters, landscapers and retailers smooth the peaks and survive the valleys.', 8, 'Aug 14'],
      ['Product', 'What’s new: scenario planning 2.0', 'Stack what-ifs, compare against baseline and share a forecast with your bookkeeper.', 3, 'Aug 7'],
      ['Cash flow', 'Separate accounts for tax, payroll and profit: a simple system', 'Four accounts, three transfers a month, zero surprises.', 6, 'Jul 30'],
      ['Spending', 'Cutting software costs without cutting capability', 'An audit you can finish in an afternoon — and the three questions to ask of every subscription.', 5, 'Jul 23']
    ];
    var feat = A[0], rest = A.slice(1), cat = 'All';
    $('#feat').innerHTML = '<div class="cover">' + cover(0) + '</div><div class="feat__t"><div><div class="art-meta" style="margin-bottom:18px"><span>Featured</span><span>·</span><span>' + feat[0] + '</span></div><h2 class="h2">' + feat[1] + '</h2><p class="lead" style="margin-top:16px;font-size:1.0625rem">' + feat[2] + '</p></div><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><span class="art-meta"><span>' + feat[3] + ' min read</span><span>·</span><span>' + feat[4] + '</span></span><button class="ns-btn ns-btn--dark" data-concept="Concept prototype — article pages are not part of the design scope.">Read article' + I('arrow-right', 'i-arrow') + '</button></div></div>';
    function draw() {
      var list = rest.map(function (a, i) { return { a: a, i: i + 1 }; }).filter(function (x) { return cat === 'All' || x.a[0] === cat; });
      $('#arts').innerHTML = list.map(function (x) { return '<button class="art-card" data-concept="Concept prototype — article pages are not part of the design scope."><div class="cover">' + cover(x.i) + '</div><div class="art-meta"><span>' + x.a[0] + '</span><span>·</span><span>' + x.a[3] + ' min</span></div><h3>' + x.a[1] + '</h3><p>' + x.a[2] + '</p></button>'; }).join('') || '<p class="dim">No articles in this category yet.</p>';
    }
    var cats = ['All'].concat(Array.from(new Set(rest.map(function (a) { return a[0]; }))));
    $('#chips').innerHTML = cats.map(function (c) { return '<button class="ns-chip" aria-pressed="' + (c === 'All') + '" data-c="' + c + '">' + c + '</button>'; }).join('');
    $('#chips').addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (!b) return; cat = b.dataset.c; $$('#chips button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); draw(); });
    draw();
    var nf = $('#news-form'); if (nf) nf.addEventListener('submit', function (e) { e.preventDefault(); var i = $('input', nf); if (!i.checkValidity() || !i.value) { i.focus(); toast('Enter a valid email address.', 'alert'); return; } nf.innerHTML = '<div style="display:flex;gap:12px;align-items:center;color:#fff;font-weight:500">' + I('check') + 'You’re on the list (simulated — nothing was sent).</div>'; });
  };

  pages.about = function () {
    var ph = [['#DCE5FF', '#0B0D12', '#2B5BFF'], ['#EFEDE7', '#2B5BFF', '#0B0D12'], ['#E6E9EE', '#0B0D12', '#6A8AFF'], ['#2B5BFF', '#F6F5F1', '#0B0D12'], ['#EFEDE7', '#0B0D12', '#2B5BFF'], ['#141821', '#F6F5F1', '#6A8AFF']];
    $$('.team .ph').forEach(function (el, i) {
      var p = ph[i % ph.length], hx = 160 + (i % 3 - 1) * 12;
      el.innerHTML = '<svg viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="400" fill="' + p[0] + '"/><path d="M0 400V290l110 110z" fill="' + p[2] + '"/><circle cx="' + hx + '" cy="152" r="46" fill="' + p[1] + '"/><path d="M' + (hx - 94) + ' 400c0-80 40-128 94-128s94 48 94 128z" fill="' + p[1] + '"/></svg>';
    });
    $$('.job').forEach(function (j) { j.addEventListener('click', function () { toast('Concept prototype — Northstar isn’t hiring; this is a design exercise.', 'info'); }); });
  };

  pages.contact = function () {
    var form = $('#contact-form'); if (!form) return;
    function field(id, test) { var f = $('#' + id).closest('.ns-field'); var ok = test($('#' + id).value.trim(), $('#' + id)); f.classList.toggle('bad', !ok); return ok; }
    ['name', 'email', 'topic', 'msg'].forEach(function (id) { $('#' + id).addEventListener('blur', function () { check(id); }); $('#' + id).addEventListener('input', function () { if ($('#' + id).closest('.ns-field').classList.contains('bad')) check(id); }); });
    function check(id) {
      if (id === 'name') return field('name', function (v) { return v.length > 1; });
      if (id === 'email') return field('email', function (v, el) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); });
      if (id === 'topic') return field('topic', function (v) { return !!v; });
      return field('msg', function (v) { return v.length > 9; });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var ok = ['name', 'email', 'topic', 'msg'].map(check).every(Boolean);
      if (!ok) { var bad = $('.ns-field.bad input,.ns-field.bad select,.ns-field.bad textarea', form); if (bad) bad.focus(); return; }
      form.classList.add('sent'); $('#done-name').textContent = $('#name').value.trim().split(' ')[0]; window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
    });
    $('#again', form).addEventListener('click', function () { form.reset(); form.classList.remove('sent'); });
  };

  pages.signin = function () {
    var mode = qs.get('mode') === 'signup' ? 'signup' : 'signin', form = $('#auth-form');
    function set(m) {
      mode = m; $$('#mode button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.m === m); });
      $('#auth-h').textContent = m === 'signup' ? 'Start for free' : 'Welcome back'; $('#auth-p').textContent = m === 'signup' ? 'Create your Northstar workspace in two minutes. No card required.' : 'Sign in to see where your business stands.';
      $$('.only-signup').forEach(function (e) { e.style.display = m === 'signup' ? '' : 'none'; }); $$('.only-signin').forEach(function (e) { e.style.display = m === 'signin' ? '' : 'none'; });
      $('#auth-submit').textContent = m === 'signup' ? 'Create workspace' : 'Sign in'; document.title = (m === 'signup' ? 'Create account' : 'Sign in') + ' — Northstar Capital';
      $('#pw').autocomplete = m === 'signup' ? 'new-password' : 'current-password';
    }
    set(mode); $('#mode').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) set(b.dataset.m); });
    $('#showpw').addEventListener('click', function () { var p = $('#pw'), s = p.type === 'password'; p.type = s ? 'text' : 'password'; this.setAttribute('aria-pressed', s); this.innerHTML = I(s ? 'eye' : 'lock'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var em = $('#em'); em.removeAttribute('aria-invalid');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) { em.setAttribute('aria-invalid', 'true'); em.focus(); toast('Enter a valid email address — or leave it as is to try the demo.', 'alert'); return; }
      var b = $('#auth-submit'); b.disabled = true; b.innerHTML = '<span style="width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite"></span>Opening your workspace…';
      setTimeout(function () { location.href = '../app/index.html'; }, 700);
    });
    $$('[data-demo]').forEach(function (b) { b.addEventListener('click', function () { location.href = '../app/index.html'; }); });
    var ring = $('#ring-card'); if (ring) C.donut(ring, { size: 120, thickness: 11, center: { value: cushion.toFixed(1), label: 'months' }, label: 'Cash cushion', segments: [{ label: 'Operating', value: D.accounts[0].balance, color: 'var(--c1)' }, { label: 'Payroll', value: D.accounts[1].balance, color: 'var(--c2)' }, { label: 'Tax reserve', value: D.accounts[2].balance, color: 'var(--c3)' }, { label: 'Savings', value: D.accounts[3].balance, color: 'var(--c4)' }] });
  };

  var st = document.createElement('style'); st.textContent = '@keyframes spin{to{transform:rotate(360deg)}}'; document.head.appendChild(st);
  if (pages[page]) pages[page]();
  window.Site = { toast: toast, forecastWidget: forecastWidget, cover: cover };
})();
