/* MASON & ROWE — floor plans, neighborhood maps and section drawing, generated as SVG.
   All plans are fictional and schematic. Room tuples: [name, kind, x, y, w, h, opts] in feet. */
(function () {
  var MR = (window.MR = window.MR || {});

  /* ── plan templates ──────────────────────────────────────── */
  var T = {};
  T.t1 = { W: 44, D: 34, sides: 'tb', rooms: [
    ['Living', 'living', 0, 0, 22, 16], ['Kitchen & Dining', 'kitchen', 22, 0, 22, 16], ['Gallery', 'gallery', 0, 16, 44, 6],
    ['Bedroom 2', 'bed', 0, 22, 15, 12], ['Bath', 'bath', 15, 22, 7, 7], ['Utility', 'util', 15, 29, 7, 5, { door: 'none' }],
    ['Primary Bath', 'bath', 22, 22, 6, 12, { door: 'right' }], ['Primary Bedroom', 'bed', 28, 22, 16, 12]
  ] };
  T.t2 = { W: 54, D: 42, sides: 'tbr', rooms: [
    ['Living', 'living', 0, 0, 26, 18], ['Dining', 'dining', 26, 0, 14, 18], ['Kitchen', 'kitchen', 40, 0, 14, 18], ['Gallery', 'gallery', 0, 18, 54, 6],
    ['Bedroom 2', 'bed', 0, 24, 15, 18], ['Bath', 'bath', 15, 24, 7, 9], ['Closet', 'closet', 15, 33, 7, 9, { door: 'left' }],
    ['Bedroom 3', 'bed', 22, 24, 12, 18], ['Primary Bedroom', 'bed', 34, 24, 13, 18], ['Primary Bath', 'bath', 47, 24, 7, 18, { door: 'left' }]
  ] };
  T.t3 = { W: 64, D: 53, sides: 'tblr', rooms: [
    ['Great Room', 'living', 0, 0, 34, 22], ['Kitchen', 'kitchen', 34, 0, 16, 22], ['Scullery', 'util', 50, 0, 14, 10, { door: 'left' }], ['Library', 'study', 50, 10, 14, 12],
    ['Gallery', 'gallery', 0, 22, 64, 6],
    ['Primary Bedroom', 'bed', 0, 28, 18, 25], ['Primary Bath', 'bath', 18, 28, 9, 13, { door: 'left' }], ['Dressing', 'closet', 18, 41, 9, 12, { door: 'left' }],
    ['Bedroom 2', 'bed', 27, 28, 13, 25], ['Bath', 'bath', 40, 28, 5, 13, { door: 'left' }], ['Closet', 'closet', 40, 41, 5, 12, { door: 'left' }],
    ['Bedroom 3', 'bed', 45, 28, 13, 25], ['Bath', 'bath', 58, 28, 6, 13, { door: 'left' }], ['Closet', 'closet', 58, 41, 6, 12, { door: 'left' }]
  ] };
  T.t4 = { W: 70, D: 70, sides: 'tblr', out: [['Terrace', 0, -12, 70, 12]], rooms: [
    ['Great Room', 'living', 0, 0, 40, 26], ['Kitchen', 'kitchen', 40, 0, 18, 26], ['Dining', 'dining', 58, 0, 12, 16], ['Library', 'study', 58, 16, 12, 10],
    ['Gallery', 'gallery', 0, 26, 70, 6],
    ['Primary Bedroom', 'bed', 0, 32, 20, 38], ['Primary Bath', 'bath', 20, 32, 11, 22, { door: 'left' }], ['Dressing', 'closet', 20, 54, 11, 16, { door: 'left' }],
    ['Bedroom 2', 'bed', 31, 32, 13, 38], ['Bath', 'bath', 44, 32, 6, 22, { door: 'left' }], ['Closet', 'closet', 44, 54, 6, 16, { door: 'left' }],
    ['Bedroom 3', 'bed', 50, 32, 14, 38], ['Bath', 'bath', 64, 32, 6, 22, { door: 'left' }], ['Closet', 'closet', 64, 54, 6, 16, { door: 'left' }]
  ] };
  T.t5 = { W: 84, D: 62, sides: 'tblr', out: [['Terrace & Pool', 0, -14, 84, 14]], pool: [18, -11, 48, 8], rooms: [
    ['Living', 'living', 0, 0, 36, 26], ['Kitchen', 'kitchen', 36, 0, 20, 26], ['Dining', 'dining', 56, 0, 28, 26], ['Gallery', 'gallery', 0, 26, 84, 6],
    ['Primary Bedroom', 'bed', 0, 32, 20, 30], ['Primary Bath', 'bath', 20, 32, 12, 18, { door: 'left' }], ['Dressing', 'closet', 20, 50, 12, 12, { door: 'left' }],
    ['Bedroom 2', 'bed', 32, 32, 14, 30], ['Bath', 'bath', 46, 32, 6, 18, { door: 'left' }], ['Closet', 'closet', 46, 50, 6, 12, { door: 'left' }],
    ['Bedroom 3', 'bed', 52, 32, 14, 30], ['Bath', 'bath', 66, 32, 6, 18, { door: 'left' }], ['Closet', 'closet', 66, 50, 6, 12, { door: 'left' }],
    ['Media Room', 'media', 72, 32, 12, 30]
  ] };
  T.t6 = { W: 36, D: 32, sides: 'tblr', rooms: [
    ['Living', 'living', 0, 0, 22, 16], ['Kitchen', 'kitchen', 22, 0, 14, 16], ['Hall', 'gallery', 0, 16, 36, 4],
    ['Bedroom', 'bed', 0, 20, 16, 12], ['Bath', 'bath', 16, 20, 8, 12, { door: 'left' }], ['Study / Bed 2', 'study', 24, 20, 12, 12]
  ] };
  T.t7 = { W: 48, D: 43, sides: 'tblr', rooms: [
    ['Living', 'living', 0, 0, 22, 18], ['Dining', 'dining', 22, 0, 12, 18], ['Kitchen', 'kitchen', 34, 0, 14, 18], ['Hall', 'gallery', 0, 18, 48, 5],
    ['Bedroom 2', 'bed', 0, 23, 14, 20], ['Bedroom 3', 'bed', 14, 23, 14, 20], ['Bath', 'bath', 28, 23, 8, 10], ['Laundry', 'util', 28, 33, 8, 10, { door: 'none' }],
    ['Primary Bedroom', 'bed', 36, 23, 12, 12], ['Primary Bath', 'bath', 36, 35, 12, 8, { door: 'top' }]
  ] };
  function variant(base, extra) { var o = JSON.parse(JSON.stringify(T[base])); for (var k in extra) o[k] = extra[k]; return o; }
  T.t2r = variant('t2', { out: [['Roof Terrace', 0, -14, 54, 14]] });
  T.t3v = variant('t3', { out: [['Covered Terrace', 0, -12, 64, 12]] });
  MR.PLANS = T;

  MR.planSqft = function (key) {
    var p = T[key], s = 0; if (!p) return 0;
    p.rooms.forEach(function (r) { s += r[4] * r[5]; });
    return s;
  };
  MR.typeSqft = function (tid) { var t = MR.TYPES[tid]; return t ? MR.planSqft(t.plan) : 0; };
  MR.typeOutdoor = function (tid) {
    var p = T[MR.TYPES[tid].plan], s = 0; (p.out || []).forEach(function (o) { s += o[3] * o[4]; }); return s;
  };

  /* ── floor plan renderer ─────────────────────────────────── */
  var FILL = { living: '#FAF8F3', kitchen: '#F5F0E6', dining: '#FAF8F3', gallery: '#F2EDE3', bed: '#F7F3EA', bath: '#E9E3D5', closet: '#E4DDCD', util: '#E4DDCD', study: '#F5F0E6', media: '#EEE7D8' };
  var CH = '#1C1B19', MU = '#6B665D';
  function ft(n) { var f = Math.floor(n), i = Math.round((n - f) * 12); return f + "'" + (i ? '-' + i + '"' : '-0"'); }
  function f1(n) { return Math.round(n * 100) / 100; }

  function door(edge, x, y, w, h, u) {
    var d = 3, hx, hy, t, n;
    if (edge === 'top') { hx = x + 1; hy = y; t = [1, 0]; n = [0, 1]; }
    else if (edge === 'bottom') { hx = x + 1; hy = y + h; t = [1, 0]; n = [0, -1]; }
    else if (edge === 'left') { hx = x; hy = y + 1.2; t = [0, 1]; n = [1, 0]; }
    else { hx = x + w; hy = y + 1.2; t = [0, 1]; n = [-1, 0]; }
    var cross = t[0] * n[1] - t[1] * n[0], sweep = cross > 0 ? 1 : 0;
    var p1 = [hx + t[0] * d, hy + t[1] * d], p2 = [hx + n[0] * d, hy + n[1] * d];
    var gx = Math.min(hx, p1[0]) * u, gy = Math.min(hy, p1[1]) * u;
    var gw = Math.abs(t[0]) ? d * u : 6, gh = Math.abs(t[1]) ? d * u : 6;
    if (!Math.abs(t[0])) gx -= 3; else gy -= 3;
    return '<rect x="' + f1(gx) + '" y="' + f1(gy) + '" width="' + f1(gw) + '" height="' + f1(gh) + '" fill="#FAF8F3"/>' +
      '<path d="M' + f1(hx * u) + ' ' + f1(hy * u) + 'L' + f1(p2[0] * u) + ' ' + f1(p2[1] * u) + 'M' + f1(p1[0] * u) + ' ' + f1(p1[1] * u) + 'A' + f1(d * u) + ' ' + f1(d * u) + ' 0 0 ' + sweep + ' ' + f1(p2[0] * u) + ' ' + f1(p2[1] * u) +
      '" fill="none" stroke="' + CH + '" stroke-width="0.9"/>';
  }
  function opening(edge, x, y, w, h, u) {          /* cased opening between open rooms and gallery */
    var span = Math.min(8, (edge === 'top' || edge === 'bottom' ? w : h) - 4);
    if (span <= 2) return '';
    var cx = x + w / 2, cy = y + h / 2;
    if (edge === 'top') return '<rect x="' + f1((cx - span / 2) * u) + '" y="' + f1(y * u - 3) + '" width="' + f1(span * u) + '" height="6" fill="#FAF8F3"/>';
    if (edge === 'bottom') return '<rect x="' + f1((cx - span / 2) * u) + '" y="' + f1((y + h) * u - 3) + '" width="' + f1(span * u) + '" height="6" fill="#FAF8F3"/>';
    return '';
  }
  function win(edge, x, y, w, h, u, kind) {
    var m = kind === 'bath' ? 1.2 : 2.4, a, b, xx, yy, ww, hh, s = '';
    if (edge === 'top' || edge === 'bottom') {
      var len = w - m * 2; if (kind === 'bath') len = Math.min(len, 4); if (len < 2) return '';
      xx = (x + (w - len) / 2) * u; ww = len * u; yy = (edge === 'top' ? y : y + h) * u;
      s += '<rect x="' + f1(xx) + '" y="' + f1(yy - 3) + '" width="' + f1(ww) + '" height="6" fill="#FAF8F3"/>';
      [-2, 0, 2].forEach(function (o) { s += '<line x1="' + f1(xx) + '" x2="' + f1(xx + ww) + '" y1="' + f1(yy + o) + '" y2="' + f1(yy + o) + '" stroke="' + CH + '" stroke-width="0.8"/>'; });
      s += '<line x1="' + f1(xx) + '" x2="' + f1(xx) + '" y1="' + f1(yy - 2.5) + '" y2="' + f1(yy + 2.5) + '" stroke="' + CH + '" stroke-width="1"/><line x1="' + f1(xx + ww) + '" x2="' + f1(xx + ww) + '" y1="' + f1(yy - 2.5) + '" y2="' + f1(yy + 2.5) + '" stroke="' + CH + '" stroke-width="1"/>';
    } else {
      var len2 = h - m * 2; if (kind === 'bath') len2 = Math.min(len2, 4); if (len2 < 2) return '';
      yy = (y + (h - len2) / 2) * u; hh = len2 * u; xx = (edge === 'left' ? x : x + w) * u;
      s += '<rect x="' + f1(xx - 3) + '" y="' + f1(yy) + '" width="6" height="' + f1(hh) + '" fill="#FAF8F3"/>';
      [-2, 0, 2].forEach(function (o) { s += '<line y1="' + f1(yy) + '" y2="' + f1(yy + hh) + '" x1="' + f1(xx + o) + '" x2="' + f1(xx + o) + '" stroke="' + CH + '" stroke-width="0.8"/>'; });
      s += '<line y1="' + f1(yy) + '" y2="' + f1(yy) + '" x1="' + f1(xx - 2.5) + '" x2="' + f1(xx + 2.5) + '" stroke="' + CH + '" stroke-width="1"/><line y1="' + f1(yy + hh) + '" y2="' + f1(yy + hh) + '" x1="' + f1(xx - 2.5) + '" x2="' + f1(xx + 2.5) + '" stroke="' + CH + '" stroke-width="1"/>';
    }
    return s;
  }
  function R(x, y, w, h, u, extra) { return '<rect x="' + f1(x * u) + '" y="' + f1(y * u) + '" width="' + f1(w * u) + '" height="' + f1(h * u) + '" ' + (extra || 'fill="none" stroke="#6B665D" stroke-width="0.8"') + '/>'; }
  function furn(kind, x, y, w, h, u, name) {
    var s = '', cx = x + w / 2, cy = y + h / 2;
    var st = 'fill="#EFE8DA" stroke="#6B665D" stroke-width="0.8"';
    if (kind === 'bed') {
      var bw = Math.min(6.5, h - 4), bl = 7;
      if (w < 10 || bw < 4) return '';
      var bx = x + 0.8, by = cy - bw / 2;
      s += R(bx, by, bl, bw, u, st) + R(bx, by, 0.8, bw, u, 'fill="#6B665D" stroke="none"');
      s += R(bx + 0.9, by + 0.5, 1.5, bw / 2 - 0.8, u, 'fill="#FAF8F3" stroke="#6B665D" stroke-width="0.7"') + R(bx + 0.9, by + bw / 2 + 0.3, 1.5, bw / 2 - 0.8, u, 'fill="#FAF8F3" stroke="#6B665D" stroke-width="0.7"');
      s += R(bx, by - 1.8, 1.5, 1.5, u, st) + R(bx, by + bw + 0.3, 1.5, 1.5, u, st);
    } else if (kind === 'living') {
      var sw = Math.min(10, w - 6); if (sw < 5) return '';
      var sy = y + h - 4.6;
      s += R(cx - 6.5, cy - 4, 13, 8.5, u, 'fill="none" stroke="#A39B8B" stroke-width="0.7" stroke-dasharray="3 3"');
      s += R(cx - sw / 2, sy, sw, 3, u, st) + R(cx - sw / 2, sy + 2.2, sw, 0.8, u, 'fill="#A39B8B" stroke="none"');
      s += R(cx - 2, cy - 1.4, 4, 2.6, u, st);
      if (w > 24) { s += '<circle cx="' + f1((x + w - 5) * u) + '" cy="' + f1((cy - 3) * u) + '" r="' + f1(1.5 * u) + '" ' + st + '/>'; s += R(x + 3, cy - 3, 3, 8, u, st); }
    } else if (kind === 'dining') {
      var tl = Math.min(9, h - 7), tw = 3.6; if (tl < 4) return '';
      s += R(cx - tw / 2, cy - tl / 2, tw, tl, u, st);
      for (var i = 0; i < Math.floor(tl / 2.4); i++) { var cyy = cy - tl / 2 + 0.6 + i * 2.4; s += R(cx - tw / 2 - 1.5, cyy, 1.1, 1.4, u, st) + R(cx + tw / 2 + 0.4, cyy, 1.1, 1.4, u, st); }
    } else if (kind === 'kitchen') {
      var il = Math.min(9, h - 8); if (il < 3) return '';
      s += R(x + 0.4, y + 0.4, w - 0.8, 2.2, u, st);
      s += R(cx - 1.8, cy - il / 2 + 1, 3.6, il, u, st) + '<circle cx="' + f1(cx * u) + '" cy="' + f1((cy - il / 2 + 3) * u) + '" r="' + f1(0.7 * u) + '" fill="none" stroke="#6B665D" stroke-width="0.8"/>';
    } else if (kind === 'bath') {
      if (w >= 6 && h >= 8) {
        s += R(x + w - 3.2, y + 0.8, 2.6, Math.min(5.6, h - 2), u, 'fill="#FAF8F3" stroke="#6B665D" stroke-width="0.8" rx="' + f1(1.2 * u) + '"');
        s += R(x + 0.6, y + h - 3.6, 1.6, 2.6, u, st) + '<circle cx="' + f1((x + 1.4) * u) + '" cy="' + f1((y + h - 5) * u) + '" r="' + f1(0.5 * u) + '" fill="none" stroke="#6B665D" stroke-width="0.8"/>';
      } else if (w >= 5) { s += R(x + 0.6, y + 0.6, Math.min(3.4, w - 1.2), Math.min(3.4, h - 1.2), u, 'fill="#FAF8F3" stroke="#6B665D" stroke-width="0.8"') + R(x + 0.6, y + h - 2.8, 1.6, 2.2, u, st); }
    } else if (kind === 'closet') {
      if (h >= 5) { s += '<line x1="' + f1((x + 1) * u) + '" x2="' + f1((x + 1) * u) + '" y1="' + f1((y + 0.8) * u) + '" y2="' + f1((y + h - 0.8) * u) + '" stroke="#6B665D" stroke-width="1.4" stroke-dasharray="1.5 2"/>'; }
    } else if (kind === 'util') {
      if (w >= 5 && h >= 4) { s += R(x + 0.5, y + 0.5, 2.2, 2.2, u, st) + R(x + 3, y + 0.5, 2.2, 2.2, u, st); }
    } else if (kind === 'media') {
      s += R(x + 0.6, cy - 4, 1, 8, u, 'fill="#6B665D" stroke="none"') + R(cx - 1.5, cy - 5.5, 3.5, 4.5, u, st) + R(cx - 1.5, cy + 1, 3.5, 4.5, u, st);
    } else if (kind === 'study') {
      if (w >= 9 && h >= 7) { s += R(x + 0.5, y + 0.5, w - 1, 1.2, u, 'fill="#E4DDCD" stroke="#6B665D" stroke-width="0.7"') + R(cx - 3, cy - 1, 6, 2.4, u, st); }
    }
    return s;
  }

  MR.planSVG = function (key, o) {
    o = o || {};
    var P = T[key]; if (!P) return '';
    var mini = !!o.mini, u = o.unit || (mini ? 6 : 12), m = mini ? 8 : 64;
    var outs = P.out || [], minY = 0, maxX = P.W, maxY = P.D;
    outs.forEach(function (q) { minY = Math.min(minY, q[2]); });
    var vw = P.W * u + m * 2, vh = (P.D - minY) * u + m * 2 + (mini ? 0 : 20);
    var ox = m, oy = m - minY * u;
    var s = '<svg class="plan-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + f1(vw) + ' ' + f1(vh) + '" role="img" aria-label="' + (o.label || 'Floor plan') + '">';
    s += '<defs><pattern id="hatch' + key + '" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#A39B8B" stroke-width="0.8"/></pattern></defs>';
    s += '<g transform="translate(' + f1(ox) + ' ' + f1(oy) + ')">';
    /* outdoor areas */
    outs.forEach(function (q) {
      s += '<rect x="' + f1(q[1] * u) + '" y="' + f1(q[2] * u) + '" width="' + f1(q[3] * u) + '" height="' + f1(q[4] * u) + '" fill="url(#hatch' + key + ')" stroke="#A39B8B" stroke-width="1" stroke-dasharray="5 4"/>';
      if (!mini) s += '<text x="' + f1((q[1] + 1.2) * u) + '" y="' + f1((q[2] + 1.8) * u) + '" class="pl-t">' + q[0].toUpperCase() + ' · ' + Math.round(q[3] * q[4]) + ' SQ FT</text>';
    });
    if (P.pool) { var pl = P.pool; s += '<rect x="' + f1(pl[0] * u) + '" y="' + f1(pl[1] * u) + '" width="' + f1(pl[2] * u) + '" height="' + f1(pl[3] * u) + '" fill="#E4EAEA" stroke="#6B665D" stroke-width="1"/>'; }
    /* rooms */
    var gal = P.rooms.filter(function (r) { return r[1] === 'gallery'; })[0];
    P.rooms.forEach(function (r) {
      s += '<rect x="' + f1(r[2] * u) + '" y="' + f1(r[3] * u) + '" width="' + f1(r[4] * u) + '" height="' + f1(r[5] * u) + '" fill="' + (FILL[r[1]] || '#F7F3EA') + '" stroke="' + CH + '" stroke-width="' + (mini ? 1.4 : 1.5) + '"/>';
    });
    if (!mini) {
      P.rooms.forEach(function (r) { s += furn(r[1], r[2], r[3], r[4], r[5], u, r[0]); });
    }
    /* exterior wall */
    s += '<rect x="0" y="0" width="' + f1(P.W * u) + '" height="' + f1(P.D * u) + '" fill="none" stroke="' + CH + '" stroke-width="' + (mini ? 3 : 5) + '"/>';
    if (!mini) {
      P.rooms.forEach(function (r) {
        var x = r[2], y = r[3], w = r[4], h = r[5], k = r[1], op = r[6] || {};
        if (k === 'gallery') return;
        /* windows on exterior edges */
        if (k !== 'util' && k !== 'closet') {
          var sides = P.sides || 'tb';
          if (y === 0 && sides.indexOf('t') > -1) s += win('top', x, y, w, h, u, k);
          if (Math.abs(y + h - P.D) < 0.01 && sides.indexOf('b') > -1) s += win('bottom', x, y, w, h, u, k);
          if (x === 0 && sides.indexOf('l') > -1) s += win('left', x, y, w, h, u, k);
          if (Math.abs(x + w - P.W) < 0.01 && sides.indexOf('r') > -1) s += win('right', x, y, w, h, u, k);
        }
        /* doors / openings */
        var edge = op.door;
        if (edge === 'none') return;
        if (!edge && gal) {
          if (y === gal[3] + gal[5]) edge = 'top';
          else if (y + h === gal[3]) edge = 'bottom';
        }
        if (!edge) return;
        if ((k === 'living' || k === 'kitchen' || k === 'dining') && (edge === 'top' || edge === 'bottom')) s += opening(edge, x, y, w, h, u);
        else s += door(edge, x, y, w, h, u);
      });
      /* labels */
      P.rooms.forEach(function (r) {
        var x = r[2], y = r[3], w = r[4], h = r[5], k = r[1];
        var small = Math.min(w, h) < 7 || w * h < 70;
        var cx = (x + w / 2) * u, cy = (y + h / 2) * u;
        if (k === 'living' || k === 'dining' || k === 'kitchen') cy = (y + h / 2 - 5.5) * u;
        if (k === 'bed') cy = (y + h / 2 - (h > 14 ? 5.2 : 4)) * u;
        if (w < 6 && h > w) {
          s += '<text transform="translate(' + f1(cx) + ' ' + f1(cy) + ') rotate(-90)" class="pl-s" text-anchor="middle">' + r[0].toUpperCase() + '</text>';
          return;
        }
        if (k === 'gallery') { s += '<text x="' + f1(cx) + '" y="' + f1(cy + 3) + '" class="pl-s" text-anchor="middle">' + r[0].toUpperCase() + '</text>'; return; }
        s += '<text x="' + f1(cx) + '" y="' + f1(cy) + '" class="' + (small ? 'pl-s' : 'pl-n') + '" text-anchor="middle">' + r[0].toUpperCase() + '</text>';
        if (!small) s += '<text x="' + f1(cx) + '" y="' + f1(cy + 12) + '" class="pl-d" text-anchor="middle">' + ft(w) + ' × ' + ft(h) + '</text>';
      });
      /* overall dimensions */
      var dy = (minY - 2.6) * u, dx = -3.2 * u;
      s += '<g class="pl-dim"><line x1="0" x2="' + f1(P.W * u) + '" y1="' + f1(dy) + '" y2="' + f1(dy) + '"/><line x1="0" x2="0" y1="' + f1(dy - 5) + '" y2="' + f1(dy + 5) + '"/><line x1="' + f1(P.W * u) + '" x2="' + f1(P.W * u) + '" y1="' + f1(dy - 5) + '" y2="' + f1(dy + 5) + '"/>' +
        '<line x1="' + f1(dx) + '" x2="' + f1(dx) + '" y1="0" y2="' + f1(P.D * u) + '"/><line x1="' + f1(dx - 5) + '" x2="' + f1(dx + 5) + '" y1="0" y2="0"/><line x1="' + f1(dx - 5) + '" x2="' + f1(dx + 5) + '" y1="' + f1(P.D * u) + '" y2="' + f1(P.D * u) + '"/></g>';
      s += '<text x="' + f1(P.W * u / 2) + '" y="' + f1(dy - 7) + '" class="pl-d" text-anchor="middle">' + ft(P.W) + '</text>';
      s += '<text transform="translate(' + f1(dx - 8) + ' ' + f1(P.D * u / 2) + ') rotate(-90)" class="pl-d" text-anchor="middle">' + ft(P.D) + '</text>';
      /* north arrow + scale bar */
      var ax = (P.W + 2.4) * u, ay = (minY + 2) * u;
      s += '<g transform="translate(' + f1(ax) + ' ' + f1(ay) + ')"><circle r="15" fill="none" stroke="' + CH + '" stroke-width="0.9"/><path d="M0 -11L5 8L0 4L-5 8Z" fill="' + CH + '"/><text y="-19" class="pl-s" text-anchor="middle">N</text></g>';
      var sy = (P.D + 3.2) * u;
      s += '<g transform="translate(0 ' + f1(sy) + ')"><rect width="' + f1(5 * u) + '" height="4" fill="' + CH + '"/><rect x="' + f1(5 * u) + '" width="' + f1(5 * u) + '" height="4" fill="none" stroke="' + CH + '" stroke-width="0.8"/><text y="16" class="pl-d">0</text><text x="' + f1(5 * u) + '" y="16" class="pl-d" text-anchor="middle">5</text><text x="' + f1(10 * u) + '" y="16" class="pl-d" text-anchor="end">10 FT</text></g>';
    }
    s += '</g></svg>';
    return s;
  };

  /* ── neighborhood map ───────────────────────────────────── */
  function lcg(seed) { var s = seed; return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
  MR.mapSVG = function (cityKey, o) {
    o = o || {};
    var H = MR.HOODS[cityKey], dev = MR.DEVS.filter(function (d) { return d.cityKey === cityKey; })[0];
    var st = dev.map.style, r = lcg(cityKey.charCodeAt(0) * 97 + 11), W = 1000, Ht = 700;
    var s = '<svg class="map-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + Ht + '" role="img" aria-label="Illustrative map of ' + H.title + '">';
    s += '<rect width="1000" height="700" fill="#E7E1D4"/>';
    var rot = { ny: 24, mia: -8, la: 0, atx: 12 }[st];
    /* land use */
    if (st === 'la') {
      for (var i = 0; i < 16; i++) {
        var rx = 90 + i * 52, ry = 40 + i * 36;
        s += '<ellipse cx="' + (420 + i * 8) + '" cy="' + (330 - i * 4) + '" rx="' + (30 + i * 52) + '" ry="' + (20 + i * 34) + '" fill="none" stroke="#D8D0BF" stroke-width="' + (i % 4 === 0 ? 1.6 : 0.9) + '" transform="rotate(-18 500 330)"/>';
      }
      s += '<path d="M-20 560C200 500 330 560 520 470S820 400 1020 440" fill="none" stroke="#FAF8F3" stroke-width="9"/><path d="M-20 560C200 500 330 560 520 470S820 400 1020 440" fill="none" stroke="#CBC4B6" stroke-width="1"/>';
      s += '<path d="M500 350C560 300 640 270 760 240" fill="none" stroke="#FAF8F3" stroke-width="6"/>';
    } else {
      s += '<g transform="rotate(' + rot + ' 500 350)">';
      var step = st === 'atx' ? 62 : 54;
      for (var x = -400; x < 1500; x += step) s += '<line x1="' + x + '" y1="-400" x2="' + x + '" y2="1100" stroke="#F8F4EA" stroke-width="' + (x % (step * 4) === 0 ? 11 : 6) + '"/>';
      for (var y = -400; y < 1100; y += step * 0.82) s += '<line x1="-400" y1="' + y + '" x2="1500" y2="' + y + '" stroke="#F8F4EA" stroke-width="' + (Math.round(y / (step * 0.82)) % 4 === 0 ? 10 : 5) + '"/>';
      s += '</g>';
      s += '<path d="M-40 640L1040 230" stroke="#FAF8F3" stroke-width="16"/><path d="M-40 640L1040 230" stroke="#CBC4B6" stroke-width="1"/>';
    }
    /* parks */
    var parks = { ny: [[690, 520, 120, 80], [560, 90, 70, 50]], mia: [[430, 540, 140, 90], [200, 120, 90, 60]], la: [[600, 90, 220, 140], [120, 130, 120, 100]], atx: [[300, 260, 200, 120], [620, 90, 160, 70]] }[st];
    parks.forEach(function (p) { s += '<rect x="' + p[0] + '" y="' + p[1] + '" width="' + p[2] + '" height="' + p[3] + '" rx="10" fill="#D5D8C3"/>'; });
    /* water */
    var wtr = '';
    if (dev.map.water === 'west') wtr = 'M-10 0L120 0C90 120 150 220 100 330S130 560 90 700L-10 700Z';
    if (dev.map.water === 'east') wtr = 'M1010 0L880 0C920 110 850 220 905 340S870 560 920 700L1010 700Z';
    if (dev.map.water === 'river') wtr = 'M-10 520C180 470 300 590 470 560S760 600 1010 540L1010 700L-10 700Z';
    if (wtr) s += '<path d="' + wtr + '" fill="#C6CFD1"/><path d="' + wtr + '" fill="none" stroke="#B3BDC0" stroke-width="2"/>';
    s += '<text x="' + (st === 'la' ? 500 : 500) + '" y="360" class="map-area" text-anchor="middle">' + H.title.toUpperCase() + '</text>';
    /* walk rings */
    var cx = 500, cy = 350;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="130" fill="none" stroke="#6B665D" stroke-width="1" stroke-dasharray="3 5"/><circle cx="' + cx + '" cy="' + cy + '" r="260" fill="none" stroke="#6B665D" stroke-width="1" stroke-dasharray="3 5"/>';
    s += '<text x="' + (cx + 134) + '" y="' + (cy - 4) + '" class="map-ring">5 MIN</text><text x="' + (cx + 264) + '" y="' + (cy - 4) + '" class="map-ring">10 MIN</text>';
    /* POIs */
    H.pois.forEach(function (p) {
      var px = p.x * 10, py = p.y * 7;
      s += '<g class="map-poi" data-n="' + p.n + '" data-cat="' + p.cat + '" tabindex="0" transform="translate(' + px + ' ' + py + ')"><circle r="15" class="mp-bg"/><text y="4.5" text-anchor="middle" class="mp-n">' + p.n + '</text></g>';
    });
    /* development marker */
    s += '<g transform="translate(' + cx + ' ' + cy + ')"><circle r="30" fill="#1C1B19" opacity=".12"/><circle r="22" fill="#1C1B19"/><g transform="translate(-12 -12) scale(.24)" color="#FAF8F3" style="--mr-pier:#B38E62"><use href="#mr-mono" width="100" height="100"/></g></g>';
    s += '<text x="' + cx + '" y="' + (cy + 46) + '" class="map-dev" text-anchor="middle">' + dev.name.toUpperCase() + '</text>';
    s += '<g transform="translate(940 650)"><circle r="16" fill="none" stroke="#1C1B19" stroke-width=".9"/><path d="M0 -11L5 8L0 4L-5 8Z" fill="#1C1B19"/></g>';
    s += '</svg>';
    return s;
  };

  /* ── building section (Architecture page) ────────────────── */
  MR.sectionSVG = function () {
    var W = 1180, H = 760, g = 640, fh = 34, s = '<svg class="sec-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Schematic section through a Mason & Rowe tower">';
    var C = '#1C1B19', B = '#8B6B47', ox = 190;
    s += '<defs><pattern id="sx" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="#A39B8B" stroke-width=".8"/></pattern></defs>';
    s += '<line x1="0" x2="' + W + '" y1="' + g + '" y2="' + g + '" stroke="' + C + '" stroke-width="2"/>';
    s += '<rect x="0" y="' + g + '" width="' + W + '" height="120" fill="url(#sx)"/>';
    var x0 = 300 + ox, x1 = 640 + ox;
    s += '<rect x="' + (x0 - 40) + '" y="' + g + '" width="' + (x1 - x0 + 80) + '" height="86" fill="#FAF8F3" stroke="' + C + '" stroke-width="3"/>';
    s += '<rect x="' + (x0 - 40) + '" y="' + (g + 43) + '" width="' + (x1 - x0 + 80) + '" height="5" fill="' + C + '"/>';
    s += '<rect x="' + (x0 - 40) + '" y="' + (g - 62) + '" width="' + (x1 - x0 + 80) + '" height="62" fill="#FAF8F3" stroke="' + C + '" stroke-width="3"/>';
    var tiers = [[0, 11, x0, x1], [11, 14, x0 + 40, x1 - 40]];
    tiers.forEach(function (t) {
      for (var f = t[0]; f < t[1]; f++) {
        var y = g - 62 - (f + 1) * fh;
        s += '<rect x="' + t[2] + '" y="' + y + '" width="' + (t[3] - t[2]) + '" height="' + fh + '" fill="#FAF8F3" stroke="' + C + '" stroke-width="1.4"/>';
        s += '<rect x="' + (t[2] - 6) + '" y="' + (y + fh - 6) + '" width="' + (t[3] - t[2] + 12) + '" height="6" fill="' + C + '"/>';
        s += '<rect x="' + (t[2] - 3) + '" y="' + y + '" width="8" height="' + fh + '" fill="' + B + '"/><rect x="' + (t[3] - 5) + '" y="' + y + '" width="8" height="' + fh + '" fill="' + B + '"/>';
        s += '<line x1="' + (t[2] + 90) + '" x2="' + (t[2] + 90) + '" y1="' + y + '" y2="' + (y + fh - 6) + '" stroke="' + C + '" stroke-width="2"/>';
      }
    });
    var ty = g - 62 - 14 * fh;
    s += '<rect x="' + (x0 + 110) + '" y="' + (ty - 40) + '" width="' + (x1 - x0 - 220) + '" height="40" fill="#F2EDE3" stroke="' + C + '" stroke-width="3"/><rect x="' + (x0 + 100) + '" y="' + (ty - 46) + '" width="' + (x1 - x0 - 200) + '" height="8" fill="' + C + '"/>';
    s += '<rect x="' + (x0 - 6) + '" y="' + (g - 62 - 11 * fh - 8) + '" width="46" height="8" fill="#5E4529"/><rect x="' + (x1 - 40) + '" y="' + (g - 62 - 11 * fh - 8) + '" width="46" height="8" fill="#5E4529"/>';
    /* labels: right-hand labels start at x=R, left-hand labels end at x=L */
    var R = x1 + 90, L = 20;
    function lab(x, y, side, t, n) {
      if (side === 'r') {
        s += '<line x1="' + x + '" y1="' + y + '" x2="' + R + '" y2="' + y + '" stroke="' + C + '" stroke-width=".9"/><circle cx="' + x + '" cy="' + y + '" r="3" fill="' + C + '"/>';
        s += '<text x="' + (R + 10) + '" y="' + (y + 4) + '" class="sec-t"><tspan class="sec-n">' + n + '</tspan> ' + t + '</text>';
      } else {
        s += '<line x1="' + (L + 200) + '" y1="' + y + '" x2="' + x + '" y2="' + y + '" stroke="' + C + '" stroke-width=".9"/><circle cx="' + x + '" cy="' + y + '" r="3" fill="' + C + '"/>';
        s += '<text x="' + L + '" y="' + (y + 4) + '" class="sec-t"><tspan class="sec-n">' + n + '</tspan> ' + t + '</text>';
      }
    }
    lab(x0 + 220, ty - 20, 'r', 'CROWN PAVILION', '01');
    lab(x1 - 20, g - 62 - 11 * fh - 4, 'r', 'PLANTED SETBACK TERRACE', '02');
    lab(x1 - 20, g - 62 - 6 * fh, 'r', 'RESIDENCES · 10′-6″ CEILINGS', '03');
    lab(x0 + 8, g - 62 - 4 * fh, 'l', 'BRONZE SPANDREL', '04');
    lab(x0 + 8, g - 62 - 8 * fh, 'l', 'LIMESTONE PIER', '05');
    lab(x1 + 40, g - 30, 'r', 'LOBBY & RECEPTION', '06');
    lab(x0 - 30, g + 24, 'l', 'SPA & LAP POOL', '07');
    lab(x1 + 40, g + 66, 'r', 'WINE CELLAR', '08');
    s += '<g transform="translate(60 720)"><rect width="100" height="4" fill="' + C + '"/><text y="20" class="sec-t">0 — 30 FT</text></g></svg>';
    return s;
  };
})();
