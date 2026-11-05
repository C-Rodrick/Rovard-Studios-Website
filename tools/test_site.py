"""Site checks. Start a server first:  python -m http.server 8123   then:  python tools/test_site.py

Static: every internal link and asset in the generated pages resolves.
Browser (headless Chrome via tools/cdp.py): console errors, horizontal overflow at four widths, menu, form flow (the POST is
intercepted, so no real enquiry is sent), filters, reduced motion, no-JavaScript, pause control.
"""
import glob, json, os, re, sys, urllib.parse
from html.parser import HTMLParser
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'http://localhost:8123/'
GEN_DIRS = ('', 'about', 'blog', 'contact', 'cookies', 'dimension', 'pricing', 'privacy', 'services', 'start', 'terms', 'work', 'fr')
fails = []


def ok(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name + (f'  -- {detail}' if detail and not cond else ''))
    if not cond:
        fails.append(name)


class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.urls = []; self.ids = set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
        for k in ('href', 'src', 'poster'):
            if a.get(k):
                self.urls.append(a[k])
        if a.get('srcset'):
            self.urls += [x.strip().split(' ')[0] for x in a['srcset'].split(',')]


def static_links():
    pages = [os.path.join(ROOT, 'index.html')]
    for d in GEN_DIRS[1:]:
        pages += glob.glob(os.path.join(ROOT, d, '**', 'index.html'), recursive=True)
    broken, total = [], 0
    parsed = {}
    for p in pages:
        P = Links(); P.feed(open(p, encoding='utf-8').read()); parsed[os.path.normpath(p)] = P
    for p, P in parsed.items():
        here = os.path.dirname(p)
        for u in P.urls:
            if re.match(r'^(https?:|mailto:|tel:|data:|//)', u) or u.startswith('#'):
                if u.startswith('#') and len(u) > 1 and u[1:] not in P.ids:
                    broken.append((p, u))
                continue
            path, _, frag = urllib.parse.unquote(u.split('?')[0]).partition('#')
            target = os.path.normpath(os.path.join(ROOT, path.lstrip('/')) if path.startswith('/') else os.path.join(here, path))
            if os.path.isdir(target):
                target = os.path.join(target, 'index.html')
            total += 1
            if not os.path.exists(target):
                broken.append((os.path.relpath(p, ROOT), u))
            elif frag and target in parsed and frag not in parsed[target].ids:
                broken.append((os.path.relpath(p, ROOT), u + ' (missing anchor)'))
    ok(f'internal links and assets resolve ({total} checked across {len(pages)} pages)', not broken, str(broken[:12]))


def console(b, url):
    b.send('Log.enable')
    b.js("window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message||e.target&&e.target.src)),true);addEventListener('unhandledrejection',e=>__errs.push(String(e.reason)))")


SAMPLE = ['', 'work/', 'work/linkrithm/', 'work/mason-and-rowe/', 'services/', 'services/logo-design/', 'about/', 'pricing/', 'blog/', 'contact/', 'start/', 'dimension/', 'privacy/', 'fr/', 'fr/work/', 'fr/start/']


def runtime_errors(b, tag):
    bad = {}
    for pg in SAMPLE:
        b.send('Page.addScriptToEvaluateOnNewDocument', source="window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message||(e.target&&(e.target.src||e.target.href)))),true);addEventListener('unhandledrejection',e=>__errs.push(String(e.reason)))")
        b.goto(BASE + pg); b.wait(1800)
        h = b.js('document.documentElement.scrollHeight')
        for y in range(0, h, 900):
            b.js(f'window.scrollTo(0,{y})'); b.wait(120)
        errs = b.js('JSON.stringify(window.__errs||[])')
        if errs and errs != '[]':
            bad[pg] = errs
    ok(f'no runtime errors on {len(SAMPLE)} pages ({tag})', not bad, json.dumps(bad)[:800])


def overflow():
    for w, h, mobile in ((390, 844, True), (768, 1024, True), (1024, 768, False), (1440, 900, False)):
        with Browser(w, h, mobile=mobile) as b:
            b.goto(BASE); b.js("localStorage.setItem('rv-seen','1')")
            bad = {}
            for pg in SAMPLE:
                b.goto(BASE + pg); b.wait(1000)
                sw = b.js('document.documentElement.scrollWidth')
                wide = b.js("""(()=>{const W=innerWidth,o=[];document.querySelectorAll('main *, header *, footer *').forEach(e=>{if(e.closest('.universe,.film-frame,.lightbox,.hero-still'))return;const r=e.getBoundingClientRect();if(r.width&&r.right>W+1&&getComputedStyle(e).position!=='fixed')o.push(e.tagName+'.'+e.className)});return o.slice(0,3).join(' | ')})()""")
                if sw > w or wide:
                    bad[pg] = f'{sw} {wide}'
            ok(f'no horizontal overflow at {w}px', not bad, json.dumps(bad)[:600])


