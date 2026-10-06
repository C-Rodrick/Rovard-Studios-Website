"""Quick speed + accessibility audit of the built site, using headless Chrome (tools/cdp.py).
Run with the preview server up (python -m http.server 8000):  python tools/audit_site.py
Checks per page: title/description/lang, one h1 and heading order, image alts, unnamed links/buttons, form labels, duplicate ids,
text contrast (where the background is a flat colour), sideways scroll at phone width, page weight and the biggest files."""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser

BASE = 'http://localhost:8000/'
PAGES = ['', 'services/', 'services/logo-design/', 'work/', 'work/bitefort/', 'pricing/', 'blog/', 'blog/how-to-brief-a-designer/', 'about/', 'start/', 'privacy/', 'fr/', 'fr/pricing/', 'fr/start/']

JS = r"""
(() => {
  const out = {issues: [], info: {}};
  const add = (t, d) => out.issues.push(t + ': ' + d);
  const d = document;
  if (!d.documentElement.lang) add('lang', 'missing');
  if (!d.title) add('title', 'missing');
  const md = d.querySelector('meta[name=description]'); if (!md || !md.content) add('description', 'missing');
  const h = [...d.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  const h1 = h.filter(x => x.tagName === 'H1').length; if (h1 !== 1) add('h1', 'count ' + h1);
  let last = 0; h.forEach(x => { const l = +x.tagName[1]; if (last && l > last + 1) add('heading order', x.tagName + ' after h' + last + ': ' + x.textContent.trim().slice(0, 40)); last = l; });
  [...d.images].forEach(i => { if (!i.hasAttribute('alt')) add('img alt', 'missing on ' + (i.currentSrc || i.src).split('/').slice(-2).join('/')); });
  [...d.querySelectorAll('a,button,[role=button]')].forEach(e => {
    const name = (e.getAttribute('aria-label') || e.textContent || '').trim() || (e.querySelector('img[alt]') || {alt: ''}).alt;
    if (!name && !e.closest('[aria-hidden=true]') && e.offsetParent !== null) add('name', e.tagName + ' ' + (e.className || '').toString().slice(0, 30) + ' has no accessible name');
  });
  [...d.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select')].forEach(e => {
    if (e.closest('.trap')) return;
    const has = e.id && d.querySelector('label[for="' + e.id + '"]') || e.closest('label') || e.getAttribute('aria-label');
    if (!has) add('form label', (e.name || e.id) + ' has no label');
  });
  const ids = {}; [...d.querySelectorAll('[id]')].forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
  Object.entries(ids).forEach(([k, v]) => { if (v > 1) add('duplicate id', k); });
  // contrast
  const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
  const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return {c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1}; };
  const bgOf = el => { let e = el; while (e) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') return null; const p = parse(cs.backgroundColor); if (p && p.a > .85) return p.c; e = e.parentElement; } return [255, 255, 255]; };
  const seen = new Set(); let low = 0;
  d.querySelectorAll('p,li,a,span,h1,h2,h3,h4,small,label,button,summary,figcaption,em,b').forEach(el => {
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2)) return;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .9 || el.offsetParent === null) return;
    if (el.closest('.sr-only,[aria-hidden=true],.lg-item,.cards-row,.close-r,.hero,.logos,.pan,.dark,.menu-panel,.pk-feat,.bband,.film')) return;
    const fg = parse(cs.color); const bg = bgOf(el); if (!fg || !bg) return;
    const L1 = lum(fg.c), L2 = lum(bg); const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700; const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    if (ratio < need) { const key = cs.color + '|' + bg + '|' + size; if (!seen.has(key)) { seen.add(key); add('contrast', ratio.toFixed(2) + ' (needs ' + need + ') ' + cs.color + ' on rgb(' + bg + ') ' + size + 'px: "' + el.textContent.trim().slice(0, 40) + '"'); } low++; }
  });
  // weight
  const res = performance.getEntriesByType('resource'); const nav = performance.getEntriesByType('navigation')[0];
  let total = (nav && nav.transferSize) || 0; res.forEach(r => { total += r.transferSize || 0; });
  out.info.kb = Math.round(total / 1024); out.info.requests = res.length + 1;
  out.info.big = res.filter(r => (r.transferSize || 0) > 400 * 1024).map(r => r.name.split('/').slice(-2).join('/') + ' ' + Math.round(r.transferSize / 1024) + 'KB');
  out.info.sideways = d.documentElement.scrollWidth > innerWidth;
  return JSON.stringify(out);
})()
"""

problems = 0
for mobile in (False, True):
    with Browser(390 if mobile else 1440, 800 if mobile else 900, mobile=mobile) as b:
        for p in PAGES:
            b.goto(BASE + p); b.wait(2600)
            b.js("window.scrollTo(0, document.body.scrollHeight)"); b.wait(900); b.js("window.scrollTo(0,0)"); b.wait(300)
            r = json.loads(b.js(JS))
            tag = ('mobile ' if mobile else 'desktop ') + (p or 'home')
            line = f"{tag:48} {r['info']['kb']:>6} KB {r['info']['requests']:>3} req" + ('  SIDEWAYS SCROLL' if r['info']['sideways'] else '')
            print(line)
            for big in r['info']['big']:
                print('    big file:', big)
            for i in r['issues'][:12]:
                print('    -', i); problems += 1
print('issues:', problems)
