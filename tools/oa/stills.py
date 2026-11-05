# -*- coding: utf-8 -*-
"""Render the Core's static fallback images from the real 3D scene.

    python tools/oa/stills.py            all states, into img/core/
    python tools/oa/stills.py --look hero 1440 900 out.png     one frame, for review

Needs a local server on :8131 serving the repo root (python -m http.server 8131).
"""
import os, sys
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = 'http://localhost:8131/tools/oa/still.html'
OUT = os.path.join(ROOT, 'img', 'core')
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
# name, state, width, height, quality
JOBS = [
    ('hero-wide', 'hero', 1680, 1050, 74), ('hero-tall', 'hero', 780, 1250, 70),
    ('recede-wide', 'recede', 1680, 1050, 68), ('recede-tall', 'recede', 780, 1250, 66),
    ('capabilities-wide', 'capabilities', 1680, 1050, 68), ('capabilities-tall', 'capabilities', 780, 1250, 66),
    ('closing-wide', 'closing', 1680, 1050, 72), ('closing-tall', 'closing', 780, 1250, 68),
    ('studio-wide', 'studio', 1680, 1050, 70), ('studio-tall', 'studio', 780, 1250, 66),
    ('contact-wide', 'contact', 1680, 1050, 70), ('contact-tall', 'contact', 780, 1250, 66),
]


def shot(pw_browser, state, w, h, path):
    ctx = pw_browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1)
    page = ctx.new_page()
    errs = []
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(f'{URL}?state={state}')
    page.wait_for_selector('html[data-ready="1"]', timeout=120000, state='attached')
    page.wait_for_timeout(200)
    page.screenshot(path=path)
    ctx.close()
    if errs:
        print('ERR', state, errs[:3])


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', headless=True, args=ARGS)
        if len(sys.argv) > 1 and sys.argv[1] == '--look':
            _, _, state, w, h, out = sys.argv
            shot(b, state, int(w), int(h), out)
        else:
            os.makedirs(OUT, exist_ok=True)
            for name, state, w, h, qual in JOBS:
                tmp = os.path.join(OUT, name + '.png')
                shot(b, state, w, h, tmp)
                Image.open(tmp).convert('RGB').save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=qual, method=6)
                os.remove(tmp)
                print(name, os.path.getsize(os.path.join(OUT, name + '.webp')) // 1024, 'KB')
        b.close()


if __name__ == '__main__':
    main()