def menu():
    with Browser(390, 844, mobile=True) as b:
        b.goto(BASE); b.js("localStorage.setItem('rv-seen','1')")
        b.goto(BASE + 'about/'); b.wait(1400)
        b.js("document.querySelector('[data-menu-btn]').click()"); b.wait(900)
        ok('menu opens and reports aria-expanded', b.js("document.querySelector('[data-menu-btn]').getAttribute('aria-expanded')") == 'true')
        ok('background scroll is locked while menu is open', b.js("document.documentElement.classList.contains('locked') && document.querySelector('main').inert"))
        ok('focus moves into the menu', b.js("document.activeElement.closest('#menu')!==null"))
        b.js("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))"); b.wait(900)
        ok('Escape closes the menu and returns focus', b.js("document.querySelector('[data-menu-btn]').getAttribute('aria-expanded')==='false' && document.activeElement===document.querySelector('[data-menu-btn]')"))


FETCH_STUB = "window.__posts=[];const _f=window.fetch;window.fetch=(u,o)=>{if(String(u).includes('formspree')){window.__posts.push([...o.body.entries()]);return Promise.resolve(new Response('{}',{status:window.__status||200}))}return _f(u,o)};"


def form():
    for w, h, mobile in ((1440, 900, False), (390, 844, True)):
        with Browser(w, h, mobile=mobile) as b:
            b.goto(BASE + 'start/?package=brand'); b.wait(1400)
            b.js(FETCH_STUB)
            vis = lambda: b.js("[...document.querySelectorAll('[data-step]')].findIndex(s=>!s.hidden)")
            ok(f'[{w}] deep link pre-selects the package and need', b.js("document.querySelector('#f-package').value==='Brand identity' && document.querySelector('input[name=need][value=branding]').checked"))
            b.js("document.querySelector('input[name=need][value=branding]').checked=false;document.querySelector('[data-next]').click()"); b.wait(200)
            ok(f'[{w}] step 1 blocks with a helpful error when empty', vis() == 0 and b.js("document.querySelector('[data-step] .f-err').textContent.length>5"))
            b.js("document.querySelector('input[name=need][value=website]').click();document.querySelector('[data-next]').click()"); b.wait(300)
            ok(f'[{w}] continue moves to step 2 and focuses its title', vis() == 1 and b.js("document.activeElement.hasAttribute('data-step-title')"))
            b.js("document.querySelector('[data-next]').click()"); b.wait(200)
            ok(f'[{w}] idea is required', vis() == 1 and b.js("document.querySelector('#f-idea').getAttribute('aria-invalid')==='true'"))
            b.js("const t=document.querySelector('#f-idea');t.value='A site for my bakery';t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-next]').click()"); b.wait(300)
            b.js("document.querySelector('[data-back]').click()"); b.wait(300)
            ok(f'[{w}] back returns and keeps what was typed', vis() == 1 and b.js("document.querySelector('#f-idea').value==='A site for my bakery'"))
            for _ in range(3):
                b.js("document.querySelector('[data-next]').click()"); b.wait(300)
            ok(f'[{w}] reaches the contact step, submit shows', vis() == 4 and b.js("!document.querySelector('[data-submit]').hidden && document.querySelector('[data-next]').hidden"))
            b.js("const f=document.querySelector('#start-form');f.requestSubmit()"); b.wait(300)
            ok(f'[{w}] name and email are validated', b.js("window.__posts.length===0 && document.querySelector('#f-name').getAttribute('aria-invalid')==='true' && document.querySelector('#f-email').getAttribute('aria-invalid')==='true'"))
            b.js("document.querySelector('#f-name').value='Test';document.querySelector('#f-email').value='not-an-email';document.querySelector('#start-form').requestSubmit()"); b.wait(300)
            ok(f'[{w}] bad email is refused', b.js("window.__posts.length===0"))
            b.js("window.__status=500;document.querySelector('#f-email').value='test@example.com';document.querySelector('#start-form').requestSubmit()"); b.wait(400)
            ok(f'[{w}] a failed send shows an error and a fallback email', b.js("document.querySelector('.form-error').textContent.includes('hello@rovardstudio.com') && !document.querySelector('[data-submit]').disabled"))
            b.js("window.__status=200;window.__posts=[];document.querySelector('#start-form').requestSubmit()"); b.wait(500)
            posted = json.loads(b.js("JSON.stringify(window.__posts[0]||[])"))
            keys = {k for k, _ in posted}
            ok(f'[{w}] posts to Formspree with all fields', {'need', 'idea', 'name', 'email', 'package', '_subject', '_gotcha'} <= keys, str(keys))
            ok(f'[{w}] action is the real Formspree endpoint', b.js("document.querySelector('#start-form').action").startswith('https://formspree.io/f/'))
            ok(f'[{w}] confirmation state appears', b.js("document.querySelector('#start-form').hidden && !document.querySelector('.form-done').hidden"))


