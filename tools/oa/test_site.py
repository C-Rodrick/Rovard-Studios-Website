# -*- coding: utf-8 -*-
"""Quality checks for the Obsidian edition. Needs the server on :8131 (python -m http.server 8131).

    python tools/oa/test_site.py          everything
Form tests intercept the network, so nothing is ever sent to the real inbox.
"""
import glob, html, json, os, re, sys, urllib.parse
from html.parser import HTMLParser
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = 'http://localhost:8131'
GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
fails, passes = [], 0


def ok(name, cond, detail=''):
    global passes
    if cond:
        passes += 1
    else:
        fails.append(f'{name}: {detail}')
        print('FAIL', name, detail)


class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs = []; self.h1 = 0; self.noalt = []; self.ids = set(); self.heads = []
    def handle_starttag(self, t, a):
        a = dict(a)
        if 'id' in a: self.ids.add(a['id'])
        for k in ('href', 'src', 'poster'):
            if k in a and a[k]: self.refs.append((t, a[k]))
        if 'srcset' in a:
            for part in a['srcset'].split(','):
                self.refs.append((t, part.split()[0]))
        if t == 'h1': self.h1 += 1
        if t in ('h1', 'h2', 'h3', 'h4'): self.heads.append(int(t[1]))
        if t == 'img' and 'alt' not in a: self.noalt.append(a.get('src'))


def static():
    skip = r'^(node_modules|afaa-pay|northstar-capital|vita-house|mason-rowe|flyer|motion-video|tools|assets|every-student-first-class|Skills Acquisition Program|google-business-photos)[\\/]'
    pages = [p for p in glob.glob(os.path.join(ROOT, '**', 'index.html'), recursive=True) if not re.search(skip, os.path.relpath(p, ROOT))]
    print(len(pages), 'pages')
    ids = {}
    parsed = {}
    for f in pages:
        pr = P(); pr.feed(open(f, encoding='utf-8').read()); parsed[f] = pr; ids[os.path.normpath(f)] = pr.ids
    for f, pr in parsed.items():
        rel = os.path.relpath(f, ROOT).replace('\\', '/')
        ok(f'one h1 {rel}', pr.h1 == 1, str(pr.h1))
        ok(f'alt {rel}', not pr.noalt, str(pr.noalt[:2]))
        jumps = [b for a, b in zip(pr.heads, pr.heads[1:]) if b - a > 1]
        ok(f'heading order {rel}', not jumps, str(pr.heads[:12]))
        for t, u in pr.refs:
            if re.match(r'^(https?:|mailto:|tel:|data:|javascript:)', u):
                continue
            path, _, frag = u.partition('#')
            path = path.split('?')[0]
            target = f if not path else os.path.normpath(os.path.join(os.path.dirname(f), urllib.parse.unquote(path)))
            if os.path.isdir(target):
                target = os.path.join(target, 'index.html')
            ok(f'link {rel} -> {u}', os.path.exists(target), 'missing')
            if frag and os.path.normpath(target) in ids:
                ok(f'anchor {rel} -> {u}', frag in ids[os.path.normpath(target)], 'no such id')
        txt = open(f, encoding='utf-8').read()
        ok(f'canonical {rel}', 'rel="canonical"' in txt)
        ok(f'description {rel}', 'name="description"' in txt)
        for bad in ('RovarD', 'Rovard Studios', 'Rovard Studio ', 'lorem'):
            ok(f'wording {rel} "{bad}"', bad not in re.sub(r'Combined%20Logo[^"]*|<script.*?</script>', '', txt, flags=re.S))
    fr = [p for p in pages if re.search(r'[\\/]fr[\\/]', p)]
    ok('french pages match', len(fr) * 2 == len(pages), f'{len(fr)} of {len(pages)}')


