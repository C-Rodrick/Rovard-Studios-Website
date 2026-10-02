/* Northstar Capital — chart engine
   Small, dependency-free SVG/HTML charts that follow the brand's data-viz rules:
   thin marks (≤24px bars, 2px lines), hairline recessive grid, 4px rounded data-ends,
   2px surface gaps, selective direct labels, crosshair + one tooltip for every series,
   keyboard + screen-reader access, and a "Today" marker drawn with the brand wedge. */
(function () {
  var NS = (window.NS = window.NS || {});
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- format */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var fmt = {
    usd: function (n, o) {
      o = o || {};
      var a = Math.abs(n), s = n < 0 ? '−' : (o.sign && n > 0 ? '+' : '');
      if (o.compact && a >= 1000) {
        var v = a >= 1e6 ? (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M'
                         : (a / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K';
        return s + '$' + v;
      }
      var d = o.cents ? 2 : 0;
      return s + '$' + a.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    },
    num: function (n, d) { return Number(n).toLocaleString('en-US', { maximumFractionDigits: d == null ? 0 : d }); },
    pct: function (n, d, sign) { d = d == null ? 1 : d; return (sign !== false && n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(d) + '%'; },
    date: function (t, o) {
      var d = new Date(t); o = o || 'md';
      if (o === 'md') return MONTHS[d.getMonth()] + ' ' + d.getDate();
      if (o === 'mdy') return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
      if (o === 'm') return MONTHS[d.getMonth()];
      if (o === 'my') return MONTHS[d.getMonth()] + " '" + String(d.getFullYear()).slice(2);
      if (o === 'wd') return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
      return d.toLocaleDateString('en-US');
    }
  };
  NS.fmt = fmt;

  /* ----------------------------------------------------------------- utils */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function niceNum(range, round) {
    var e = Math.floor(Math.log10(range)), f = range / Math.pow(10, e), n;
    if (round) n = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10; else n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return n * Math.pow(10, e);
  }
  function niceScale(min, max, count) {
    if (min === max) { max = min + 1; }
    var range = niceNum(max - min, false), step = niceNum(range / (count - 1), true);
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, ticks = [];
    for (var v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(6));
    return { min: lo, max: hi, ticks: ticks, step: step };
  }
  function monotone(pts) {            // monotone cubic Hermite → SVG path (no overshoot)
    var n = pts.length; if (n < 3) return 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join('L');
    var dx = [], dy = [], m = [], t = [], i;
    for (i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dy[i] / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; }
      var a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { var k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (i = 0; i < n - 1; i++) {
      var h = dx[i] / 3;
      d += 'C' + (pts[i][0] + h) + ',' + (pts[i][1] + h * t[i]) + ',' + (pts[i + 1][0] - h) + ',' + (pts[i + 1][1] - h * t[i + 1]) + ',' + pts[i + 1][0] + ',' + pts[i + 1][1];
    }
    return d;
  }
  function linear(pts) { return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('L'); }
  function rbarPath(x, y, w, h, r, down) {  // rounded data-end (top, or bottom for negatives), square at baseline
    r = Math.max(0, Math.min(r, w / 2, Math.abs(h))); if (h <= 0) return '';
    if (!down) return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
    return 'M' + x + ',' + y + 'V' + (y + h - r) + 'Q' + x + ',' + (y + h) + ' ' + (x + r) + ',' + (y + h) + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + (y + h) + ' ' + (x + w) + ',' + (y + h - r) + 'V' + y + 'Z';
  }
  var uid = 0;
  function mount(el, type, cfg, renderer) {
    if (el.__vz && el.__vz.ro) el.__vz.ro.disconnect();
    var state = el.__vz = { type: type, cfg: cfg, drawn: false, w: 0 };
    el.classList.add('vz');
    function go() { var w = Math.round(el.clientWidth); if (!w) return; state.w = w; renderer(el, cfg, state); state.drawn = true; }
    go();
    if (window.ResizeObserver) {
      state.ro = new ResizeObserver(function () { if (Math.round(el.clientWidth) !== state.w) { cancelAnimationFrame(state.raf); state.raf = requestAnimationFrame(go); } });
      state.ro.observe(el);
    }
    return { update: function (c) { if (c) { for (var k in c) cfg[k] = c[k]; } state.drawn = !!(c && c.animate === false) || state.drawn; go(); }, el: el };
  }
  function tipEl(el) {
    var t = el.querySelector('.vz-tip'); if (t) return t;
    t = document.createElement('div'); t.className = 'vz-tip'; t.setAttribute('role', 'status'); el.appendChild(t); return t;
  }
  function fillTip(tip, title, rows, foot) {
    tip.textContent = '';
    if (title) { var h = document.createElement('div'); h.className = 'vz-tip__t'; h.textContent = title; tip.appendChild(h); }
    rows.forEach(function (r) {
      var row = document.createElement('div'); row.className = 'vz-tip__r';
      var k = document.createElement('i'); k.className = 'vz-key' + (r.dash ? ' is-dash' : ''); k.style.setProperty('--k', r.color || 'var(--c1)'); row.appendChild(k);
      var l = document.createElement('span'); l.className = 'vz-tip__l'; l.textContent = r.label; row.appendChild(l);
      var v = document.createElement('b'); v.className = 'vz-tip__v'; v.textContent = r.value; row.appendChild(v);
      tip.appendChild(row);
    });
    if (foot) { var f = document.createElement('div'); f.className = 'vz-tip__f'; f.textContent = foot; tip.appendChild(f); }
  }
  function placeTip(el, tip, x, y, W) {
    tip.classList.add('is-on');
    var tw = tip.offsetWidth, th = tip.offsetHeight, left = x + 14;
    if (left + tw > W - 4) left = x - tw - 14;
    left = Math.max(4, left);
    var top = Math.max(4, Math.min(y - th / 2, (el.__vz.h || 300) - th - 4));
    tip.style.transform = 'translate(' + left + 'px,' + top + 'px)';
  }
  function legend(series) {
    return '<div class="vz-legend">' + series.map(function (s) {
      return '<span class="vz-legend__i"><i class="vz-key' + (s.dash ? ' is-dash' : '') + (s.shape === 'rect' ? ' is-rect' : '') + '" style="--k:' + s.color + '"></i>' + esc(s.label) + '</span>';
    }).join('') + '</div>';
  }
  function srTable(caption, head, rows) {
    return '<div class="ns-sr"><table><caption>' + esc(caption) + '</caption><thead><tr>' + head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return i ? '<td>' + esc(c) + '</td>' : '<th scope="row">' + esc(c) + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }

  /* ------------------------------------------------------------------ line */
  /* cfg: { height, series:[{key,label,color,data:[{x,y}],area,dash,forecastFrom,width}], y:{format,ticks,min,max,zero},
            xFormat, today, markers:[{x,y,label,dx,dy,anchor}], tooltip(i,xs)->{title,rows,foot}, curve:'monotone'|'linear',
            legend:true|false, label, onHover(i) }                                                           */
  function line(el, cfg) { return mount(el, 'line', cfg, renderLine); }
  function renderLine(el, cfg, st) {
    var W = st.w, H = (st.h = cfg.height || 280), id = 'vz' + (++uid);
    var series = cfg.series, S0 = series[0], N = S0.data.length;
    var showLegend = cfg.legend !== false && series.length > 1;
    var m = { t: 22, r: cfg.right != null ? cfg.right : 14, b: 26, l: cfg.hideY ? 8 : 52 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var all = []; series.forEach(function (s) { s.data.forEach(function (p) { all.push(p.y); }); });
    var lo = cfg.y && cfg.y.min != null ? cfg.y.min : Math.min.apply(null, all), hi = cfg.y && cfg.y.max != null ? cfg.y.max : Math.max.apply(null, all);
    if (cfg.y && cfg.y.zero) lo = Math.min(0, lo);
    var pad = (hi - lo) * 0.08; if (!(cfg.y && cfg.y.min != null)) lo -= pad; hi += pad; if (cfg.y && cfg.y.zero && lo < 0 && Math.min.apply(null, all) >= 0) lo = 0;
    var sc = niceScale(lo, hi, (cfg.y && cfg.y.ticks) || 5);
    var xmin = S0.data[0].x, xmax = S0.data[N - 1].x;
    var X = function (x) { return m.l + (x - xmin) / (xmax - xmin) * iw; };
    var Y = function (y) { return m.t + ih - (y - sc.min) / (sc.max - sc.min) * ih; };
    var yf = (cfg.y && cfg.y.format) || function (v) { return fmt.usd(v, { compact: true }); };
    var xf = cfg.xFormat || function (t) { return fmt.date(t, 'md'); };
    var s = '';
    // grid + y labels
    sc.ticks.forEach(function (tv) {
      var y = Y(tv); if (y < m.t - 1 || y > m.t + ih + 1) return;
      s += '<line class="vz-grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y + '" y2="' + y + '"/>';
      if (!cfg.hideY) s += '<text class="vz-tick" x="' + (m.l - 10) + '" y="' + (y + 3.5) + '" text-anchor="end">' + esc(yf(tv)) + '</text>';
    });
    // x labels
    var nx = Math.max(2, Math.min(cfg.xTicks || 7, Math.floor(iw / 78)));
    for (var k = 0; k < nx; k++) {
      var idx = Math.round(k * (N - 1) / (nx - 1)), tx = X(S0.data[idx].x);
      var anchor = k === 0 ? 'start' : k === nx - 1 ? 'end' : 'middle';
      s += '<text class="vz-tick" x="' + tx + '" y="' + (H - 6) + '" text-anchor="' + anchor + '">' + esc(xf(S0.data[idx].x)) + '</text>';
    }
    // forecast shading
    if (cfg.today != null) {
      var tx0 = X(cfg.today);
      s += '<rect class="vz-fc" x="' + tx0 + '" y="' + m.t + '" width="' + Math.max(0, W - m.r - tx0) + '" height="' + ih + '"/>';
    }
    // series
    var curve = cfg.curve === 'linear' ? linear : monotone;
    s += '<g class="' + (st.drawn || reduceMotion || cfg.animate === false ? '' : 'vz-reveal') + '">';
    series.forEach(function (sr, si) {
      var pts = sr.data.map(function (p) { return [X(p.x), Y(p.y)]; });
      var ff = sr.forecastFrom != null ? sr.forecastFrom : N;
      var a = pts.slice(0, Math.min(ff + 1, N)), b = ff < N ? pts.slice(Math.max(ff, 0)) : [];
      var base = Y(Math.max(sc.min, Math.min(0, sc.max)));
      if (sr.area) {
        var gid = id + 'g' + si;
        s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sr.color + '" stop-opacity=".22"/><stop offset="1" stop-color="' + sr.color + '" stop-opacity="0"/></linearGradient></defs>';
        if (a.length > 1) s += '<path d="' + curve(a) + 'L' + a[a.length - 1][0] + ',' + (m.t + ih) + 'L' + a[0][0] + ',' + (m.t + ih) + 'Z" fill="url(#' + gid + ')"/>';
        if (b.length > 1) s += '<path d="' + curve(b) + 'L' + b[b.length - 1][0] + ',' + (m.t + ih) + 'L' + b[0][0] + ',' + (m.t + ih) + 'Z" fill="url(#' + gid + ')" opacity=".55"/>';
      }
      var w = sr.width || 2;
      if (a.length > 1) s += '<path d="' + curve(a) + '" fill="none" stroke="' + sr.color + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (sr.dash ? ' stroke-dasharray="' + sr.dash + '"' : '') + '/>';
      if (b.length > 1) s += '<path d="' + curve(b) + '" fill="none" stroke="' + sr.color + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 5.5"/>';
    });
    s += '</g>';
    // today marker (brand wedge)
    if (cfg.today != null) {
      var tx1 = X(cfg.today);
      s += '<line class="vz-today" x1="' + tx1 + '" x2="' + tx1 + '" y1="' + (m.t - 2) + '" y2="' + (m.t + ih) + '"/>' +
           '<polygon class="vz-wedge" points="' + (tx1 - 4.5) + ',' + (m.t - 6) + ' ' + (tx1 - 4.5) + ',' + (m.t + 3) + ' ' + (tx1 + 4.5) + ',' + (m.t + 3) + '"/>' +
           '<text class="vz-today-t" x="' + (tx1 + 9) + '" y="' + (m.t + 2) + '">TODAY</text>';
      // end dot on today for series that have actuals
      series.forEach(function (sr) {
        var ff = sr.forecastFrom; if (ff == null) return;
        var p = sr.data[Math.max(0, Math.min(ff, N - 1))];
        s += '<circle class="vz-dot" cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4.5" fill="' + sr.color + '"/>';
      });
    } else if (cfg.endDot !== false) {
      series.forEach(function (sr) { var p = sr.data[N - 1]; s += '<circle class="vz-dot" cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4.5" fill="' + sr.color + '"/>'; });
    }
    // markers (selective direct labels)
    (cfg.markers || []).forEach(function (mk) {
      var mx = X(mk.x), my = Y(mk.y), dx = mk.dx != null ? mk.dx : 0, dy = mk.dy != null ? mk.dy : -14;
      s += '<circle class="vz-dot" cx="' + mx + '" cy="' + my + '" r="4" fill="' + (mk.color || 'var(--text)') + '"/>' +
           '<text class="vz-label" x="' + (mx + dx) + '" y="' + (my + dy) + '" text-anchor="' + (mk.anchor || 'middle') + '">' + esc(mk.label) + '</text>';
    });
    // hover layer
    s += '<line class="vz-cross" x1="0" x2="0" y1="' + m.t + '" y2="' + (m.t + ih) + '" style="display:none"/><g class="vz-hdots"></g>' +
         '<rect class="vz-hit" x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + ih + '" fill="transparent"/>';
    var label = cfg.label || 'Line chart';
    var tbl = srTable(label, ['Date'].concat(series.map(function (z) { return z.label; })), S0.data.map(function (p, i) { return [xf(p.x)].concat(series.map(function (z) { return yf(z.data[i].y); })); }));
    el.innerHTML = (showLegend ? legend(series) : '') + '<svg class="vz-svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '" tabindex="0">' + s + '</svg>' + tbl;
    var svg = el.querySelector('svg'), cross = svg.querySelector('.vz-cross'), hd = svg.querySelector('.vz-hdots'), hit = svg.querySelector('.vz-hit');
    var tip = tipEl(el), cur = -1;
    function show(i, py) {
      i = Math.max(0, Math.min(N - 1, i)); cur = i;
      var x = X(S0.data[i].x); cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.style.display = '';
      hd.innerHTML = series.map(function (sr) { return '<circle class="vz-dot" cx="' + x + '" cy="' + Y(sr.data[i].y) + '" r="4.5" fill="' + sr.color + '"/>'; }).join('');
      var t = cfg.tooltip ? cfg.tooltip(i) : { title: fmt.date(S0.data[i].x, 'wd'), rows: series.map(function (sr) { return { label: sr.label, value: yf(sr.data[i].y), color: sr.color, dash: !!sr.dash || (sr.forecastFrom != null && i > sr.forecastFrom) }; }) };
      fillTip(tip, t.title, t.rows, t.foot);
      var svgTop = svg.offsetTop;
      placeTip(el, tip, x, svgTop + (py != null ? py : Y(S0.data[i].y)), W);
      if (cfg.onHover) cfg.onHover(i);
    }
    function hide() { cross.style.display = 'none'; hd.innerHTML = ''; tip.classList.remove('is-on'); cur = -1; }
    hit.addEventListener('pointermove', function (e) {
      var r = svg.getBoundingClientRect(), px = (e.clientX - r.left) * (W / r.width), py = (e.clientY - r.top) * (H / r.height);
      var f = (px - m.l) / iw * (xmax - xmin) + xmin, best = 0, bd = Infinity;
      for (var i = 0; i < N; i++) { var d = Math.abs(S0.data[i].x - f); if (d < bd) { bd = d; best = i; } }
      show(best, py);
    });
    hit.addEventListener('pointerleave', hide);
    svg.addEventListener('blur', hide);
    svg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(cur < 0 ? 0 : cur + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { show(cur < 0 ? N - 1 : cur - 1); e.preventDefault(); }
      else if (e.key === 'Escape') hide();
    });
  }

  /* ------------------------------------------------------------------ bars */
  /* cfg: { height, labels:[], series:[{key,label,color,values:[]}], stacked, y:{format,ticks}, maxBar, highlight, line:{label,color,values},
            tooltip(i)->{title,rows,foot}, xFormat, label }                                                          */
  function bars(el, cfg) { return mount(el, 'bars', cfg, renderBars); }
  function renderBars(el, cfg, st) {
    var W = st.w, H = (st.h = cfg.height || 260), series = cfg.series, n = cfg.labels.length, k = series.length;
    var showLegend = cfg.legend !== false && (series.length > 1 || cfg.line);
    var m = { t: 12, r: 8, b: 26, l: cfg.hideY ? 4 : 52 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    var mins = [0], maxs = [0];
    for (var i = 0; i < n; i++) {
      if (cfg.stacked) { var pos = 0, neg = 0; series.forEach(function (sr) { var v = sr.values[i] || 0; if (v >= 0) pos += v; else neg += v; }); maxs.push(pos); mins.push(neg); }
      else series.forEach(function (sr) { var v = sr.values[i] || 0; maxs.push(v); mins.push(v); });
      if (cfg.line) { maxs.push(cfg.line.values[i]); mins.push(cfg.line.values[i]); }
    }
    var sc = niceScale(Math.min.apply(null, mins) * 1.04, Math.max.apply(null, maxs) * 1.06, (cfg.y && cfg.y.ticks) || 5);
    var Y = function (v) { return m.t + ih - (v - sc.min) / (sc.max - sc.min) * ih; }, y0 = Y(0);
    var yf = (cfg.y && cfg.y.format) || function (v) { return fmt.usd(v, { compact: true }); };
    var band = iw / n, maxBar = cfg.maxBar || 24, gap = 2;
    var bw = cfg.stacked ? Math.min(maxBar, band * 0.62) : Math.min(maxBar, (band * 0.7 - gap * (k - 1)) / k);
    var s = '';
    sc.ticks.forEach(function (tv) {
      var y = Y(tv); s += '<line class="' + (tv === 0 ? 'vz-axis' : 'vz-grid') + '" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y + '" y2="' + y + '"/>';
      if (!cfg.hideY) s += '<text class="vz-tick" x="' + (m.l - 10) + '" y="' + (y + 3.5) + '" text-anchor="end">' + esc(yf(tv)) + '</text>';
    });
    var every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 54))));
    cfg.labels.forEach(function (lb, i) {
      if (i % every === 0 || i === n - 1 && (n - 1) % every === 0) s += '<text class="vz-tick" x="' + (m.l + band * (i + .5)) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(lb) + '</text>';
    });
    s += '<g class="vz-bars' + (st.drawn || reduceMotion || cfg.animate === false ? '' : ' vz-grow') + '">';
    for (var j = 0; j < n; j++) {
      var cx = m.l + band * (j + .5);
      s += '<g class="vz-bar-g' + (cfg.highlight === j ? ' is-hl' : '') + '" data-i="' + j + '">';
      if (cfg.stacked) {
        var up = 0, dn = 0, x = cx - bw / 2, lastPos = -1;
        series.forEach(function (sr, si) { if ((sr.values[j] || 0) > 0) lastPos = si; });
        series.forEach(function (sr, si) {
          var v = sr.values[j] || 0; if (!v) return;
          if (v > 0) { var ya = Y(up), yb = Y(up + v), hh = ya - yb - (si === lastPos ? 0 : 0); var top = yb, h2 = Math.max(0, hh - (up > 0 ? gap : 0));
            s += '<path d="' + rbarPath(x, top, bw, h2, si === lastPos ? 4 : 0, false) + '" fill="' + sr.color + '"/>'; up += v; }
          else { var yc = Y(dn), yd = Y(dn + v); s += '<path d="' + rbarPath(x, yc + (dn < 0 ? gap : 0), bw, Math.max(0, yd - yc - (dn < 0 ? gap : 0)), 4, true) + '" fill="' + sr.color + '"/>'; dn += v; }
        });
      } else {
        var total = k * bw + (k - 1) * gap, x0 = cx - total / 2;
        series.forEach(function (sr, si) {
          var v = sr.values[j] || 0, bx = x0 + si * (bw + gap);
          var op = sr.muted ? ' opacity="1"' : '';
          if (v >= 0) s += '<path d="' + rbarPath(bx, Y(v), bw, y0 - Y(v), 4, false) + '" fill="' + sr.color + '"' + op + '/>';
          else s += '<path d="' + rbarPath(bx, y0, bw, Y(v) - y0, 4, true) + '" fill="' + sr.color + '"' + op + '/>';
        });
      }
      s += '</g>';
    }
    s += '</g>';
    if (cfg.line) {
      var lp = cfg.line.values.map(function (v, i) { return [m.l + band * (i + .5), Y(v)]; });
      s += '<path d="' + monotone(lp) + '" fill="none" stroke="' + cfg.line.color + '" stroke-width="2" stroke-linecap="round"/>';
      lp.forEach(function (p) { s += '<circle class="vz-dot" cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" fill="' + cfg.line.color + '"/>'; });
    }
    for (var q = 0; q < n; q++) s += '<rect class="vz-bhit" data-i="' + q + '" x="' + (m.l + band * q) + '" y="' + m.t + '" width="' + band + '" height="' + ih + '" fill="transparent"/>';
    var label = cfg.label || 'Bar chart';
    var heads = ['Period'].concat(series.map(function (z) { return z.label; })).concat(cfg.line ? [cfg.line.label] : []);
    var tbl = srTable(label, heads, cfg.labels.map(function (lb, i) { return [lb].concat(series.map(function (z) { return yf(z.values[i]); })).concat(cfg.line ? [yf(cfg.line.values[i])] : []); }));
    var lg = showLegend ? legend(series.map(function (z) { return { label: z.label, color: z.color, shape: 'rect' }; }).concat(cfg.line ? [{ label: cfg.line.label, color: cfg.line.color }] : [])) : '';
    el.innerHTML = lg + '<svg class="vz-svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + s + '</svg>' + tbl;
    var svg = el.querySelector('svg'), tip = tipEl(el), groups = svg.querySelectorAll('.vz-bar-g');
    function on(i, e) {
      svg.classList.add('is-hover'); groups.forEach(function (g) { g.classList.toggle('is-on', +g.dataset.i === i); });
      var t = cfg.tooltip ? cfg.tooltip(i) : { title: cfg.labels[i], rows: series.map(function (z) { return { label: z.label, value: yf(z.values[i]), color: z.color }; }).concat(cfg.line ? [{ label: cfg.line.label, value: yf(cfg.line.values[i]), color: cfg.line.color }] : []) };
      fillTip(tip, t.title, t.rows, t.foot);
      var r = svg.getBoundingClientRect(), py = e ? (e.clientY - r.top) : H / 3;
      placeTip(el, tip, m.l + band * (i + .5), svg.offsetTop + py, W);
    }
    svg.querySelectorAll('.vz-bhit').forEach(function (h) {
      h.addEventListener('pointermove', function (e) { on(+h.dataset.i, e); });
    });
    svg.addEventListener('pointerleave', function () { svg.classList.remove('is-hover'); groups.forEach(function (g) { g.classList.remove('is-on'); }); tip.classList.remove('is-on'); });
  }

  /* ---------------------------------------------------------------- hbars */
  /* cfg: { items:[{label,value,sub,color,delta}], format, max, onClick }  — HTML, ranked, one hue (emphasis) */
  function hbars(el, cfg) {
    var items = cfg.items, max = cfg.max || Math.max.apply(null, items.map(function (i) { return i.value; })), f = cfg.format || function (v) { return fmt.usd(v); };
    el.classList.add('vz'); el.innerHTML = '';
    var wrap = document.createElement('div'); wrap.className = 'vz-hb'; wrap.setAttribute('role', 'list');
    items.forEach(function (it, ix) {
      var row = document.createElement('div'); row.className = 'vz-hb__r'; row.setAttribute('role', 'listitem');
      var lab = document.createElement('div'); lab.className = 'vz-hb__l';
      var t = document.createElement('span'); t.textContent = it.label; lab.appendChild(t);
      if (it.sub) { var sb = document.createElement('small'); sb.textContent = it.sub; lab.appendChild(sb); }
      var tr = document.createElement('div'); tr.className = 'vz-hb__t';
      var b = document.createElement('i'); b.style.width = (it.value / max * 100) + '%'; b.style.setProperty('--k', it.color || 'var(--c1)'); b.style.transitionDelay = (ix * 40) + 'ms'; tr.appendChild(b);
      var v = document.createElement('b'); v.className = 'vz-hb__v ns-num'; v.textContent = f(it.value);
      row.appendChild(lab); row.appendChild(tr); row.appendChild(v);
      if (it.delta != null) { var d = document.createElement('em'); d.className = 'vz-hb__d ' + (it.deltaGood === false ? 'neg' : it.deltaGood ? 'pos' : ''); d.textContent = it.delta; row.appendChild(d); row.classList.add('has-d'); }
      wrap.appendChild(row);
    });
    el.appendChild(wrap);
    if (!reduceMotion) { wrap.classList.add('is-pre'); requestAnimationFrame(function () { requestAnimationFrame(function () { wrap.classList.remove('is-pre'); }); }); }
    return { el: el };
  }

  /* ---------------------------------------------------------------- stack */
  /* single horizontal part-to-whole bar + legend. cfg: { segments:[{label,value,color}], format } */
  function stack(el, cfg) {
    var tot = cfg.segments.reduce(function (a, b) { return a + b.value; }, 0), f = cfg.format || function (v) { return fmt.usd(v); };
    el.classList.add('vz');
    el.innerHTML = '<div class="vz-stack" role="img" aria-label="' + esc(cfg.label || 'Breakdown') + '">' + cfg.segments.map(function (z) {
      return '<i style="flex:' + z.value + ';--k:' + z.color + '" title="' + esc(z.label + ': ' + f(z.value)) + '"></i>';
    }).join('') + '</div><div class="vz-stack__l">' + cfg.segments.map(function (z) {
      return '<div><span class="vz-legend__i"><i class="vz-key is-rect" style="--k:' + z.color + '"></i>' + esc(z.label) + '</span><b class="ns-num">' + esc(f(z.value)) + '</b><em>' + (z.value / tot * 100).toFixed(0) + '%</em></div>';
    }).join('') + '</div>';
    return { el: el };
  }

  /* ---------------------------------------------------------------- donut */
  /* cfg: { segments:[{label,value,color,sub}], size, thickness, center:{value,label}, format } */
  function donut(el, cfg) {
    var size = cfg.size || 168, th = cfg.thickness || 14, r = (size - th) / 2, c = 2 * Math.PI * r, f = cfg.format || function (v) { return fmt.usd(v); };
    var tot = cfg.segments.reduce(function (a, b) { return a + b.value; }, 0), off = 0, gap = 3, s = '';
    el.classList.add('vz');
    s += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--line-soft)" stroke-width="' + th + '"/>';
    cfg.segments.forEach(function (z, i) {
      var len = z.value / tot * c, dash = Math.max(0, len - gap);
      s += '<circle class="vz-seg" data-i="' + i + '" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + z.color + '" stroke-width="' + th + '" stroke-dasharray="' + dash + ' ' + (c - dash) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>';
      off += len;
    });
    var ctr = cfg.center ? '<div class="vz-donut__c"><b>' + esc(cfg.center.value) + '</b><span>' + esc(cfg.center.label) + '</span></div>' : '';
    el.innerHTML = '<div class="vz-donut"><div class="vz-donut__g" style="width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '" role="img" aria-label="' + esc(cfg.label || 'Breakdown') + '">' + s + '</svg>' + ctr + '</div>' +
      '<ul class="vz-donut__l">' + cfg.segments.map(function (z, i) {
        return '<li data-i="' + i + '"><span class="vz-legend__i"><i class="vz-key is-rect" style="--k:' + z.color + '"></i>' + esc(z.label) + '</span><b class="ns-num">' + esc(f(z.value)) + '</b><em>' + (z.value / tot * 100).toFixed(0) + '%</em></li>';
      }).join('') + '</ul></div>';
    var segs = el.querySelectorAll('.vz-seg'), lis = el.querySelectorAll('.vz-donut__l li');
    function hl(i) { segs.forEach(function (g, gi) { g.style.opacity = i < 0 || gi === i ? 1 : .32; }); lis.forEach(function (l, li) { l.style.opacity = i < 0 || li === i ? 1 : .5; }); }
    lis.forEach(function (l, i) { l.addEventListener('pointerenter', function () { hl(i); }); l.addEventListener('pointerleave', function () { hl(-1); }); });
    segs.forEach(function (g, i) { g.addEventListener('pointerenter', function () { hl(i); }); g.addEventListener('pointerleave', function () { hl(-1); }); });
    return { el: el };
  }

  /* ---------------------------------------------------------------- spark */
  /* returns an SVG string. last point is the accent; the rest is the muted line. */
  function spark(data, o) {
    o = o || {}; var w = o.w || 96, h = o.h || 28, p = 3, mn = Math.min.apply(null, data), mx = Math.max.apply(null, data), rng = (mx - mn) || 1;
    var pts = data.map(function (v, i) { return [p + i / (data.length - 1) * (w - 2 * p), p + (1 - (v - mn) / rng) * (h - 2 * p)]; });
    var col = o.color || 'var(--c1)', d = monotone(pts), last = pts[pts.length - 1];
    return '<svg class="vz-spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' +
      (o.area ? '<path d="' + d + 'L' + last[0] + ',' + h + 'L' + pts[0][0] + ',' + h + 'Z" fill="' + col + '" opacity="' + (o.areaOp || .1) + '"/>' : '') +
      '<path d="' + d + '" fill="none" stroke="' + (o.muted ? 'var(--viz-muted)' : col) + '" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="3" fill="' + col + '" stroke="var(--vz-surface,var(--surface))" stroke-width="1.5"/></svg>';
  }

  NS.charts = { line: line, bars: bars, hbars: hbars, stack: stack, donut: donut, spark: spark, niceScale: niceScale, monotone: monotone };
})();
