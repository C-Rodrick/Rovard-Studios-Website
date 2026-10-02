/* Northstar Capital — fictional demo dataset
   "Highline Roasters" is an invented Denver coffee roaster. Every name, number and date is fictional.
   Dates are generated relative to today so the product always looks current. Deterministic: no Math.random. */
(function () {
  var NS = (window.NS = window.NS || {});
  var now = new Date();
  var Y = now.getFullYear(), M = now.getMonth(), D = now.getDate();
  function at(off) { return new Date(Y, M, D + off).getTime(); }
  var TODAY = at(0), BACK = -400, AHEAD = 95;

  function rnd(a, b) { var n = (Math.imul(a | 0, 374761393) + Math.imul((b || 0) | 0, 668265263)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
  function r2(n) { return Math.round(n * 100) / 100; }
  function dayInfo(o) { var d = new Date(at(o)); return { t: d.getTime(), dow: d.getDay(), dom: d.getDate(), mon: d.getMonth(), dim: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), yr: d.getFullYear() }; }

  /* ------------------------------------------------------------ business */
  var business = { name: 'Highline Roasters', legal: 'Highline Roasters LLC', owner: 'Dana Whitfield', role: 'Owner', email: 'dana@highlineroasters.example', city: 'Denver, CO', industry: 'Food & beverage — specialty coffee', employees: 12, plan: 'Growth', since: 'Jan 2024' };

  /* ------------------------------------------------------------ accounts (balances are the targets; history is solved backwards) */
  var accounts = [
    { id: 'op',  name: 'Operating',      type: 'Checking', mask: '4417', bank: 'Partner bank', target: 82014.17 },
    { id: 'pay', name: 'Payroll',        type: 'Checking', mask: '0932', bank: 'Partner bank', target: 20440.60 },
    { id: 'tax', name: 'Tax reserve',    type: 'Savings',  mask: '7765', bank: 'Partner bank', target: 33250.00 },
    { id: 'sav', name: 'Growth savings', type: 'Savings',  mask: '2208', bank: 'Partner bank', target: 66000.00 }
  ];

  /* ------------------------------------------------------------ customers + products */
  var SKU = [
    { n: 'House Blend — 5 lb bag', p: 58.0 }, { n: 'Single Origin — 5 lb bag', p: 71.5 }, { n: 'Espresso Roast — 2 lb bag', p: 29.5 },
    { n: 'Decaf Blend — 5 lb bag', p: 64.0 }, { n: 'Cold Brew Concentrate — 1 gal', p: 42.0 }, { n: 'Seasonal Roast — 5 lb bag', p: 66.0 }
  ];
  var customers = [
    { id: 'c1', name: 'Larkspur Café',         email: 'orders@larkspurcafe.example',    city: 'Boulder, CO',     terms: 15, cadence: 14, base: 4150, late: -1, phase: 1,  mix: [0, 2, 4] },
    { id: 'c2', name: 'Northgate Bakehouse',   email: 'ap@northgatebakehouse.example',  city: 'Denver, CO',      terms: 30, cadence: 28, base: 3600, late: 3,  phase: 11, mix: [0, 3, 2] },
    { id: 'c3', name: 'Foxglove Market',       email: 'billing@foxglovemarket.example', city: 'Fort Collins, CO',terms: 30, cadence: 14, base: 3250, late: 6,  phase: 34,  mix: [1, 0, 5] },
    { id: 'c4', name: 'Sable & Sage Hotel',    email: 'accounts@sablesage.example',     city: 'Aspen, CO',       terms: 30, cadence: 28, base: 7150, late: 13, phase: 39, mix: [1, 0, 3] },
    { id: 'c5', name: 'Orchard Row Co-op',     email: 'finance@orchardrow.example',     city: 'Denver, CO',      terms: 15, cadence: 14, base: 2050, late: 0,  phase: 0,  mix: [0, 5, 2] },
    { id: 'c6', name: 'Bridgewater Brewing',   email: 'ap@bridgewaterbrewing.example',  city: 'Golden, CO',      terms: 30, cadence: 28, base: 3050, late: 10, phase: 34, mix: [4, 0, 2] },
    { id: 'c7', name: 'Tidewater Provisions',  email: 'ar@tidewaterprov.example',       city: 'Littleton, CO',   terms: 15, cadence: 14, base: 2300, late: 2,  phase: 12,  mix: [2, 0, 1] },
    { id: 'c8', name: 'Juniper Hall Events',   email: 'pay@juniperhall.example',        city: 'Denver, CO',      terms: 30, cadence: 35, base: 5050, late: 22, phase: 47, mix: [1, 5, 0] },
    { id: 'c9', name: 'Kestrel Coworking',     email: 'ops@kestrelcowork.example',      city: 'Denver, CO',      terms: 15, cadence: 14, base: 1500, late: 5,  phase: 13, mix: [0, 2, 4] }
  ];

  /* ------------------------------------------------------------ invoices */
  function growth(o) { return Math.pow(1.011, o / 30); }
  var invoices = [], invSeq = 0;
  customers.forEach(function (c, ci) {
    var anchor = -c.phase;
    for (var n = -Math.ceil(420 / c.cadence); n <= Math.ceil(70 / c.cadence); n++) {
      var iss = anchor + n * c.cadence; if (iss < BACK + 2 || iss > 62) continue;
      var tot = c.base * growth(iss) * (0.86 + rnd(ci * 101 + n, 5) * 0.3), lines = [];
      var w = [0.5, 0.3, 0.2];
      c.mix.forEach(function (si, li) { var q = Math.max(2, Math.round(tot * w[li] / SKU[si].p)); lines.push({ desc: SKU[si].n, qty: q, price: SKU[si].p }); });
      var amount = r2(lines.reduce(function (a, l) { return a + l.qty * l.price; }, 0));
      var due = iss + c.terms, pay = Math.max(iss + 2, due + c.late + Math.round((rnd(ci * 53 + n, 9) - 0.5) * 5));
      invoices.push({ cust: c.id, issue: iss, due: due, pay: pay, amount: amount, lines: lines, terms: c.terms, viewed: rnd(ci + n * 7, 3) > 0.25 });
    }
  });
  invoices.sort(function (a, b) { return a.issue - b.issue || a.cust.localeCompare(b.cust); });
  var custById = {}; customers.forEach(function (c) { custById[c.id] = c; });
  invoices.forEach(function (v, i) {
    v.id = 'INV-' + (1001 + i); v.customer = custById[v.cust];
    v.issueT = at(v.issue); v.dueT = at(v.due); v.payT = at(v.pay);
    v.status = v.issue > 2 ? 'forecast' : v.issue > 0 ? 'draft' : v.pay <= 0 ? 'paid' : v.due < 0 ? 'overdue' : 'sent';
    if (v.status === 'draft') v.issueT = at(v.issue);
    v.daysLate = v.status === 'overdue' ? -v.due : 0;
    v.reminders = v.status === 'overdue' ? Math.min(3, Math.ceil(v.daysLate / 7)) : 0;
    v.paidDays = v.status === 'paid' ? v.pay - v.issue : null;
    v.tax = 0; v.subtotal = v.amount;
  });
  var invoiceList = invoices.filter(function (v) { return v.status !== 'forecast'; });

  /* ------------------------------------------------------------ transactions (actual + projected) */
  var tx = [], txSeq = 0;
  function add(o, desc, cat, acct, amount, extra) {
    var info = dayInfo(o); var t = { id: 'tx' + (++txSeq), t: info.t, off: o, desc: desc, cat: cat, acct: acct, amount: r2(amount), proj: o > 0, status: o > 0 ? 'scheduled' : (o === 0 ? 'pending' : 'posted') };
    if (extra) for (var k in extra) t[k] = extra[k]; tx.push(t); return t;
  }
  var SEAS = [0.93, 0.9, 0.95, 0.98, 1.0, 0.97, 0.94, 0.96, 1.03, 1.1, 1.22, 1.36];
  var VEND = { green: ['Verdant Origin Imports', 'Blackbird Green Coffee'], pack: 'PackRight Supply', ship: 'Relay Freight', ads: 'Beacon Ads', pay: 'Payroll — 12 employees', rent: 'Alpine Industrial Properties', util: 'Front Range Power & Gas', soft: ['Stack Software', 'Ledgerline POS', 'Crate Email'], ins: 'Cornerstone Mutual Insurance', lease: 'Granite Equipment Leasing', fees: 'Ledgerwell Bookkeeping', tax: 'Estimated tax — federal (Q)' };
  var batch = 4800;
  for (var o = BACK; o <= AHEAD; o++) {
    var d = dayInfo(o), g = growth(o), s = SEAS[d.mon], proj = o > 0, wk = (d.dow === 0 || d.dow === 6);
    var noise = function (k, a) { return proj ? 1 : (1 - a + rnd(o + 2000, k) * a * 2); };
    // revenue — online storefront payout & taproom
    add(o, 'Storefront payout · batch #' + (batch + o + 400), 'Online sales', 'op', 915 * g * s * (wk ? 1.22 : d.dow === 2 ? 0.88 : 1) * noise(1, 0.28));
    add(o, 'Taproom card settlement', 'Taproom', 'op', 238 * g * s * (wk ? 2.0 : d.dow === 1 ? 0.6 : 0.95) * noise(2, 0.3));
    if (d.dom === 1 || d.dom === 15) add(o, 'Coffee Club subscriptions · ' + Math.round(412 * g) + ' members', 'Subscriptions', 'op', Math.round(412 * g) * 17.5 * 0.99 * noise(3, 0.02));
    // payroll cycle (transfer 2 days before, pay on 15th & last day)
    var payAmt = 17250 * Math.pow(g, 0.5);
    if (d.dom === 13 || (d.dom === d.dim - 2)) { add(o, 'Transfer to Payroll ··0932', 'Transfer', 'op', -payAmt, { xfer: true }); add(o, 'Transfer from Operating ··4417', 'Transfer', 'pay', payAmt, { xfer: true }); }
    if (d.dom === 15 || d.dom === d.dim) add(o, VEND.pay, 'Payroll', 'pay', -payAmt, { vendor: 'Payroll' });
    // occupancy
    if (d.dom === 1) add(o, VEND.rent, 'Rent & utilities', 'op', -6400, { vendor: VEND.rent });
    if (d.dom === 12) add(o, VEND.util, 'Rent & utilities', 'op', -(1080 + (d.mon === 0 || d.mon === 11 || d.mon === 6 ? 260 : 0) + (proj ? 90 : rnd(o, 7) * 180)), { vendor: VEND.util });
    // cost of goods
    if (d.dow === 2) add(o, VEND.green[(Math.floor(o / 7) % 2 + 2) % 2], 'Cost of goods', 'op', -(5300 * Math.pow(g, 0.9) * s * noise(4, 0.08)), { vendor: VEND.green[(Math.floor(o / 7) % 2 + 2) % 2] });
    if (d.dom === 9 || d.dom === 24) add(o, VEND.pack, 'Cost of goods', 'op', -(1240 * g * noise(5, 0.12)), { vendor: VEND.pack });
    // fulfilment & marketing
    if (d.dow === 1) add(o, VEND.ship, 'Shipping', 'op', -(1010 * g * s * noise(6, 0.14)), { vendor: VEND.ship });
    if (d.dow === 3) add(o, VEND.ads, 'Marketing', 'op', -(610 * noise(7, 0.15)), { vendor: VEND.ads });
    // fixed monthly
    if (d.dom === 4) add(o, VEND.soft[0], 'Software', 'op', -249, { vendor: VEND.soft[0] });
    if (d.dom === 6) add(o, VEND.soft[1], 'Software', 'op', -189, { vendor: VEND.soft[1] });
    if (o === 19) add(o, 'Verdant Origin Imports — holiday pre-buy', 'Cost of goods', 'op', -21800, { vendor: VEND.green[0] });
    if (d.dom === 17) add(o, VEND.soft[2], 'Software', 'op', -(79 + (proj ? 0 : 0)), { vendor: VEND.soft[2] });
    if (d.dom === 5) add(o, VEND.ins, 'Insurance', 'op', -890, { vendor: VEND.ins });
    if (d.dom === 8) add(o, VEND.lease, 'Equipment', 'op', -540, { vendor: VEND.lease });
    if (d.dom === 20) add(o, VEND.fees, 'Professional fees', 'op', -750, { vendor: VEND.fees });
    // quarterly estimated tax (Jan/Apr/Jun/Sep 15) from the tax reserve
    if (d.dom === 15 && (d.mon === 0 || d.mon === 3 || d.mon === 5 || d.mon === 8)) add(o, VEND.tax.replace('(Q)', '(' + 'Q' + (d.mon === 0 ? 4 : d.mon === 3 ? 1 : d.mon === 5 ? 2 : 3) + ')'), 'Taxes', 'tax', -6400, { vendor: 'Federal estimated tax' });
    // savings & reserve transfers + owner draw
    if (d.dom === 2) { add(o, 'Transfer to Tax reserve ··7765', 'Transfer', 'op', -3200, { xfer: true }); add(o, 'Transfer from Operating ··4417', 'Transfer', 'tax', 3200, { xfer: true }); }
    if (d.dom === d.dim - 1) { add(o, 'Transfer to Growth savings ··2208', 'Transfer', 'op', -4200, { xfer: true }); add(o, 'Transfer from Operating ··4417', 'Transfer', 'sav', 4200, { xfer: true }); }
    if (d.dom === d.dim - 3) add(o, 'Owner distribution', 'Owner draw', 'op', -8000, { vendor: 'Owner' });
    if (d.dom === 28) add(o, 'Interest earned', 'Interest', 'sav', 118 + (proj ? 0 : rnd(o, 4) * 14));
  }
  // wholesale payments
  invoices.forEach(function (v) {
    if (v.status === 'draft' || v.status === 'forecast' && v.pay > AHEAD) return;
    if (v.pay <= AHEAD && v.pay >= BACK) add(v.pay, v.customer.name, 'Wholesale', 'op', v.amount, { vendor: v.customer.name, inv: v.id, cust: v.cust });
  });
  tx.sort(function (a, b) { return a.t - b.t || (a.id < b.id ? -1 : 1); });

  /* ------------------------------------------------------------ balances (solved backwards from the targets) */
  var daily = {};   // off -> per-account end-of-day balance
  var target = {}; accounts.forEach(function (a) { target[a.id] = a.target; });
  var netByDay = {}; tx.forEach(function (t) { if (t.off > AHEAD) return; (netByDay[t.off] = netByDay[t.off] || {}); netByDay[t.off][t.acct] = (netByDay[t.off][t.acct] || 0) + t.amount; });
  var bal = {}; accounts.forEach(function (a) { bal[a.id] = a.target; });
  daily[0] = Object.assign({}, bal);
  for (var b = 0; b > BACK; b--) { var nd = netByDay[b] || {}; accounts.forEach(function (a) { bal[a.id] = r2(bal[a.id] - (nd[a.id] || 0)); }); daily[b - 1] = Object.assign({}, bal); }
  var fwd = Object.assign({}, target);
  for (var f = 1; f <= AHEAD; f++) { var nf = netByDay[f] || {}; accounts.forEach(function (a) { fwd[a.id] = r2(fwd[a.id] + (nf[a.id] || 0)); }); daily[f] = Object.assign({}, fwd); }
  function totalAt(off) { var x = daily[off]; return x ? x.op + x.pay + x.tax + x.sav : null; }
  accounts.forEach(function (a) { a.balance = a.target; });
  var cashSeries = [];
  for (var c = BACK; c <= AHEAD; c++) cashSeries.push({ off: c, x: at(c), y: r2(totalAt(c)) });

  /* ------------------------------------------------------------ aggregates */
  var INCOME = ['Wholesale', 'Online sales', 'Subscriptions', 'Taproom'];
  var EXPENSE_GROUPS = [
    { key: 'Cost of goods', cats: ['Cost of goods'] }, { key: 'Payroll', cats: ['Payroll'] }, { key: 'Rent & utilities', cats: ['Rent & utilities'] },
    { key: 'Shipping', cats: ['Shipping'] }, { key: 'Marketing', cats: ['Marketing'] }, { key: 'Software & fees', cats: ['Software', 'Professional fees', 'Insurance', 'Equipment'] }
  ];
  function isOp(t) { return !t.xfer && t.cat !== 'Owner draw' && t.cat !== 'Taxes' && t.cat !== 'Interest'; }
  function range(fromOff, toOff, filter) { return tx.filter(function (t) { return t.off >= fromOff && t.off <= toOff && (!filter || filter(t)); }); }
  function sum(arr) { return arr.reduce(function (a, t) { return a + t.amount; }, 0); }
  function period(fromOff, toOff) {
    var arr = range(fromOff, toOff, isOp), inc = arr.filter(function (t) { return t.amount > 0 && t.cat !== 'Wholesale'; }), exp = arr.filter(function (t) { return t.amount < 0; });
    var byInc = {}, byExp = {}; INCOME.forEach(function (k) { byInc[k] = 0; });
    inc.forEach(function (t) { byInc[t.cat] = (byInc[t.cat] || 0) + t.amount; });
    invoiceList.forEach(function (v) { if (v.issue >= fromOff && v.issue <= toOff && (v.status === 'paid' || v.status === 'sent' || v.status === 'overdue')) byInc.Wholesale += v.amount; });
    EXPENSE_GROUPS.forEach(function (gp) { byExp[gp.key] = 0; });
    exp.forEach(function (t) { EXPENSE_GROUPS.forEach(function (gp) { if (gp.cats.indexOf(t.cat) > -1) byExp[gp.key] += -t.amount; }); });
    var revenue = 0; INCOME.forEach(function (k) { revenue += byInc[k]; });
    var expenses = 0; EXPENSE_GROUPS.forEach(function (gp) { expenses += byExp[gp.key]; });
    return { revenue: revenue, expenses: expenses, net: revenue - expenses, byInc: byInc, byExp: byExp };
  }
  // cash view: everything that really moved, minus internal transfers
  function flows(fromOff, toOff) {
    var arr = range(fromOff, toOff, function (t) { return !t.xfer; }), i = 0, o = 0;
    arr.forEach(function (t) { if (t.amount > 0) i += t.amount; else o -= t.amount; });
    return { moneyIn: i, moneyOut: o, net: i - o };
  }
  // calendar months (last 12 complete)
  var months = [];
  for (var mi = 12; mi >= 1; mi--) {
    var ms = new Date(Y, M - mi, 1), me = new Date(Y, M - mi + 1, 0);
    var so = Math.round((ms.getTime() - TODAY) / 864e5), eo = Math.round((me.getTime() - TODAY) / 864e5);
    var pr = period(Math.max(so, BACK), eo); var fm = flows(Math.max(so, BACK), eo); pr.moneyIn = fm.moneyIn; pr.moneyOut = fm.moneyOut; pr.cashNet = fm.net; pr.label = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][ms.getMonth()]; pr.year = ms.getFullYear(); pr.so = so; pr.eo = eo; months.push(pr);
  }
  // weeks (last 13 weeks, Mon–Sun ending on the last full week)
  var weeks = [];
  var lastSun = -((now.getDay() + 7) % 7); if (lastSun === 0) lastSun = -7; // last Sunday strictly before today
  for (var wi = 12; wi >= 0; wi--) {
    var eo2 = lastSun - wi * 7, so2 = eo2 - 6, pw = period(so2, eo2);
    var fl = flows(so2, eo2); pw.moneyIn = fl.moneyIn; pw.moneyOut = fl.moneyOut; pw.cashNet = fl.net; pw.so = so2; pw.eo = eo2; pw.label = new Date(at(so2)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); weeks.push(pw);
  }
  var cur30 = period(-29, 0), prev30 = period(-59, -30);

  /* ------------------------------------------------------------ KPIs */
  var openInv = invoiceList.filter(function (v) { return v.status === 'sent' || v.status === 'overdue'; });
  var overdueInv = invoiceList.filter(function (v) { return v.status === 'overdue'; });
  var paid60 = invoiceList.filter(function (v) { return v.status === 'paid' && v.pay > -60; });
  var avgDays = paid60.length ? paid60.reduce(function (a, v) { return a + (v.pay - v.issue); }, 0) / paid60.length : 0;
  var totalCash = accounts.reduce(function (a, x) { return a + x.balance; }, 0);
  var cash30 = totalAt(-30);

  /* ------------------------------------------------------------ forecast with scenarios */
  var SCENARIOS = {
    late:  { label: 'Largest open invoice pays 14 days late', desc: 'Delays the biggest unpaid invoice by two weeks.' },
    hire:  { label: 'Hire one full-time barista', desc: 'Adds $2,700 to each payroll run.' },
    equip: { label: 'Buy a second roaster ($18,000)', desc: 'One-time equipment purchase in 12 days.' }
  };
  function forecast(active) {
    active = active || [];
    var net = {}; for (var i = 1; i <= AHEAD; i++) net[i] = 0;
    tx.forEach(function (t) { if (t.off > 0 && t.off <= AHEAD && !t.xfer) net[t.off] += t.amount; });
    if (active.indexOf('late') > -1) {
      var big = openInv.slice().sort(function (a, b) { return b.amount - a.amount; })[0];
      if (big) { var po = Math.max(1, big.pay); if (big.pay > 0 && net[po] != null) { net[po] -= big.amount; } if (net[po + 14] != null && big.pay > 0) net[po + 14] += big.amount; }
    }
    if (active.indexOf('hire') > -1) tx.forEach(function (t) { if (t.off > 0 && t.cat === 'Payroll' && t.off <= AHEAD) net[t.off] -= 2700; });
    if (active.indexOf('equip') > -1) net[12] -= 18000;
    var out = [{ x: at(0), y: r2(totalCash), off: 0 }], run = totalCash, low = { y: totalCash, off: 0 };
    for (var j = 1; j <= AHEAD; j++) { run += net[j]; out.push({ x: at(j), y: r2(run), off: j }); if (run < low.y) low = { y: run, off: j, x: at(j) }; }
    return { series: out, low: low, end: out[out.length - 1].y };
  }
  var baseFc = forecast([]);

  /* ------------------------------------------------------------ upcoming (next 21 days) */
  var upcoming = tx.filter(function (t) { return t.off > 0 && t.off <= 21 && !t.xfer && Math.abs(t.amount) >= 400 && t.cat !== 'Online sales' && t.cat !== 'Taproom'; })
    .map(function (t) { return { t: t.t, off: t.off, desc: t.desc, cat: t.cat, amount: t.amount, kind: t.amount > 0 ? 'in' : 'out' }; });

  /* ------------------------------------------------------------ insights */
  var overdueTotal = overdueInv.reduce(function (a, v) { return a + v.amount; }, 0);
  var topCust = (function () {
    var m = {}, tot = 0;
    invoiceList.forEach(function (v) { if (v.issue >= -89 && v.issue <= 0 && v.status !== 'draft') { m[v.customer.name] = (m[v.customer.name] || 0) + v.amount; tot += v.amount; } });
    var arr = Object.keys(m).map(function (k) { return { name: k, value: m[k], share: m[k] / tot }; }).sort(function (a, b) { return b.value - a.value; });
    return { list: arr, total: tot };
  })();
  var nextPayroll = tx.filter(function (t) { return t.cat === 'Payroll' && t.off > 0; })[0];
  var insights = [
    { id: 'in1', tone: 'warn', icon: 'invoices', title: overdueInv.length + (overdueInv.length === 1 ? ' invoice is' : ' invoices are') + ' overdue — ' + NS_usd(overdueTotal),
      body: 'The oldest is ' + (overdueInv.slice().sort(function (a, b) { return b.daysLate - a.daysLate; })[0] || { daysLate: 0 }).daysLate + ' days late. Customers who get a reminder pay 6 days sooner on average.', action: 'Send reminders', go: '#/invoices?f=overdue' },
    { id: 'in2', tone: 'accent', icon: 'cashflow', title: 'You’re covered for payroll by ' + (nextPayroll ? (totalCash / -nextPayroll.amount).toFixed(1) : '—') + '×',
      body: 'Your next payroll of ' + NS_usd(nextPayroll ? -nextPayroll.amount : 0) + ' runs ' + (nextPayroll ? new Date(nextPayroll.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '') + '. Lowest projected balance over 90 days is ' + NS_usd(baseFc.low.y) + '.', action: 'Open forecast', go: '#/cash-flow' },
    { id: 'in3', tone: 'pos', icon: 'revenue', title: 'Wholesale is ' + (cur30.byInc.Wholesale >= prev30.byInc.Wholesale ? 'up ' : 'down ') + Math.abs(Math.round((cur30.byInc.Wholesale / Math.max(1, prev30.byInc.Wholesale) - 1) * 100)) + '% on the prior 30 days',
      body: topCust.list[0].name + ' is your largest account at ' + Math.round(topCust.list[0].share * 100) + '% of wholesale revenue — worth watching concentration.', action: 'See revenue', go: '#/revenue' },
    { id: 'in4', tone: 'neutral', icon: 'layers', title: 'Software spend is steady at ' + NS_usd(517) + '/mo',
      body: 'Three subscriptions, no duplicates found. We’ll flag any new recurring charge over $50.', action: 'View expenses', go: '#/expenses' }
  ];
  function NS_usd(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  /* ------------------------------------------------------------ notifications */
  function ago(minutes) { return Date.now() - minutes * 60000; }
  var lastPaid = invoiceList.filter(function (v) { return v.status === 'paid'; }).sort(function (a, b) { return b.pay - a.pay; });
  var notifications = [
    { id: 'n1', type: 'paid', t: ago(38), unread: true, title: 'Payment received — ' + (lastPaid[0] ? lastPaid[0].customer.name : ''), body: (lastPaid[0] ? lastPaid[0].id + ' · ' + NS_usd(lastPaid[0].amount) : '') + ' landed in Operating ··4417.', go: '#/invoices' },
    { id: 'n2', type: 'overdue', t: ago(150), unread: true, title: (overdueInv[0] ? overdueInv[0].customer.name : 'An invoice') + ' is ' + (overdueInv[0] ? overdueInv[0].daysLate : 0) + ' days overdue', body: 'Invoice ' + (overdueInv[0] ? overdueInv[0].id : '') + ' for ' + NS_usd(overdueInv[0] ? overdueInv[0].amount : 0) + '. A gentle reminder is ready to send.', go: '#/invoices?f=overdue' },
    { id: 'n3', type: 'forecast', t: ago(60 * 5), unread: true, title: 'Cash forecast: lowest point is in ' + Math.max(1, baseFc.low.off) + ' days', body: 'Projected low of ' + NS_usd(baseFc.low.y) + ' on ' + new Date(baseFc.low.x || at(baseFc.low.off)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' after payroll and a green-coffee order.', go: '#/cash-flow' },
    { id: 'n4', type: 'security', t: ago(60 * 22), unread: false, title: 'New sign-in from Chrome on Windows', body: 'Denver, CO · If this wasn’t you, secure your account.', go: '#/settings?s=security' },
    { id: 'n5', type: 'bill', t: ago(60 * 27), unread: false, title: 'Bill due soon: Alpine Industrial Properties', body: NS_usd(6400) + ' will be paid automatically from Operating.', go: '#/transactions' },
    { id: 'n6', type: 'insight', t: ago(60 * 30), unread: false, title: 'Weekly summary is ready', body: 'Revenue ' + NS_usd(period(-6, 0).revenue) + ' · Expenses ' + NS_usd(period(-6, 0).expenses) + ' over the last 7 days.', go: '#/reports' },
    { id: 'n7', type: 'sync', t: ago(60 * 52), unread: false, title: 'Operating ··4417 synced', body: '14 new transactions were categorized automatically.', go: '#/transactions' },
    { id: 'n8', type: 'paid', t: ago(60 * 76), unread: false, title: 'Payment received — ' + (lastPaid[1] ? lastPaid[1].customer.name : ''), body: (lastPaid[1] ? lastPaid[1].id + ' · ' + NS_usd(lastPaid[1].amount) : ''), go: '#/invoices' },
    { id: 'n9', type: 'large', t: ago(60 * 100), unread: false, title: 'Large payment sent', body: 'Verdant Origin Imports · ' + NS_usd(11400) + ' from Operating.', go: '#/transactions' },
    { id: 'n10', type: 'insight', t: ago(60 * 140), unread: false, title: 'Tax reserve is on track', body: 'You’ve set aside 96% of your estimated Q4 payment.', go: '#/cash-flow' },
    { id: 'n11', type: 'sync', t: ago(60 * 190), unread: false, title: 'Welcome to Northstar Growth', body: 'Forecasting, approvals and 3 seats are now unlocked.', go: '#/settings?s=billing' }
  ];

  NS.data = {
    TODAY: TODAY, at: at, business: business, accounts: accounts, customers: customers, custById: custById, invoices: invoiceList, sku: SKU,
    tx: tx, txActual: tx.filter(function (t) { return t.off <= 0 && t.off >= -365; }), cashSeries: cashSeries, totalAt: totalAt, daily: daily,
    months: months, weeks: weeks, cur30: cur30, prev30: prev30, period: period, flows: flows, range: range, isOp: isOp, INCOME: INCOME, EXPENSE_GROUPS: EXPENSE_GROUPS,
    openInv: openInv, overdueInv: overdueInv, avgDays: avgDays, totalCash: totalCash, cash30: cash30, forecast: forecast, baseFc: baseFc, SCENARIOS: SCENARIOS,
    upcoming: upcoming, insights: insights, notifications: notifications, topCust: topCust, AHEAD: AHEAD, BACK: BACK, sum: sum
  };
})();
