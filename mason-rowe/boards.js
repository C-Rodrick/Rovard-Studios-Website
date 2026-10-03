/* Boards runtime: ?only=bNN shows one board at 1:1; otherwise all boards are previewed scaled.
   Also computes live colour values and contrast ratios so the guidelines never go stale. */
(function () {
  var q = new URLSearchParams(location.search), only = q.get('only');
  if (only) {
    document.body.classList.add('only');
    var el = document.getElementById(only); if (el) el.classList.add('show');
  }
  function rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function lum(h) { var c = rgb(h).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function cr(a, b) { var A = lum(a), B = lum(b), hi = Math.max(A, B), lo = Math.min(A, B); return (hi + .05) / (lo + .05); }
  function cmyk(h) { var c = rgb(h).map(function (v) { return v / 255; }), k = 1 - Math.max.apply(null, c); if (k >= 1) return [0, 0, 0, 100]; return c.map(function (v) { return Math.round((1 - v - k) / (1 - k) * 100); }).concat([Math.round(k * 100)]); }
  window.BD = { rgb: rgb, lum: lum, cr: cr, cmyk: cmyk };

  document.querySelectorAll('[data-hex]').forEach(function (e) {
    var h = e.getAttribute('data-hex'), r = rgb(h), k = cmyk(h);
    var t = e.querySelector('.vals'); if (t) t.innerHTML = 'HEX ' + h.toUpperCase() + '<br>RGB ' + r.join(' · ') + '<br>CMYK ' + k.join(' · ');
  });
  document.querySelectorAll('[data-pair]').forEach(function (e) {
    var p = e.getAttribute('data-pair').split(','), r = cr(p[0], p[1]);
    var g = r >= 7 ? ['AAA', 'aaa'] : r >= 4.5 ? ['AA', 'aa'] : r >= 3 ? ['Large text · UI', 'ui'] : ['Decorative only', 'na'];
    e.querySelector('.ratio').textContent = r.toFixed(2) + ' : 1';
    var gr = e.querySelector('.grade'); gr.textContent = g[0]; gr.className = 'grade ' + g[1];
  });
  /* stacking-cell + plan snippets reuse the site's own generators when available */
  if (window.MR && MR.planSVG) {
    document.querySelectorAll('[data-plan]').forEach(function (e) { e.innerHTML = MR.planSVG(e.getAttribute('data-plan'), { mini: e.hasAttribute('data-mini') }); });
  }
})();
