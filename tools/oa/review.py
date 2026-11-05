# -*- coding: utf-8 -*-
"""Review screenshots with the live 3D running.  python tools/oa/review.py OUTDIR PATH WIDTH HEIGHT [sel1 sel2 ...]
Each selector scrolls that element to the top of the view before its shot. 'top' means the top of the page."""
import sys
from playwright.sync_api import sync_playwright
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
out, path, w, h, *sels = sys.argv[1:]
w, h = int(w), int(h)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=ARGS)
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=w < 700, has_touch=w < 700)
    pg = ctx.new_page()
    pg.on('console', lambda m: print('CONSOLE', m.type, m.text[:300]) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: print('PAGEERROR', str(e)[:400]))
    pg.on('requestfailed', lambda r: print('FAILED', r.url))
    pg.goto('http://localhost:8131' + path)
    pg.wait_for_timeout(5500)
    print('gl:', pg.evaluate("document.documentElement.classList.contains('gl')"), 'overflow:', pg.evaluate('document.documentElement.scrollWidth - innerWidth'))
    for i, s in enumerate(sels or ['top']):
        if s == 'top':
            pg.evaluate('window.scrollTo({top:0,behavior:"instant"})')
        else:
            pg.evaluate('(s)=>{const e=document.querySelector(s);window.scrollTo({top:e.getBoundingClientRect().top+scrollY-(window.__off||0),behavior:"instant"})}', s)
        pg.wait_for_timeout(1800)
        pg.screenshot(path=f'{out}/r{i}.png')
    b.close()
