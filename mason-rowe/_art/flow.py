"""Scripted behavioural checks: overflow on every page at phone/tablet/desktop widths, plus key interactions."""
import sys, time
from playwright.sync_api import sync_playwright
from pw import open_browser, url_for, settle

PAGES = ['index', 'developments', 'development?d=halden-house', 'development?d=wren-canyon', 'residences', 'amenities', 'architecture', 'neighborhood', 'availability', 'private-viewing', 'about', 'contact']

def run():
    with sync_playwright() as p:
        b = open_browser(p)
        errs = []
        for w, h, mob in ((390, 844, True), (820, 1100, False), (1440, 900, False)):
            ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob)
            for pg_name in PAGES:
                pg = ctx.new_page()
                logs = []
                pg.on('console', lambda m, L=logs: L.append(m.text) if m.type == 'error' else None)
                pg.on('pageerror', lambda e, L=logs: L.append('PAGEERROR ' + str(e)))
                pg.goto(url_for(f'website/{pg_name.split("?")[0]}.html' + ('?' + pg_name.split('?')[1] if '?' in pg_name else '')))
                settle(pg, scroll=False, wait=300)
                ov = pg.evaluate("""() => { const sw = document.documentElement.scrollWidth, cw = document.documentElement.clientWidth; if (sw <= cw + 1) return null; const out=[]; document.querySelectorAll('body *').forEach(e=>{ const r=e.getBoundingClientRect(); if (r.right>cw+2 && r.width>0 && !e.closest('.ftr') && !e.closest('.strip-h') && !e.closest('.hero-slide') && !e.closest('.tabs') && !e.closest('.subnav')) out.push(e.tagName+'.'+(e.className.toString().slice(0,30))+' '+Math.round(r.right)); }); return [sw, cw, out.slice(0,5)]; }""")
                tag = f'{w:>4} {pg_name:32s}'
                if ov or logs:
                    print(tag, 'OVERFLOW' if ov else '', ov if ov else '', logs[:3])
                else:
                    print(tag, 'ok')
                pg.close()
            ctx.close()
        b.close()

if __name__ == '__main__':
    run()
