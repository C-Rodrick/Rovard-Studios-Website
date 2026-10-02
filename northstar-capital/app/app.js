/* Northstar Capital — product shell: router, overlays, command palette, theme, helpers */
(function () {
  var D = NS.data, F = NS.fmt;
  var ROUTES = [
    { id: 'overview',      label: 'Overview',      icon: 'overview',     group: 'Workspace' },
    { id: 'cash-flow',     label: 'Cash flow',     icon: 'cashflow',     group: 'Workspace' },
    { id: 'revenue',       label: 'Revenue',       icon: 'revenue',      group: 'Workspace' },
    { id: 'expenses',      label: 'Expenses',      icon: 'expenses',     group: 'Workspace' },
    { id: 'invoices',      label: 'Invoices',      icon: 'invoices',     group: 'Money' },
    { id: 'transactions',  label: 'Transactions',  icon: 'transactions', group: 'Money' },
    { id: 'reports',       label: 'Reports',       icon: 'reports',      group: 'Insights' },
    { id: 'notifications', label: 'Notifications', icon: 'bell',         group: 'Account' },
    { id: 'settings',      label: 'Settings',      icon: 'settings',     group: 'Account' }
  ];
  var MOBILE_TABS = ['overview', 'cash-flow', 'invoices', 'transactions'];

  var App = (window.App = {
    views: {}, routes: ROUTES, state: { range: 30, invoices: D.invoices.slice(), tx: D.txActual.slice(), notifs: D.notifications.slice() },
    D: D, F: F, current: null, params: {}
  });

  /* ------------------------------------------------------------ helpers */
  var $ = App.$ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = App.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  App.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var esc = App.esc;
  App.h = function (html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  App.icon = function (n, c) { return NS.icon(n, c); };
  App.usd = function (n, o) { return F.usd(n, o); };
  App.money = function (n, o) { o = o || {}; o.cents = o.cents != null ? o.cents : true; return F.usd(n, o); };
  App.hero = function (n) { var a = Math.abs(n), whole = Math.floor(a), cents = Math.round((a - whole) * 100); return (n < 0 ? '−' : '') + '$' + whole.toLocaleString('en-US') + '<small>.' + String(cents).padStart(2, '0') + '</small>'; };
  App.initials = function (n) { var p = String(n).replace(/[^A-Za-z& ]/g, '').split(/\s+/).filter(Boolean); return ((p[0] || '')[0] + ((p[1] || '')[0] === '&' ? (p[2] || '')[0] : (p[1] || '')[0] || '')).toUpperCase(); };
  App.avatar = function (n, cls) { return '<span class="ns-avatar ns-avatar--sq ' + (cls || '') + '" style="--s:34px">' + esc(App.initials(n)) + '</span>'; };
  App.dateShort = function (t) { return F.date(t, 'md'); };
  App.dateLong = function (t) { return F.date(t, 'mdy'); };
  App.delta = function (cur, prev, o) {
    o = o || {}; if (!prev) return { pct: 0, cls: '', html: '' };
    var p = (cur - prev) / Math.abs(prev) * 100, good = o.invert ? p < 0 : p > 0, cls = Math.abs(p) < 0.05 ? '' : good ? 'pos' : 'neg';
    return { pct: p, cls: cls, up: p >= 0, txt: F.pct(p, 1) };
  };
  App.deltaPill = function (cur, prev, o) {
    var d = App.delta(cur, prev, o); if (!prev) return '';
    return '<span class="pill-delta' + (d.cls ? ' pill-delta--' + d.cls : '') + '">' + NS.icon(d.up ? 'arrow-up-right' : 'arrow-down-right') + d.txt + '</span>';
  };
  App.relTime = function (ms) {
    var m = Math.round((Date.now() - ms) / 60000);
    if (m < 1) return 'Just now'; if (m < 60) return m + ' min ago'; var h = Math.round(m / 60); if (h < 24) return h + ' hr ago';
    var d = Math.round(h / 24); return d === 1 ? 'Yesterday' : d + ' days ago';
  };
  App.dueText = function (inv) {
    if (inv.status === 'paid') return 'Paid ' + App.dateShort(inv.payT);
    if (inv.status === 'draft') return 'Not sent';
    var d = Math.round((inv.dueT - D.TODAY) / 864e5);
    return d < 0 ? Math.abs(d) + ' days overdue' : d === 0 ? 'Due today' : 'Due in ' + d + ' days';
  };
  var STATUS = { paid: ['Paid', 'pos'], sent: ['Sent', 'accent'], overdue: ['Overdue', 'neg'], draft: ['Draft', ''] };
  App.statusBadge = function (s) { var m = STATUS[s] || [s, '']; return '<span class="ns-badge' + (m[1] ? ' ns-badge--' + m[1] : '') + '">' + m[0] + '</span>'; };
  App.csv = function (name, rows) {
    var out = rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([out], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  };
  App.sparkData = function (fn, n, step) { var out = []; for (var i = n - 1; i >= 0; i--) out.push(fn(-(i * step), -(i * step) - step + 1)); return out; };

  /* ------------------------------------------------------------ toast */
  App.toast = function (msg, icon) {
    var host = $('#toasts'), t = App.h('<div class="ns-toast" role="status">' + NS.icon(icon || 'check') + '<span>' + esc(msg) + '</span></div>');
    host.appendChild(t); setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 220); }, 3200);
  };

  /* ------------------------------------------------------------ overlays */
  var overlayStack = [];
  function trapFocus(el, e) {
    if (e.key !== 'Tab') return; var f = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', el).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return; var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }
  App.overlay = function (opts) {
    var host = $('#overlay'), scrim = App.h('<div class="scrim"></div>'), el = App.h(opts.html);
    var prev = document.activeElement;
    host.appendChild(scrim); host.appendChild(el);
    var o = { el: el, scrim: scrim, close: function () {
      if (o.closed) return; o.closed = true; el.classList.add('is-leaving'); scrim.classList.add('is-leaving');
      overlayStack = overlayStack.filter(function (x) { return x !== o; });
      setTimeout(function () { el.remove(); scrim.remove(); if (prev && prev.focus) try { prev.focus(); } catch (e) {} }, 190); if (opts.onClose) opts.onClose();
    } };
    scrim.addEventListener('click', o.close);
    el.addEventListener('keydown', function (e) { trapFocus(el, e); });
    $$('[data-close]', el).forEach(function (b) { b.addEventListener('click', o.close); });
    overlayStack.push(o);
    var first = $('[autofocus]', el) || $('input,button,select,textarea', el); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 30);
    return o;
  };
  App.closeTop = function () { var o = overlayStack[overlayStack.length - 1]; if (o) { o.close(); return true; } return false; };
  App.drawer = function (title, bodyHtml, footHtml, opts) {
    opts = opts || {};
    var o = App.overlay({ html: '<aside class="drawer ' + (opts.size === 'lg' ? 'drawer--lg' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="drawer__h"><h3>' + esc(title) + '</h3><button class="ns-btn ns-btn--ghost ns-btn--icon ns-btn--sm" data-close aria-label="Close">' + NS.icon('x') + '</button></div><div class="drawer__b">' + bodyHtml + '</div>' + (footHtml ? '<div class="drawer__f">' + footHtml + '</div>' : '') + '</aside>', onClose: opts.onClose });
    return o;
  };
  App.modal = function (html) { return App.overlay({ html: '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>' }); };

  /* ------------------------------------------------------------ theme */
  App.theme = function (pref) {
    try { if (pref) localStorage.setItem('ns-theme', pref); } catch (e) {}
    var p = pref || (function () { try { return localStorage.getItem('ns-theme'); } catch (e) { return null; } })() || 'system';
    var dark = p === 'dark' || (p === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    var qt = new URLSearchParams(location.search).get('theme');   // ?theme=light|dark pins the theme (used by embeds)
    if (!pref && (qt === 'dark' || qt === 'light')) dark = qt === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#0B0D12' : '#F6F5F1';
    var b = $('#themeBtn use'); if (b) b.setAttribute('href', dark ? '#i-sun' : '#i-moon');
    App.rerenderCharts();
    return p;
  };
  App.rerenderCharts = function () { $$('.vz').forEach(function (c) { if (c.__vz && c.__vz.cfg && c.__vz.type) { c.__vz.drawn = true; var w = c.clientWidth; c.__vz.w = 0; window.dispatchEvent(new Event('resize')); } }); };
  App.density = function (d) { try { localStorage.setItem('ns-density', d); } catch (e) {} document.documentElement.setAttribute('data-density', d); };

  /* ------------------------------------------------------------ nav */
  function buildNav() {
    var groups = {}; ROUTES.forEach(function (r) { (groups[r.group] = groups[r.group] || []).push(r); });
    $('#nav').innerHTML = Object.keys(groups).map(function (g) {
      return '<div class="nav-group"><div class="nav-label">' + g + '</div>' + groups[g].map(function (r) {
        return '<a class="nav-item" data-route="' + r.id + '" href="#/' + r.id + '">' + NS.icon(r.icon) + '<span>' + r.label + '</span>' + (r.id === 'notifications' ? '<span class="ns-count" id="nav-count" hidden></span>' : '') + '</a>';
      }).join('') + '</div>';
    }).join('');
    var tabs = MOBILE_TABS.map(function (id) { var r = ROUTES.filter(function (x) { return x.id === id; })[0]; return '<a data-route="' + id + '" href="#/' + id + '">' + NS.icon(r.icon) + '<span>' + (id === 'cash-flow' ? 'Cash' : id === 'transactions' ? 'Activity' : r.label) + '</span></a>'; }).join('');
    $('#tabbar').innerHTML = tabs + '<button type="button" id="moreBtn" aria-haspopup="dialog">' + NS.icon('menu') + '<span>More</span></button>';
    $('#moreBtn').addEventListener('click', openSheet);
  }
  function openSheet() {
    var rest = ROUTES.filter(function (r) { return MOBILE_TABS.indexOf(r.id) < 0; });
    var o = App.overlay({ html: '<div class="sheet" role="dialog" aria-modal="true" aria-label="More"><nav class="nav-group">' + rest.map(function (r) {
      return '<a class="nav-item" data-route="' + r.id + '" href="#/' + r.id + '" data-close>' + NS.icon(r.icon) + '<span>' + r.label + '</span></a>'; }).join('') +
      '</nav><div class="ns-divider" style="margin:8px 0"></div><button class="nav-item" id="sheetTheme" style="width:100%;border:0;background:none;cursor:pointer;text-align:left;height:48px;font-size:1rem">' + NS.icon('moon') + '<span>Switch theme</span></button><p class="concept-note" style="margin-top:14px"><b>Concept prototype.</b> Northstar Capital is a fictional brand by Rovard Studios.</p></div>' });
    $('#sheetTheme', o.el).addEventListener('click', function () { toggleTheme(); o.close(); });
    $$('a', o.el).forEach(function (a) { a.addEventListener('click', function () { o.close(); }); });
  }
  function toggleTheme() { App.theme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }
  App.updateBadges = function () {
    var n = App.state.notifs.filter(function (x) { return x.unread; }).length, c = $('#nav-count'), dot = $('#bell-dot');
    if (c) { c.textContent = n; c.hidden = !n; } if (dot) dot.style.display = n ? '' : 'none';
  };

  /* ------------------------------------------------------------ router */
  function parse() {
    var h = location.hash.replace(/^#\/?/, ''), q = {}, i = h.indexOf('?');
    if (i > -1) { new URLSearchParams(h.slice(i + 1)).forEach(function (v, k) { q[k] = v; }); h = h.slice(0, i); }
    return { id: h || 'overview', q: q };
  }
  App.go = function (hash) { if (location.hash === hash) render(); else location.hash = hash; };
  function render() {
    var p = parse(), route = ROUTES.filter(function (r) { return r.id === p.id; })[0] || ROUTES[0], root = $('#view');
    if (App.current && App.current.cleanup) { try { App.current.cleanup(); } catch (e) {} }
    $$('.vz', root).forEach(function (c) { if (c.__vz && c.__vz.ro) c.__vz.ro.disconnect(); });
    App.current = route; App.params = p.q;
    $$('[data-route]').forEach(function (a) { if (a.dataset.route === route.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('#crumb').textContent = route.label; document.title = route.label + ' — Northstar Capital';
    root.innerHTML = ''; root.style.animation = 'none'; void root.offsetWidth; root.style.animation = 'page-in .38s var(--ease) both';
    var cleanup = App.views[route.id] && App.views[route.id](root, p.q);
    if (typeof cleanup === 'function') route.cleanup = cleanup; else route.cleanup = null;
    window.scrollTo(0, 0); App.updateBadges();
  }
  var st = document.createElement('style'); st.textContent = '@keyframes page-in{from{opacity:0;transform:translateY(6px)}}'; document.head.appendChild(st);
  App.render = render;

  /* ------------------------------------------------------------ command palette */
  function openCmd() {
    if ($('.cmdk')) return;
    var items = ROUTES.map(function (r) { return { g: 'Go to', icon: r.icon, label: r.label, run: function () { App.go('#/' + r.id); } }; }).concat([
      { g: 'Actions', icon: 'plus', label: 'Create invoice', hint: 'N', run: function () { App.go('#/invoices'); setTimeout(function () { App.views.invoices.openBuilder && App.views.invoices.openBuilder(); }, 120); } },
      { g: 'Actions', icon: 'send', label: 'Send reminders for overdue invoices', run: function () { App.remindAll && App.remindAll(); } },
      { g: 'Actions', icon: 'download', label: 'Export transactions (CSV)', run: function () { App.exportTx && App.exportTx(); } },
      { g: 'Actions', icon: 'moon', label: 'Toggle dark mode', run: toggleTheme },
      { g: 'Actions', icon: 'help', label: 'Contact support', run: function () { App.toast('Concept prototype — support chat is not connected.', 'info'); } }
    ]);
    var sel = 0, shown = items;
    var o = App.overlay({ html: '<div class="cmdk" role="dialog" aria-modal="true" aria-label="Command palette"><div class="cmdk__in">' + NS.icon('search') + '<input id="cmdq" placeholder="Search or jump to…" autocomplete="off" spellcheck="false" aria-label="Command"><kbd class="ns-kbd">esc</kbd></div><div class="cmdk__list" role="listbox"></div><div class="cmdk__f"><span><kbd class="ns-kbd">↑</kbd><kbd class="ns-kbd">↓</kbd> navigate</span><span><kbd class="ns-kbd">↵</kbd> select</span></div></div>' });
    var list = $('.cmdk__list', o.el), input = $('#cmdq', o.el);
    function draw() {
      var last = '', html = '';
      shown.forEach(function (it, i) { if (it.g !== last) { html += '<div class="cmdk__g">' + it.g + '</div>'; last = it.g; } html += '<button class="cmdk__i" role="option" data-i="' + i + '" aria-selected="' + (i === sel) + '">' + NS.icon(it.icon) + '<span>' + esc(it.label) + '</span>' + (it.hint ? '<kbd class="ns-kbd">' + it.hint + '</kbd>' : '') + '</button>'; });
      list.innerHTML = html || '<div class="rows__empty"><b>No results</b>Try “invoices” or “cash flow”.</div>';
      var s = $('[aria-selected=true]', list); if (s) s.scrollIntoView({ block: 'nearest' });
    }
    function run(i) { var it = shown[i]; if (!it) return; o.close(); setTimeout(it.run, 60); }
    input.addEventListener('input', function () { var q = input.value.trim().toLowerCase(); shown = items.filter(function (x) { return !q || x.label.toLowerCase().indexOf(q) > -1; }); sel = 0; draw(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
      else if (e.key === 'Enter') { run(sel); e.preventDefault(); }
    });
    list.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) run(+b.dataset.i); });
    list.addEventListener('pointermove', function (e) { var b = e.target.closest('[data-i]'); if (b && +b.dataset.i !== sel) { sel = +b.dataset.i; $$('.cmdk__i', list).forEach(function (x) { x.setAttribute('aria-selected', +x.dataset.i === sel); }); } });
    draw();
  }

  /* ------------------------------------------------------------ account menu */
  function openMe() {
    var o = App.modal('<div style="display:flex;gap:14px;align-items:center"><span class="ns-avatar ns-avatar--accent" style="--s:48px">DW</span><div><h3>Dana Whitfield</h3><p style="margin-top:2px">dana@highlineroasters.example · Owner</p></div></div><div class="ns-divider" style="margin:20px 0"></div><div style="display:grid;gap:8px"><a class="ns-btn ns-btn--outline ns-btn--block" href="#/settings" data-close style="justify-content:flex-start">' + NS.icon('settings') + 'Settings</a><button class="ns-btn ns-btn--outline ns-btn--block" id="meTheme" style="justify-content:flex-start">' + NS.icon('moon') + 'Toggle dark mode</button><a class="ns-btn ns-btn--outline ns-btn--block" href="../site/index.html" style="justify-content:flex-start">' + NS.icon('logout') + 'Sign out (back to website)</a></div>');
    $('#meTheme', o.el).addEventListener('click', function () { toggleTheme(); o.close(); });
  }

  /* ------------------------------------------------------------ start */
  App.start = function () {
    buildNav(); App.theme(); App.updateBadges();
    $('#cmd').addEventListener('click', openCmd);
    $('#themeBtn').addEventListener('click', toggleTheme);
    $('#me').addEventListener('click', openMe);
    $('#ws').addEventListener('click', function () { App.toast('Workspace switching is not part of this prototype.', 'info'); });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); }
      else if (e.key === 'Escape') { App.closeTop(); }
      else if (e.key === '/' && !/input|textarea|select/i.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); openCmd(); }
    });
    window.addEventListener('hashchange', render);
    matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if ((localStorage.getItem('ns-theme') || 'system') === 'system') App.theme('system'); });
    render();
  };
})();