def filters():
    with Browser(1440, 900) as b:
        b.goto(BASE + 'work/'); b.wait(1500)
        total = b.js("document.querySelectorAll('[data-kind]').length")
        n = lambda: b.js("[...document.querySelectorAll('[data-kind]')].filter(c=>!c.hidden).length")
        b.js("document.querySelector('[data-filter=motion]').click()"); b.wait(900)
        m = n()
        b.js("document.querySelector('[data-filter=concept]').click()"); b.wait(900)
        c = n()
        ok('concept filter shows only concepts', b.js("[...document.querySelectorAll('[data-kind]')].filter(c=>!c.hidden).every(c=>c.dataset.status==='concept')") and c > 0)
        b.js("document.querySelector('[data-filter=all]').click()"); b.wait(900)
        ok(f'filters work (all {total}, motion {m}, concepts {c})', n() == total and 0 < m < total)
        lab = b.js("""(()=>{const c=[...document.querySelectorAll('[data-status=concept]')];return c.length&&c.every(x=>x.textContent.includes('Independent concept'))})()""")
        ok('every concept on the Work page carries the label', lab)


def reduced():
    with Browser(1440, 900) as b:
        b.send('Emulation.setEmulatedMedia', features=[{'name': 'prefers-reduced-motion', 'value': 'reduce'}])
        b.goto(BASE); b.wait(2500)
        ok('reduced motion: no opening sequence', b.js("!document.querySelector('[data-intro]') && !document.documentElement.classList.contains('is-intro')"))
        ok('reduced motion: three.js not started, still image shown', b.js("!document.documentElement.classList.contains('core-live') && getComputedStyle(document.querySelector('.hero-still')).display!=='none'"))
        ok('reduced motion: headline visible and not split', b.js("getComputedStyle(document.querySelector('.hero-h')).opacity==='1' && !document.querySelector('.ch')"))
        ok('reduced motion: no smooth-scroll hijack', b.js("!document.documentElement.classList.contains('lenis')"))
        b.js("window.scrollTo(0,99999)"); b.wait(400)
        ok('reduced motion: lower sections visible', b.js("getComputedStyle(document.querySelector('.close-sub')).opacity==='1'"))


def no_js():
    with Browser(1440, 900) as b:
        b.send('Emulation.setScriptExecutionDisabled', value=True)
        b.goto(BASE + 'start/'); b.wait(1200)
        b.send('Emulation.setScriptExecutionDisabled', value=False)
        r = b.js("[...document.querySelectorAll('[data-step]')].filter(s=>!s.hidden && s.offsetHeight>0).length")
        ok('no JavaScript: all five form steps are visible with a working submit', r == 5 and b.js("document.querySelector('[data-submit]').offsetHeight>0 && document.querySelector('#start-form').method==='post'"))
    with Browser(1440, 900) as b:
        b.send('Emulation.setScriptExecutionDisabled', value=True)
        b.goto(BASE); b.wait(3000)
        b.send('Emulation.setScriptExecutionDisabled', value=False)
        ok('no JavaScript: hero readable, still image present', b.js("document.querySelector('.hero-h').innerText.length>20 && document.querySelector('.hero-still').complete"))


def intro():
    with Browser(1440, 900) as b:
        b.goto(BASE); b.wait(200)
        first = b.js("document.documentElement.classList.contains('is-intro')")
        b.wait(2600)
        ok('first visit: opening sequence runs and removes itself within 2.8 s', first and b.js("!document.querySelector('[data-intro]')"))
        b.goto(BASE); b.wait(200)
        ok('return visit: no opening sequence', not b.js("document.documentElement.classList.contains('is-intro')"))


def pause():
    with Browser(1440, 900) as b:
        b.goto(BASE + 'about/'); b.wait(1400)
        b.js("document.querySelector('[data-motion-toggle]').click()"); b.wait(100)
        ok('pause control sets state and label', b.js("document.documentElement.classList.contains('motion-off') && document.querySelector('[data-motion-toggle]').getAttribute('aria-pressed')==='true'"))
        b.goto(BASE + 'about/'); b.wait(800)
        ok('pause choice is remembered', b.js("document.documentElement.classList.contains('motion-off')"))


if __name__ == '__main__':
    only = sys.argv[1:]
    steps = {'links': static_links, 'overflow': overflow, 'menu': menu, 'form': form, 'filters': filters, 'reduced': reduced, 'nojs': no_js, 'intro': intro, 'pause': pause}
    for name, fn in steps.items():
        if not only or name in only:
            fn()
    if not only or 'errors' in only:
        with Browser(1440, 900) as b:
            b.goto(BASE); b.js("localStorage.setItem('rv-seen','1')")
            runtime_errors(b, 'desktop')
        with Browser(390, 844, mobile=True) as b:
            b.goto(BASE); b.js("localStorage.setItem('rv-seen','1')")
            runtime_errors(b, 'phone')
    print(f'\n{len(fails)} failed' if fails else '\nAll checks passed')
    sys.exit(1 if fails else 0)
