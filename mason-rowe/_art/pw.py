"""Playwright helpers for reviewing the Mason & Rowe site and rendering portfolio boards.

  py pw.py page website/index.html out.png [width] [height] [--mobile] [--full]

Uses the installed Chrome. Pages are served from the local file system.
"""
import os
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))


def url_for(target):
    if target.startswith(('http', 'file:')):
        return target
    path, _, q = target.partition('?')
    return 'file:///' + os.path.join(ROOT, path).replace('\\', '/') + ('?' + q if q else '')


def open_browser(p):
    return p.chromium.launch(channel='chrome', args=['--allow-file-access-from-files', '--force-color-profile=srgb'])


def settle(page, scroll=True, wait=900):
    """Scroll the page once so reveal-on-scroll content is triggered, then return to top."""
    page.wait_for_load_state('load')
    try:
        page.evaluate('document.fonts.ready')
    except Exception:
        pass
    if scroll:
        h = page.evaluate('document.documentElement.scrollHeight')
        y = 0
        while y < h:
            page.evaluate(f'window.scrollTo(0,{y})')
            page.wait_for_timeout(120)
            y += 600
            h = page.evaluate('document.documentElement.scrollHeight')
    page.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
    page.evaluate('window.scrollTo(0,0)')
    try:
        page.wait_for_function("[...document.images].every(i=>i.complete)", timeout=12000)
    except Exception:
        pass
    page.wait_for_timeout(wait)


def capture(target, out, w=1440, h=900, full=True, mobile=False, scroll=True, wait=900, hide_header=False, js=None, quiet=False):
    out = out if os.path.isabs(out) else os.path.join(HERE, out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    logs = []
    with sync_playwright() as p:
        b = open_browser(p)
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1 if not mobile else 2, is_mobile=mobile, has_touch=mobile)
        page = ctx.new_page()
        page.on('console', lambda m: logs.append(f'[{m.type}] {m.text}') if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
        page.goto(url_for(target))
        if js:
            page.evaluate(js)
        settle(page, scroll, wait)
        if hide_header:
            page.add_style_tag(content='.hdr,.mbar{display:none!important}')
        page.screenshot(path=out, full_page=full)
        b.close()
    if not quiet:
        for l in logs:
            print('  ', l[:260])
        print('ok', out)
    return logs


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    if a and a[0] == 'page':
        capture(a[1], a[2], int(a[3]) if len(a) > 3 else 1440, int(a[4]) if len(a) > 4 else 900,
                full='--full' in sys.argv, mobile='--mobile' in sys.argv)
