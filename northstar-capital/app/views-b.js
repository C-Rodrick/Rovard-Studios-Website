/* Northstar Capital — product views B: Invoices · Transactions · Reports · Notifications · Settings */
(function () {
  var App = window.App, D = NS.data, F = NS.fmt, C = NS.charts, $ = App.$, $$ = App.$$, esc = App.esc, head = App.head, card = App.card;

  /* ======================================================================= INVOICES */
  var invUi = { f: 'all', q: '', sort: 'new', page: 1 };
  var PER = 10;
  function invById(id) { return App.state.invoices.filter(function (v) { return v.id === id; })[0]; }
  function nextInvNo() { var n = App.state.invoices.reduce(function (m, v) { return Math.max(m, +v.id.replace(/\D/g, '')); }, 1000); return 'INV-' + (n + 1); }
  function sumAmt(a) { return a.reduce(function (s, v) { return s + v.amount; }, 0); }

  App.remind = function (id, silent) {
    var v = invById(id); if (!v) return; v.reminders = (v.reminders || 0) + 1; v.lastReminder = Date.now();
    if (!silent) { App.toast('Reminder sent to ' + v.customer.email, 'send'); if (App.current && App.current.id === 'invoices') draw(); else if (App.current && App.current.id === 'overview') App.render(); }
  };
  App.remindAll = function () {
    var o = App.state.invoices.filter(function (v) { return v.status === 'overdue'; });
    if (!o.length) { App.toast('No overdue invoices — nothing to send.', 'check'); return; }
    o.forEach(function (v) { App.remind(v.id, true); }); App.toast('Reminders sent for ' + o.length + ' overdue invoices (' + App.usd(sumAmt(o)) + ').', 'send');
    if (App.current && /invoices|overview/.test(App.current.id)) App.render();
  };
  function markPaid(id) {
    var v = invById(id); if (!v) return; v.status = 'paid'; v.pay = 0; v.payT = Date.now(); v.daysLate = 0; v.paidDays = Math.max(0, Math.round((D.TODAY - v.issueT) / 864e5));
    App.toast(v.id + ' marked as paid — ' + App.money(v.amount), 'check');
  }
  function sendDraft(id) { var v = invById(id); if (!v) return; v.status = 'sent'; v.issue = 0; v.issueT = D.TODAY; v.dueT = D.at(v.terms); v.due = v.terms; App.toast(v.id + ' sent to ' + v.customer.email, 'send'); }

  function invDoc(v) {
    var lines = v.lines, sub = lines.reduce(function (s, l) { return s + l.qty * l.price; }, 0), taxAmt = v.taxRate ? sub * v.taxRate / 100 : 0;
    var stamp = v.status === 'paid' ? '<span class="inv-stamp inv-stamp--paid">Paid</span>' : v.status === 'overdue' ? '<span class="inv-stamp inv-stamp--overdue">Overdue</span>' : '';
    return '<div class="inv-doc"><div class="inv-doc__top"><svg viewBox="0 0 195.6 36" role="img" aria-label="Northstar Capital"><use href="#ns-logo"/></svg><h4>Invoice<small>' + esc(v.id) + '</small>' + stamp + '</h4></div>' +
      '<div class="inv-doc__meta"><div><small>From</small><b>' + esc(D.business.legal) + '</b><span>2100 Blake Yard<br>Denver, CO 80205</span></div><div><small>Bill to</small><b>' + esc(v.customer.name) + '</b><span>' + esc(v.customer.email) + '<br>' + esc(v.customer.city) + '</span></div>' +
      '<div><small>Issued</small><b>' + App.dateLong(v.issueT) + '</b></div><div><small>Due</small><b>' + App.dateLong(v.dueT) + '</b><span>Net ' + v.terms + '</span></div></div>' +
      '<table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + lines.map(function (l) { return '<tr><td>' + esc(l.desc) + '</td><td>' + l.qty + '</td><td>' + App.money(l.price) + '</td><td>' + App.money(l.qty * l.price) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<div class="inv-doc__tot"><div><span>Subtotal</span><span>' + App.money(sub) + '</span></div>' + (v.taxRate ? '<div><span>Tax (' + v.taxRate + '%)</span><span>' + App.money(taxAmt) + '</span></div>' : '') + '<div class="due"><span>' + (v.status === 'paid' ? 'Paid' : 'Amount due') + '</span><span>' + App.money(sub + taxAmt) + '</span></div></div>' +
      '<div class="inv-doc__foot">Pay by ACH or card at <b>pay.northstar.example/' + esc(v.id.toLowerCase()) + '</b>. Thank you for your business.<br>Invoiced with Northstar Capital — a fictional brand by Rovard Studios.</div></div>';
  }

  App.openInvoice = function (id) {
    var v = invById(id); if (!v) return;
    var steps = [{ t: 'Invoice created', d: App.dateShort(v.issueT), done: true }];
    if (v.status !== 'draft') steps.push({ t: 'Sent to ' + v.customer.email, d: App.dateShort(v.issueT), done: true });
    if (v.status !== 'draft' && v.viewed) steps.push({ t: 'Opened by customer', d: App.dateShort(v.issueT + 86400000), done: true });
    for (var i = 0; i < (v.reminders || 0); i++) steps.push({ t: 'Reminder ' + (i + 1) + ' sent', d: v.lastReminder && i === v.reminders - 1 && v.lastReminder > Date.now() - 3e5 ? 'Just now' : '', done: true });
    steps.push(v.status === 'paid' ? { t: 'Payment received', d: App.dateShort(v.payT), done: true } : v.status === 'overdue' ? { t: 'Overdue by ' + v.daysLate + ' days', d: 'Due ' + App.dateShort(v.dueT), warn: true } : { t: v.status === 'draft' ? 'Ready to send' : 'Awaiting payment', d: v.status === 'draft' ? '' : 'Due ' + App.dateShort(v.dueT) });
    var body = '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px"><div><div style="margin-bottom:8px">' + App.statusBadge(v.status) + ' <span class="muted" style="font-size:.8125rem;margin-left:6px">' + App.dueText(v) + '</span></div><div class="hero-fig" style="font-size:2.5rem">' + App.hero(v.amount) + '</div></div></div>' +
      '<div class="ns-card card" style="padding:16px"><div class="steps">' + steps.map(function (s) { return '<div class="step ' + (s.done ? 'done' : '') + (s.warn ? ' warn' : '') + '"><i>' + (s.done ? NS.icon('check') : '') + '</i><b>' + esc(s.t) + '</b><small>' + esc(s.d) + '</small></div>'; }).join('') + '</div></div>' + invDoc(v);
    var foot = (v.status === 'overdue' || v.status === 'sent' ? '<button class="ns-btn ns-btn--outline" id="dRemind">' + NS.icon('send') + 'Send reminder</button>' : '') +
      (v.status === 'draft' ? '<button class="ns-btn ns-btn--outline" id="dSend">' + NS.icon('send') + 'Send invoice</button>' : '') +
      '<button class="ns-btn ns-btn--outline" id="dPrint">' + NS.icon('download') + 'Download PDF</button>' +
      (v.status === 'overdue' || v.status === 'sent' ? '<button class="ns-btn ns-btn--primary" id="dPaid">' + NS.icon('check') + 'Mark as paid</button>' : '');
    var o = App.drawer(v.id + ' · ' + v.customer.name, body, foot);
    function again() { o.close(); setTimeout(function () { App.openInvoice(id); if (App.current.id === 'invoices') draw(); else App.render(); }, 220); }
    var b;
    if ((b = $('#dRemind', o.el))) b.addEventListener('click', function () { App.remind(id, true); App.toast('Reminder sent to ' + v.customer.email, 'send'); again(); });
    if ((b = $('#dPaid', o.el))) b.addEventListener('click', function () { markPaid(id); o.close(); if (App.current.id === 'invoices') draw(); else App.render(); });
    if ((b = $('#dSend', o.el))) b.addEventListener('click', function () { sendDraft(id); o.close(); if (App.current.id === 'invoices') draw(); else App.render(); });
    if ((b = $('#dPrint', o.el))) b.addEventListener('click', function () { App.toast('PDF generated — opening print dialog.', 'download'); setTimeout(function () { window.print(); }, 400); });
  };

  function openBuilder() {
    var items = [{ desc: SKU(0).n, qty: 12, price: SKU(0).p }, { desc: SKU(2).n, qty: 10, price: SKU(2).p }];
    var st = { cust: D.customers[0].id, terms: 15, tax: 0, notes: '', lines: items };
    function SKU(i) { return D.sku[i]; }
    var no = nextInvNo();
    var body = '<div class="builder"><div class="builder__form">' +
      '<div class="ns-field"><label class="ns-label" for="bCust">Customer</label><select class="ns-select" id="bCust">' + D.customers.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-grid"><div class="ns-field"><label class="ns-label" for="bNo">Invoice number</label><input class="ns-input" id="bNo" value="' + no + '" readonly></div><div class="ns-field"><label class="ns-label" for="bTerms">Payment terms</label><select class="ns-select" id="bTerms"><option value="0">Due on receipt</option><option value="15" selected>Net 15</option><option value="30">Net 30</option></select></div></div>' +
      '<div class="ns-field"><span class="ns-label">Line items</span><div id="bLines" style="display:grid;gap:8px"></div><button class="ns-btn ns-btn--ghost ns-btn--sm" id="bAdd" style="justify-self:start">' + NS.icon('plus') + 'Add line</button></div>' +
      '<div class="form-grid"><div class="ns-field"><label class="ns-label" for="bTax">Tax rate (%)</label><input class="ns-input" id="bTax" type="number" min="0" max="15" step="0.1" value="0"></div><div class="ns-field"><label class="ns-label" for="bDate">Issue date</label><input class="ns-input" id="bDate" type="date" value="' + new Date(D.TODAY).toISOString().slice(0, 10) + '" disabled></div></div>' +
      '<div class="ns-field"><label class="ns-label" for="bNotes">Note to customer <span class="muted">(optional)</span></label><textarea class="ns-textarea" id="bNotes" placeholder="Thanks for your order — roast date is on every bag."></textarea></div>' +
      '<label class="ns-check"><input type="checkbox" id="bRemind" checked><span>Automatically remind if unpaid 3 days after due</span></label></div>' +
      '<div class="builder__prev" id="bPrev"></div></div>';
    var o = App.drawer('New invoice', body, '<button class="ns-btn ns-btn--ghost" data-close>Cancel</button><button class="ns-btn ns-btn--outline" id="bDraft">Save draft</button><button class="ns-btn ns-btn--primary" id="bSend">' + NS.icon('send') + 'Send invoice</button>', { size: 'lg' });
    o.el.querySelector('.drawer__b').style.padding = '0'; o.el.querySelector('.drawer__b').style.display = 'block';
    function lineRows() {
      $('#bLines', o.el).innerHTML = '<div class="li-head"><span>Item</span><span>Qty</span><span>Rate</span><span></span></div>' + st.lines.map(function (l, i) {
        return '<div class="li-row"><input class="ns-input ns-input--sm" data-f="desc" data-i="' + i + '" value="' + esc(l.desc) + '" aria-label="Description"><input class="ns-input ns-input--sm" data-f="qty" data-i="' + i + '" type="number" min="1" value="' + l.qty + '" aria-label="Quantity"><input class="ns-input ns-input--sm" data-f="price" data-i="' + i + '" type="number" min="0" step="0.01" value="' + l.price + '" aria-label="Rate"><button class="ns-btn ns-btn--ghost ns-btn--icon ns-btn--sm" data-del="' + i + '" aria-label="Remove line">' + NS.icon('x') + '</button></div>'; }).join('');
    }
    function preview() {
      var c = D.custById[st.cust], v = { id: no, customer: c, issueT: D.TODAY, dueT: D.TODAY + st.terms * 864e5, terms: st.terms, lines: st.lines, taxRate: +st.tax || 0, status: 'draft' };
      $('#bPrev', o.el).innerHTML = invDoc(v);
    }
    function total() { var s = st.lines.reduce(function (a, l) { return a + (+l.qty || 0) * (+l.price || 0); }, 0); return s * (1 + (+st.tax || 0) / 100); }
    lineRows(); preview();
    o.el.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'bCust') st.cust = t.value; else if (t.id === 'bTerms') st.terms = +t.value; else if (t.id === 'bTax') st.tax = t.value; else if (t.id === 'bNotes') st.notes = t.value;
      else if (t.dataset.f) { var l = st.lines[+t.dataset.i]; l[t.dataset.f] = t.dataset.f === 'desc' ? t.value : +t.value; }
      preview();
    });
    o.el.addEventListener('click', function (e) {
      var d = e.target.closest('[data-del]'); if (d) { st.lines.splice(+d.dataset.del, 1); if (!st.lines.length) st.lines.push({ desc: '', qty: 1, price: 0 }); lineRows(); preview(); }
    });
    $('#bAdd', o.el).addEventListener('click', function () { st.lines.push({ desc: '', qty: 1, price: 0 }); lineRows(); preview(); var inp = $$('.li-row', o.el).pop(); if (inp) inp.querySelector('input').focus(); });
    function create(status) {
      var c = D.custById[st.cust], lines = st.lines.filter(function (l) { return l.desc && l.qty > 0; });
      if (!lines.length) { App.toast('Add at least one line item.', 'alert'); return; }
      var amt = lines.reduce(function (a, l) { return a + l.qty * l.price; }, 0) * (1 + (+st.tax || 0) / 100);
      var v = { id: no, cust: c.id, customer: c, issue: 0, due: st.terms, pay: 9999, amount: Math.round(amt * 100) / 100, lines: lines, terms: st.terms, taxRate: +st.tax || 0, viewed: false, issueT: D.TODAY, dueT: D.TODAY + st.terms * 864e5, payT: 0, status: status, daysLate: 0, reminders: 0, paidDays: null };
      App.state.invoices.unshift(v); o.close();
      App.toast(status === 'draft' ? no + ' saved as draft.' : no + ' sent to ' + c.email + ' — ' + App.money(v.amount), status === 'draft' ? 'check' : 'send');
      if (location.hash.indexOf('#/invoices') !== 0) { App.go('#/invoices'); } else { invUi.f = 'all'; invUi.page = 1; invUi.sort = 'new'; draw(); }
    }
    $('#bDraft', o.el).addEventListener('click', function () { create('draft'); });
    $('#bSend', o.el).addEventListener('click', function () { create('sent'); });
  }

  var invRoot;
  function draw() {
    if (!invRoot) return;
    var all = App.state.invoices, root = invRoot;
    var counts = { all: all.length, draft: 0, sent: 0, overdue: 0, paid: 0 }; all.forEach(function (v) { counts[v.status]++; });
    var list = all.filter(function (v) { return invUi.f === 'all' || v.status === invUi.f; });
    if (invUi.q) { var q = invUi.q.toLowerCase(); list = list.filter(function (v) { return (v.customer.name + ' ' + v.id).toLowerCase().indexOf(q) > -1; }); }
    var sorters = { new: function (a, b) { return b.issueT - a.issueT || (a.id < b.id ? 1 : -1); }, old: function (a, b) { return a.issueT - b.issueT; }, amt: function (a, b) { return b.amount - a.amount; }, due: function (a, b) { return a.dueT - b.dueT; } };
    list.sort(sorters[invUi.sort]);
    var pages = Math.max(1, Math.ceil(list.length / PER)); invUi.page = Math.min(invUi.page, pages);
    var slice = list.slice((invUi.page - 1) * PER, invUi.page * PER);
    var open = all.filter(function (v) { return v.status === 'sent' || v.status === 'overdue'; }), over = all.filter(function (v) { return v.status === 'overdue'; });
    var paid30 = all.filter(function (v) { return v.status === 'paid' && v.pay > -30; });
    $('#invKpis', root).innerHTML =
      tile('Outstanding', App.usd(sumAmt(open)), open.length + ' open invoices') + tile('Overdue', App.usd(sumAmt(over)), over.length + (over.length === 1 ? ' invoice' : ' invoices') + ' past due', over.length ? 'neg' : '') +
      tile('Paid, last 30 days', App.usd(sumAmt(paid30)), paid30.length + ' payments', 'pos') + tile('Avg. days to get paid', D.avgDays.toFixed(1), 'Down from 28.6 last quarter');
    var tabs = [['all', 'All'], ['draft', 'Draft'], ['sent', 'Sent'], ['overdue', 'Overdue'], ['paid', 'Paid']];
    $('#invTabs', root).innerHTML = tabs.map(function (t) { return '<button role="tab" data-f="' + t[0] + '" aria-selected="' + (invUi.f === t[0]) + '">' + t[1] + ' <span class="ns-count">' + counts[t[0]] + '</span></button>'; }).join('');
    $('#invRows', root).innerHTML = '<div class="rows__h" style="--cols:var(--icols)"><span style="order:1">Customer</span><span style="order:2" class="hide-sm">Issued</span><span style="order:3" class="hide-sm">Due</span><span style="order:4" class="r">Amount</span><span style="order:5" class="hide-sm">Status</span><span style="order:6"></span></div>' +
      (slice.length ? slice.map(function (v) {
        var act = v.status === 'overdue' ? '<button class="ns-btn ns-btn--outline ns-btn--sm" data-remind="' + v.id + '">' + NS.icon('send') + 'Remind</button>' : v.status === 'draft' ? '<button class="ns-btn ns-btn--outline ns-btn--sm" data-sendd="' + v.id + '">Send</button>' : '';
        return '<div class="rows__r is-click keep3" style="--cols:var(--icols)" tabindex="0" data-inv="' + v.id + '"><div class="cell-main" style="order:1">' + App.avatar(v.customer.name) + '<div><b>' + esc(v.customer.name) + '</b><small>' + v.id + '</small></div></div><div class="r num" style="order:4">' + App.money(v.amount) + '</div>' +
          '<div style="order:3;' + (v.status === 'overdue' ? 'color:var(--neg);font-weight:500' : '') + '">' + App.dueText(v) + '</div><div style="order:5">' + App.statusBadge(v.status) + '</div><div class="hide-sm muted" style="order:2">' + App.dateShort(v.issueT) + '</div><div class="r hide-sm" style="order:6">' + act + '</div></div>'; }).join('')
        : '<div class="rows__empty"><b>No invoices match</b>Try a different filter or search term.</div>');
    $('#invFoot', root).innerHTML = '<span>' + (list.length ? ((invUi.page - 1) * PER + 1) + '–' + Math.min(list.length, invUi.page * PER) + ' of ' + list.length : '0 results') + '</span><div class="pager"><button class="ns-btn ns-btn--outline ns-btn--sm ns-btn--icon" data-p="-1" ' + (invUi.page <= 1 ? 'disabled' : '') + ' aria-label="Previous page">' + NS.icon('chevron-left') + '</button><span class="ns-num">' + invUi.page + ' / ' + pages + '</span><button class="ns-btn ns-btn--outline ns-btn--sm ns-btn--icon" data-p="1" ' + (invUi.page >= pages ? 'disabled' : '') + ' aria-label="Next page">' + NS.icon('chevron-right') + '</button></div>';
    App.bindRows(root);
    $$('[data-sendd]', root).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); sendDraft(b.dataset.sendd); draw(); }); });
  }
  function tile(label, val, sub, tone) { return '<div class="ns-card kpi kpi-cell s-3" style="min-height:112px"><div><span class="kpi__label">' + label + '</span><div class="kpi__val ' + (tone || '') + '" style="color:' + (tone === 'neg' ? 'var(--neg)' : 'inherit') + '">' + val + '</div></div><span class="card__s" style="margin:0">' + sub + '</span></div>'; }

  var invoicesView = function (root, q) {
    invRoot = root; if (q && q.f) { invUi.f = q.f; invUi.page = 1; }
    root.innerHTML = head('Invoices', 'Get paid faster — create, send and track every invoice.', '<button class="ns-btn ns-btn--outline" id="remAll">' + NS.icon('send') + 'Remind overdue</button><button class="ns-btn ns-btn--primary" id="newInv">' + NS.icon('plus') + 'New invoice</button>') +
      '<div class="grid" id="invKpis" style="margin-bottom:16px"></div>' +
      '<section class="ns-card card card--p0" style="overflow:hidden"><div style="padding:16px 20px 0"><div class="ns-tabs" id="invTabs" role="tablist"></div></div>' +
      '<div class="toolbar" style="padding:14px 20px 0"><div class="ns-input-wrap">' + NS.icon('search') + '<input class="ns-input ns-input--sm" id="invQ" placeholder="Search customer or invoice #" aria-label="Search invoices" value="' + esc(invUi.q) + '"></div><span class="sp"></span><label class="muted hide-sm" style="font-size:.8125rem" for="invSort">Sort</label><select class="ns-select ns-select--sm" id="invSort" style="width:auto"><option value="new">Newest</option><option value="old">Oldest</option><option value="amt">Amount: high to low</option><option value="due">Due soonest</option></select></div>' +
      '<div class="rows" id="invRows" style="--icols:minmax(0,1.5fr) 90px 150px 120px 100px 100px"></div><div class="rows__foot" id="invFoot"></div></section>';
    $('#invSort', root).value = invUi.sort;
    $('#newInv', root).addEventListener('click', openBuilder); $('#remAll', root).addEventListener('click', App.remindAll);
    $('#invTabs', root).addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { invUi.f = b.dataset.f; invUi.page = 1; draw(); } });
    $('#invQ', root).addEventListener('input', function (e) { invUi.q = e.target.value; invUi.page = 1; draw(); $('#invQ', root).focus(); });
    $('#invSort', root).addEventListener('change', function (e) { invUi.sort = e.target.value; draw(); });
    $('#invFoot', root).addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (b) { invUi.page += +b.dataset.p; draw(); } });
    draw();
    return function () { invRoot = null; };
  };
  invoicesView.openBuilder = openBuilder;
  App.views.invoices = invoicesView;

  /* ======================================================================= TRANSACTIONS */
  var txUi = { type: 'all', q: '', acct: 'all', cat: 'all', days: 90, page: 1 };
  var TX_PER = 20;
  function txFiltered() {
    var from = -(txUi.days - 1), q = txUi.q.toLowerCase();
    return App.state.tx.filter(function (t) {
      if (t.off < from) return false;
      if (txUi.type === 'in' && !(t.amount > 0 && !t.xfer)) return false;
      if (txUi.type === 'out' && !(t.amount < 0 && !t.xfer)) return false;
      if (txUi.type === 'transfer' && !t.xfer) return false;
      if (txUi.acct !== 'all' && t.acct !== txUi.acct) return false;
      if (txUi.cat !== 'all' && t.cat !== txUi.cat) return false;
      if (q && (t.desc + ' ' + t.cat).toLowerCase().indexOf(q) < 0) return false; return true;
    }).sort(function (a, b) { return b.t - a.t || (a.id < b.id ? 1 : -1); });
  }
  App.exportTx = function () {
    var rows = txFiltered(); App.csv('northstar-transactions.csv', [['Date', 'Description', 'Category', 'Account', 'Amount', 'Status']].concat(rows.map(function (t) { return [F.date(t.t, 'mdy'), t.desc, t.cat, App.acctName(t.acct), t.amount.toFixed(2), t.status]; })));
    App.toast('Exported ' + rows.length + ' transactions (CSV).', 'download');
  };
  App.openTx = function (id) {
    var t = App.state.tx.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    var cats = ['Wholesale', 'Online sales', 'Subscriptions', 'Taproom', 'Cost of goods', 'Payroll', 'Rent & utilities', 'Shipping', 'Marketing', 'Software', 'Insurance', 'Equipment', 'Professional fees', 'Taxes', 'Owner draw', 'Interest', 'Transfer'];
    var body = '<div><div class="muted" style="font-size:.8125rem;margin-bottom:8px">' + F.date(t.t, 'wd') + ' · ' + (t.status === 'pending' ? 'Pending' : 'Posted') + '</div><div class="hero-fig" style="font-size:2.75rem;' + (t.amount > 0 ? 'color:var(--pos)' : '') + '">' + (t.amount > 0 ? '+' : '') + App.hero(t.amount) + '</div><p style="margin-top:12px;font-size:1rem;font-weight:500;letter-spacing:-.015em">' + esc(t.desc) + '</p></div>' +
      '<div class="ns-card card" style="display:grid;gap:14px;padding:16px"><div class="set-row" style="padding:0;border:0"><span class="muted">Account</span><b>' + esc(App.acctName(t.acct)) + '</b></div><div class="set-row" style="padding:12px 0 0"><span class="muted">Type</span><b>' + (t.xfer ? 'Internal transfer' : t.amount > 0 ? 'Money in' : 'Money out') + '</b></div>' + (t.inv ? '<div class="set-row" style="padding:12px 0 0"><span class="muted">Matched invoice</span><a class="link" href="#/invoices" data-close>' + esc(t.inv) + NS.icon('arrow-up-right') + '</a></div>' : '') + '</div>' +
      '<div class="ns-field"><label class="ns-label" for="txCat">Category</label><select class="ns-select" id="txCat">' + cats.map(function (c) { return '<option' + (c === t.cat ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select><span class="ns-hint">Northstar categorized this automatically. Changes apply to similar future transactions.</span></div>' +
      '<div class="ns-field"><label class="ns-label" for="txNote">Note</label><textarea class="ns-textarea" id="txNote" placeholder="Add a note for your bookkeeper">' + esc(t.note || '') + '</textarea></div>';
    var o = App.drawer('Transaction', body, '<button class="ns-btn ns-btn--ghost" data-close>Close</button><button class="ns-btn ns-btn--primary" id="txSave">Save changes</button>');
    $('#txSave', o.el).addEventListener('click', function () { t.cat = $('#txCat', o.el).value; t.note = $('#txNote', o.el).value; o.close(); App.toast('Transaction updated.', 'check'); if (App.current.id === 'transactions') drawTx(); });
  };
  var txRoot;
  function drawTx() {
    if (!txRoot) return; var root = txRoot, list = txFiltered(), pages = Math.max(1, Math.ceil(list.length / TX_PER)); txUi.page = Math.min(txUi.page, pages);
    var slice = list.slice((txUi.page - 1) * TX_PER, txUi.page * TX_PER), op = list.filter(function (t) { return !t.xfer; });
    var inn = op.filter(function (t) { return t.amount > 0; }).reduce(function (s, t) { return s + t.amount; }, 0), out = -op.filter(function (t) { return t.amount < 0; }).reduce(function (s, t) { return s + t.amount; }, 0);
    $('#txSum', root).innerHTML = '<div><small>Transactions</small><b>' + F.num(list.length) + '</b><span>last ' + txUi.days + ' days</span></div><div><small>Money in</small><b class="pos">+' + App.usd(inn) + '</b><span>excluding transfers</span></div><div><small>Money out</small><b>' + '−' + App.usd(out) + '</b><span>net ' + (inn - out >= 0 ? '+' : '−') + App.usd(Math.abs(inn - out)) + '</span></div>';
    $('#txRows', root).innerHTML = '<div class="rows__h" style="--cols:var(--tcols)"><span>Description</span><span class="r">Amount</span><span class="hide-sm">Category</span><span class="hide-sm">Date</span><span class="hide-sm">Account</span></div>' +
      (slice.length ? slice.map(function (t) {
        var inc = t.amount > 0;
        return '<div class="rows__r is-click keep3" style="--cols:var(--tcols)" tabindex="0" data-tx="' + t.id + '"><div class="cell-main">' + (t.xfer ? '<span class="ns-avatar ns-avatar--sq" style="--s:34px">' + NS.icon('repeat', 'i--sm') + '</span>' : App.avatar(t.desc)) + '<div><b>' + esc(t.desc) + '</b><small>' + (t.status === 'pending' ? 'Pending · ' : '') + esc(t.cat) + '</small></div></div><div class="r num ' + (inc && !t.xfer ? 'ns-amt-pos' : '') + '">' + (inc ? '+' : '') + App.money(t.amount) + '</div><div class="hide-sm"><span class="ns-badge ns-badge--plain">' + esc(t.cat) + '</span></div><div class="muted hide-sm">' + App.dateShort(t.t) + '</div><div class="muted hide-sm">' + esc(App.acctName(t.acct)) + '</div></div>'; }).join('')
        : '<div class="rows__empty"><b>No transactions found</b>Adjust your filters or search.</div>');
    $('#txFoot', root).innerHTML = '<span>' + (list.length ? ((txUi.page - 1) * TX_PER + 1) + '–' + Math.min(list.length, txUi.page * TX_PER) + ' of ' + list.length : '0 results') + '</span><div class="pager"><button class="ns-btn ns-btn--outline ns-btn--sm ns-btn--icon" data-p="-1" ' + (txUi.page <= 1 ? 'disabled' : '') + ' aria-label="Previous page">' + NS.icon('chevron-left') + '</button><span class="ns-num">' + txUi.page + ' / ' + pages + '</span><button class="ns-btn ns-btn--outline ns-btn--sm ns-btn--icon" data-p="1" ' + (txUi.page >= pages ? 'disabled' : '') + ' aria-label="Next page">' + NS.icon('chevron-right') + '</button></div>';
    App.bindRows(root);
  }
  App.views.transactions = function (root) {
    txRoot = root;
    var cats = ['all'].concat(Array.from(new Set(App.state.tx.map(function (t) { return t.cat; }))).sort());
    root.innerHTML = head('Transactions', 'Every dollar in and out, categorized automatically.', '<button class="ns-btn ns-btn--outline" id="txExp">' + NS.icon('download') + 'Export CSV</button>') +
      '<section class="ns-card card card--p0" style="overflow:hidden"><div class="toolbar" style="padding:16px 20px 0"><div class="ns-input-wrap">' + NS.icon('search') + '<input class="ns-input ns-input--sm" id="txQ" placeholder="Search transactions" aria-label="Search transactions" value="' + esc(txUi.q) + '"></div>' +
      '<div class="ns-seg" id="txType" role="group" aria-label="Type">' + [['all', 'All'], ['in', 'Money in'], ['out', 'Money out'], ['transfer', 'Transfers']].map(function (x) { return '<button data-k="' + x[0] + '" aria-pressed="' + (txUi.type === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div><span class="sp"></span>' +
      '<select class="ns-select ns-select--sm hide-sm" id="txAcct" style="width:auto" aria-label="Account"><option value="all">All accounts</option>' + D.accounts.map(function (a) { return '<option value="' + a.id + '">' + a.name + ' ··' + a.mask + '</option>'; }).join('') + '</select>' +
      '<select class="ns-select ns-select--sm hide-sm" id="txCatSel" style="width:auto" aria-label="Category">' + cats.map(function (c) { return '<option value="' + c + '">' + (c === 'all' ? 'All categories' : c) + '</option>'; }).join('') + '</select>' +
      '<select class="ns-select ns-select--sm" id="txDays" style="width:auto" aria-label="Date range"><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option></select></div>' +
      '<div class="summary-strip" id="txSum" style="margin:14px 0 0"></div><div class="rows" id="txRows" style="--tcols:minmax(0,1.6fr) 130px 150px 90px 150px"></div><div class="rows__foot" id="txFoot"></div></section>';
    $('#txAcct', root).value = txUi.acct; $('#txCatSel', root).value = txUi.cat; $('#txDays', root).value = txUi.days;
    $('#txQ', root).addEventListener('input', function (e) { txUi.q = e.target.value; txUi.page = 1; drawTx(); });
    $('#txType', root).addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (!b) return; txUi.type = b.dataset.k; txUi.page = 1; $$('#txType button', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); drawTx(); });
    $('#txAcct', root).addEventListener('change', function (e) { txUi.acct = e.target.value; txUi.page = 1; drawTx(); });
    $('#txCatSel', root).addEventListener('change', function (e) { txUi.cat = e.target.value; txUi.page = 1; drawTx(); });
    $('#txDays', root).addEventListener('change', function (e) { txUi.days = +e.target.value; txUi.page = 1; drawTx(); });
    $('#txFoot', root).addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (b) { txUi.page += +b.dataset.p; drawTx(); } });
    $('#txExp', root).addEventListener('click', App.exportTx);
    drawTx(); return function () { txRoot = null; };
  };

  /* ======================================================================= REPORTS */
  var REPORTS = [
    { id: 'pl', name: 'Profit & loss', desc: 'Income and expenses by month', icon: 'reports' },
    { id: 'cf', name: 'Cash flow summary', desc: 'Money in, money out and ending balance', icon: 'cashflow' },
    { id: 'ar', name: 'Receivables aging', desc: 'Who owes you, and for how long', icon: 'invoices' },
    { id: 'vendor', name: 'Spend by vendor', desc: 'Where the last 90 days went', icon: 'building' },
    { id: 'cust', name: 'Revenue by customer', desc: 'Wholesale accounts, last 90 days', icon: 'users' }
  ];
  function buildReport(id, months) {
    var ms = D.months.slice(-months), U = App.usd, M = function (n) { return U(n, { cents: false }); };
    function pad(a, n) { return a; }
    if (id === 'pl') {
      var head = ['Category'].concat(ms.map(function (m) { return m.label + " '" + String(m.year).slice(2); }), ['Total']);
      var rows = [{ c: 'sec', cells: ['Income'].concat(ms.map(function () { return ''; }), ['']) }];
      D.INCOME.forEach(function (k) { rows.push({ c: 'sub', cells: [k].concat(ms.map(function (m) { return M(m.byInc[k]); }), [M(ms.reduce(function (s, m) { return s + m.byInc[k]; }, 0))]) }); });
      rows.push({ c: 'tot', cells: ['Total income'].concat(ms.map(function (m) { return M(m.revenue); }), [M(ms.reduce(function (s, m) { return s + m.revenue; }, 0))]) });
      rows.push({ c: 'sec', cells: ['Expenses'].concat(ms.map(function () { return ''; }), ['']) });
      D.EXPENSE_GROUPS.forEach(function (g) { rows.push({ c: 'sub', cells: [g.key].concat(ms.map(function (m) { return M(m.byExp[g.key]); }), [M(ms.reduce(function (s, m) { return s + m.byExp[g.key]; }, 0))]) }); });
      rows.push({ c: 'tot', cells: ['Total expenses'].concat(ms.map(function (m) { return M(m.expenses); }), [M(ms.reduce(function (s, m) { return s + m.expenses; }, 0))]) });
      rows.push({ c: 'grand', cells: ['Net profit'].concat(ms.map(function (m) { return M(m.net); }), [M(ms.reduce(function (s, m) { return s + m.net; }, 0))]) });
      return { title: 'Profit & loss', sub: 'Accrual basis · ' + ms[0].label + ' ' + ms[0].year + ' – ' + ms[ms.length - 1].label + ' ' + ms[ms.length - 1].year, head: head, rows: rows };
    }
    if (id === 'cf') {
      var h2 = ['Cash flow'].concat(ms.map(function (m) { return m.label + " '" + String(m.year).slice(2); }), ['Total']);
      var r2 = [{ c: 'sub', cells: ['Money in'].concat(ms.map(function (m) { return M(m.moneyIn); }), [M(ms.reduce(function (s, m) { return s + m.moneyIn; }, 0))]) }, { c: 'sub', cells: ['Money out'].concat(ms.map(function (m) { return '−' + M(m.moneyOut); }), ['−' + M(ms.reduce(function (s, m) { return s + m.moneyOut; }, 0))]) },
        { c: 'tot', cells: ['Net cash flow'].concat(ms.map(function (m) { return M(m.cashNet); }), [M(ms.reduce(function (s, m) { return s + m.cashNet; }, 0))]) },
        { c: 'grand', cells: ['Ending balance'].concat(ms.map(function (m) { return M(D.totalAt(m.eo)); }), [M(D.totalCash)]) }];
      return { title: 'Cash flow summary', sub: 'Cash basis · internal transfers excluded', head: h2, rows: r2 };
    }
    if (id === 'ar') {
      var buckets = ['Current', '1–30', '31–60', '61–90', '90+'], by = {};
      App.state.invoices.filter(function (v) { return v.status === 'sent' || v.status === 'overdue'; }).forEach(function (v) {
        var b = v.status === 'sent' ? 0 : v.daysLate <= 30 ? 1 : v.daysLate <= 60 ? 2 : v.daysLate <= 90 ? 3 : 4, c = by[v.customer.name] = by[v.customer.name] || [0, 0, 0, 0, 0]; c[b] += v.amount;
      });
      var names = Object.keys(by).sort(function (a, b) { return by[b].reduce(function (s, x) { return s + x; }, 0) - by[a].reduce(function (s, x) { return s + x; }, 0); }), tot = [0, 0, 0, 0, 0];
      var r3 = names.map(function (n) { by[n].forEach(function (x, i) { tot[i] += x; }); return { c: 'sub', cells: [n].concat(by[n].map(function (x) { return x ? M(x) : '—'; }), [M(by[n].reduce(function (s, x) { return s + x; }, 0))]) }; });
      r3.push({ c: 'grand', cells: ['Total outstanding'].concat(tot.map(function (x) { return M(x); }), [M(tot.reduce(function (s, x) { return s + x; }, 0))]) });
      return { title: 'Receivables aging', sub: 'As of ' + F.date(D.TODAY, 'mdy') + ' · days past due', head: ['Customer'].concat(buckets, ['Total']), rows: r3 };
    }
    if (id === 'vendor') {
      var vv = {}, totalSpend = 0; D.range(-89, 0, function (t) { return t.amount < 0 && t.vendor && !t.xfer && t.cat !== 'Owner draw'; }).forEach(function (t) { var x = vv[t.vendor] = vv[t.vendor] || { n: 0, t: 0, cat: t.cat }; x.n++; x.t += -t.amount; totalSpend += -t.amount; });
      var rows4 = Object.keys(vv).sort(function (a, b) { return vv[b].t - vv[a].t; }).map(function (k) { return { c: 'sub', cells: [k, vv[k].cat, String(vv[k].n), M(vv[k].t), (vv[k].t / totalSpend * 100).toFixed(1) + '%'] }; });
      rows4.push({ c: 'grand', cells: ['Total', '', '', M(totalSpend), '100%'] });
      return { title: 'Spend by vendor', sub: 'Last 90 days · excludes transfers and owner distributions', head: ['Vendor', 'Category', 'Payments', 'Spend', 'Share'], rows: rows4 };
    }
    var tc = D.topCust.list, r5 = tc.map(function (c) { return { c: 'sub', cells: [c.name, M(c.value), (c.share * 100).toFixed(1) + '%'] }; }); r5.push({ c: 'grand', cells: ['Total wholesale', M(D.topCust.total), '100%'] });
    return { title: 'Revenue by customer', sub: 'Wholesale invoices issued in the last 90 days', head: ['Customer', 'Invoiced', 'Share'], rows: r5 };
  }
  App.views.reports = function (root, q) {
    var sel = (q && q.r) || 'pl', months = 6;
    root.innerHTML = head('Reports', 'Clean, accountant-ready statements — always up to date.', '<button class="ns-btn ns-btn--outline" id="repSched">' + NS.icon('calendar') + 'Schedule</button>') +
      '<div class="reports"><div><section class="ns-card card--p0"><div class="rep-list" role="tablist" aria-label="Reports">' + REPORTS.map(function (r) { return '<button class="rep-item" role="tab" data-r="' + r.id + '" aria-selected="' + (r.id === sel) + '"><span class="ic">' + NS.icon(r.icon) + '</span><span><b>' + r.name + '</b><small>' + r.desc + '</small></span></button>'; }).join('') + '</div></section>' +
      '<section class="ns-card card" style="margin-top:16px"><div class="card__h" style="margin-bottom:8px"><h2 class="card__t">Scheduled</h2></div>' +
      [['Monthly P&L', 'Emailed on the 1st to you and your bookkeeper', true], ['Weekly cash summary', 'Mondays at 8:00 AM', true], ['Receivables aging', 'Not scheduled', false]].map(function (s) { return '<div class="set-row"><div><b>' + s[0] + '</b><small>' + s[1] + '</small></div><label class="ns-switch"><input type="checkbox" ' + (s[2] ? 'checked' : '') + ' aria-label="' + s[0] + '"><span></span></label></div>'; }).join('') + '</section></div>' +
      '<section class="ns-card doc" id="repDoc"></section></div>';
    function draw() {
      var rp = buildReport(sel, months), isMonthly = sel === 'pl' || sel === 'cf';
      $('#repDoc', root).innerHTML = '<div class="doc__h"><div><div class="ns-eyebrow" style="margin-bottom:10px">' + esc(D.business.name) + '</div><h2>' + rp.title + '</h2><p>' + esc(rp.sub) + '</p></div><div class="page__actions">' + (isMonthly ? '<select class="ns-select ns-select--sm" id="repPeriod" style="width:auto" aria-label="Period"><option value="3">Last 3 months</option><option value="6" selected>Last 6 months</option><option value="12">Last 12 months</option></select>' : '') + '<button class="ns-btn ns-btn--outline ns-btn--sm" id="repCsv">' + NS.icon('download') + 'CSV</button><button class="ns-btn ns-btn--outline ns-btn--sm" id="repPrint">' + NS.icon('copy') + 'Print / PDF</button></div></div>' +
        '<div class="table-scroll"><table class="rtable"><thead><tr>' + rp.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rp.rows.map(function (r) { return '<tr class="' + r.c + '">' + r.cells.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="card__s" style="margin-top:20px">Generated ' + F.date(D.TODAY, 'mdy') + ' by Northstar Capital. Fictional data for a concept prototype.</p>';
      var pe = $('#repPeriod', root); if (pe) { pe.value = String(months); pe.addEventListener('change', function () { months = +pe.value; draw(); }); }
      $('#repCsv', root).addEventListener('click', function () { App.csv('northstar-' + sel + '.csv', [rp.head].concat(rp.rows.map(function (r) { return r.cells; }))); App.toast(rp.title + ' exported (CSV).', 'download'); });
      $('#repPrint', root).addEventListener('click', function () { window.print(); });
    }
    $$('.rep-item', root).forEach(function (b) { b.addEventListener('click', function () { sel = b.dataset.r; $$('.rep-item', root).forEach(function (x) { x.setAttribute('aria-selected', x === b); }); draw(); }); });
    $('#repSched', root).addEventListener('click', function () { App.toast('Scheduled delivery is part of the Growth plan — already on.', 'calendar'); });
    $$('.ns-switch input', root).forEach(function (s) { s.addEventListener('change', function () { App.toast(s.checked ? 'Scheduled report turned on.' : 'Scheduled report paused.', 'check'); }); });
    draw();
  };

  /* ======================================================================= NOTIFICATIONS */
  var NT = { paid: ['check', 'pos'], overdue: ['alert', 'neg'], forecast: ['cashflow', 'accent'], security: ['shield', 'warn'], bill: ['receipt', ''], insight: ['sparkline', 'accent'], sync: ['refresh', ''], large: ['arrow-up-right', ''] };
  App.views.notifications = function (root) {
    var f = 'all';
    root.innerHTML = head('Notifications', 'What happened, and what needs you.', '<button class="ns-btn ns-btn--outline" id="markAll">' + NS.icon('check') + 'Mark all as read</button>') +
      '<div class="grid"><section class="ns-card card--p0 s-8" style="overflow:hidden"><div style="padding:16px 20px 0"><div class="ns-tabs" id="nTabs" role="tablist"></div></div><div id="nList" style="margin-top:12px"></div></section>' +
      '<section class="ns-card card s-4"><div class="card__h"><div><h2 class="card__t">Delivery</h2><p class="card__s">Choose how Northstar reaches you.</p></div></div>' +
      [['Email digest', 'Daily at 8:00 AM', true], ['Push notifications', 'Instant, on your phone', true], ['Quiet hours', '9:00 PM – 7:00 AM', true]].map(function (s) { return '<div class="set-row"><div><b>' + s[0] + '</b><small>' + s[1] + '</small></div><label class="ns-switch"><input type="checkbox" ' + (s[2] ? 'checked' : '') + ' aria-label="' + s[0] + '"><span></span></label></div>'; }).join('') +
      '<a class="ns-btn ns-btn--outline ns-btn--block" href="#/settings?s=notifications" style="margin-top:16px">Notification settings</a></section></div>';
    function draw() {
      var all = App.state.notifs, un = all.filter(function (n) { return n.unread; }).length, alerts = all.filter(function (n) { return ['overdue', 'forecast', 'security', 'large'].indexOf(n.type) > -1; });
      var list = f === 'all' ? all : f === 'unread' ? all.filter(function (n) { return n.unread; }) : alerts;
      $('#nTabs', root).innerHTML = [['all', 'All', all.length], ['unread', 'Unread', un], ['alerts', 'Alerts', alerts.length]].map(function (t) { return '<button role="tab" data-f="' + t[0] + '" aria-selected="' + (f === t[0]) + '">' + t[1] + ' <span class="ns-count">' + t[2] + '</span></button>'; }).join('');
      var groups = { Today: [], Yesterday: [], Earlier: [] };
      list.forEach(function (n) { var h = (Date.now() - n.t) / 36e5; (h < 24 ? groups.Today : h < 48 ? groups.Yesterday : groups.Earlier).push(n); });
      var html = Object.keys(groups).map(function (g) { var a = groups[g]; if (!a.length) return ''; return '<div class="group-label">' + g + '</div>' + a.map(function (n) { var m = NT[n.type] || ['bell', '']; return '<div class="notif ' + (n.unread ? 'is-unread' : '') + '" tabindex="0" role="button" data-n="' + n.id + '"><div class="notif__ic' + (m[1] ? ' notif__ic--' + m[1] : '') + '">' + NS.icon(m[0]) + '</div><div><b>' + esc(n.title) + '</b><p>' + esc(n.body) + '</p></div><time>' + App.relTime(n.t) + '</time></div>'; }).join(''); }).join('');
      $('#nList', root).innerHTML = html || '<div class="rows__empty"><b>You’re all caught up</b>New activity will show up here.</div>';
      $$('[data-n]', root).forEach(function (el) { function go() { var n = App.state.notifs.filter(function (x) { return x.id === el.dataset.n; })[0]; n.unread = false; App.updateBadges(); if (n.go) App.go(n.go); } el.addEventListener('click', go); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); }); });
    }
    $('#nTabs', root).addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { f = b.dataset.f; draw(); } });
    $('#markAll', root).addEventListener('click', function () { App.state.notifs.forEach(function (n) { n.unread = false; }); App.updateBadges(); draw(); App.toast('All notifications marked as read.', 'check'); });
    $$('.ns-switch input', root).forEach(function (s) { s.addEventListener('change', function () { App.toast('Preference saved.', 'check'); }); });
    draw();
  };

  /* ======================================================================= SETTINGS */
  var SET = [['profile', 'Business profile', 'building'], ['accounts', 'Connected accounts', 'bank'], ['team', 'Team', 'users'], ['notifications', 'Notifications', 'bell'], ['security', 'Security', 'shield'], ['appearance', 'Appearance', 'sun'], ['billing', 'Billing & plan', 'card']];
  var team = [{ n: 'Dana Whitfield', e: 'dana@highlineroasters.example', r: 'Owner', st: 'Active' }, { n: 'Marcus Bell', e: 'marcus@ledgerwell.example', r: 'Bookkeeper', st: 'Active' }, { n: 'Priya Raman', e: 'priya@highlineroasters.example', r: 'Viewer', st: 'Invited' }];
  App.views.settings = function (root, q) {
    var s = (q && q.s) || 'profile';
    function sw(label, hint, on) { return '<div class="set-row"><div><b>' + label + '</b>' + (hint ? '<small>' + hint + '</small>' : '') + '</div><label class="ns-switch"><input type="checkbox" ' + (on ? 'checked' : '') + ' aria-label="' + label + '"><span></span></label></div>'; }
    var panels = {
      profile: card('Business profile', 'Shown on invoices and reports.',
        '<form class="form-grid" id="profForm" novalidate><div class="ns-field"><label class="ns-label" for="pName">Business name</label><input class="ns-input" id="pName" value="' + esc(D.business.name) + '"></div><div class="ns-field"><label class="ns-label" for="pLegal">Legal name</label><input class="ns-input" id="pLegal" value="' + esc(D.business.legal) + '"></div><div class="ns-field"><label class="ns-label" for="pInd">Industry</label><input class="ns-input" id="pInd" value="' + esc(D.business.industry) + '"></div><div class="ns-field"><label class="ns-label" for="pEin">EIN</label><input class="ns-input" id="pEin" value="••-•••4821" readonly><span class="ns-hint">Contact support to change your EIN.</span></div><div class="ns-field full"><label class="ns-label" for="pAddr">Business address</label><input class="ns-input" id="pAddr" value="2100 Blake Yard, Denver, CO 80205"></div><div class="ns-field"><label class="ns-label" for="pFy">Fiscal year starts</label><select class="ns-select" id="pFy"><option selected>January</option><option>April</option><option>July</option><option>October</option></select></div><div class="ns-field"><label class="ns-label" for="pTz">Time zone</label><select class="ns-select" id="pTz"><option selected>Mountain Time (MT)</option><option>Central Time (CT)</option><option>Eastern Time (ET)</option><option>Pacific Time (PT)</option></select></div></form>' +
        '<div style="display:flex;justify-content:flex-end;margin-top:20px"><button class="ns-btn ns-btn--primary" id="profSave">Save changes</button></div>'),
      accounts: card('Connected accounts', 'Northstar reads balances and transactions. It can’t move money without your approval.',
        '<div>' + D.accounts.map(function (a) { return '<div class="session"><span class="ns-avatar ns-avatar--sq">' + NS.icon('bank', 'i--sm') + '</span><div><b>' + a.name + ' ··' + a.mask + '</b><small>' + a.type + ' · ' + a.bank + ' · synced 4 min ago</small></div><span class="ns-badge ns-badge--pos">Connected</span></div>'; }).join('') + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap"><button class="ns-btn ns-btn--outline" id="syncNow">' + NS.icon('refresh') + 'Sync now</button><button class="ns-btn ns-btn--primary" id="addAcct">' + NS.icon('plus') + 'Connect an account</button></div>'),
      team: card('Team', 'Growth plan includes 3 seats.',
        '<div id="teamList">' + team.map(function (m) { return '<div class="session"><span class="ns-avatar">' + App.initials(m.n) + '</span><div><b>' + m.n + ' ' + (m.st === 'Invited' ? '<span class="ns-badge ns-badge--warn" style="margin-left:6px">Invited</span>' : '') + '</b><small>' + m.e + '</small></div><select class="ns-select ns-select--sm" style="width:130px" aria-label="Role for ' + m.n + '" ' + (m.r === 'Owner' ? 'disabled' : '') + '>' + ['Owner', 'Admin', 'Bookkeeper', 'Viewer'].map(function (r) { return '<option' + (r === m.r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></div>'; }).join('') + '</div>' +
        '<div class="ns-divider" style="margin:20px 0"></div><form class="toolbar" id="invite" style="margin:0"><div class="ns-input-wrap" style="max-width:none"><svg class="i"><use href="#i-mail"/></svg><input class="ns-input" id="invEmail" type="email" placeholder="Invite by email" aria-label="Invite by email" required></div><button class="ns-btn ns-btn--primary" type="submit">Send invite</button></form>'),
      notifications: card('Notifications', 'Pick what reaches you, and where.',
        '<div class="matrix"><span></span><span class="mh">Email</span><span class="mh">Push</span><span class="mh">SMS</span>' + [['Invoice paid', 'When a customer pays you'], ['Invoice overdue', 'Past-due reminders'], ['Low-balance forecast', 'If cash is projected to dip'], ['Large transactions', 'Over $5,000'], ['Weekly summary', 'Mondays']].map(function (r, i) { return '<div class="ml"><b>' + r[0] + '</b><small>' + r[1] + '</small></div>' + [1, 1, 0].map(function (on, j) { return '<div class="mc"><label class="ns-check"><input type="checkbox" ' + ((i === 4 ? j === 0 : on || (j === 1 && i < 4)) ? 'checked' : '') + ' aria-label="' + r[0] + ' ' + ['email', 'push', 'SMS'][j] + '"><span class="ns-sr">on</span></label></div>'; }).join(''); }).join('') + '</div>'),
      security: card('Security', 'Protect your books and your customers’ data.',
        sw('Two-factor authentication', 'Authenticator app · required for all team members', true) + sw('Passkeys', 'Sign in with Face ID, Touch ID or a security key', true) + sw('Require approval for payments over $2,500', 'A second person must approve', true) +
        '<div class="ns-divider" style="margin:20px 0"></div><h3 class="card__t" style="margin-bottom:14px">Active sessions</h3>' + [['Chrome on Windows', 'Denver, CO · This device', true], ['Northstar app on iPhone', 'Denver, CO · 2 hours ago', false], ['Safari on MacBook', 'Boulder, CO · 3 days ago', false]].map(function (x) { return '<div class="session"><span class="ns-avatar ns-avatar--sq">' + NS.icon(x[2] ? 'globe' : 'lock', 'i--sm') + '</span><div><b>' + x[0] + '</b><small>' + x[1] + '</small></div>' + (x[2] ? '<span class="ns-badge ns-badge--pos">Current</span>' : '<button class="ns-btn ns-btn--outline ns-btn--sm" data-signout>Sign out</button>') + '</div>'; }).join('')),
      appearance: card('Appearance', 'Make Northstar feel like yours.',
        '<div class="theme-opts" role="radiogroup" aria-label="Theme">' + [['light', 'Light', '#F6F5F1', '#fff'], ['dark', 'Dark', '#0B0D12', '#161A22'], ['system', 'System', 'linear-gradient(90deg,#F6F5F1 50%,#0B0D12 50%)', 'transparent']].map(function (t) { var cur = (function () { try { return localStorage.getItem('ns-theme') || 'system'; } catch (e) { return 'system'; } })(); return '<button class="theme-opt" role="radio" data-theme-opt="' + t[0] + '" aria-checked="' + (cur === t[0]) + '"><span class="pv" style="background:' + t[2] + '"><i style="background:' + (t[0] === 'system' ? 'transparent' : t[3]) + '"></i><i></i></span><span>' + t[1] + '</span></button>'; }).join('') + '</div>' +
        '<div class="ns-divider" style="margin:24px 0"></div>' + sw('Compact density', 'Tighter rows for power users', document.documentElement.getAttribute('data-density') === 'compact') + sw('Reduce motion', 'Turn off chart and page animations', false) +
        '<div class="set-row"><div><b>Currency</b><small>Used across the product</small></div><select class="ns-select ns-select--sm" style="width:150px" aria-label="Currency"><option>USD — US dollar</option></select></div>'),
      billing: card('Billing & plan', 'Growth · $31/month, billed annually.',
        '<div class="usage"><div><span>Seats</span><b>2 of 3 used</b></div><div class="ns-meter"><i style="width:66%"></i></div><div style="margin-top:8px"><span>Connected accounts</span><b>4 of 10</b></div><div class="ns-meter"><i style="width:40%"></i></div><div style="margin-top:8px"><span>Invoices sent this month</span><b>Unlimited</b></div></div>' +
        '<div class="ns-divider" style="margin:24px 0"></div><div class="set-row" style="padding-top:0"><div><b>Payment method</b><small>Card ending in 4242 · expires 08/29</small></div><button class="ns-btn ns-btn--outline ns-btn--sm" data-toast="Payment methods are not part of this prototype.">Update</button></div>' +
        '<div class="set-row"><div><b>Next invoice</b><small>' + F.date(D.at(18), 'mdy') + ' · $372.00 (annual)</small></div><button class="ns-btn ns-btn--outline ns-btn--sm" data-toast="Billing history is not part of this prototype.">View history</button></div>' +
        '<div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap"><a class="ns-btn ns-btn--primary" href="../site/pricing.html">Compare plans</a><button class="ns-btn ns-btn--ghost" data-toast="Concept prototype — nothing to cancel.">Cancel plan</button></div>')
    };
    root.innerHTML = head('Settings', 'Manage your workspace, team and preferences.') +
      '<div class="settings"><nav class="sub-nav" aria-label="Settings sections">' + SET.map(function (x) { return '<a href="#/settings?s=' + x[0] + '" aria-current="' + (x[0] === s) + '">' + NS.icon(x[2]) + x[1] + '</a>'; }).join('') + '</nav><div>' + (panels[s] || panels.profile) + '</div></div>';
    var el;
    if ((el = $('#profSave', root))) el.addEventListener('click', function () { D.business.name = $('#pName', root).value || D.business.name; App.toast('Business profile saved.', 'check'); });
    if ((el = $('#syncNow', root))) el.addEventListener('click', function () { App.toast('All 4 accounts are up to date.', 'refresh'); });
    if ((el = $('#addAcct', root))) el.addEventListener('click', function () {
      var m = App.modal('<h3>Connect an account</h3><p>Concept prototype — bank linking is simulated.</p><div style="display:grid;gap:8px;margin:18px 0">' + ['Pinecrest Savings & Loan', 'Harborview Credit Union', 'Meridian Trust Bank'].map(function (b) { return '<button class="ns-btn ns-btn--outline" data-bank style="justify-content:flex-start">' + NS.icon('bank') + b + '</button>'; }).join('') + '</div><div style="display:flex;justify-content:flex-end"><button class="ns-btn ns-btn--ghost" data-close>Cancel</button></div>');
      $$('[data-bank]', m.el).forEach(function (b) { b.addEventListener('click', function () { m.close(); App.toast('Connection simulated — no real bank was contacted.', 'info'); }); });
    });
    if ((el = $('#invite', root))) el.addEventListener('submit', function (e) { e.preventDefault(); var v = $('#invEmail', root); if (!v.value || !v.checkValidity()) { v.setAttribute('aria-invalid', 'true'); v.focus(); return; } App.toast('Invite sent to ' + v.value + ' (simulated).', 'send'); v.value = ''; v.removeAttribute('aria-invalid'); });
    $$('[data-signout]', root).forEach(function (b) { b.addEventListener('click', function () { b.closest('.session').remove(); App.toast('Session signed out.', 'logout'); }); });
    $$('[data-toast]', root).forEach(function (b) { b.addEventListener('click', function () { App.toast(b.dataset.toast, 'info'); }); });
    $$('[data-theme-opt]', root).forEach(function (b) { b.addEventListener('click', function () { App.theme(b.dataset.themeOpt); $$('[data-theme-opt]', root).forEach(function (x) { x.setAttribute('aria-checked', x === b); }); }); });
    $$('.ns-switch input, .matrix input', root).forEach(function (c) { c.addEventListener('change', function () {
      if (c.getAttribute('aria-label') === 'Compact density') App.density(c.checked ? 'compact' : 'comfortable'); App.toast('Preference saved.', 'check'); }); });
    $$('.session select', root).forEach(function (c) { c.addEventListener('change', function () { App.toast('Role updated.', 'check'); }); });
  };
})();