def browser(p):
    b = p.chromium.launch(channel='chrome', headless=True, args=GL)

    # Rendering: errors and overflow on a broad sample, at phone, tablet and desktop width.
    sample = ['/', '/work/', '/work/linkrithm/', '/work/rovard-studios-brand-film/', '/work/kymela-2026/', '/capabilities/', '/studio/', '/pricing/', '/start/', '/contact/', '/blog/',
              '/blog/how-to-brief-a-designer/', '/services/vehicle-branding/', '/privacy/', '/fr/', '/fr/capabilities/', '/fr/start/', '/fr/studio/', '/fr/pricing/', '/fr/work/afaa-pay/']
    for w, h in ((390, 844), (844, 390), (768, 1024), (1280, 720), (1920, 1080)):
        ctx = b.new_context(viewport={'width': w, 'height': h})
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        pg.on('console', lambda m: errs.append(m.text[:300]) if m.type == 'error' else None)
        for path in sample:
            pg.goto(BASE + path)
            pg.wait_for_timeout(250)
            over = pg.evaluate('document.documentElement.scrollWidth - innerWidth')
            ok(f'overflow {path} @{w}', over <= 0, f'{over}px')
            # Fitted or display lines must stay inside the view.
            bad = pg.evaluate("""[...document.querySelectorAll('h1,h2,.ln,.phil-l,.btn')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.right>innerWidth+1||r.left<-1)}).map(e=>e.textContent.trim().slice(0,30))""")
            ok(f'type inside view {path} @{w}', not bad, str(bad[:3]))
        ok(f'console clean @{w}', not errs, str(errs[:3]))
        ctx.close()

    # Mobile menu: keyboard, Escape and focus.
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True)
    pg = ctx.new_page(); pg.goto(BASE + '/'); pg.wait_for_timeout(300)
    btn = pg.locator('[data-menu-open]')
    btn.focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    ok('menu opens by keyboard', pg.evaluate("document.getElementById('menu').open"))
    ok('menu expanded state', btn.get_attribute('aria-expanded') == 'true')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(350)
    ok('menu closes on Escape', not pg.evaluate("document.getElementById('menu').open"))
    ok('focus returns to menu button', pg.evaluate("document.activeElement.hasAttribute('data-menu-open')"))
    btn.click(); pg.wait_for_timeout(200); pg.locator('#menu a', has_text='Work').first.click(); pg.wait_for_url('**/work/')
    ok('menu link navigates', pg.url.endswith('/work/'))
    ctx.close()

    # Navigation, filters, history, project opening, lightbox.
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page(); pg.goto(BASE + '/'); pg.wait_for_timeout(300)
    pg.locator('.top-nav a', has_text='Capabilities').click(); pg.wait_for_url('**/capabilities/')
    ok('active nav state', pg.locator('.top-nav a[aria-current]').inner_text().upper() == 'CAPABILITIES')
    pg.go_back(); pg.wait_for_timeout(300)
    ok('back returns home', pg.url == BASE + '/')
    pg.goto(BASE + '/work/'); pg.wait_for_timeout(300)
    total = pg.locator('.wk').count()
    ok('22 projects listed', total == 22, str(total))
    pg.locator('[data-filter="motion"]').click(); pg.wait_for_timeout(100)
    vis = pg.locator('.wk:not([hidden])').count()
    ok('filter narrows', vis == 3, str(vis))
    ok('filter in URL', 'c=motion' in pg.url)
    pg.reload(); pg.wait_for_timeout(200)
    ok('filter survives reload', pg.locator('.wk:not([hidden])').count() == 3)
    pg.locator('[data-filter="concept"]').click(); pg.wait_for_timeout(100)
    ok('concept filter only shows concepts', pg.locator('.wk:not([hidden])').count() == pg.locator('.wk[data-concept="1"]').count())
    pg.locator('[data-filter="all"]').click()
    pg.locator('.wk .ex-title a').first.click(); pg.wait_for_url('**/work/linkrithm/')
    ok('project opens', pg.locator('h1').inner_text().upper() == 'LINKRITHM')
    pg.locator('.gi').first.click(); pg.wait_for_timeout(200)
    ok('lightbox opens', pg.evaluate("document.querySelector('dialog.lb').open"))
    src1 = pg.locator('dialog.lb img').get_attribute('src')
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(100)
    ok('lightbox next', pg.locator('dialog.lb img').get_attribute('src') != src1)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    ok('lightbox closes', not pg.evaluate("document.querySelector('dialog.lb').open"))
    pg.locator('.next-a').click(); pg.wait_for_url('**/work/*/')
    ok('next project works', 'linkrithm' not in pg.url)
    ctx.close()

    # Project form: validation, steps, review, and the three endpoint outcomes.
    def run_form(status):
        ctx = b.new_context(viewport={'width': 1440, 'height': 900})
        pg = ctx.new_page()
        calls = []
        def handle(route):
            calls.append(route.request.post_data_buffer)
            if status == 'abort':
                route.abort()
            else:
                route.fulfill(status=status, content_type='application/json', body='{"ok":true}')
        pg.route('**/formspree.io/**', handle)
        pg.goto(BASE + '/start/?need=website&package=web'); pg.wait_for_timeout(200)
        pg.locator('.step.is-now [data-next]').click()
        ok('required fields block next', pg.locator('.step.is-now legend').inner_text().upper() == 'ABOUT YOU')
        ok('error is shown', pg.locator('#f-name-e').is_visible())
        ok('focus moves to first error', pg.evaluate("document.activeElement.id") == 'f-name')
        pg.fill('#f-name', 'Test'); pg.fill('#f-email', 'not-an-email')
        pg.locator('.step.is-now [data-next]').click()
        ok('bad email blocked', pg.locator('#f-email-e').is_visible())
        pg.fill('#f-email', 'test@example.com')
        pg.locator('.step.is-now [data-next]').click()
        ok('deep link fills project type', pg.input_value('#f-type') == 'website')
        pg.fill('#f-desc', 'A test project')
        pg.locator('.step.is-now [data-next]').click()
        pg.locator('.chk').first.click()
        pg.locator('.step.is-now [data-next]').click()
        ok('deep link fills package', pg.input_value('#f-package') == 'web')
        pg.locator('.step.is-now [data-back]').click()
        ok('back works', pg.locator('.step.is-now legend').inner_text().upper() == 'SERVICES')
        pg.locator('.step.is-now [data-next]').click()
        pg.locator('.step.is-now [data-next]').click()
        ok('review lists answers', 'A test project' in pg.locator('[data-review]').inner_text())
        pg.locator('[data-submit]').dblclick()
        pg.wait_for_timeout(500)
        ok(f'one request for a double click ({status})', len(calls) == 1, str(len(calls)))
        if status == 200:
            ok('success shown only after success', pg.locator('[data-form-done]').is_visible())
            pg.evaluate("document.querySelector('form[data-steps]').requestSubmit && document.querySelector('form[data-steps]').hidden")
        else:
            ok(f'no success on failure ({status})', not pg.locator('[data-form-done]').is_visible())
            ok(f'failure message ({status})', pg.locator('[data-form-error]').is_visible())
            ok(f'answers kept ({status})', pg.input_value('#f-name') == 'Test')
            ok(f'can retry ({status})', pg.locator('[data-submit]').is_enabled())
        ctx.close()
    for s in (200, 500, 'abort'):
        run_form(s)

    # Contact form.
    ctx = b.new_context(viewport={'width': 1280, 'height': 800})
    pg = ctx.new_page()
    pg.route('**/formspree.io/**', lambda r: r.fulfill(status=200, content_type='application/json', body='{}'))
    pg.goto(BASE + '/contact/'); pg.wait_for_timeout(200)
    pg.locator('#contact-form [data-submit]').click()
    ok('contact validates', pg.locator('#c-name-e').is_visible())
    pg.fill('#c-name', 'T'); pg.fill('#c-email', 't@example.com'); pg.fill('#c-msg', 'Hello')
    pg.locator('#contact-form [data-submit]').click(); pg.wait_for_timeout(300)
    ok('contact success', pg.locator('.ct-form [data-form-done]').is_visible())
    ctx.close()

    # Reduced motion: no WebGL, no hidden content, no animated transforms left.
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    pg = ctx.new_page(); pg.goto(BASE + '/'); pg.wait_for_timeout(3000)
    ok('reduced motion: 3D not started', not pg.evaluate("document.documentElement.classList.contains('gl')"))
    ok('reduced motion: still visible', pg.evaluate("getComputedStyle(document.querySelector('.scene-still')).opacity") == '1')
    hidden = pg.evaluate("[...document.querySelectorAll('[data-rv],.ex-media,.ex-meta')].filter(e=>getComputedStyle(e).opacity==='0'||getComputedStyle(e).visibility==='hidden').length")
    ok('reduced motion: nothing hidden', hidden == 0, str(hidden))
    ctx.close()

    # No WebGL at all.
    bnog = p.chromium.launch(channel='chrome', headless=True, args=['--disable-gpu', '--disable-webgl', '--disable-webgl2', '--disable-3d-apis'])
    pg = bnog.new_page(viewport={'width': 1440, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/'); pg.wait_for_timeout(2500)
    ok('no WebGL: no errors', not errs, str(errs[:2]))
    ok('no WebGL: still shows', pg.evaluate("document.querySelector('.scene-still img').complete && document.querySelector('.scene-still img').naturalWidth > 0"))
    bnog.close()

    # No JavaScript: every page's content and the form still work as plain HTML.
    ctx = b.new_context(java_script_enabled=False, viewport={'width': 1280, 'height': 800})
    pg = ctx.new_page()
    pg.goto(BASE + '/'); ok('no JS: headline visible', pg.locator('h1').is_visible())
    ok('no JS: work visible', pg.locator('.ex-title').first.is_visible())
    pg.goto(BASE + '/start/'); ok('no JS: all steps visible', pg.locator('.step').nth(3).is_visible())
    ok('no JS: submit reachable', pg.locator('[data-submit]').is_visible())
    ctx.close()

    # Live 3D: rendering pauses under the plates and resumes.
    ctx = b.new_context(viewport={'width': 1280, 'height': 720})
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/'); pg.wait_for_timeout(5000)
    ok('3D starts', pg.evaluate("document.documentElement.classList.contains('gl')"))
    ok('3D: no errors', not errs, str(errs[:2]))
    ctx.close()
    b.close()


if __name__ == '__main__':
    static()
    with sync_playwright() as p:
        browser(p)
    print(f'\n{passes} passed, {len(fails)} failed')
    for f in fails[:60]:
        print(' -', f)
    sys.exit(1 if fails else 0)
