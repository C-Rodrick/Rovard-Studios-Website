/* Northstar Capital — product views A: Overview · Cash flow · Revenue · Expenses */
(function () {
  var App = window.App, D = NS.data, F = NS.fmt, C = NS.charts, $ = App.$, $$ = App.$$, esc = App.esc;
  var GROUP_COLOR = { 'Cost of goods': 'var(--c2)', 'Payroll': 'var(--c1)', 'Rent & utilities': 'var(--c3)', 'Shipping': 'var(--c4)', 'Marketing': 'var(--c5)', 'Software & fees': 'var(--c6)' };
  var CHANNEL_COLOR = { 'Wholesale': 'var(--c1)', 'Online sales': 'var(--c2)', 'Subscriptions': 'var(--c3)', 'Taproom': 'var(--c4)' };
  App.GROUP_COLOR = GROUP_COLOR; App.CHANNEL_COLOR = CHANNEL_COLOR;

  App.rerenderCharts = function () {};
  App.sparkData = function (fn, n, step) { var out = []; for (var i = n - 1; i >= 0; i--) { var end = -(i * step); out.push(fn(end - step + 1, end)); } return out; };

  /* ---------- shared view helpers ---------- */
  function head(title, sub, actions) {
    return '<div class="page__head"><div><h1 class="page__title">' + title + '</h1>' + (sub ? '<p class="page__sub">' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="page__actions">' + actions + '</div>' : '') + '</div>';
  }
  function card(title, sub, body, o) {
    o = o || {};
    return '<section class="ns-card card ' + (o.cls || '') + '" ' + (o.attrs || '') + '><div class="card__h"><div><h2 class="card__t">' + title + '</h2>' + (sub ? '<p class="card__s">' + sub + '</p>' : '') + '</div>' + (o.actions || '') + '</div>' + body + '</section>';
  }
  function rangeSeg(opts) {
    opts = opts || [[7, '7D'], [30, '30D'], [90, '90D']];
    return '<div class="ns-seg" role="group" aria-label="Date range">' + opts.map(function (o) { return '<button type="button" data-range="' + o[0] + '" aria-pressed="' + (App.state.range === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>';
  }
  function bindRange(root) {
    $$('[data-range]', root).forEach(function (b) { b.addEventListener('click', function () { App.state.range = +b.dataset.range; App.render(); }); });
  }
  function kpi(label, value, deltaHtml, spark, tag) {
    return '<div class="ns-card kpi kpi-cell s-3"><div><div class="kpi__top"><span class="kpi__label">' + label + '</span>' + (tag ? '<span class="ns-badge ns-badge--plain">' + tag + '</span>' : '') + '</div><div class="kpi__val">' + value + '</div></div><div class="kpi__foot">' + deltaHtml + (spark || '') + '</div></div>';
  }
  function deltaLine(cur, prev, o) {
    o = o || {}; var d = App.delta(cur, prev, o); if (!prev) return '<span></span>';
    return '<span class="ns-delta ' + (d.cls ? 'ns-delta--' + d.cls : '') + '">' + NS.icon(d.up ? 'arrow-up-right' : 'arrow-down-right') + d.txt + '<span>' + (o.vs || 'vs prior') + '</span></span>';
  }
  App.card = card; App.head = head; App.rangeSeg = rangeSeg; App.bindRange = bindRange;
  function periodLabel() { var r = App.state.range; return r === 7 ? 'last 7 days' : r === 90 ? 'last 90 days' : 'last 30 days'; }
  function periods() { var r = App.state.range; return { cur: D.period(-(r - 1), 0), prev: D.period(-(2 * r - 1), -r), r: r }; }
  function avgPaid(from, to) {
    var a = D.invoices.filter(function (v) { return v.status === 'paid' && v.pay >= from && v.pay <= to; });
    return a.length ? a.reduce(function (s, v) { return s + (v.pay - v.issue); }, 0) / a.length : 0;
  }
  function greeting() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
  function invRow(v, remind) {
    var late = v.status === 'overdue';
    return '<div class="rows__r is-click keep3" style="--cols:1fr 110px 96px 104px" tabindex="0" data-inv="' + v.id + '"><div class="cell-main">' + App.avatar(v.customer.name) + '<div><b>' + esc(v.customer.name) + '</b><small>' + v.id + ' · ' + App.dueText(v) + '</small></div></div><div class="r num">' + App.money(v.amount) + '</div>' + '<div class="hide-sm">' + App.statusBadge(v.status) + '</div>' + '<div class="r hide-sm">' + (remind ? '<button class="ns-btn ns-btn--outline ns-btn--sm" data-remind="' + v.id + '">' + NS.icon('send') + 'Remind</button>' : '') + '</div></div>';
  }
  function txRow(t) {
    var inc = t.amount > 0;
    return '<div class="rows__r is-click keep3" style="--cols:1fr 120px 90px 120px" tabindex="0" data-tx="' + t.id + '"><div class="cell-main">' + App.avatar(t.desc.replace(/^(Transfer|Storefront|Taproom|Coffee Club|Interest|Owner|Estimated)\s*/i, function (m) { return m; })) + '<div><b>' + esc(t.desc) + '</b><small>' + esc(t.cat) + (t.status === 'pending' ? ' · Pending' : '') + '</small></div></div><div class="r num ' + (inc ? 'ns-amt-pos' : '') + '">' + (inc ? '+' : '') + App.money(t.amount) + '</div><div class="muted hide-sm">' + App.dateShort(t.t) + '</div><div class="muted hide-sm">' + esc(acctName(t.acct)) + '</div></div>';
  }
  function acctName(id) { var a = D.accounts.filter(function (x) { return x.id === id; })[0]; return a ? a.name + ' ··' + a.mask : id; }
  App.acctName = acctName; App.invRow = invRow; App.txRow = txRow;
  function bindRows(root) {
    $$('[data-inv]', root).forEach(function (r) {
      function open(e) { if (e.target.closest('[data-remind]')) return; App.openInvoice && App.openInvoice(r.dataset.inv); }
      r.addEventListener('click', open); r.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(e); });
    });
    $$('[data-remind]', root).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); App.remind && App.remind(b.dataset.remind); }); });
    $$('[data-tx]', root).forEach(function (r) {
      function open() { App.openTx && App.openTx(r.dataset.tx); }
      r.addEventListener('click', open); r.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(); });
    });
  }
  App.bindRows = bindRows;

  /* ======================================================================= OVERVIEW */
  App.views.overview = function (root) {
    var P = periods(), cur = P.cur, prev = P.prev, r = P.r;
    var inv = App.state.invoices;
    var open = inv.filter(function (v) { return v.status === 'sent' || v.status === 'overdue'; });
    var overdue = inv.filter(function (v) { return v.status === 'overdue'; });
    var sum = function (a) { return a.reduce(function (s, v) { return s + v.amount; }, 0); };
    var paid30 = inv.filter(function (v) { return v.status === 'paid' && v.pay > -30; }), drafts = inv.filter(function (v) { return v.status === 'draft'; });
    var seg = [{ k: 'Paid', v: sum(paid30), c: 'var(--pos-fill)' }, { k: 'Open', v: sum(open) - sum(overdue), c: 'var(--accent)' }, { k: 'Overdue', v: sum(overdue), c: 'var(--neg-fill)' }, { k: 'Draft', v: sum(drafts), c: 'var(--viz-muted)' }];
    var segTot = seg.reduce(function (s, x) { return s + x.v; }, 0) || 1;
    var attention = overdue.slice().sort(function (a, b) { return b.daysLate - a.daysLate; }).concat(open.filter(function (v) { return v.status === 'sent'; }).sort(function (a, b) { return a.dueT - b.dueT; })).slice(0, 4);
    var up = D.upcoming.filter(function (t) { return t.off <= 14; }), upIn = up.filter(function (t) { return t.amount > 0; }).reduce(function (s, t) { return s + t.amount; }, 0), upOut = -up.filter(function (t) { return t.amount < 0; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var dd = App.delta(D.totalCash, D.cash30);
    var wk = function (a, b) { return D.period(a, b); };
    var spRev = C.spark(App.sparkData(function (a, b) { return wk(a, b).revenue; }, 12, 7), { w: 84, h: 28, area: true });
    var spExp = C.spark(App.sparkData(function (a, b) { return wk(a, b).expenses; }, 12, 7), { w: 84, h: 28, muted: true, color: 'var(--text-2)' });
    var spNet = C.spark(App.sparkData(function (a, b) { return wk(a, b).net; }, 12, 7), { w: 84, h: 28, area: true });
    var spDays = C.spark([29, 27, 28, 26, 27, 25, 26, 25, 24, 25, 26, D.avgDays], { w: 84, h: 28, area: true });
    var accTotal = D.accounts.reduce(function (s, a) { return s + a.balance; }, 0);

    root.innerHTML =
      head(greeting() + ', ' + D.business.owner.split(' ')[0], F.date(D.TODAY, 'wd') + ' · Here’s where ' + esc(D.business.name) + ' stands.',
        rangeSeg() + '<button class="ns-btn ns-btn--primary" id="newInv">' + NS.icon('plus') + 'New invoice</button>') +
      '<div class="grid">' +
      card('Cash on hand', 'Across ' + D.accounts.length + ' accounts · updated just now',
        '<div class="hero-fig" style="margin:-4px 0 0">' + App.hero(D.totalCash) + '</div>' +
        '<div class="hero-meta">' + App.deltaPill(D.totalCash, D.cash30) + '<span>vs 30 days ago</span><span aria-hidden="true">·</span><span>Next payroll in ' + (function () { var p = D.tx.filter(function (t) { return t.cat === 'Payroll' && t.off > 0; })[0]; return p ? p.off + ' days' : '—'; })() + '</span></div>' +
        '<div class="ns-seg hide-sm" id="ovRange" role="group" aria-label="Chart range" style="position:absolute;top:18px;right:20px"><button data-w="30" aria-pressed="false">30D</button><button data-w="90" aria-pressed="true">90D</button><button data-w="180" aria-pressed="false">6M</button></div>' +
        '<div id="ov-chart" style="margin-top:22px"></div>', { cls: 's-8', attrs: 'style="position:relative"' }) +
      card('Insights', 'Plain-English signals from your books',
        D.insights.slice(0, 3).map(function (n) { return '<div class="insight insight--' + n.tone + '"><div class="insight__ic">' + NS.icon(n.icon) + '</div><div><b>' + esc(n.title) + '</b><p>' + esc(n.body) + '</p><a class="link" href="' + n.go + '">' + esc(n.action) + NS.icon('arrow-right') + '</a></div></div>'; }).join(''), { cls: 's-4' }) +
      kpi('Revenue', App.usd(cur.revenue), deltaLine(cur.revenue, prev.revenue), spRev, r + 'D') +
      kpi('Expenses', App.usd(cur.expenses), deltaLine(cur.expenses, prev.expenses, { invert: true }), spExp, r + 'D') +
      kpi('Net profit', App.usd(cur.net), '<span class="ns-delta ' + (cur.net >= 0 ? 'ns-delta--pos' : 'ns-delta--neg') + '">' + F.pct(cur.revenue ? cur.net / cur.revenue * 100 : 0, 1, false) + '<span>margin</span></span>', spNet, r + 'D') +
      kpi('Days to get paid', D.avgDays.toFixed(1), deltaLine(D.avgDays, avgPaid(-120, -61) || 28.6, { invert: true, vs: 'vs prior 60d' }), spDays, 'AVG') +
      card('Invoices', sum(open) ? App.usd(sum(open)) + ' outstanding · ' + open.length + ' open' : 'All caught up',
        '<div class="status-bar" role="img" aria-label="Invoice amounts by status">' + seg.map(function (x) { return '<i style="flex:' + Math.max(x.v, segTot * 0.01) + ';background:' + x.c + '"></i>'; }).join('') + '</div>' +
        '<div class="legend-row" style="margin-bottom:12px">' + seg.map(function (x) { return '<span><i style="background:' + x.c + '"></i>' + x.k + ' <b class="ns-num" style="color:var(--text);font-weight:600">' + App.usd(x.v) + '</b></span>'; }).join('') + '</div>' +
        '<div class="rows" style="margin:0 -20px -20px"><div class="rows__h" style="--cols:1fr 110px 96px 104px"><span>Needs attention</span><span class="r">Amount</span><span class="hide-sm">Status</span><span></span></div>' + attention.map(function (v) { return invRow(v, v.status === 'overdue'); }).join('') + '</div>',
        { cls: 's-7', actions: '<a class="link" href="#/invoices">View all' + NS.icon('arrow-right') + '</a>' }) +
      card('Coming up', 'Next 14 days · in ' + App.usd(upIn) + ' · out ' + App.usd(upOut),
        '<div class="tl">' + up.slice(0, 6).map(function (t) { var d = new Date(t.t); return '<div class="tl__i"><div class="tl__d"><b>' + d.getDate() + '</b><small>' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + '</small></div><div style="min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(t.desc) + '</b><small>' + (t.amount > 0 ? 'Expected payment' : t.cat) + '</small></div><span class="tl__a ' + (t.amount > 0 ? 'pos' : '') + '">' + (t.amount > 0 ? '+' : '−') + App.usd(Math.abs(t.amount)) + '</span></div>'; }).join('') + '</div>',
        { cls: 's-5', actions: '<a class="link" href="#/cash-flow">Forecast' + NS.icon('arrow-right') + '</a>' }) +
      card('Recent activity', 'Latest transactions across all accounts',
        '<div class="rows" style="margin:0 -20px -20px"><div class="rows__h" style="--cols:1fr 120px 90px 120px"><span>Description</span><span class="r">Amount</span><span class="hide-sm">Date</span><span class="hide-sm">Account</span></div>' +
        App.state.tx.slice().filter(function (t) { return !t.xfer; }).sort(function (a, b) { return b.t - a.t; }).slice(0, 6).map(txRow).join('') + '</div>',
        { cls: 's-8 card--p0', actions: '<a class="link" href="#/transactions">All transactions' + NS.icon('arrow-right') + '</a>' }) +
      card('Accounts', App.usd(accTotal) + ' total',
        '<div class="acct">' + D.accounts.map(function (a) { return '<div class="acct__i"><b>' + a.name + '</b><span class="ns-num">' + App.usd(a.balance) + '</span><small>' + a.type + ' · ··' + a.mask + '</small><div class="acct__bar"><i style="width:' + (a.balance / accTotal * 100) + '%"></i></div></div>'; }).join('') + '</div>',
        { cls: 's-4', actions: '<a class="link" href="#/settings?s=accounts">Manage' + NS.icon('arrow-right') + '</a>' }) +
      '</div>';

    bindRange(root); bindRows(root);
    $('#newInv', root).addEventListener('click', function () { App.views.invoices.openBuilder(); });
    // main chart
    var lowPt = D.baseFc.low, ch;
    function draw(w) {
      var s = D.cashSeries.filter(function (p) { return p.off >= -w && p.off <= 60; }), i0 = s.findIndex(function (p) { return p.off === 0; });
      var lowIn = s.filter(function (p) { return p.off > 0; }).reduce(function (m, p) { return p.y < m.y ? p : m; }, { y: Infinity });
      var cfg = { height: 300, label: 'Cash on hand, history and 60-day forecast', today: D.TODAY, curve: 'linear',
        series: [{ label: 'Cash on hand', color: 'var(--c1)', area: true, data: s, forecastFrom: i0 }],
        markers: lowIn.y < Infinity ? [{ x: lowIn.x, y: lowIn.y, label: 'Lowest · ' + App.usd(lowIn.y, { compact: true }), dy: 22, color: 'var(--text)' }] : [],
        tooltip: function (i) { var p = s[i]; return { title: F.date(p.x, 'wd'), rows: [{ label: p.off > 0 ? 'Projected' : 'Cash on hand', value: App.money(p.y), color: 'var(--c1)', dash: p.off > 0 }], foot: p.off > 0 ? 'Forecast from open invoices, bills and sales trends' : '' }; } };
      if (ch) ch.update({ series: cfg.series, markers: cfg.markers, tooltip: cfg.tooltip, animate: false }); else ch = C.line($('#ov-chart', root), cfg);
    }
    draw(90);
    $$('#ovRange button', root).forEach(function (b) { b.addEventListener('click', function () { $$('#ovRange button', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); draw(+b.dataset.w); }); });
  };

  /* ======================================================================= CASH FLOW */
  App.views['cash-flow'] = function (root) {
    var active = [], horizon = 90, chart;
    var scen = D.SCENARIOS;
    var cushion = D.totalCash / (D.cur30.expenses || 1);
    root.innerHTML =
      head('Cash flow', 'Where your money is, and where it’s going.', '<button class="ns-btn ns-btn--outline" id="expFlow">' + NS.icon('download') + 'Export</button>') +
      '<div class="grid">' +
      card('Forecast', 'Projected cash balance · built from open invoices, recurring bills and sales trends',
        '<div class="scen" id="scen" role="group" aria-label="What-if scenarios">' + Object.keys(scen).map(function (k) { return '<button class="ns-chip" data-s="' + k + '" aria-pressed="false" title="' + esc(scen[k].desc) + '">' + NS.icon(k === 'late' ? 'clock' : k === 'hire' ? 'user' : 'box') + esc(scen[k].label) + '</button>'; }).join('') + '</div>' +
        '<div id="cf-chart" style="margin-top:20px"></div>' +
        '<div class="summary-strip" id="cf-sum"></div>', { cls: 's-12', actions: '<div class="ns-seg" id="hz" role="group" aria-label="Forecast horizon"><button data-h="30" aria-pressed="false">30D</button><button data-h="60" aria-pressed="false">60D</button><button data-h="90" aria-pressed="true">90D</button></div>' }) +
      card('Money in vs. out', 'Weekly, last 13 weeks · net shown as a line',
        '<div id="cf-weeks"></div>', { cls: 's-8' }) +
      card('Cash cushion', 'How many months of expenses you hold',
        '<div class="hero-fig" style="font-size:2.75rem">' + cushion.toFixed(1) + '<small> months</small></div>' +
        '<div class="ns-meter" style="margin:16px 0 8px;height:8px"><i style="width:' + Math.min(100, cushion / 4 * 100) + '%"></i></div><div class="card__s" style="display:flex;justify-content:space-between"><span>0</span><span>Target: 3 months</span><span>4</span></div>' +
        '<div class="ns-divider" style="margin:20px 0"></div><div class="acct">' + D.accounts.map(function (a) { return '<div class="acct__i"><b>' + a.name + '</b><span class="ns-num">' + App.usd(a.balance) + '</span><small>' + a.type + ' ··' + a.mask + '</small></div>'; }).join('') + '</div>', { cls: 's-4' }) +
      card('Expected from customers', 'Open invoices, sorted by when they’re likely to be paid',
        '<div class="rows" style="margin:0 -20px -20px"><div class="rows__h" style="--cols:1fr 110px 130px 140px"><span>Customer</span><span class="r">Amount</span><span class="hide-sm">Expected</span><span class="hide-sm">Pattern</span></div>' +
        D.openInv.slice().sort(function (a, b) { return a.pay - b.pay; }).slice(0, 8).map(function (v) {
          var lateDays = v.customer.late; var pat = lateDays <= 0 ? 'Pays on time' : 'Usually ' + lateDays + ' days late';
          return '<div class="rows__r is-click keep3" style="--cols:1fr 110px 130px 140px" tabindex="0" data-inv="' + v.id + '"><div class="cell-main">' + App.avatar(v.customer.name) + '<div><b>' + esc(v.customer.name) + '</b><small>' + v.id + ' · due ' + App.dateShort(v.dueT) + '</small></div></div><div class="r num">' + App.money(v.amount) + '</div><div class="hide-sm">' + (v.pay <= 0 ? 'Any day now' : App.dateShort(v.payT)) + '</div><div class="hide-sm"><span class="ns-badge ' + (lateDays > 7 ? 'ns-badge--warn' : lateDays <= 0 ? 'ns-badge--pos' : '') + '">' + pat + '</span></div></div>'; }).join('') + '</div>',
        { cls: 's-8 card--p0' }) +
      card('Next 30 days', 'Scheduled and expected',
        '<div class="ns-tabs" id="upTabs" style="margin-bottom:14px"><button aria-selected="true" data-k="all">All</button><button data-k="in">Money in</button><button data-k="out">Money out</button></div><div class="tl" id="upList"></div>', { cls: 's-4' }) +
      '</div>';
    bindRows(root);

    function fc() { return active.length ? D.forecast(active) : D.baseFc; }
    function render() {
      var base = D.baseFc, f = fc(), start = -30, i0 = 30;
      function toSeries(sr) { var hist = D.cashSeries.filter(function (p) { return p.off >= start && p.off <= 0; }); return hist.concat(sr.series.filter(function (p) { return p.off > 0 && p.off <= horizon; })); }
      var main = toSeries(f), baseS = toSeries(base);
      var series = [{ label: active.length ? 'With changes' : 'Projected balance', color: 'var(--c1)', area: true, data: main, forecastFrom: i0 }];
      if (active.length) series.push({ label: 'Baseline', color: 'var(--text-3)', data: baseS, forecastFrom: i0, width: 1.5 });
      var lowIn = main.filter(function (p) { return p.off > 0; }).reduce(function (m, p) { return p.y < m.y ? p : m; }, { y: Infinity });
      var cfg = { height: 320, label: 'Projected cash balance', today: D.TODAY, curve: 'linear', series: series,
        markers: [{ x: lowIn.x, y: lowIn.y, label: 'Lowest · ' + App.usd(lowIn.y, { compact: true }), dy: 22, color: 'var(--text)' }] };
      if (chart) chart.update(cfg); else chart = C.line($('#cf-chart', root), cfg);
      var end = main[main.length - 1], delta = end.y - D.totalCash;
      $('#cf-sum', root).innerHTML =
        '<div><small>Lowest balance</small><b>' + App.usd(lowIn.y) + '</b><span>' + F.date(lowIn.x, 'wd') + (active.length ? ' · ' + (lowIn.y - base.low.y >= 0 ? '+' : '−') + App.usd(Math.abs(lowIn.y - base.low.y)) + ' vs baseline' : '') + '</span></div>' +
        '<div><small>Balance in ' + horizon + ' days</small><b>' + App.usd(end.y) + '</b><span class="' + (delta >= 0 ? 'pos' : 'neg') + '">' + (delta >= 0 ? '+' : '−') + App.usd(Math.abs(delta)) + ' from today</span></div>' +
        '<div><small>Runway at current spend</small><b>' + (lowIn.y / (D.cur30.expenses || 1)).toFixed(1) + ' months</b><span>at the lowest point</span></div>';
    }
    render();
    $$('#scen button', root).forEach(function (b) { b.addEventListener('click', function () { var k = b.dataset.s, i = active.indexOf(k); if (i > -1) active.splice(i, 1); else active.push(k); b.setAttribute('aria-pressed', active.indexOf(k) > -1); render(); }); });
    $$('#hz button', root).forEach(function (b) { b.addEventListener('click', function () { horizon = +b.dataset.h; $$('#hz button', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); render(); }); });
    // weekly bars
    C.bars($('#cf-weeks', root), { height: 280, labels: D.weeks.map(function (w) { return w.label; }), label: 'Weekly money in and money out',
      series: [{ label: 'Money in', color: 'var(--c1)', values: D.weeks.map(function (w) { return w.moneyIn; }) }, { label: 'Money out', color: 'var(--viz-muted)', values: D.weeks.map(function (w) { return w.moneyOut; }) }],
      line: { label: 'Net', color: 'var(--text)', values: D.weeks.map(function (w) { return w.cashNet; }) },
      tooltip: function (i) { var w = D.weeks[i]; return { title: 'Week of ' + w.label, rows: [{ label: 'Money in', value: App.usd(w.moneyIn), color: 'var(--c1)' }, { label: 'Money out', value: App.usd(w.moneyOut), color: 'var(--viz-muted)' }, { label: 'Net', value: (w.cashNet >= 0 ? '+' : '−') + App.usd(Math.abs(w.cashNet)), color: 'var(--text)' }] }; } });
    // upcoming list
    var upK = 'all';
    function drawUp() {
      var list = D.upcoming.filter(function (t) { return upK === 'all' || (upK === 'in' ? t.amount > 0 : t.amount < 0); }).slice(0, 7);
      $('#upList', root).innerHTML = list.length ? list.map(function (t) { var d = new Date(t.t); return '<div class="tl__i"><div class="tl__d"><b>' + d.getDate() + '</b><small>' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + '</small></div><div style="min-width:0"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(t.desc) + '</b><small>' + (t.amount > 0 ? 'Expected' : t.cat) + '</small></div><span class="tl__a ' + (t.amount > 0 ? 'pos' : '') + '">' + (t.amount > 0 ? '+' : '−') + App.usd(Math.abs(t.amount)) + '</span></div>'; }).join('') : '<p class="muted">Nothing scheduled.</p>';
    }
    drawUp();
    $$('#upTabs button', root).forEach(function (b) { b.addEventListener('click', function () { upK = b.dataset.k; $$('#upTabs button', root).forEach(function (x) { x.setAttribute('aria-selected', x === b); }); drawUp(); }); });
    $('#expFlow', root).addEventListener('click', function () {
      App.csv('northstar-weekly-cash-flow.csv', [['Week of', 'Money in', 'Money out', 'Net']].concat(D.weeks.map(function (w) { return [w.label, w.moneyIn.toFixed(2), w.moneyOut.toFixed(2), w.cashNet.toFixed(2)]; }))); App.toast('Exported weekly cash flow (CSV).', 'download');
    });
  };

  /* ======================================================================= REVENUE */
  App.views.revenue = function (root) {
    var P = periods(), cur = P.cur, prev = P.prev, r = P.r;
    var subs = D.tx.filter(function (t) { return t.cat === 'Subscriptions' && t.off <= 0; }).pop();
    var members = subs ? +(subs.desc.match(/(\d+) members/) || [0, 0])[1] : 0;
    var wInv = App.state.invoices.filter(function (v) { return v.issue >= -(r - 1) && v.issue <= 0 && v.status !== 'draft'; });
    var wPrev = App.state.invoices.filter(function (v) { return v.issue >= -(2 * r - 1) && v.issue <= -r && v.status !== 'draft'; });
    var wSum = wInv.reduce(function (s, v) { return s + v.amount; }, 0), wPrevSum = wPrev.reduce(function (s, v) { return s + v.amount; }, 0);
    var chan = D.INCOME.map(function (k) { return { label: k, value: cur.byInc[k], color: CHANNEL_COLOR[k] }; });
    var wkCur = [], wkPrev = [], weeksN = Math.max(4, Math.min(13, Math.round(r * 13 / 90) || 13));
    var nW = r === 7 ? 7 : 13, step = r === 7 ? 1 : (r === 30 ? 7 : 7);
    var span = r === 7 ? 7 : 13 * 7;
    for (var i = 0; i < (r === 7 ? 7 : 13); i++) {
      var e = -(i * step), s0 = e - step + 1; wkCur.unshift({ x: i, off: e, y: D.period(s0, e).revenue });
      wkPrev.unshift({ x: i, y: D.period(s0 - (r === 7 ? 7 : 13 * 7), e - (r === 7 ? 7 : 13 * 7)).revenue });
    }
    wkCur = wkCur.map(function (p, i) { return { x: i, y: p.y, off: p.off }; }); wkPrev = wkPrev.map(function (p, i) { return { x: i, y: p.y }; });
    root.innerHTML =
      head('Revenue', 'Every dollar you earned, by channel and customer.', rangeSeg() + '<button class="ns-btn ns-btn--outline" id="expRev">' + NS.icon('download') + 'Export</button>') +
      '<div class="grid">' +
      card('Revenue', 'Last 12 months, stacked by channel',
        '<div class="hero-fig" style="margin:-2px 0 4px">' + App.hero(cur.revenue) + '</div><div class="hero-meta" style="margin:0 0 20px">' + App.deltaPill(cur.revenue, prev.revenue) + '<span>' + periodLabel() + ' vs prior ' + r + ' days</span></div><div id="rv-months"></div>', { cls: 's-8' }) +
      card('By channel', periodLabel(), '<div id="rv-chan"></div>', { cls: 's-4' }) +
      kpi('Wholesale accounts', String(D.customers.length), '<span class="ns-delta">' + NS.icon('users') + '<span>active customers</span></span>', '', '') +
      kpi('Coffee Club members', F.num(members), '<span class="ns-delta ns-delta--pos">' + NS.icon('arrow-up-right') + '2.4%<span>this month</span></span>', C.spark([380, 384, 388, 392, 396, 399, 402, 405, 407, 409, 411, members], { w: 84, h: 28, area: true }), 'MRR') +
      kpi('Avg wholesale invoice', App.usd(wInv.length ? wSum / wInv.length : 0), deltaLine(wInv.length ? wSum / wInv.length : 0, wPrev.length ? wPrevSum / wPrev.length : 0), '', '') +
      kpi('Online sales', App.usd(cur.byInc['Online sales']), deltaLine(cur.byInc['Online sales'], prev.byInc['Online sales']), C.spark(App.sparkData(function (a, b) { return D.period(a, b).byInc['Online sales']; }, 12, 7), { w: 84, h: 28, area: true }), r + 'D') +
      card('Revenue vs. prior period', 'Weekly revenue compared with the previous ' + (r === 7 ? '7 days' : '13 weeks'), '<div id="rv-cmp"></div>', { cls: 's-7' }) +
      card('Top customers', 'Wholesale revenue, last 90 days', '<div id="rv-top"></div>', { cls: 's-5' }) +
      '</div>';
    bindRange(root);
    C.bars($('#rv-months', root), { height: 260, stacked: true, labels: D.months.map(function (m) { return m.label; }), label: 'Monthly revenue by channel',
      series: D.INCOME.map(function (k) { return { label: k, color: CHANNEL_COLOR[k], values: D.months.map(function (m) { return m.byInc[k]; }) }; }),
      tooltip: function (i) { var m = D.months[i]; return { title: m.label + ' ' + m.year, rows: D.INCOME.map(function (k) { return { label: k, value: App.usd(m.byInc[k]), color: CHANNEL_COLOR[k] }; }).concat([{ label: 'Total', value: App.usd(m.revenue), color: 'var(--text)' }]) }; } });
    C.stack($('#rv-chan', root), { segments: chan, label: 'Revenue by channel' });
    C.line($('#rv-cmp', root), { height: 250, label: 'Revenue this period compared to previous period', curve: 'monotone', endDot: true, xTicks: 7,
      xFormat: function (x) { var p = wkCur[Math.round(x)]; return p ? F.date(D.at(p.off), 'md') : ''; },
      series: [{ label: 'This period', color: 'var(--c1)', area: true, data: wkCur }, { label: 'Previous period', color: 'var(--text-3)', data: wkPrev, width: 1.5, dash: '1 5.5' }],
      tooltip: function (i) { return { title: 'Week ending ' + F.date(D.at(wkCur[i].off), 'md'), rows: [{ label: 'This period', value: App.usd(wkCur[i].y), color: 'var(--c1)' }, { label: 'Previous period', value: App.usd(wkPrev[i].y), color: 'var(--text-3)', dash: true }] }; } });
    C.hbars($('#rv-top', root), { items: D.topCust.list.slice(0, 6).map(function (c) { return { label: c.name, sub: Math.round(c.share * 100) + '% of wholesale', value: c.value }; }), format: function (v) { return App.usd(v, { compact: true }); } });
    $('#expRev', root).addEventListener('click', function () { App.csv('northstar-monthly-revenue.csv', [['Month'].concat(D.INCOME, ['Total'])].concat(D.months.map(function (m) { return [m.label + ' ' + m.year].concat(D.INCOME.map(function (k) { return m.byInc[k].toFixed(2); }), [m.revenue.toFixed(2)]); }))); App.toast('Exported monthly revenue (CSV).', 'download'); });
  };

  /* ======================================================================= EXPENSES */
  var BUDGET = { 'Cost of goods': 31000, 'Payroll': 35500, 'Rent & utilities': 8000, 'Shipping': 4600, 'Marketing': 2900, 'Software & fees': 3300 };
  App.views.expenses = function (root) {
    var P = periods(), cur = P.cur, prev = P.prev, r = P.r, groups = D.EXPENSE_GROUPS.map(function (g) { return g.key; });
    var vendors = {}; D.range(-89, 0, function (t) { return t.amount < 0 && t.vendor && !t.xfer && t.cat !== 'Owner draw'; }).forEach(function (t) { var v = vendors[t.vendor] = vendors[t.vendor] || { name: t.vendor, total: 0, cat: t.cat, n: 0 }; v.total += -t.amount; v.n++; });
    var vlist = Object.keys(vendors).map(function (k) { return vendors[k]; }).sort(function (a, b) { return b.total - a.total; }).slice(0, 7);
    var rec = [['Alpine Industrial Properties', 'Rent', 6400, 'Monthly · 1st'], ['Stack Software', 'Software', 249, 'Monthly · 4th'], ['Ledgerline POS', 'Software', 189, 'Monthly · 6th'], ['Cornerstone Mutual Insurance', 'Insurance', 890, 'Monthly · 5th'], ['Granite Equipment Leasing', 'Equipment', 540, 'Monthly · 8th'], ['Crate Email', 'Software', 79, 'Monthly · 17th']];
    var m30 = D.period(-29, 0);
    root.innerHTML =
      head('Expenses', 'See where the money goes — and what’s changed.', rangeSeg() + '<button class="ns-btn ns-btn--outline" id="expExp">' + NS.icon('download') + 'Export</button>') +
      '<div class="grid">' +
      card('Spending', 'Last 12 months, stacked by category',
        '<div class="hero-fig" style="margin:-2px 0 4px">' + App.hero(cur.expenses) + '</div><div class="hero-meta" style="margin:0 0 20px">' + App.deltaPill(cur.expenses, prev.expenses, { invert: true }) + '<span>' + periodLabel() + ' vs prior ' + r + ' days</span></div><div id="ex-months"></div>', { cls: 's-8' }) +
      card('Where it went', periodLabel() + ' · change vs prior period', '<div id="ex-rank"></div>', { cls: 's-4' }) +
      card('Budget vs. actual', 'Last 30 days against your monthly budget',
        '<div style="display:grid;gap:18px">' + groups.map(function (g) {
          var a = m30.byExp[g], b = BUDGET[g], pct = a / b * 100, over = pct > 100, near = pct > 92 && !over;
          return '<div><div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:.875rem;margin-bottom:8px"><span style="display:inline-flex;align-items:center;gap:8px"><i class="vz-key is-rect" style="--k:' + GROUP_COLOR[g] + '"></i>' + g + '</span><span class="ns-num"><b style="font-weight:600">' + App.usd(a) + '</b> <span class="muted">of ' + App.usd(b) + '</span></span></div><div class="ns-meter ' + (over ? 'ns-meter--warn' : '') + '" role="meter" aria-valuenow="' + Math.round(pct) + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + g + ' budget used"><i style="width:' + Math.min(100, pct) + '%;' + (over ? '' : '') + '"></i></div>' + (over ? '<div class="card__s warn" style="color:var(--warn);margin-top:6px">Over by ' + App.usd(a - b) + '</div>' : near ? '<div class="card__s" style="margin-top:6px">Close to budget</div>' : '') + '</div>'; }).join('') + '</div>', { cls: 's-6' }) +
      card('Top vendors', 'Last 90 days',
        '<div class="rows" style="margin:0 -20px -20px"><div class="rows__h" style="--cols:1fr 110px 90px"><span>Vendor</span><span class="r">Spend</span><span class="r hide-sm">Payments</span></div>' +
        vlist.map(function (v) { return '<div class="rows__r keep3" style="--cols:1fr 110px 90px"><div class="cell-main">' + App.avatar(v.name) + '<div><b>' + esc(v.name) + '</b><small>' + esc(v.cat) + '</small></div></div><div class="r num">' + App.usd(v.total) + '</div><div class="r muted hide-sm">' + v.n + '</div></div>'; }).join('') + '</div>', { cls: 's-6 card--p0' }) +
      card('Recurring charges', 'We watch for new subscriptions over $50 and flag duplicates',
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">' + rec.map(function (x) { return '<div class="ns-card ns-card--sunken" style="padding:14px;display:grid;gap:10px"><div style="display:flex;justify-content:space-between;gap:8px"><span class="ns-badge ns-badge--plain">' + x[1] + '</span><span class="muted" style="font-size:.75rem">' + x[3] + '</span></div><div><b style="font-weight:500;font-size:.875rem;display:block;margin-bottom:4px">' + x[0] + '</b><span class="ns-num" style="font:600 1.25rem/1 var(--font-sans);letter-spacing:-.03em">' + App.usd(x[2]) + '</span></div></div>'; }).join('') + '</div>' +
        '<div class="insight insight--pos" style="margin-top:18px;border:0;padding:0"><div class="insight__ic">' + NS.icon('check') + '</div><div><b>No duplicate or unused subscriptions found</b><p>Last checked today. Recurring charges total ' + App.usd(rec.reduce(function (s, x) { return s + x[2]; }, 0)) + '/month.</p></div></div>', { cls: 's-12' }) +
      '</div>';
    bindRange(root);
    C.bars($('#ex-months', root), { height: 260, stacked: true, labels: D.months.map(function (m) { return m.label; }), label: 'Monthly expenses by category',
      series: groups.map(function (g) { return { label: g, color: GROUP_COLOR[g], values: D.months.map(function (m) { return m.byExp[g]; }) }; }),
      tooltip: function (i) { var m = D.months[i]; return { title: m.label + ' ' + m.year, rows: groups.map(function (g) { return { label: g, value: App.usd(m.byExp[g]), color: GROUP_COLOR[g] }; }).concat([{ label: 'Total', value: App.usd(m.expenses), color: 'var(--text)' }]) }; } });
    C.hbars($('#ex-rank', root), { items: groups.map(function (g) { var d = prev.byExp[g] ? (cur.byExp[g] - prev.byExp[g]) / prev.byExp[g] * 100 : 0; return { label: g, value: cur.byExp[g], delta: F.pct(d, 0), deltaGood: Math.abs(d) < 1 ? null : d < 0 }; }).sort(function (a, b) { return b.value - a.value; }), format: function (v) { return App.usd(v, { compact: true }); } });
    $('#expExp', root).addEventListener('click', function () { App.csv('northstar-monthly-expenses.csv', [['Month'].concat(groups, ['Total'])].concat(D.months.map(function (m) { return [m.label + ' ' + m.year].concat(groups.map(function (g) { return m.byExp[g].toFixed(2); }), [m.expenses.toFixed(2)]); }))); App.toast('Exported monthly expenses (CSV).', 'download'); });
  };
})();
