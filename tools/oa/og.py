# -*- coding: utf-8 -*-
"""Share image from the real hero: assets/og-cover.jpg, 1200x630.  Needs the server on :8131."""
import os
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
out = os.path.join(ROOT, 'assets', 'og-cover.jpg')
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True)
    pg = b.new_context(viewport={'width': 1200, 'height': 630}, reduced_motion='reduce').new_page()
    pg.goto('http://localhost:8131/')
    pg.add_style_tag(content='.top-nav,.top-cta,.hero-foot,.hero-eyebrow,.scroll-cue{display:none!important}')
    pg.wait_for_timeout(800)
    pg.screenshot(path=out + '.png')
    b.close()
Image.open(out + '.png').convert('RGB').save(out, 'JPEG', quality=84, optimize=True)
os.remove(out + '.png')
print(os.path.getsize(out) // 1024, 'KB')
