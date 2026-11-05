# -*- coding: utf-8 -*-
"""Full-page review capture: scrolls through so every reveal fires, then takes one tall image.  python tools/oa/sweep.py OUT.png PATH W H"""
import sys
from playwright.sync_api import sync_playwright
out, path, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True)
    ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=w < 700, has_touch=w < 700, reduced_motion='no-preference')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: print('PAGEERROR', str(e)[:400]))
    pg.goto('http://localhost:8131' + path)
    pg.wait_for_timeout(1500)
    H = pg.evaluate('document.documentElement.scrollHeight')
    y = 0
    while y < H:
        pg.evaluate('(y)=>window.scrollTo({top:y,behavior:"instant"})', y)
        pg.wait_for_timeout(180)
        y += int(h * .6)
    pg.wait_for_timeout(1200)
    pg.evaluate('window.scrollTo({top:0,behavior:"instant"})')
    pg.wait_for_timeout(500)
    print('height', H, 'overflow', pg.evaluate('document.documentElement.scrollWidth - innerWidth'))
    pg.screenshot(path=out, full_page=True)
    b.close()
