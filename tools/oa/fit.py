# -*- coding: utf-8 -*-
"""Measure the hero headline lines in the real font and print the --k value that makes each line fill the block.

    python tools/oa/fit.py           needs the server on :8131
"""
import sys
from playwright.sync_api import sync_playwright

LINES = {'en': ['We turn ideas into', 'extraordinary', 'visual experiences.'],
         'fr': ['Nous transformons les idées', 'en expériences visuelles', 'extraordinaires.']}
JS = """async (lines) => {
  await document.fonts.load('800 100px Syne'); await document.fonts.ready;
  const out = [];
  for (const t of lines) {
    const s = document.createElement('span');
    s.style.cssText = 'position:absolute;white-space:nowrap;font:800 100px Syne;letter-spacing:-.012em;text-transform:uppercase';
    s.textContent = t; document.body.append(s);
    out.push(s.getBoundingClientRect().width / 100); s.remove();
  }
  return out;
}"""
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True)
    pg = b.new_page()
    pg.goto('http://localhost:8131/index.html')
    for lang, lines in LINES.items():
        w = pg.evaluate(JS, lines)
        for t, x in zip(lines, w):
            print(lang, repr(t), 'em width', round(x, 3), '--k', round(1 / x, 4))
    b.close()
