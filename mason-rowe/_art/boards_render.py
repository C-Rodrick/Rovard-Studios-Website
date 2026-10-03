"""Render portfolio boards to 2400x1600 JPG.

  py boards_render.py preview boards-brand-1 b01 b02      -> _shots/board_<id>.png (quick look)
  py boards_render.py brand                                -> every brand board into assets/Brand Identitities/7_Mason and Rowe
  py boards_render.py ui                                   -> every UI board into assets/UI Design/5_Mason and Rowe

Boards live in ../boards-*.html and are shown one at a time with ?only=<id>.
"""
import os
import re
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

from pw import open_browser, url_for, ROOT

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(ROOT, '..'))
BRAND_DIR = os.path.join(REPO, 'assets', 'Brand Identitities', '7_Mason and Rowe')
UI_DIR = os.path.join(REPO, 'assets', 'UI Design', '5_Mason and Rowe')
THUMBS = os.path.join(REPO, 'assets', 'thumbs')

BRAND = [('boards-brand-1', 'b01', 'mr-brand-01-cover'), ('boards-brand-1', 'b02', 'mr-brand-02-strategy'),
         ('boards-brand-1', 'b03', 'mr-brand-03-personality'), ('boards-brand-1', 'b04', 'mr-brand-04-monogram'),
         ('boards-brand-1', 'b05', 'mr-brand-05-wordmark'), ('boards-brand-1', 'b06', 'mr-brand-06-usage'),
         ('boards-brand-1', 'b07', 'mr-brand-07-color'), ('boards-brand-1', 'b08', 'mr-brand-08-accessibility'),
         ('boards-brand-2', 'b09', 'mr-brand-09-typography'), ('boards-brand-2', 'b10', 'mr-brand-10-graphic-system'),
         ('boards-brand-2', 'b11', 'mr-brand-11-photography'), ('boards-brand-2', 'b12', 'mr-brand-12-layout'),
         ('boards-brand-2', 'b13', 'mr-brand-13-stationery'), ('boards-brand-2', 'b14', 'mr-brand-14-signage'),
         ('boards-brand-2', 'b15', 'mr-brand-15-brochure'), ('boards-brand-2', 'b16', 'mr-brand-16-digital')]
UI = [('boards-ui', 'u01', 'mr-ui-01-cover'), ('boards-ui', 'u02', 'mr-ui-02-sitemap'), ('boards-ui', 'u03', 'mr-ui-03-system'),
      ('boards-ui', 'u04', 'mr-ui-04-home'), ('boards-ui', 'u05', 'mr-ui-05-development'), ('boards-ui', 'u06', 'mr-ui-06-property'),
      ('boards-ui', 'u07', 'mr-ui-07-pages'), ('boards-ui', 'u08', 'mr-ui-08-viewing'), ('boards-ui', 'u09', 'mr-ui-09-mobile'),
      ('boards-ui', 'u10', 'mr-ui-10-responsive'), ('boards-ui', 'u11', 'mr-ui-11-motion')]


def render(jobs, out_dir=None, preview=False, quality=88, only_ids=None):
    with sync_playwright() as p:
        b = open_browser(p)
        ctx = b.new_context(viewport={'width': 2400, 'height': 1600}, device_scale_factor=1)
        for page_name, bid, fname in jobs:
            if only_ids and bid not in only_ids:
                continue
            pg = ctx.new_page()
            logs = []
            pg.on('console', lambda m, L=logs: L.append(m.text) if m.type == 'error' else None)
            pg.on('pageerror', lambda e, L=logs: L.append(str(e)))
            fonts_ok = False
            for attempt in range(4):
                pg.goto(url_for(f'{page_name}.html?only={bid}'))
                pg.wait_for_load_state('load')
                pg.evaluate('document.fonts.ready')
                pg.wait_for_timeout(600)
                fams = pg.evaluate("[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family.replace(/['\\\"]/g,''))")
                if 'Newsreader' in fams and 'Jost' in fams:
                    fonts_ok = True
                    break
                pg.wait_for_timeout(2500)
            if not fonts_ok:
                raise SystemExit(f'{bid}: brand fonts (Newsreader, Jost) did not load - check the network and retry; refusing to save a fallback-font board')
            pg.evaluate("document.querySelectorAll('img').forEach(i=>i.loading='eager')")
            try:
                pg.wait_for_function('[...document.images].every(i=>i.complete)', timeout=15000)
            except Exception:
                pass
            pg.wait_for_timeout(900)
            if preview:
                out = os.path.join(HERE, '_shots', f'board_{bid}.png')
                os.makedirs(os.path.dirname(out), exist_ok=True)
                pg.locator(f'#{bid}').screenshot(path=out)
            else:
                os.makedirs(out_dir, exist_ok=True)
                tmp = os.path.join(HERE, '_shots', f'_tmp_{bid}.png')
                os.makedirs(os.path.dirname(tmp), exist_ok=True)
                pg.locator(f'#{bid}').screenshot(path=tmp)
                out = os.path.join(out_dir, fname + '.jpg')
                Image.open(tmp).convert('RGB').save(out, 'JPEG', quality=quality, optimize=True, progressive=True)
                os.remove(tmp)
            print(('ok ' if not logs else 'ok(+errors) ') + bid, os.path.basename(out), os.path.getsize(out) // 1024, 'KB', logs[:2] if logs else '')
            pg.close()
        b.close()


def make_cover(src, name, size=(960, 640), quality=86):
    os.makedirs(THUMBS, exist_ok=True)
    im = Image.open(src).convert('RGB')
    im = im.resize(size, Image.LANCZOS)
    out = os.path.join(THUMBS, name + '.jpg')
    im.save(out, 'JPEG', quality=quality, optimize=True, progressive=True)
    print('cover', out, os.path.getsize(out) // 1024, 'KB')


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a:
        print(__doc__); sys.exit()
    if a[0] == 'preview':
        jobs = BRAND + UI
        render(jobs, preview=True, only_ids=set(a[2:]) if len(a) > 2 else {j[1] for j in jobs if j[0] == a[1]})
    elif a[0] == 'brand':
        render(BRAND, BRAND_DIR, only_ids=set(a[1:]) or None)
        make_cover(os.path.join(BRAND_DIR, 'mr-brand-01-cover.jpg'), 'mason-rowe-brand-cover')
    elif a[0] == 'ui':
        render(UI, UI_DIR, only_ids=set(a[1:]) or None)
        make_cover(os.path.join(UI_DIR, 'mr-ui-01-cover.jpg'), 'mason-rowe-ui-cover')
